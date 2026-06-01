import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DeletedCharacterTombstone } from '@/data/db'

// ── In-memory stores (must be hoisted so vi.mock factory can reference them) ──

const { tombstoneStore, characterStore, mockDB, makeObjectStoreNames } = vi.hoisted(() => {
  const tombstoneStore = new Map<string, DeletedCharacterTombstone>()
  const characterStore = new Map<string, unknown>()

  function makeObjectStoreNames(names: string[]) {
    return { contains: (name: string) => names.includes(name) }
  }

  const mockDB = {
    objectStoreNames: makeObjectStoreNames(['characters', 'deleted_characters']),
    createObjectStore: vi.fn(),
    deleteObjectStore: vi.fn(),
    getAll: vi.fn().mockImplementation((store: string) => {
      if (store === 'deleted_characters') return Promise.resolve([...tombstoneStore.values()])
      return Promise.resolve([...characterStore.values()])
    }),
    get: vi.fn().mockImplementation((store: string, id: string) => {
      if (store === 'deleted_characters') return Promise.resolve(tombstoneStore.get(id))
      return Promise.resolve(characterStore.get(id))
    }),
    put: vi.fn().mockImplementation((store: string, value: unknown) => {
      if (store === 'deleted_characters') {
        const t = value as DeletedCharacterTombstone
        tombstoneStore.set(t.id, t)
      } else {
        const r = value as { id: string }
        characterStore.set(r.id, r)
      }
      return Promise.resolve()
    }),
    delete: vi.fn().mockImplementation((store: string, id: string) => {
      if (store === 'deleted_characters') tombstoneStore.delete(id)
      else characterStore.delete(id)
      return Promise.resolve()
    }),
    transaction: vi.fn(),
    close: vi.fn(),
  }

  return { tombstoneStore, characterStore, mockDB, makeObjectStoreNames }
})

vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue(mockDB),
}))

import {
  createTombstone,
  getPendingTombstones,
  markTombstoneSynced,
  removeTombstone,
} from '@/data/db'

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetMockImplementations() {
  mockDB.getAll.mockImplementation((store: string) => {
    if (store === 'deleted_characters') return Promise.resolve([...tombstoneStore.values()])
    return Promise.resolve([...characterStore.values()])
  })
  mockDB.get.mockImplementation((store: string, id: string) => {
    if (store === 'deleted_characters') return Promise.resolve(tombstoneStore.get(id))
    return Promise.resolve(characterStore.get(id))
  })
  mockDB.put.mockImplementation((store: string, value: unknown) => {
    if (store === 'deleted_characters') {
      const t = value as DeletedCharacterTombstone
      tombstoneStore.set(t.id, t)
    } else {
      const r = value as { id: string }
      characterStore.set(r.id, r)
    }
    return Promise.resolve()
  })
  mockDB.delete.mockImplementation((store: string, id: string) => {
    if (store === 'deleted_characters') tombstoneStore.delete(id)
    else characterStore.delete(id)
    return Promise.resolve()
  })
}

function makeTransactionMock() {
  const mockObjectStore = { openCursor: vi.fn().mockResolvedValue(null) }
  return { objectStore: vi.fn().mockReturnValue(mockObjectStore) }
}

function seedTombstone(overrides: Partial<DeletedCharacterTombstone> = {}): DeletedCharacterTombstone {
  const t: DeletedCharacterTombstone = {
    id: 'char_001', deletedAt: 1700000000000, userId: 'user_001', synced: false,
    ...overrides,
  }
  tombstoneStore.set(t.id, t)
  return t
}

// ── Schema migration (v9 — Phase 1 synchronous createObjectStore) ─────────────
//
// The upgrade callback is split into two phases:
//   Phase 1 (sync): all createObjectStore / deleteObjectStore calls
//   Phase 2 (async): cursor-based data migrations
// This prevents the versionchange transaction from auto-committing before
// createObjectStore runs when earlier data-migration phases use await.

