/**
 * transferCampaignOwnership service unit tests
 *
 * Covers:
 *  - Returns { ok: false, error: 'offline' } when supabase is null
 *  - Calls rpc with correct params; returns { ok: true } on success
 *  - Returns { ok: false, error } when rpc returns an error (no throw)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ────────────────────────────────────────────────────────

let mockSupabaseConfigured = false
const mockRpc = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockClient = {
  rpc: (...args: unknown[]) => mockRpc(...args),
}

import { transferCampaignOwnership } from '@/services/campaign'

describe('transferCampaignOwnership', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSupabaseConfigured = false })

  it('returns { ok: false, error: "offline" } when supabase is null', async () => {
    const result = await transferCampaignOwnership('c1', 'u-player')
    expect(result).toEqual({ ok: false, error: 'offline' })
  })

  it('calls rpc with correct params and returns { ok: true }', async () => {
    mockSupabaseConfigured = true
    mockRpc.mockResolvedValue({ error: null })
    const result = await transferCampaignOwnership('c1', 'u-player')
    expect(result).toEqual({ ok: true })
    expect(mockRpc).toHaveBeenCalledWith('transfer_campaign_ownership', {
      p_campaign_id: 'c1',
      p_new_owner: 'u-player',
    })
  })

  it('returns { ok: false, error } when rpc returns error (does not throw)', async () => {
    mockSupabaseConfigured = true
    mockRpc.mockResolvedValue({ error: { message: 'not_owner' } })
    const result = await transferCampaignOwnership('c1', 'u-player')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('not_owner')
  })

  it('returns { ok: false } for not_member error (does not throw)', async () => {
    mockSupabaseConfigured = true
    mockRpc.mockResolvedValue({ error: { message: 'not_member' } })
    await expect(transferCampaignOwnership('c1', 'u-nobody')).resolves.toMatchObject({ ok: false })
  })
})
