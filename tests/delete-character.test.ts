import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/data/db ────────────────────────────────────────────────────────────
const mockDeleteFromDB   = vi.fn().mockResolvedValue(undefined)
const mockCreateTombstone = vi.fn().mockResolvedValue(undefined)
const mockRemoveTombstone = vi.fn().mockResolvedValue(undefined)

vi.mock('@/data/db', () => ({
  listCharacters:      vi.fn(),
  getCharacter:        vi.fn(),
  saveCharacter:       vi.fn(),
  deleteCharacter:     (...args: unknown[]) => mockDeleteFromDB(...args),
  createTombstone:     (...args: unknown[]) => mockCreateTombstone(...args),
  removeTombstone:     (...args: unknown[]) => mockRemoveTombstone(...args),
  getPendingTombstones: vi.fn().mockResolvedValue([]),
  markTombstoneSynced:  vi.fn().mockResolvedValue(undefined),
}))

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────
let mockSession: { user: { id: string } } | null = null
let mockSupabaseConfigured = false

const mockFrom = vi.fn()
const mockStorageFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
}))

const mockClient = {
  from: (...args: unknown[]) => mockFrom(...args),
  storage: {
    from: (...args: unknown[]) => mockStorageFrom(...args),
  },
}

import {
  deleteCharacterService,
  DeleteCharacterError,
  parseDeleteErrorCode,
} from '@/services/delete-character'

// ── helpers ───────────────────────────────────────────────────────────────────

function setupSupabase(userId = 'user_001') {
  mockSupabaseConfigured = true
  mockSession = { user: { id: userId } }
}

function resetSupabase() {
  mockSupabaseConfigured = false
  mockSession = null
}

// ── deleteCharacterService ────────────────────────────────────────────────────

describe('deleteCharacterService — not logged in', () => {
  beforeEach(() => {
    mockDeleteFromDB.mockResolvedValue(undefined)
    resetSupabase()
    vi.clearAllMocks()
    mockDeleteFromDB.mockResolvedValue(undefined)
  })

  it('deletes from IndexedDB', async () => {
    const result = await deleteCharacterService('char_001')
    expect(mockDeleteFromDB).toHaveBeenCalledWith('char_001')
    expect(result.localOk).toBe(true)
  })

  it('returns cloudOk=false and storageOk=false when not logged in', async () => {
    const result = await deleteCharacterService('char_001')
    expect(result.cloudOk).toBe(false)
    expect(result.storageOk).toBe(false)
    expect(result.errors).toHaveLength(0)
  })

  it('does not call supabase when client is null', async () => {
    await deleteCharacterService('char_001')
    expect(mockFrom).not.toHaveBeenCalled()
    expect(mockStorageFrom).not.toHaveBeenCalled()
  })
})

describe('deleteCharacterService — local delete failure', () => {
  beforeEach(() => {
    mockDeleteFromDB.mockRejectedValue(new Error('IDB error'))
    resetSupabase()
  })

  it('throws DeleteCharacterError with code local_delete_failed', async () => {
    await expect(deleteCharacterService('char_001'))
      .rejects.toThrow(DeleteCharacterError)
    await expect(deleteCharacterService('char_001'))
      .rejects.toMatchObject({ code: 'local_delete_failed' })
  })

  it('result.localOk is false in the thrown error', async () => {
    try {
      await deleteCharacterService('char_001')
    } catch (err) {
      expect(err instanceof DeleteCharacterError).toBe(true)
      if (err instanceof DeleteCharacterError) {
        expect(err.result.localOk).toBe(false)
        expect(err.result.errors).toContain('local_delete_failed')
      }
    }
  })
})

describe('deleteCharacterService — logged in, full success', () => {
  const mockDeleteEq  = vi.fn().mockResolvedValue({ error: null })
  const mockDeleteFn  = vi.fn().mockReturnValue({ eq: mockDeleteEq })
  const mockListFn    = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockRemoveFn  = vi.fn().mockResolvedValue({ error: null })

  beforeEach(() => {
    mockDeleteFromDB.mockResolvedValue(undefined)
    setupSupabase('user_abc')
    mockFrom.mockReturnValue({ delete: mockDeleteFn })
    mockStorageFrom.mockReturnValue({ list: mockListFn, remove: mockRemoveFn })
    vi.clearAllMocks()
    mockDeleteFromDB.mockResolvedValue(undefined)
    setupSupabase('user_abc')
    mockFrom.mockReturnValue({ delete: mockDeleteFn })
    mockStorageFrom.mockReturnValue({ list: mockListFn, remove: mockRemoveFn })
  })

  it('returns all OK flags', async () => {
    const result = await deleteCharacterService('char_001')
    expect(result.localOk).toBe(true)
    expect(result.cloudOk).toBe(true)
    expect(result.storageOk).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('calls supabase.from("characters").delete().eq("id", characterId)', async () => {
    await deleteCharacterService('char_001')
    expect(mockFrom).toHaveBeenCalledWith('characters')
    expect(mockDeleteFn).toHaveBeenCalled()
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'char_001')
  })
})

describe('deleteCharacterService — logged in, no storage files', () => {
  const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })
  const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq })
  const mockListFn   = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockRemoveFn = vi.fn().mockResolvedValue({ error: null })

  beforeEach(() => {
    mockDeleteFromDB.mockResolvedValue(undefined)
    setupSupabase('user_abc')
    mockFrom.mockReturnValue({ delete: mockDeleteFn })
    mockStorageFrom.mockReturnValue({ list: mockListFn, remove: mockRemoveFn })
  })

  it('skips storage remove when list returns empty', async () => {
    const result = await deleteCharacterService('char_001')
    expect(result.storageOk).toBe(true)
    expect(mockRemoveFn).not.toHaveBeenCalled()
  })
})