describe('Schema migration → v9 (deleted_characters store)', () => {
  it('creates deleted_characters store from fresh install (oldVersion = 0)', async () => {
    const { openDB } = await import('idb')
    const upgradeMock = vi.fn()
    vi.mocked(openDB).mockImplementationOnce((_name, _version, opts) => {
      const fakeDb = {
        objectStoreNames: makeObjectStoreNames([]),
        createObjectStore: upgradeMock,
        deleteObjectStore: vi.fn(),
      }
      const txMock = makeTransactionMock()
      opts?.upgrade?.(fakeDb as never, 0, 9, txMock as never, {} as never)
      return Promise.resolve(mockDB)
    })
    await createTombstone('char_x', 'user_x')
    expect(upgradeMock).toHaveBeenCalledWith('deleted_characters', { keyPath: 'id' })
  })

  it('creates deleted_characters store when upgrading from v7', async () => {
    const { openDB } = await import('idb')
    const upgradeMock = vi.fn()
    vi.mocked(openDB).mockImplementationOnce((_name, _version, opts) => {
      const fakeDb = {
        objectStoreNames: makeObjectStoreNames(['characters']),
        createObjectStore: upgradeMock,
        deleteObjectStore: vi.fn(),
      }
      opts?.upgrade?.(fakeDb as never, 7, 9, makeTransactionMock() as never, {} as never)
      return Promise.resolve(mockDB)
    })
    await createTombstone('char_x', 'user_x')
    expect(upgradeMock).toHaveBeenCalledWith('deleted_characters', { keyPath: 'id' })
  })

  it('heals broken v8 install (v8 without deleted_characters → v9)', async () => {
    // v8 was deployed with createObjectStore AFTER awaits, so some installs
    // reached v8 without the deleted_characters store. v9 defensive fix.
    const { openDB } = await import('idb')
    const upgradeMock = vi.fn()
    vi.mocked(openDB).mockImplementationOnce((_name, _version, opts) => {
      const fakeDb = {
        objectStoreNames: makeObjectStoreNames(['characters']),  // broken: missing tombstone store
        createObjectStore: upgradeMock,
        deleteObjectStore: vi.fn(),
      }
      opts?.upgrade?.(fakeDb as never, 8, 9, makeTransactionMock() as never, {} as never)
      return Promise.resolve(mockDB)
    })
    await createTombstone('char_x', 'user_x')
    expect(upgradeMock).toHaveBeenCalledWith('deleted_characters', { keyPath: 'id' })
  })

  it('does not recreate store if it already exists (idempotent)', async () => {
    const { openDB } = await import('idb')
    const upgradeMock = vi.fn()
    vi.mocked(openDB).mockImplementationOnce((_name, _version, opts) => {
      const fakeDb = {
        objectStoreNames: makeObjectStoreNames(['characters', 'deleted_characters']),
        createObjectStore: upgradeMock,
        deleteObjectStore: vi.fn(),
      }
      opts?.upgrade?.(fakeDb as never, 7, 9, makeTransactionMock() as never, {} as never)
      return Promise.resolve(mockDB)
    })
    await createTombstone('char_x', 'user_x')
    expect(upgradeMock).not.toHaveBeenCalledWith('deleted_characters', expect.anything())
  })

  it('characters store is preserved across v9 migration', async () => {
    const { openDB } = await import('idb')
    const deleteStoreMock = vi.fn()
    vi.mocked(openDB).mockImplementationOnce((_name, _version, opts) => {
      const fakeDb = {
        objectStoreNames: makeObjectStoreNames(['characters', 'deleted_characters']),
        createObjectStore: vi.fn(),
        deleteObjectStore: deleteStoreMock,
      }
      opts?.upgrade?.(fakeDb as never, 7, 9, makeTransactionMock() as never, {} as never)
      return Promise.resolve(mockDB)
    })
    await createTombstone('char_x', 'user_x')
    expect(deleteStoreMock).not.toHaveBeenCalledWith('characters')
  })
})

// ── createTombstone ───────────────────────────────────────────────────────────

