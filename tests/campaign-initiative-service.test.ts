/**
 * campaign-initiative service tests — registerInitiative
 *
 * Covers:
 *  - fans out one RPC call per campaignId
 *  - skips when supabase is null
 *  - skips when campaignIds is empty
 *  - does not throw on RPC error (best-effort)
 *  - passes correct params to register_initiative RPC
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false
const mockRpc = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockClient = {
  rpc: (...args: unknown[]) => mockRpc(...args),
}

function setupSupabase() { mockSupabaseConfigured = true }
function resetSupabase() { mockSupabaseConfigured = false }

import { registerInitiative } from '@/services/campaign-initiative'

// ── registerInitiative ────────────────────────────────────────────────────────

describe('registerInitiative', () => {
  beforeEach(() => { vi.clearAllMocks(); setupSupabase() })

  it('skips when supabase is null', async () => {
    resetSupabase()
    await expect(registerInitiative(['c1'], 'char1', 15, 'Eira')).resolves.toBeUndefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('skips when campaignIds is empty', async () => {
    await expect(registerInitiative([], 'char1', 15, 'Eira')).resolves.toBeUndefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls register_initiative RPC once for a single campaign', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }))

    await registerInitiative(['c1'], 'char1', 12, 'Eira')

    expect(mockRpc).toHaveBeenCalledOnce()
    expect(mockRpc).toHaveBeenCalledWith('register_initiative', {
      p_campaign_id: 'c1',
      p_character_id: 'char1',
      p_value: 12,
      p_name: 'Eira',
    })
  })

  it('fans out to two RPC calls for two campaigns', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }))

    await registerInitiative(['c1', 'c2'], 'char1', 15, 'Eira')

    expect(mockRpc).toHaveBeenCalledTimes(2)
    const ids = mockRpc.mock.calls.map(c => (c[1] as Record<string, unknown>)['p_campaign_id'])
    expect(ids).toContain('c1')
    expect(ids).toContain('c2')
  })

  it('passes p_value and p_name correctly', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }))

    await registerInitiative(['camp-x'], 'char-y', 20, 'Thorin')

    expect(mockRpc).toHaveBeenCalledWith('register_initiative', {
      p_campaign_id: 'camp-x',
      p_character_id: 'char-y',
      p_value: 20,
      p_name: 'Thorin',
    })
  })

  it('does not throw on RPC error (best-effort)', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: { message: 'db error' } }))

    await expect(
      registerInitiative(['c1'], 'char1', 10, 'Gimli'),
    ).resolves.toBeUndefined()
  })

  it('does not throw even when one campaign errors (fans out all)', async () => {
    mockRpc
      .mockReturnValueOnce(Promise.resolve({ error: { message: 'err' } }))
      .mockReturnValueOnce(Promise.resolve({ error: null }))

    await expect(
      registerInitiative(['c1', 'c2'], 'char1', 8, 'Legolas'),
    ).resolves.toBeUndefined()

    expect(mockRpc).toHaveBeenCalledTimes(2)
  })
})
