import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ────────────────────────────────────────────────────────

let mockSupabaseConfigured = false
let mockSession: { user: { id: string } } | null = null
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockClient = {
  auth: {
    getSession: vi.fn(),
  },
  from: (...args: unknown[]) => mockFrom(...args),
}

function setupAuth(userId = 'owner_1') {
  mockSupabaseConfigured = true
  mockSession = { user: { id: userId } }
  mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } })
}

function resetAuth() {
  mockSupabaseConfigured = false
  mockSession = null
  mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
}

import { removeMember, CampaignServiceError } from '@/services/campaign'

describe('removeMember', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws not_authenticated when supabase is null', async () => {
    resetAuth()
    await expect(removeMember({ campaignId: 'c1', userId: 'u-player' }))
      .rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws not_authenticated when no session', async () => {
    mockSupabaseConfigured = true
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
    await expect(removeMember({ campaignId: 'c1', userId: 'u-player' }))
      .rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws cannot_remove_self when userId equals current user', async () => {
    setupAuth('u1')
    await expect(removeMember({ campaignId: 'c1', userId: 'u1' }))
      .rejects.toMatchObject({ code: 'cannot_remove_self' })
  })

  it('throws remove_member_failed when campaign_members delete fails', async () => {
    setupAuth('owner_1')
    // campaign_characters delete ok, campaign_members delete fails
    const okEq = { eq: vi.fn().mockResolvedValue({ error: null }) }
    const failEq = { eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }) }
    const okDeleteChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(okEq) }) }
    const failDeleteChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(failEq) }) }
    mockFrom
      .mockReturnValueOnce(okDeleteChain)   // campaign_characters
      .mockReturnValueOnce(failDeleteChain) // campaign_members
    await expect(removeMember({ campaignId: 'c1', userId: 'u-player' }))
      .rejects.toMatchObject({ code: 'remove_member_failed' })
  })

  it('resolves on success (chars unlink + member removal)', async () => {
    setupAuth('owner_1')
    const okEq = { eq: vi.fn().mockResolvedValue({ error: null }) }
    const okChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(okEq) }) }
    mockFrom.mockReturnValue(okChain)
    await expect(removeMember({ campaignId: 'c1', userId: 'u-player' }))
      .resolves.toBeUndefined()
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })

  it('continues to remove member even if chars unlink fails (non-blocking)', async () => {
    setupAuth('owner_1')
    // chars delete fails (error), but member delete succeeds
    const failEq = { eq: vi.fn().mockResolvedValue({ error: { message: 'chars fail' } }) }
    const okEq = { eq: vi.fn().mockResolvedValue({ error: null }) }
    const failCharsChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(failEq) }) }
    const okMemberChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(okEq) }) }
    mockFrom
      .mockReturnValueOnce(failCharsChain) // campaign_characters — non-blocking
      .mockReturnValueOnce(okMemberChain)  // campaign_members — ok
    await expect(removeMember({ campaignId: 'c1', userId: 'u-player' }))
      .resolves.toBeUndefined()
  })

  it('is a CampaignServiceError instance on error', async () => {
    resetAuth()
    await expect(removeMember({ campaignId: 'c1', userId: 'u-player' }))
      .rejects.toBeInstanceOf(CampaignServiceError)
  })
})
