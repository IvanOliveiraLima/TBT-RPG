/**
 * campaign-dice-log service tests
 *
 * Covers:
 *  - listCampaignIdsForCharacter: returns campaign IDs for a character
 *  - logRoll: inserts one row per campaign (N rows for N campaigns)
 *  - logRoll: skips silently when supabase is null or campaignIds is empty
 *  - logRoll: best-effort (does not throw on DB error)
 *  - listCampaignRolls: returns mapped entries ordered newest-first
 *  - listCampaignRolls: returns [] when supabase is null or error
 *  - clearCampaignRolls: deletes by campaign_id
 *  - clearCampaignRolls: best-effort (does not throw on error)
 *
 * NOTE: Retention (TTL 12h + cap 50/campaign) is enforced by a Postgres trigger
 * (trim_campaign_dice_rolls) that runs AFTER INSERT — not by the client.
 * There is no client-side retention logic to test here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockClient = {
  from: (...args: unknown[]) => mockFrom(...args),
}

function setupSupabase()  { mockSupabaseConfigured = true }
function resetSupabase()  { mockSupabaseConfigured = false }

import {
  logRoll,
  listCampaignRolls,
  clearCampaignRolls,
} from '@/services/campaign-dice-log'

import {
  listCampaignIdsForCharacter,
} from '@/services/campaign-characters'

import type { RollResult } from '@/domain/dice'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<RollResult> = {}): RollResult {
  return {
    id: 'r1',
    notation: 'd20',
    dice: [{ sides: 20, value: 15, kept: true }],
    modifier: 0,
    total: 15,
    mode: 'normal',
    crit: null,
    at: Date.now(),
    ...overrides,
  }
}

const ROLL_ROW = {
  id: 'row1',
  campaign_id: 'c1',
  user_id: 'u1',
  actor_name: 'Aragorn',
  result: makeResult(),
  created_at: '2024-01-01T10:00:00Z',
}

// ── listCampaignIdsForCharacter ───────────────────────────────────────────────

describe('listCampaignIdsForCharacter', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns [] when supabase is null', async () => {
    resetSupabase()
    expect(await listCampaignIdsForCharacter('char1')).toEqual([])
  })

  it('returns campaign_id strings from rows', async () => {
    setupSupabase()
    const eqFn = vi.fn().mockResolvedValue({
      data: [{ campaign_id: 'c1' }, { campaign_id: 'c2' }],
      error: null,
    })
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ select: selectFn })

    const ids = await listCampaignIdsForCharacter('char1')
    expect(ids).toEqual(['c1', 'c2'])
    expect(eqFn).toHaveBeenCalledWith('character_id', 'char1')
  })

  it('returns [] on DB error (best-effort)', async () => {
    setupSupabase()
    const eqFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) })

    expect(await listCampaignIdsForCharacter('char1')).toEqual([])
  })
})

// ── logRoll ───────────────────────────────────────────────────────────────────

describe('logRoll', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('skips when supabase is null', async () => {
    resetSupabase()
    await expect(logRoll(['c1'], 'Aragorn', makeResult())).resolves.toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('skips when campaignIds is empty', async () => {
    setupSupabase()
    await expect(logRoll([], 'Aragorn', makeResult())).resolves.toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('inserts one row per campaignId (single)', async () => {
    setupSupabase()
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    await logRoll(['c1'], 'Aragorn', makeResult())

    expect(mockInsert).toHaveBeenCalledOnce()
    const rows = mockInsert.mock.calls[0]![0] as unknown[]
    expect(rows).toHaveLength(1)
    expect((rows[0] as Record<string, unknown>)['campaign_id']).toBe('c1')
    expect((rows[0] as Record<string, unknown>)['actor_name']).toBe('Aragorn')
  })

  it('inserts N rows for N campaigns', async () => {
    setupSupabase()
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    await logRoll(['c1', 'c2', 'c3'], 'Legolas', makeResult())

    const rows = mockInsert.mock.calls[0]![0] as unknown[]
    expect(rows).toHaveLength(3)
    expect((rows[0] as Record<string, unknown>)['campaign_id']).toBe('c1')
    expect((rows[1] as Record<string, unknown>)['campaign_id']).toBe('c2')
    expect((rows[2] as Record<string, unknown>)['campaign_id']).toBe('c3')
  })

  it('does not throw on DB error (best-effort)', async () => {
    setupSupabase()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
    })
    await expect(logRoll(['c1'], 'Aragorn', makeResult())).resolves.toBeUndefined()
  })
})

// ── listCampaignRolls ─────────────────────────────────────────────────────────

describe('listCampaignRolls', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns [] when supabase is null', async () => {
    resetSupabase()
    expect(await listCampaignRolls('c1')).toEqual([])
  })

  it('maps rows to CampaignDiceRoll', async () => {
    setupSupabase()
    const limitFn  = vi.fn().mockResolvedValue({ data: [ROLL_ROW], error: null })
    const orderFn  = vi.fn().mockReturnValue({ limit: limitFn })
    const eqFn     = vi.fn().mockReturnValue({ order: orderFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ select: selectFn })

    const rolls = await listCampaignRolls('c1')
    expect(rolls).toHaveLength(1)
    const r = rolls[0]!
    expect(r.id).toBe('row1')
    expect(r.campaignId).toBe('c1')
    expect(r.userId).toBe('u1')
    expect(r.actorName).toBe('Aragorn')
    expect(r.result.total).toBe(15)
    expect(r.createdAt).toBe(new Date('2024-01-01T10:00:00Z').getTime())
  })

  it('orders by created_at descending', async () => {
    setupSupabase()
    const limitFn  = vi.fn().mockResolvedValue({ data: [], error: null })
    const orderFn  = vi.fn().mockReturnValue({ limit: limitFn })
    const eqFn     = vi.fn().mockReturnValue({ order: orderFn })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) })

    await listCampaignRolls('c1')
    expect(orderFn).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('applies limit', async () => {
    setupSupabase()
    const limitFn  = vi.fn().mockResolvedValue({ data: [], error: null })
    const orderFn  = vi.fn().mockReturnValue({ limit: limitFn })
    const eqFn     = vi.fn().mockReturnValue({ order: orderFn })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) })

    await listCampaignRolls('c1', 20)
    expect(limitFn).toHaveBeenCalledWith(20)
  })

  it('returns [] on DB error', async () => {
    setupSupabase()
    const limitFn  = vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
    const orderFn  = vi.fn().mockReturnValue({ limit: limitFn })
    const eqFn     = vi.fn().mockReturnValue({ order: orderFn })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) })

    expect(await listCampaignRolls('c1')).toEqual([])
  })
})

// ── clearCampaignRolls ────────────────────────────────────────────────────────

describe('clearCampaignRolls', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('skips when supabase is null', async () => {
    resetSupabase()
    await expect(clearCampaignRolls('c1')).resolves.toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('deletes by campaign_id', async () => {
    setupSupabase()
    const eqFn     = vi.fn().mockResolvedValue({ error: null })
    const deleteFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ delete: deleteFn })

    await clearCampaignRolls('c1')
    expect(eqFn).toHaveBeenCalledWith('campaign_id', 'c1')
  })

  it('does not throw on DB error (best-effort)', async () => {
    setupSupabase()
    const eqFn     = vi.fn().mockResolvedValue({ error: { message: 'err' } })
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: eqFn }) })

    await expect(clearCampaignRolls('c1')).resolves.toBeUndefined()
  })
})
