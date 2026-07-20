import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Character } from '@/domain/character'
import type { DeletedCharacterTombstone } from '@/data/db'

// ── Mock @/data/db ────────────────────────────────────────────────────────────

const mockListCharacters      = vi.fn<[], Promise<Character[]>>()
const mockGetCharacter        = vi.fn<[string], Promise<Character | null>>()
const mockDeleteCharacterDB   = vi.fn<[string], Promise<void>>()
const mockImportCharacter     = vi.fn<[Character], Promise<void>>()
const mockGetPendingTombstones = vi.fn<[], Promise<DeletedCharacterTombstone[]>>()
const mockRemoveTombstone     = vi.fn<[string], Promise<void>>()

vi.mock('@/data/db', () => ({
  listCharacters:       (...a: unknown[]) => mockListCharacters(...(a as [])),
  getCharacter:         (...a: unknown[]) => mockGetCharacter(...(a as [string])),
  deleteCharacter:      (...a: unknown[]) => mockDeleteCharacterDB(...(a as [string])),
  importCharacter:      (...a: unknown[]) => mockImportCharacter(...(a as [Character])),
  getPendingTombstones: (...a: unknown[]) => mockGetPendingTombstones(...(a as [])),
  removeTombstone:      (...a: unknown[]) => mockRemoveTombstone(...(a as [string])),
  // unused in sync-download tests but required by the mock module shape
  saveCharacter:        vi.fn(),
  createTombstone:      vi.fn(),
  markTombstoneSynced:  vi.fn(),
  markCharacterSynced:  vi.fn().mockResolvedValue(undefined),
}))

// ── Mock @/store/characters ───────────────────────────────────────────────────

const mockFetchCharacters = vi.fn<[], Promise<void>>()
const mockCharacters: Character[] = []

vi.mock('@/store/characters', () => ({
  useCharactersStore: {
    getState: () => ({
      characters: mockCharacters,
      fetchCharacters: mockFetchCharacters,
    }),
  },
}))

// ── Mock @/services/delete-character ─────────────────────────────────────────

const mockDeleteImages = vi.fn<[string, string], Promise<void>>()

vi.mock('@/services/delete-character', () => ({
  deleteCharacterImages: (...a: unknown[]) => mockDeleteImages(...(a as [string, string])),
  deleteCharacterService: vi.fn(),
  DeleteCharacterError: class {},
  parseDeleteErrorCode: vi.fn(),
}))

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSession: { user: { id: string } } | null = null
let mockSupabaseConfigured = false

// Per-table data (mutable per test)
let mockCharsSelectData: unknown[]    = []
let mockTombsSelectData: unknown[]    = []
let mockCharsMaybySingleData: { updated_at: string } | null = null
let mockCharsUpsertError: Error | null = null
let mockTombsUpsertError: Error | null = null
let mockCharsDeleteError: Error | null = null
let mockStorageListData: { name: string }[] = []
let mockStorageDownloadBlob: Blob | null = null
let mockStorageDownloadError: Error | null = null

const mockCharsUpsert    = vi.fn()
const mockTombsUpsert    = vi.fn()
const mockCharsDeleteEq  = vi.fn()
const mockStorageList    = vi.fn()
const mockStorageDownload = vi.fn()
const mockStorageUpload  = vi.fn()

const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === 'deleted_characters') {
    return {
      select: () => ({
        eq: () => ({
          returns: () => Promise.resolve({ data: mockTombsSelectData, error: null }),
        }),
      }),
      upsert: (...a: unknown[]) => {
        mockTombsUpsert(...a)
        return Promise.resolve({ error: mockTombsUpsertError })
      },
    }
  }
  // default: 'characters' table
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: mockCharsMaybySingleData }),
        returns: () => Promise.resolve({ data: mockCharsSelectData, error: null }),
      }),
    }),
    upsert: (...a: unknown[]) => {
      mockCharsUpsert(...a)
      return Promise.resolve({ error: mockCharsUpsertError })
    },
    delete: () => ({
      eq: (...a: unknown[]) => {
        mockCharsDeleteEq(...a)
        return Promise.resolve({ error: mockCharsDeleteError })
      },
    }),
  }
})

