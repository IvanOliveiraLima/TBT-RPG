/**
 * Tests for campaign-view service:
 * fetchCampaignCharacter, fetchCampaignCharacterImages
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false
let mockSessionUserId: string | null = 'user1'

const mockFrom = vi.fn()
const mockStorage = { from: vi.fn() }

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
  getSession: () => Promise.resolve(
    mockSessionUserId ? { user: { id: mockSessionUserId } } : null
  ),
}))

const mockClient = {
  from: (...args: unknown[]) => mockFrom(...args),
  storage: mockStorage,
}

function setupSupabase() { mockSupabaseConfigured = true }
function resetSupabase() { mockSupabaseConfigured = false }

import {
  fetchCampaignCharacter,
  fetchCampaignCharacterImages,
  CampaignViewError,
} from '@/services/campaign-view'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const LINK_ROW = { character_id: 'char1', user_id: 'owner1' }

const CHAR_ROW = {
  id: 'char1',
  user_id: 'owner1',
  data: {
    id: 'char1',
    name: 'Aragorn',
    race: 'Human',
    classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
    updatedAt: 0,
  },
  updated_at: '2024-01-15T00:00:00Z',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMaybeSingleChain(data: unknown, error: unknown = null) {
  return {
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeEqEqChain(data: unknown, error: unknown = null) {
  const chain = makeMaybeSingleChain(data, error)
  const eq2 = vi.fn().mockReturnValue(chain)
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  return { chain, eq1, eq2, select: vi.fn().mockReturnValue({ eq: eq1 }) }
}

function makeEqSingleChain(data: unknown, error: unknown = null) {
  const chain = makeMaybeSingleChain(data, error)
  const eq1 = vi.fn().mockReturnValue(chain)
  return { chain, eq1, select: vi.fn().mockReturnValue({ eq: eq1 }) }
}

// ── fetchCampaignCharacter ────────────────────────────────────────────────────

describe('fetchCampaignCharacter', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSessionUserId = 'user1' })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws not_authenticated when no session', async () => {
    setupSupabase()
    mockSessionUserId = null
    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns null when link not found', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(null, null)
    mockFrom.mockReturnValueOnce({ select: linkChain.select })

    const result = await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    expect(result).toBeNull()
  })

  it('throws fetch_failed on link query error', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(null, { message: 'db error' })
    mockFrom.mockReturnValueOnce({ select: linkChain.select })

    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'fetch_failed' })
  })

  it('returns null when char row not found', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(LINK_ROW)
    const charChain = makeEqSingleChain(null, null)
    mockFrom
      .mockReturnValueOnce({ select: linkChain.select })
      .mockReturnValueOnce({ select: charChain.select })

    const result = await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    expect(result).toBeNull()
  })

  it('throws fetch_failed on char query error', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(LINK_ROW)
    const charChain = makeEqSingleChain(null, { message: 'db error' })
    mockFrom
      .mockReturnValueOnce({ select: linkChain.select })
      .mockReturnValueOnce({ select: charChain.select })

    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'fetch_failed' })
  })

  it('returns mapped char and ownerId on success', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(LINK_ROW)
    const charChain = makeEqSingleChain(CHAR_ROW)
    mockFrom
      .mockReturnValueOnce({ select: linkChain.select })
      .mockReturnValueOnce({ select: charChain.select })

    const result = await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    expect(result).not.toBeNull()
    expect(result!.char.name).toBe('Aragorn')
    expect(result!.char.updatedAt).toBe(new Date('2024-01-15T00:00:00Z').getTime())
    expect(result!.ownerId).toBe('owner1')
  })

  it('char instance has CampaignViewError class', async () => {
    resetSupabase()
    try {
      await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    } catch (err) {
      expect(err).toBeInstanceOf(CampaignViewError)
    }
  })
})

// ── fetchCampaignCharacterImages ──────────────────────────────────────────────

describe('fetchCampaignCharacterImages', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null values when supabase is null', async () => {
    resetSupabase()
    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
  })

  it('returns null values when list returns error', async () => {
    setupSupabase()
    const listFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
    mockStorage.from.mockReturnValue({ list: listFn })

    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
  })

  it('returns null values when list returns empty array', async () => {
    setupSupabase()
    const listFn = vi.fn().mockResolvedValue({ data: [], error: null })
    mockStorage.from.mockReturnValue({ list: listFn })

    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
  })

  it('skips files with unrecognised kind', async () => {
    setupSupabase()
    const listFn = vi.fn().mockResolvedValue({
      data: [{ name: 'thumbnail.png' }],
      error: null,
    })
    const downloadFn = vi.fn().mockResolvedValue({ data: null, error: null })
    mockStorage.from.mockReturnValue({ list: listFn, download: downloadFn })

    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
    expect(downloadFn).not.toHaveBeenCalled()
  })
})