describe('createTombstone', () => {
  beforeEach(() => {
    tombstoneStore.clear()
    vi.clearAllMocks()
    resetMockImplementations()
  })

  it('stores tombstone with synced=false', async () => {
    await createTombstone('char_001', 'user_001')
    const t = tombstoneStore.get('char_001')
    expect(t).toBeDefined()
    expect(t!.synced).toBe(false)
  })

  it('stores tombstone with correct characterId and userId', async () => {
    await createTombstone('char_002', 'user_007')
    const t = tombstoneStore.get('char_002')
    expect(t!.id).toBe('char_002')
    expect(t!.userId).toBe('user_007')
  })

  it('stamps deletedAt close to Date.now()', async () => {
    const before = Date.now()
    await createTombstone('char_001', 'user_001')
    const after = Date.now()
    const t = tombstoneStore.get('char_001')
    expect(t!.deletedAt).toBeGreaterThanOrEqual(before)
    expect(t!.deletedAt).toBeLessThanOrEqual(after)
  })

  it('is idempotent: second write overwrites first', async () => {
    await createTombstone('char_001', 'user_001')
    await createTombstone('char_001', 'user_001')
    expect(tombstoneStore.size).toBe(1)
  })
})

// ── getPendingTombstones ──────────────────────────────────────────────────────

describe('getPendingTombstones', () => {
  beforeEach(() => {
    tombstoneStore.clear()
    vi.clearAllMocks()
    resetMockImplementations()
  })

  it('returns empty array when no tombstones exist', async () => {
    const result = await getPendingTombstones()
    expect(result).toHaveLength(0)
  })

  it('returns only tombstones with synced=false', async () => {
    seedTombstone({ id: 'char_001', synced: false })
    seedTombstone({ id: 'char_002', synced: true })
    const result = await getPendingTombstones()
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('char_001')
  })

  it('returns all pending tombstones when none are synced', async () => {
    seedTombstone({ id: 'char_001', synced: false })
    seedTombstone({ id: 'char_002', synced: false })
    const result = await getPendingTombstones()
    expect(result).toHaveLength(2)
  })

  it('returns empty array when all tombstones are synced', async () => {
    seedTombstone({ id: 'char_001', synced: true })
    seedTombstone({ id: 'char_002', synced: true })
    const result = await getPendingTombstones()
    expect(result).toHaveLength(0)
  })
})

// ── markTombstoneSynced ───────────────────────────────────────────────────────

describe('markTombstoneSynced', () => {
  beforeEach(() => {
    tombstoneStore.clear()
    vi.clearAllMocks()
    resetMockImplementations()
  })

  it('updates synced flag to true', async () => {
    seedTombstone({ id: 'char_001', synced: false })
    await markTombstoneSynced('char_001')
    expect(tombstoneStore.get('char_001')!.synced).toBe(true)
  })

  it('does not throw when tombstone does not exist', async () => {
    await expect(markTombstoneSynced('nonexistent')).resolves.toBeUndefined()
  })

  it('does not create a new tombstone for a non-existent id', async () => {
    await markTombstoneSynced('nonexistent')
    expect(tombstoneStore.has('nonexistent')).toBe(false)
  })

  it('preserves other fields when marking synced', async () => {
    seedTombstone({ id: 'char_001', userId: 'user_x', deletedAt: 12345, synced: false })
    await markTombstoneSynced('char_001')
    const t = tombstoneStore.get('char_001')!
    expect(t.userId).toBe('user_x')
    expect(t.deletedAt).toBe(12345)
  })
})

// ── removeTombstone ───────────────────────────────────────────────────────────

describe('removeTombstone', () => {
  beforeEach(() => {
    tombstoneStore.clear()
    vi.clearAllMocks()
    resetMockImplementations()
  })

  it('removes the tombstone from the store', async () => {
    seedTombstone({ id: 'char_001' })
    await removeTombstone('char_001')
    expect(tombstoneStore.has('char_001')).toBe(false)
  })

  it('does not throw when removing a non-existent tombstone', async () => {
    await expect(removeTombstone('nonexistent')).resolves.toBeUndefined()
  })

  it('only removes the targeted tombstone', async () => {
    seedTombstone({ id: 'char_001' })
    seedTombstone({ id: 'char_002' })
    await removeTombstone('char_001')
    expect(tombstoneStore.has('char_002')).toBe(true)
    expect(tombstoneStore.has('char_001')).toBe(false)
  })
})