const mockStorageFrom = vi.fn().mockImplementation(() => ({
  list:     (...a: unknown[]) => { mockStorageList(...a); return Promise.resolve({ data: mockStorageListData, error: null }) },
  download: (...a: unknown[]) => { mockStorageDownload(...a); return Promise.resolve({ data: mockStorageDownloadBlob, error: mockStorageDownloadError }) },
  upload:   (...a: unknown[]) => { mockStorageUpload(...a); return Promise.resolve({ error: null }) },
}))

const mockClient = {
  from:    (...a: unknown[]) => mockFrom(...a),
  storage: { from: (...a: unknown[]) => mockStorageFrom(...a) },
}

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
}))

// ── Import under test (after mocks) ──────────────────────────────────────────

import {
  syncAll,
  getSyncStatus,
  onSyncStatusChange,
  blobToBase64,
} from '@/services/sync'

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupLoggedIn(userId = 'user_001') {
  mockSupabaseConfigured = true
  mockSession = { user: { id: userId } }
}

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char_001', name: 'Aria', race: 'Elf', background: 'Sage',
    alignment: 'LG',
    classes: [{ name: 'Wizard', level: 3, hitDie: 6 }],
    experience: 0, age: '', height: '', weight: '',
    eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 14, con: 12, int: 18, wis: 14, cha: 10 },
    proficiencyBonus: 2,
    hp: { current: 18, max: 18, temp: 0 },
    hitDice: [{ className: 'Wizard', current: 3, max: 3, dieSize: 6 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 12, initiative: 2, speed: 30,
    passivePerception: 12, spellSaveDC: 14, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks: [], inventory: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features: [], backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [], spellSlots: {},
    spellcastingAbility: '', spellcastingClass: '',
    images: {}, createdAt: 0, updatedAt: 1_700_000_000_000,
    ...overrides,
  }
}

function makeCloudRow(char: Character, updatedAtMs: number) {
  return {
    id:         char.id,
    user_id:    'user_001',
    data:       char,
    updated_at: new Date(updatedAtMs).toISOString(),
  }
}

function makeTombRow(id: string) {
  return { id, user_id: 'user_001', deleted_at: new Date().toISOString() }
}

function resetAll() {
  mockSession = null
  mockSupabaseConfigured = false
  mockCharsSelectData    = []
  mockTombsSelectData    = []
  mockCharsMaybySingleData = null
  mockCharsUpsertError   = null
  mockTombsUpsertError   = null
  mockCharsDeleteError   = null
  mockStorageListData    = []
  mockStorageDownloadBlob = null
  mockStorageDownloadError = null
  mockCharacters.length  = 0
  vi.clearAllMocks()
  mockGetPendingTombstones.mockResolvedValue([])
  mockRemoveTombstone.mockResolvedValue(undefined)
  mockImportCharacter.mockResolvedValue(undefined)
  mockDeleteCharacterDB.mockResolvedValue(undefined)
  mockListCharacters.mockResolvedValue([])
  mockGetCharacter.mockResolvedValue(null)
  mockFetchCharacters.mockResolvedValue(undefined)
  mockDeleteImages.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
}

// ── uploadCharacter — LWW guard ───────────────────────────────────────────────

describe('uploadCharacter — LWW guard', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
  })

  it('skips upsert when cloud version is newer', async () => {
    const char = makeChar({ id: 'char_001', updatedAt: 1_000 })
    mockCharacters.splice(0, Infinity, char)
    mockGetPendingTombstones.mockResolvedValue([])
    mockListCharacters.mockResolvedValue([char])
    mockCharsSelectData = []
    mockTombsSelectData = []
    // Cloud maybeSingle returns a row newer than local
    mockCharsMaybySingleData = { updated_at: new Date(2_000).toISOString() }

    await syncAll()

    expect(mockCharsUpsert).not.toHaveBeenCalled()
  })

  it('proceeds with upsert when local version is newer', async () => {
    const char = makeChar({ id: 'char_001', updatedAt: 3_000 })
    mockCharacters.splice(0, Infinity, char)
    mockGetPendingTombstones.mockResolvedValue([])
    mockListCharacters.mockResolvedValue([char])
    mockCharsSelectData = []
    mockTombsSelectData = []
    // Cloud maybySingle returns an older row
    mockCharsMaybySingleData = { updated_at: new Date(1_000).toISOString() }

    await syncAll()

    expect(mockCharsUpsert).toHaveBeenCalledTimes(1)
  })

  it('proceeds with upsert when char does not exist in cloud', async () => {
    const char = makeChar({ id: 'char_001', updatedAt: 1_000 })
    mockCharacters.splice(0, Infinity, char)
    mockGetPendingTombstones.mockResolvedValue([])
    mockListCharacters.mockResolvedValue([char])
    mockCharsSelectData = []
    mockTombsSelectData = []
    // Cloud maybySingle returns null (char not yet uploaded)
    mockCharsMaybySingleData = null

    await syncAll()

    expect(mockCharsUpsert).toHaveBeenCalledTimes(1)
  })
})

