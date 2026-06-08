/**
 * Tests for invite-related service functions:
 * lookupCampaignByCode, acceptCampaignInvite, regenerateInviteCode
 * and listProfilesByIds from user-profile service.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false

const mockRpcChain = {
  single: vi.fn(),
  maybeSingle: vi.fn(),
}
const mockRpc = vi.fn().mockReturnValue(mockRpcChain)
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockClient = {
  auth: {
    getSession: vi.fn(),
  },
  from: (...args: unknown[]) => mockFrom(...args),
  rpc: (...args: unknown[]) => mockRpc(...args),
}

function setupSupabase() {
  mockSupabaseConfigured = true
}

function resetSupabase() {
  mockSupabaseConfigured = false
}

import {
  lookupCampaignByCode,
  acceptCampaignInvite,
  regenerateInviteCode,
} from '@/services/campaign'

import { listProfilesByIds } from '@/services/user-profile'

// ── lookupCampaignByCode ───────────────────────────────────────────────────────

describe('lookupCampaignByCode', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRpc.mockReturnValue(mockRpcChain) })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(lookupCampaignByCode('ABCD1234')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns null when code not found', async () => {
    setupSupabase()
    mockRpcChain.maybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await lookupCampaignByCode('ABCD1234')
    expect(result).toBeNull()
  })

  it('returns campaign data when code matches', async () => {
    setupSupabase()
    mockRpcChain.maybeSingle.mockResolvedValue({
      data: { id: 'c1', name: 'Test', description: 'Desc' },
      error: null,
    })
    const result = await lookupCampaignByCode('ABCD1234')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('c1')
    expect(result?.name).toBe('Test')
    expect(result?.description).toBe('Desc')
  })

  it('strips hyphen and uppercases before lookup', async () => {
    setupSupabase()
    mockRpcChain.maybeSingle.mockResolvedValue({ data: null, error: null })
    await lookupCampaignByCode('abcd-1234')
    expect(mockRpc).toHaveBeenCalledWith('lookup_campaign_by_code', { p_code: 'ABCD1234' })
  })

  it('throws lookup_failed on RPC error', async () => {
    setupSupabase()
    mockRpcChain.maybeSingle.mockResolvedValue({ data: null, error: { message: 'db error' } })
    await expect(lookupCampaignByCode('ABCD1234')).rejects.toMatchObject({ code: 'lookup_failed' })
  })
})

// ── acceptCampaignInvite ───────────────────────────────────────────────────────

describe('acceptCampaignInvite', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRpc.mockReturnValue(mockRpcChain) })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(acceptCampaignInvite('ABCD1234')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns joined status on success', async () => {
    setupSupabase()
    mockRpcChain.single.mockResolvedValue({
      data: { r_campaign_id: 'c1', r_status: 'joined' },
      error: null,
    })
    const result = await acceptCampaignInvite('ABCD1234')
    expect(result.campaignId).toBe('c1')
    expect(result.status).toBe('joined')
  })

  it('returns already_member when user is already in campaign', async () => {
    setupSupabase()
    mockRpcChain.single.mockResolvedValue({
      data: { r_campaign_id: 'c1', r_status: 'already_member' },
      error: null,
    })
    const result = await acceptCampaignInvite('ABCD1234')
    expect(result.status).toBe('already_member')
  })

  it('returns not_found for invalid code', async () => {
    setupSupabase()
    mockRpcChain.single.mockResolvedValue({
      data: { r_campaign_id: null, r_status: 'not_found' },
      error: null,
    })
    const result = await acceptCampaignInvite('ZZZZ9999')
    expect(result.status).toBe('not_found')
  })

  it('throws not_authenticated when error contains not_authenticated', async () => {
    setupSupabase()
    mockRpcChain.single.mockResolvedValue({ data: null, error: { message: 'not_authenticated' } })
    await expect(acceptCampaignInvite('ABCD1234')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws accept_failed on other RPC error', async () => {
    setupSupabase()
    mockRpcChain.single.mockResolvedValue({ data: null, error: { message: 'db error' } })
    await expect(acceptCampaignInvite('ABCD1234')).rejects.toMatchObject({ code: 'accept_failed' })
  })

  it('strips hyphen before calling RPC', async () => {
    setupSupabase()
    mockRpcChain.single.mockResolvedValue({
      data: { r_campaign_id: 'c1', r_status: 'joined' },
      error: null,
    })
    await acceptCampaignInvite('ABCD-1234')
    expect(mockRpc).toHaveBeenCalledWith('accept_campaign_invite', { p_code: 'ABCD1234' })
  })
})

// ── regenerateInviteCode ──────────────────────────────────────────────────────

describe('regenerateInviteCode', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(regenerateInviteCode('c1')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns new code string on success', async () => {
    setupSupabase()
    mockRpc.mockResolvedValue({ data: 'NEWCODE1', error: null })
    const result = await regenerateInviteCode('c1')
    expect(result).toBe('NEWCODE1')
    expect(mockRpc).toHaveBeenCalledWith('regenerate_invite_code', { p_campaign_id: 'c1' })
  })

  it('throws not_owner when error contains not_owner', async () => {
    setupSupabase()
    mockRpc.mockResolvedValue({ data: null, error: { message: 'not_owner' } })
    await expect(regenerateInviteCode('c1')).rejects.toMatchObject({ code: 'not_owner' })
  })

  it('throws campaign_not_found when error contains campaign_not_found', async () => {
    setupSupabase()
    mockRpc.mockResolvedValue({ data: null, error: { message: 'campaign_not_found' } })
    await expect(regenerateInviteCode('c1')).rejects.toMatchObject({ code: 'campaign_not_found' })
  })

  it('throws regenerate_failed on generic error', async () => {
    setupSupabase()
    mockRpc.mockResolvedValue({ data: null, error: { message: 'db error' } })
    await expect(regenerateInviteCode('c1')).rejects.toMatchObject({ code: 'regenerate_failed' })
  })
})

// ── listProfilesByIds ─────────────────────────────────────────────────────────

describe('listProfilesByIds', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns empty array when supabase is null', async () => {
    resetSupabase()
    const result = await listProfilesByIds(['u1', 'u2'])
    expect(result).toEqual([])
  })

  it('returns empty array for empty userIds input', async () => {
    setupSupabase()
    const result = await listProfilesByIds([])
    expect(result).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns mapped profiles for matching ids', async () => {
    setupSupabase()
    const rows = [
      { user_id: 'u1', display_name: 'Alice', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { user_id: 'u2', display_name: 'Bob', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    ]
    const inChain = { in: vi.fn().mockResolvedValue({ data: rows, error: null }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(inChain) })

    const result = await listProfilesByIds(['u1', 'u2'])
    expect(result).toHaveLength(2)
    expect(result[0]?.displayName).toBe('Alice')
    expect(result[1]?.displayName).toBe('Bob')
  })

  it('returns empty array silently on supabase error', async () => {
    setupSupabase()
    const inChain = { in: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(inChain) })

    const result = await listProfilesByIds(['u1'])
    expect(result).toEqual([])
  })

  it('handles partial matches (some userIds have no profile)', async () => {
    setupSupabase()
    const rows = [
      { user_id: 'u1', display_name: 'Alice', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    ]
    const inChain = { in: vi.fn().mockResolvedValue({ data: rows, error: null }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(inChain) })

    const result = await listProfilesByIds(['u1', 'u2', 'u3'])
    expect(result).toHaveLength(1)
    expect(result[0]?.userId).toBe('u1')
  })
})
