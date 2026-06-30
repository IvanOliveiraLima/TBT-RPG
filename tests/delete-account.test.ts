import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteAccountService, DeleteAccountError } from '@/services/delete-account'

// ── Mock supabase ─────────────────────────────────────────────────────────────

const mockGetSession = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => mockFrom(table),
    rpc: (fn: string) => mockRpc(fn),
  },
}))

// ── Mock campaign service ─────────────────────────────────────────────────────

const mockListMyCampaigns = vi.fn()
const mockDeleteCampaign = vi.fn()
const mockLeaveCampaign = vi.fn()

vi.mock('@/services/campaign', () => ({
  listMyCampaigns: () => mockListMyCampaigns(),
  deleteCampaign: (id: string) => mockDeleteCampaign(id),
  leaveCampaign: (id: string) => mockLeaveCampaign(id),
}))

// ── Mock db ───────────────────────────────────────────────────────────────────

const mockListCharacters = vi.fn()
const mockClearAllLocalData = vi.fn()

vi.mock('@/data/db', () => ({
  listCharacters: () => mockListCharacters(),
  clearAllLocalData: () => mockClearAllLocalData(),
}))

// ── Mock delete-character ─────────────────────────────────────────────────────

const mockDeleteCharacterImages = vi.fn()

vi.mock('@/services/delete-character', () => ({
  deleteCharacterImages: (userId: string, charId: string) => mockDeleteCharacterImages(userId, charId),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupHappyPath(userId = 'user-123') {
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: userId } } } })
  mockListMyCampaigns.mockResolvedValue([])
  mockListCharacters.mockResolvedValue([])
  mockClearAllLocalData.mockResolvedValue(undefined)
  mockRpc.mockResolvedValue({ error: null })
  mockSignOut.mockResolvedValue(undefined)
  mockFrom.mockReturnValue({ delete: () => ({ eq: () => ({ error: null }) }) })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('deleteAccountService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws DeleteAccountError("not_authenticated") when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    await expect(deleteAccountService()).rejects.toMatchObject({ code: 'not_authenticated' })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls delete_own_account RPC on success', async () => {
    setupHappyPath()
    await deleteAccountService()
    expect(mockRpc).toHaveBeenCalledWith('delete_own_account')
  })

  it('calls signOut after successful RPC', async () => {
    setupHappyPath()
    await deleteAccountService()
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('throws DeleteAccountError("account_delete_failed") when RPC errors', async () => {
    setupHappyPath()
    mockRpc.mockResolvedValue({ error: { message: 'RPC failed' } })
    await expect(deleteAccountService()).rejects.toMatchObject({ code: 'account_delete_failed' })
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('deletes owned campaigns (best-effort)', async () => {
    const userId = 'user-123'
    setupHappyPath(userId)
    mockListMyCampaigns.mockResolvedValue([{ id: 'camp-1', ownerId: userId }])
    await deleteAccountService()
    expect(mockDeleteCampaign).toHaveBeenCalledWith('camp-1')
  })

  it('leaves unowned campaigns (best-effort)', async () => {
    setupHappyPath('user-123')
    mockListMyCampaigns.mockResolvedValue([{ id: 'camp-2', ownerId: 'other-user' }])
    await deleteAccountService()
    expect(mockLeaveCampaign).toHaveBeenCalledWith('camp-2')
  })

  it('clears local IndexedDB data', async () => {
    setupHappyPath()
    await deleteAccountService()
    expect(mockClearAllLocalData).toHaveBeenCalled()
  })

  it('succeeds even when listMyCampaigns throws (best-effort)', async () => {
    setupHappyPath()
    mockListMyCampaigns.mockRejectedValue(new Error('network'))
    await expect(deleteAccountService()).resolves.toBeUndefined()
    expect(mockRpc).toHaveBeenCalledWith('delete_own_account')
  })

  it('succeeds even when clearAllLocalData throws (best-effort)', async () => {
    setupHappyPath()
    mockClearAllLocalData.mockRejectedValue(new Error('idb'))
    await expect(deleteAccountService()).resolves.toBeUndefined()
    expect(mockRpc).toHaveBeenCalledWith('delete_own_account')
  })

  it('DeleteAccountError has correct name and code', () => {
    const err = new DeleteAccountError('test_code')
    expect(err.name).toBe('DeleteAccountError')
    expect(err.code).toBe('test_code')
    expect(err).toBeInstanceOf(Error)
  })
})