// ── processTombstones — cloud tombstone insert ────────────────────────────────

describe('processTombstones — cloud tombstone insert', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockCharsSelectData = []
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([])
  })

  it('inserts cloud tombstone before deleting from characters', async () => {
    const callOrder: string[] = []
    mockTombsUpsert.mockImplementation(() => { callOrder.push('tombstone_upsert'); return Promise.resolve({ error: null }) })
    mockCharsDeleteEq.mockImplementation(() => { callOrder.push('chars_delete'); return Promise.resolve({ error: null }) })

    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 100, userId: 'user_001', synced: false },
    ])

    await syncAll()

    expect(callOrder[0]).toBe('tombstone_upsert')
    expect(callOrder[1]).toBe('chars_delete')
  })

  it('inserts cloud tombstone with correct shape', async () => {
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 1_700_000_000_000, userId: 'user_001', synced: false },
    ])

    await syncAll()

    expect(mockTombsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id:      'char_del',
        user_id: 'user_001',
      })
    )
  })

  it('does not remove local tombstone if cloud upsert fails', async () => {
    mockTombsUpsertError = new Error('cloud error')
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 100, userId: 'user_001', synced: false },
    ])

    await syncAll()

    expect(mockRemoveTombstone).not.toHaveBeenCalled()
  })

  it('removes local tombstone after successful cloud propagation', async () => {
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 100, userId: 'user_001', synced: false },
    ])

    await syncAll()

    expect(mockRemoveTombstone).toHaveBeenCalledWith('char_del')
  })
})

// ── downloadCharacters — basic ────────────────────────────────────────────────

describe('downloadCharacters — basic', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockGetPendingTombstones.mockResolvedValue([])
  })

  it('does nothing when cloud returns empty lists', async () => {
    mockCharsSelectData = []
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    expect(mockImportCharacter).not.toHaveBeenCalled()
    expect(mockDeleteCharacterDB).not.toHaveBeenCalled()
    expect(mockFetchCharacters).not.toHaveBeenCalled()
  })

  it('fetches both characters and tombstones from cloud', async () => {
    const char = makeChar()
    mockCharsSelectData = [makeCloudRow(char, 2_000)]
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    // Both tables were queried
    const tableArgs = mockFrom.mock.calls.map(c => c[0])
    expect(tableArgs).toContain('characters')
    expect(tableArgs).toContain('deleted_characters')
  })

  it('returns idle status after successful download', async () => {
    mockCharsSelectData = []
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    expect(getSyncStatus()).toBe('idle')
  })
})

// ── downloadCharacters — LWW conflict ────────────────────────────────────────