describe('deleteCharacterService — partial cloud failure', () => {
  const mockListFn   = vi.fn().mockResolvedValue({ data: [{ name: 'portrait.jpg' }], error: null })
  const mockRemoveFn = vi.fn().mockResolvedValue({ error: null })

  beforeEach(() => {
    mockDeleteFromDB.mockResolvedValue(undefined)
    setupSupabase('user_abc')
    mockStorageFrom.mockReturnValue({ list: mockListFn, remove: mockRemoveFn })
  })

  it('continues to storage even when cloud row delete fails', async () => {
    const badDeleteEq = vi.fn().mockResolvedValue({ error: new Error('cloud fail') })
    const badDeleteFn = vi.fn().mockReturnValue({ eq: badDeleteEq })
    mockFrom.mockReturnValue({ delete: badDeleteFn })

    const result = await deleteCharacterService('char_001')
    expect(result.localOk).toBe(true)
    expect(result.cloudOk).toBe(false)
    expect(result.errors).toContain('cloud_delete_failed')
    // storage was still attempted
    expect(mockStorageFrom).toHaveBeenCalled()
  })

  it('reports storage_delete_failed without throwing', async () => {
    const okDeleteEq = vi.fn().mockResolvedValue({ error: null })
    const okDeleteFn = vi.fn().mockReturnValue({ eq: okDeleteEq })
    mockFrom.mockReturnValue({ delete: okDeleteFn })
    mockStorageFrom.mockReturnValue({
      list:   vi.fn().mockResolvedValue({ data: [{ name: 'x.jpg' }], error: null }),
      remove: vi.fn().mockResolvedValue({ error: new Error('storage fail') }),
    })

    const result = await deleteCharacterService('char_001')
    expect(result.storageOk).toBe(false)
    expect(result.errors).toContain('storage_delete_failed')
    // must not throw
  })
})

// ── deleteCharacterService — tombstone behavior ───────────────────────────────

describe('deleteCharacterService — tombstone behavior', () => {
  const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })
  const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq })
  const mockListFn   = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockRemoveFn = vi.fn().mockResolvedValue({ error: null })

  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteFromDB.mockResolvedValue(undefined)
    mockCreateTombstone.mockResolvedValue(undefined)
    mockRemoveTombstone.mockResolvedValue(undefined)
  })

  it('creates tombstone when user is logged in', async () => {
    setupSupabase('user_001')
    mockFrom.mockReturnValue({ delete: mockDeleteFn })
    mockStorageFrom.mockReturnValue({ list: mockListFn, remove: mockRemoveFn })
    await deleteCharacterService('char_001')
    expect(mockCreateTombstone).toHaveBeenCalledWith('char_001', 'user_001')
  })

  it('does not create tombstone when not logged in', async () => {
    resetSupabase()
    await deleteCharacterService('char_001')
    expect(mockCreateTombstone).not.toHaveBeenCalled()
  })

  it('removes tombstone when cloud + storage both succeed', async () => {
    setupSupabase('user_001')
    mockFrom.mockReturnValue({ delete: mockDeleteFn })
    mockStorageFrom.mockReturnValue({ list: mockListFn, remove: mockRemoveFn })
    await deleteCharacterService('char_001')
    expect(mockRemoveTombstone).toHaveBeenCalledWith('char_001')
  })

  it('keeps tombstone pending when cloud delete fails', async () => {
    setupSupabase('user_001')
    const badEq = vi.fn().mockResolvedValue({ error: new Error('cloud fail') })
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: badEq }) })
    mockStorageFrom.mockReturnValue({ list: mockListFn, remove: mockRemoveFn })
    await deleteCharacterService('char_001')
    expect(mockRemoveTombstone).not.toHaveBeenCalled()
  })

  it('keeps tombstone pending when storage delete fails', async () => {
    setupSupabase('user_001')
    mockFrom.mockReturnValue({ delete: mockDeleteFn })
    mockStorageFrom.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [{ name: 'p.jpg' }], error: null }),
      remove: vi.fn().mockResolvedValue({ error: new Error('storage fail') }),
    })
    await deleteCharacterService('char_001')
    expect(mockRemoveTombstone).not.toHaveBeenCalled()
  })
})

// ── parseDeleteErrorCode ──────────────────────────────────────────────────────

describe('parseDeleteErrorCode', () => {
  it('returns the code from DeleteCharacterError', () => {
    const err = new DeleteCharacterError('local_delete_failed', {
      localOk: false, cloudOk: false, storageOk: false, errors: [],
    })
    expect(parseDeleteErrorCode(err)).toBe('local_delete_failed')
  })

  it('returns unknown for generic Error', () => {
    expect(parseDeleteErrorCode(new Error('oops'))).toBe('unknown')
  })

  it('returns unknown for non-Error value', () => {
    expect(parseDeleteErrorCode('string')).toBe('unknown')
    expect(parseDeleteErrorCode(null)).toBe('unknown')
  })
})