describe('downloadCharacters — LWW conflict', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockGetPendingTombstones.mockResolvedValue([])
    mockTombsSelectData = []
  })

  it('overwrites local when cloud is strictly newer', async () => {
    const localChar  = makeChar({ id: 'char_001', updatedAt: 1_000 })
    const cloudData  = makeChar({ id: 'char_001', name: 'CloudName', updatedAt: 1_000 })
    mockCharsSelectData  = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockImportCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'char_001', updatedAt: 2_000 })
    )
  })

  it('keeps local when local is newer (cloud wins only when strictly older)', async () => {
    const localChar  = makeChar({ id: 'char_001', updatedAt: 5_000 })
    const cloudData  = makeChar({ id: 'char_001', updatedAt: 1_000 })
    mockCharsSelectData  = [makeCloudRow(cloudData, 1_000)]
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockImportCharacter).not.toHaveBeenCalled()
  })

  it('treats equal timestamps as no-op (local wins tie)', async () => {
    const ts = 3_000
    const localChar  = makeChar({ id: 'char_001', updatedAt: ts })
    const cloudData  = makeChar({ id: 'char_001', updatedAt: ts })
    mockCharsSelectData  = [makeCloudRow(cloudData, ts)]
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockImportCharacter).not.toHaveBeenCalled()
  })

  it('preserves cloud updatedAt when importing', async () => {
    const localChar = makeChar({ id: 'char_001', updatedAt: 1_000 })
    const cloudData = makeChar({ id: 'char_001', updatedAt: 1_000 })
    mockCharsSelectData = [makeCloudRow(cloudData, 9_999)]
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    const call = mockImportCharacter.mock.calls[0]![0]
    expect(call.updatedAt).toBe(9_999)
  })
})

// ── downloadCharacters — propagation ─────────────────────────────────────────

describe('downloadCharacters — propagation', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockGetPendingTombstones.mockResolvedValue([])
    mockTombsSelectData = []
  })

  it('adds cloud char that does not exist locally', async () => {
    const cloudData = makeChar({ id: 'char_new' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    expect(mockImportCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'char_new' })
    )
  })

  it('calls fetchCharacters after adding a new cloud char', async () => {
    const cloudData = makeChar({ id: 'char_new' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    expect(mockFetchCharacters).toHaveBeenCalled()
  })

  it('deletes local char when cloud has tombstone', async () => {
    const localChar = makeChar({ id: 'char_deleted' })
    mockCharsSelectData = []  // not in cloud characters
    mockTombsSelectData = [makeTombRow('char_deleted')]
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockDeleteCharacterDB).toHaveBeenCalledWith('char_deleted')
  })

  it('keeps local char when cloud has neither char nor tombstone (ambiguous)', async () => {
    const localChar = makeChar({ id: 'char_ambiguous' })
    mockCharsSelectData = []
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockDeleteCharacterDB).not.toHaveBeenCalled()
    expect(mockImportCharacter).not.toHaveBeenCalled()
  })

  it('does not download cloud char that has a local pending tombstone', async () => {
    const cloudData = makeChar({ id: 'char_pending_del' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([])
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_pending_del', deletedAt: 100, userId: 'user_001', synced: false },
    ])

    await syncAll()

    expect(mockImportCharacter).not.toHaveBeenCalled()
  })

  it('skips cloud char that appears in cloud tombstones (inconsistent state)', async () => {
    const cloudData = makeChar({ id: 'char_both' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockTombsSelectData = [makeTombRow('char_both')]
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    expect(mockImportCharacter).not.toHaveBeenCalled()
  })
})

// ── downloadCharacterImages ───────────────────────────────────────────────────

describe('downloadCharacterImages', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockGetPendingTombstones.mockResolvedValue([])
    mockTombsSelectData = []
  })

  it('lists files from the correct storage path', async () => {
    const cloudData = makeChar({ id: 'char_001' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([])
    mockStorageListData = []

    await syncAll()

    expect(mockStorageList).toHaveBeenCalledWith('user_001/char_001')
  })

  it('skips download when local already has portrait (idempotent)', async () => {
    const cloudData = makeChar({ id: 'char_001' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([])
    mockStorageListData = [{ name: 'character.png' }]
    // Local char already has portrait
    mockGetCharacter.mockResolvedValue(
      makeChar({ id: 'char_001', images: { character: 'data:image/png;base64,existing' } })
    )

    await syncAll()

    expect(mockStorageDownload).not.toHaveBeenCalled()
  })

  it('downloads and saves portrait when local does not have it', async () => {
    const cloudData = makeChar({ id: 'char_001' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([])
    mockStorageListData = [{ name: 'character.png' }]
    mockGetCharacter.mockResolvedValue(makeChar({ id: 'char_001', images: {} }))
    const mockBlob = new Blob(['fake-png'], { type: 'image/png' })
    mockStorageDownloadBlob = mockBlob

    // Stub FileReader to simulate base64 conversion synchronously
    const fakeBase64 = 'data:image/png;base64,ZmFrZS1wbmc='
    vi.stubGlobal('FileReader', class {
      result: string | null = null
      onload: (() => void) | null = null
      onerror: ((e: unknown) => void) | null = null
      readAsDataURL() {
        this.result = fakeBase64
        Promise.resolve().then(() => this.onload?.())
      }
    })

    await syncAll()

    expect(mockImportCharacter).toHaveBeenLastCalledWith(
      expect.objectContaining({
        images: expect.objectContaining({ character: fakeBase64 }),
      })
    )

    vi.unstubAllGlobals()
  })

  it('handles storage list error gracefully (no crash)', async () => {
    // Override storage list to return an error
    mockStorageFrom.mockImplementationOnce(() => ({
      list:     () => Promise.resolve({ data: null, error: new Error('list failed') }),
      download: () => Promise.resolve({ data: null, error: null }),
      upload:   () => Promise.resolve({ error: null }),
    }))
    const cloudData = makeChar({ id: 'char_001' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([])

    await expect(syncAll()).resolves.toBeUndefined()
  })

  it('skips files with unknown names (only character and symbol allowed)', async () => {
    const cloudData = makeChar({ id: 'char_001' })
    mockCharsSelectData = [makeCloudRow(cloudData, 2_000)]
    mockListCharacters.mockResolvedValue([])
    mockStorageListData = [{ name: 'thumbnail.png' }, { name: 'metadata.json' }]
    mockGetCharacter.mockResolvedValue(makeChar({ id: 'char_001', images: {} }))

    await syncAll()

    expect(mockStorageDownload).not.toHaveBeenCalled()
  })
})

// ── syncAll — full cycle ──────────────────────────────────────────────────────

describe('syncAll — full cycle ordering', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockCharsSelectData = []
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([])
  })

  it('runs tombstones → upload → download in order', async () => {
    const callOrder: string[] = []

    mockGetPendingTombstones.mockImplementation(async () => {
      callOrder.push('processTombstones')
      return []
    })
    const char = makeChar({ id: 'char_001', updatedAt: 1_000 })
    mockCharacters.splice(0, Infinity, char)
    mockCharsUpsert.mockImplementation(async () => {
      callOrder.push('upload')
      return { error: null }
    })
    mockListCharacters.mockImplementation(async () => {
      callOrder.push('download')
      return []
    })

    await syncAll()

    expect(callOrder[0]).toBe('processTombstones')
    expect(callOrder[1]).toBe('upload')
    expect(callOrder[2]).toBe('download')
  })

  it('sets error status when download throws', async () => {
    mockListCharacters.mockRejectedValue(new Error('db error'))

    await syncAll()

    expect(getSyncStatus()).toBe('error')
  })

  it('emits syncing during operation and idle at end', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    await syncAll()
    unsub()
    expect(statuses[0]).toBe('syncing')
    expect(statuses[statuses.length - 1]).toBe('idle')
  })
})

// ── Multi-device simulation ───────────────────────────────────────────────────

describe('multi-device simulation', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockGetPendingTombstones.mockResolvedValue([])
  })

  it('device B downloads char created on device A', async () => {
    // Device A created the char and it's now in cloud
    const charFromA = makeChar({ id: 'char_from_a', name: 'Device A Char', updatedAt: 1_000 })
    mockCharsSelectData = [makeCloudRow(charFromA, 1_000)]
    mockTombsSelectData = []
    // Device B has no local chars
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    expect(mockImportCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'char_from_a', name: 'Device A Char' })
    )
  })

  it('device B propagates cloud delete of char deleted on device A', async () => {
    // Device A deleted char and cloud has both the tombstone and no char
    const localChar = makeChar({ id: 'char_from_a' })
    mockCharsSelectData = []  // no longer in cloud characters
    mockTombsSelectData = [makeTombRow('char_from_a')]
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockDeleteCharacterDB).toHaveBeenCalledWith('char_from_a')
    expect(mockFetchCharacters).toHaveBeenCalled()
  })

  it('conservative: char only in local (no cloud, no tombstone) is preserved', async () => {
    // User edited offline; char was never uploaded yet
    const localChar = makeChar({ id: 'char_offline' })
    mockCharsSelectData = []
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockDeleteCharacterDB).not.toHaveBeenCalled()
    expect(mockImportCharacter).not.toHaveBeenCalled()
  })

  it('LWW: device B edit (newer) wins over cloud (older)', async () => {
    const cloudData = makeChar({ id: 'char_001', name: 'Old name', updatedAt: 1_000 })
    const localChar = makeChar({ id: 'char_001', name: 'New name', updatedAt: 5_000 })
    mockCharsSelectData = [makeCloudRow(cloudData, 1_000)]
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockImportCharacter).not.toHaveBeenCalled()  // local wins, no download
  })

  it('LWW: cloud edit (newer) overwrites local (older)', async () => {
    const cloudData = makeChar({ id: 'char_001', name: 'Cloud name', updatedAt: 1_000 })
    const localChar = makeChar({ id: 'char_001', name: 'Old local', updatedAt: 500 })
    mockCharsSelectData = [makeCloudRow(cloudData, 1_000)]
    mockTombsSelectData = []
    mockListCharacters.mockResolvedValue([localChar])

    await syncAll()

    expect(mockImportCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'char_001', name: 'Cloud name' })
    )
  })
})

// ── syncAll — cloud tombstone skips upload ────────────────────────────────────

describe('syncAll — cloud tombstone skips upload', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockCharsSelectData = []
    mockGetPendingTombstones.mockResolvedValue([])
    mockListCharacters.mockResolvedValue([])
  })

  it('does not upload char that has a cloud tombstone', async () => {
    const char = makeChar({ id: 'char_tombstoned' })
    mockCharacters.splice(0, Infinity, char)
    mockTombsSelectData = [makeTombRow('char_tombstoned')]

    await syncAll()

    expect(mockCharsUpsert).not.toHaveBeenCalled()
  })

  it('deletes local char from DB when cloud tombstone exists during upload phase', async () => {
    const char = makeChar({ id: 'char_tombstoned' })
    mockCharacters.splice(0, Infinity, char)
    mockTombsSelectData = [makeTombRow('char_tombstoned')]

    await syncAll()

    expect(mockDeleteCharacterDB).toHaveBeenCalledWith('char_tombstoned')
  })

  it('still uploads chars that do not have a cloud tombstone', async () => {
    const charA = makeChar({ id: 'char_a' })
    const charB = makeChar({ id: 'char_b' })
    mockCharacters.splice(0, Infinity, charA, charB)
    mockTombsSelectData = [makeTombRow('char_a')]

    await syncAll()

    // char_a skipped (tombstoned), char_b uploaded
    expect(mockCharsUpsert).toHaveBeenCalledTimes(1)
    const uploadedId = (mockCharsUpsert.mock.calls[0]![0] as Record<string, unknown>).id
    expect(uploadedId).toBe('char_b')
  })

  it('calls fetchCharacters after deleting a locally-present tombstoned char', async () => {
    const char = makeChar({ id: 'char_tombstoned' })
    mockCharacters.splice(0, Infinity, char)
    mockTombsSelectData = [makeTombRow('char_tombstoned')]

    await syncAll()

    expect(mockFetchCharacters).toHaveBeenCalled()
  })

  it('does not call fetchCharacters in upload phase when no tombstoned chars exist locally', async () => {
    const char = makeChar({ id: 'char_normal' })
    mockCharacters.splice(0, Infinity, char)
    mockTombsSelectData = []   // no tombstones
    mockCharsSelectData = []   // nothing to download either

    await syncAll()

    // fetchCharacters is NOT called from the upload phase (only download phase may call it)
    // Since download also finds nothing, it should not be called at all
    expect(mockFetchCharacters).not.toHaveBeenCalled()
  })

  it('pre-fetches tombstones once regardless of number of local chars', async () => {
    const chars = [
      makeChar({ id: 'char_a' }), makeChar({ id: 'char_b' }), makeChar({ id: 'char_c' }),
    ]
    mockCharacters.splice(0, Infinity, ...chars)
    mockTombsSelectData = []

    await syncAll()

    // deleted_characters is queried once for fetchCloudTombstoneIds + once for downloadCharacters
    // (NOT N times for N chars — that would be Option B behaviour)
    const tombSelectCalls = mockFrom.mock.calls.filter(c => c[0] === 'deleted_characters')
    expect(tombSelectCalls).toHaveLength(2)
  })
})

// ── multi-device delete propagation (upload-phase guard) ─────────────────────

describe('multi-device delete — upload-phase guard', () => {
  beforeEach(() => {
    resetAll()
    setupLoggedIn()
    mockGetPendingTombstones.mockResolvedValue([])
    mockListCharacters.mockResolvedValue([])
  })

  it('device B does not re-upload char that device A deleted (tombstone exists)', async () => {
    // Device A deleted char_x → cloud tombstone exists, cloud characters row is gone
    // Device B still has char_x in its local Zustand store (hasn't synced yet)
    const charX = makeChar({ id: 'char_x', name: 'TesteDelete' })
    mockCharacters.splice(0, Infinity, charX)
    mockCharsSelectData = []                       // not in cloud characters
    mockTombsSelectData = [makeTombRow('char_x')]  // tombstone exists

    await syncAll()

    expect(mockCharsUpsert).not.toHaveBeenCalled()  // not re-uploaded
    expect(mockDeleteCharacterDB).toHaveBeenCalledWith('char_x')  // deleted locally
  })

  it('device B local char deleted (upload phase) does not get re-imported in download phase', async () => {
    // Ensure download phase does not resurrect a char just deleted in upload phase:
    // after deleteCharacter(), listCharacters() returns [] → download loop finds nothing
    const charX = makeChar({ id: 'char_x' })
    mockCharacters.splice(0, Infinity, charX)
    mockCharsSelectData = []                       // not in cloud characters (deleted by A)
    mockTombsSelectData = [makeTombRow('char_x')]
    // listCharacters returns empty (char_x was already deleted from DB by upload phase)
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    // importCharacter should NOT be called (no resurrection)
    expect(mockImportCharacter).not.toHaveBeenCalled()
  })

  it('multi-char: tombstoned char deleted locally while non-tombstoned char uploaded', async () => {
    const tombstoned = makeChar({ id: 'char_deleted', updatedAt: 1_000 })
    const normal     = makeChar({ id: 'char_normal',  updatedAt: 1_000 })
    mockCharacters.splice(0, Infinity, tombstoned, normal)
    mockCharsSelectData = []
    mockTombsSelectData = [makeTombRow('char_deleted')]
    mockListCharacters.mockResolvedValue([])

    await syncAll()

    expect(mockDeleteCharacterDB).toHaveBeenCalledWith('char_deleted')
    expect(mockCharsUpsert).toHaveBeenCalledTimes(1)
    const uploadedId = (mockCharsUpsert.mock.calls[0]![0] as Record<string, unknown>).id
    expect(uploadedId).toBe('char_normal')
  })
})

// ── blobToBase64 ──────────────────────────────────────────────────────────────

describe('blobToBase64', () => {
  it('resolves with a data URL string', async () => {
    const fakeResult = 'data:image/png;base64,abc123'
    vi.stubGlobal('FileReader', class {
      result: string | null = null
      onload: (() => void) | null = null
      onerror: ((e: unknown) => void) | null = null
      readAsDataURL() {
        this.result = fakeResult
        Promise.resolve().then(() => this.onload?.())
      }
    })

    const blob = new Blob(['test'], { type: 'image/png' })
    const result = await blobToBase64(blob)
    expect(result).toBe(fakeResult)

    vi.unstubAllGlobals()
  })

  it('rejects when FileReader errors', async () => {
    const fakeErr = new DOMException('read error')
    vi.stubGlobal('FileReader', class {
      result: string | null = null
      error: DOMException | null = fakeErr  // the error is on the instance, not the event arg
      onload: (() => void) | null = null
      onerror: ((e: unknown) => void) | null = null
      readAsDataURL() {
        Promise.resolve().then(() => this.onerror?.(new Event('error')))
      }
    })

    const blob = new Blob(['test'], { type: 'image/png' })
    await expect(blobToBase64(blob)).rejects.toBe(fakeErr)

    vi.unstubAllGlobals()
  })
})
