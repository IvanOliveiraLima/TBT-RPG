import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Character } from '@/domain/character'
import type { DeletedCharacterTombstone } from '@/data/db'

// ── Mock @/data/db ────────────────────────────────────────────────────────────

const mockMarkCharacterSynced = vi.fn<[string, number], Promise<void>>()
const mockGetPendingTombstones = vi.fn<[], Promise<DeletedCharacterTombstone[]>>()
const mockListCharacters       = vi.fn<[], Promise<Character[]>>()
const mockImportCharacter      = vi.fn<[Character], Promise<void>>()

vi.mock('@/data/db', () => ({
  markCharacterSynced:  (...a: unknown[]) => mockMarkCharacterSynced(...(a as [string, number])),
  getPendingTombstones: (...a: unknown[]) => mockGetPendingTombstones(...(a as [])),
  listCharacters:       (...a: unknown[]) => mockListCharacters(...(a as [])),
  importCharacter:      (...a: unknown[]) => mockImportCharacter(...(a as [Character])),
  getCharacter:         vi.fn().mockResolvedValue(null),
  saveCharacter:        vi.fn().mockResolvedValue(undefined),
  deleteCharacter:      vi.fn().mockResolvedValue(undefined),
  removeTombstone:      vi.fn().mockResolvedValue(undefined),
  createTombstone:      vi.fn().mockResolvedValue(undefined),
  markTombstoneSynced:  vi.fn().mockResolvedValue(undefined),
}))

// ── Mock @/store/useSyncConflictStore ─────────────────────────────────────────

const mockAddConflict    = vi.fn()
const mockRemoveConflict = vi.fn()
const mockHasConflict    = vi.fn().mockReturnValue(false)

vi.mock('@/store/useSyncConflictStore', () => ({
  useSyncConflictStore: {
    getState: () => ({
      addConflict:    mockAddConflict,
      removeConflict: mockRemoveConflict,
      hasConflict:    mockHasConflict,
      clear:          vi.fn(),
    }),
  },
}))

// ── Mock @/store/characters ───────────────────────────────────────────────────

const mockCharacters:      Character[] = []
const mockFetchCharacters  = vi.fn<[], Promise<void>>()
const mockAddCharacter     = vi.fn<[Character], Promise<void>>()

vi.mock('@/store/characters', () => ({
  useCharactersStore: {
    getState: () => ({
      characters:      mockCharacters,
      fetchCharacters: mockFetchCharacters,
      addCharacter:    mockAddCharacter,
    }),
  },
}))

// ── Mock @/services/delete-character ─────────────────────────────────────────

vi.mock('@/services/delete-character', () => ({
  deleteCharacterImages:  vi.fn().mockResolvedValue(undefined),
  deleteCharacterService: vi.fn(),
  DeleteCharacterError:   class {},
  parseDeleteErrorCode:   vi.fn(),
}))

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSession: { user: { id: string } } | null = null
let mockSupabaseConfigured = false

const mockUpsert       = vi.fn()
const mockMaybySingle  = vi.fn().mockResolvedValue({ data: null })
const mockReturns      = vi.fn().mockResolvedValue({ data: [], error: null })
const mockStorageUpload = vi.fn()

const mockFrom = vi.fn().mockImplementation(() => ({
  select: () => ({
    eq: () => ({
      maybeSingle: mockMaybySingle,
      returns:     mockReturns,
    }),
  }),
  upsert: mockUpsert,
  delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
}))

const mockClient = {
  from:    (...a: unknown[]) => mockFrom(...a),
  storage: { from: vi.fn().mockImplementation(() => ({
    upload: mockStorageUpload,
    list:   vi.fn().mockResolvedValue({ data: [], error: null }),
  })) },
}

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
}))

// ── Import under test (after mocks) ──────────────────────────────────────────

import {
  syncAll,
  resolveConflictKeepMine,
  resolveConflictKeepCloud,
  resolveConflictKeepBoth,
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
    images: {}, createdAt: 0, updatedAt: 1700000000000,
    ...overrides,
  }
}

// ── Default mock reset ────────────────────────────────────────────────────────

beforeEach(() => {
  setupLoggedIn()
  mockCharacters.length = 0
  vi.clearAllMocks()
  mockGetPendingTombstones.mockResolvedValue([])
  mockListCharacters.mockResolvedValue([])
  mockImportCharacter.mockResolvedValue(undefined)
  mockFetchCharacters.mockResolvedValue(undefined)
  mockAddCharacter.mockResolvedValue(undefined)
  mockMarkCharacterSynced.mockResolvedValue(undefined)
  mockMaybySingle.mockResolvedValue({ data: null })
  mockReturns.mockResolvedValue({ data: [], error: null })
  mockUpsert.mockResolvedValue({ error: null })
  mockAddConflict.mockReset()
  mockRemoveConflict.mockReset()
  mockHasConflict.mockReturnValue(false)
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('conflict detection — upload phase', () => {
  it('records conflict when cloud advanced past baseUpdatedAt', async () => {
    // Local: edited (dirty=true), base reconciled at 1000ms
    // Cloud: updated at 2000ms (newer than base) → conflict
    const base = 1000
    const cloudTime = 2000
    const cloudIso = new Date(cloudTime).toISOString()

    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, baseUpdatedAt: base, updatedAt: 1500 }))
    mockMaybySingle.mockResolvedValueOnce({ data: { updated_at: cloudIso, data: makeChar() } })

    await syncAll()

    expect(mockAddConflict).toHaveBeenCalledTimes(1)
    const conflict = mockAddConflict.mock.calls[0]![0] as { local: Character; cloud: { updatedAt: number } }
    expect(conflict.local.id).toBe('char_001')
    expect(conflict.cloud.updatedAt).toBe(cloudTime)
  })

  it('does NOT record conflict when cloud is at or before baseUpdatedAt', async () => {
    // Cloud at 800ms, base at 1000ms → cloud has NOT moved past our base → safe to upload
    const base = 1000
    const cloudTime = 800
    const cloudIso = new Date(cloudTime).toISOString()

    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, baseUpdatedAt: base, updatedAt: 1500 }))
    mockMaybySingle.mockResolvedValueOnce({ data: { updated_at: cloudIso, data: makeChar() } })

    await syncAll()

    expect(mockAddConflict).not.toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it('does NOT record conflict when cloud equals baseUpdatedAt', async () => {
    const base = 1000
    const cloudIso = new Date(base).toISOString()

    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, baseUpdatedAt: base, updatedAt: 1500 }))
    mockMaybySingle.mockResolvedValueOnce({ data: { updated_at: cloudIso, data: makeChar() } })

    await syncAll()

    expect(mockAddConflict).not.toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it('does NOT record conflict when no cloud row exists (first upload)', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, baseUpdatedAt: 1000 }))
    mockMaybySingle.mockResolvedValueOnce({ data: null })

    await syncAll()

    expect(mockAddConflict).not.toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it('uses LWW fallback (no conflict detection) for legacy chars without baseUpdatedAt', async () => {
    // Legacy: no baseUpdatedAt → falls back to LWW by wall-clock time
    const localTime = 1_500
    const cloudTime = 2_000  // cloud newer than local → LWW guard skips upload (no conflict)
    const cloudIso  = new Date(cloudTime).toISOString()

    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, updatedAt: localTime }))
    mockMaybySingle.mockResolvedValueOnce({ data: { updated_at: cloudIso, data: makeChar() } })

    await syncAll()

    // LWW guard fires → no upload, but also no conflict recorded
    expect(mockAddConflict).not.toHaveBeenCalled()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('does NOT upload conflicted char (addConflict + no upsert)', async () => {
    const base = 1000
    const cloudIso = new Date(2000).toISOString()

    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, baseUpdatedAt: base }))
    mockMaybySingle.mockResolvedValueOnce({ data: { updated_at: cloudIso, data: makeChar() } })

    await syncAll()

    expect(mockUpsert).not.toHaveBeenCalled()
    expect(mockMarkCharacterSynced).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('conflict guard — download phase', () => {
  it('skips importCharacter for chars currently in conflict', async () => {
    const charId = 'char_conflict'
    const cloudChar = makeChar({ id: charId })

    // hasConflict returns true for this char id
    mockHasConflict.mockImplementation((id: string) => id === charId)

    // Local: char exists
    mockListCharacters.mockResolvedValue([makeChar({ id: charId, updatedAt: 1000 })])

    // Cloud: char exists with newer timestamp
    const cloudRow = { id: charId, user_id: 'user_001', data: cloudChar, updated_at: new Date(2000).toISOString() }
    // Call order: fetchCloudTombstoneIds → chars download → tombstones download
    mockReturns
      .mockResolvedValueOnce({ data: [], error: null })          // fetchCloudTombstoneIds
      .mockResolvedValueOnce({ data: [cloudRow], error: null }) // chars
      .mockResolvedValueOnce({ data: [], error: null })          // tombstones

    await syncAll()

    // importCharacter must NOT be called for the conflicted char
    expect(mockImportCharacter).not.toHaveBeenCalled()
  })

  it('still imports non-conflicted chars during download', async () => {
    const conflictId = 'char_conflict'
    const safeId     = 'char_safe'
    const safeChar   = makeChar({ id: safeId })

    mockHasConflict.mockImplementation((id: string) => id === conflictId)

    mockListCharacters.mockResolvedValue([
      makeChar({ id: conflictId, updatedAt: 1000 }),
      makeChar({ id: safeId,     updatedAt: 1000 }),
    ])

    const conflictRow = { id: conflictId, user_id: 'user_001', data: makeChar({ id: conflictId }), updated_at: new Date(2000).toISOString() }
    const safeRow     = { id: safeId,     user_id: 'user_001', data: safeChar,                     updated_at: new Date(2000).toISOString() }

    mockReturns
      .mockResolvedValueOnce({ data: [], error: null })                          // fetchCloudTombstoneIds
      .mockResolvedValueOnce({ data: [conflictRow, safeRow], error: null })     // chars
      .mockResolvedValueOnce({ data: [], error: null })                          // tombstones

    await syncAll()

    // Only the safe char should be imported
    expect(mockImportCharacter).toHaveBeenCalledTimes(1)
    const imported = mockImportCharacter.mock.calls[0]![0] as Character
    expect(imported.id).toBe(safeId)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('resolveConflictKeepMine', () => {
  it('upserts local data to cloud and removes conflict', async () => {
    const local = makeChar({ dirty: true, baseUpdatedAt: 1000, updatedAt: 1500 })

    await resolveConflictKeepMine(local)

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    expect(mockRemoveConflict).toHaveBeenCalledWith('char_001')
  })

  it('calls markCharacterSynced with char id and updatedAt', async () => {
    const local = makeChar({ dirty: true, baseUpdatedAt: 1000, updatedAt: 1500 })

    await resolveConflictKeepMine(local)

    expect(mockMarkCharacterSynced).toHaveBeenCalledWith('char_001', 1500)
  })

  it('strips dirty and baseUpdatedAt from cloud payload', async () => {
    const local = makeChar({ dirty: true, baseUpdatedAt: 999, updatedAt: 1500 })

    await resolveConflictKeepMine(local)

    const payload = mockUpsert.mock.calls[0]![0] as Record<string, unknown>
    const data    = payload['data'] as Record<string, unknown>
    expect('dirty' in data).toBe(false)
    expect('baseUpdatedAt' in data).toBe(false)
  })

  it('payload contains expected cloud columns', async () => {
    const local = makeChar({ dirty: true, updatedAt: 1500 })

    await resolveConflictKeepMine(local)

    const payload = mockUpsert.mock.calls[0]![0] as Record<string, unknown>
    expect(payload['id']).toBe('char_001')
    expect(payload['user_id']).toBe('user_001')
    expect(payload['updated_at']).toBe(new Date(1500).toISOString())
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('resolveConflictKeepCloud', () => {
  it('imports cloud data locally', async () => {
    const cloudData = makeChar({ id: 'char_001', name: 'Aria (cloud)' })
    const cloud     = { data: cloudData, updatedAt: 2000 }

    await resolveConflictKeepCloud(cloud, 'char_001')

    expect(mockImportCharacter).toHaveBeenCalledTimes(1)
    const imported = mockImportCharacter.mock.calls[0]![0] as Character
    expect(imported.name).toBe('Aria (cloud)')
    expect(imported.updatedAt).toBe(2000)
  })

  it('removes conflict and refreshes store', async () => {
    const cloud = { data: makeChar(), updatedAt: 2000 }

    await resolveConflictKeepCloud(cloud, 'char_001')

    expect(mockRemoveConflict).toHaveBeenCalledWith('char_001')
    expect(mockFetchCharacters).toHaveBeenCalledTimes(1)
  })

  it('does NOT call upsert (no cloud write)', async () => {
    const cloud = { data: makeChar(), updatedAt: 2000 }

    await resolveConflictKeepCloud(cloud, 'char_001')

    expect(mockUpsert).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('resolveConflictKeepBoth', () => {
  it('imports cloud data at original id', async () => {
    const cloudData = makeChar({ name: 'Aria (cloud)' })
    const cloud     = { data: cloudData, updatedAt: 2000 }
    const local     = makeChar({ dirty: true, baseUpdatedAt: 1000, updatedAt: 1500 })

    await resolveConflictKeepBoth(local, cloud, 'Aria (conflito)')

    expect(mockImportCharacter).toHaveBeenCalledTimes(1)
    const imported = mockImportCharacter.mock.calls[0]![0] as Character
    expect(imported.id).toBe('char_001')
    expect(imported.name).toBe('Aria (cloud)')
    expect(imported.updatedAt).toBe(2000)
  })

  it('adds a new character with the given copy name and a fresh id', async () => {
    const cloud = { data: makeChar(), updatedAt: 2000 }
    const local = makeChar({ dirty: true, baseUpdatedAt: 1000, updatedAt: 1500 })

    await resolveConflictKeepBoth(local, cloud, 'Aria (conflito)')

    expect(mockAddCharacter).toHaveBeenCalledTimes(1)
    const added = mockAddCharacter.mock.calls[0]![0] as Character
    expect(added.name).toBe('Aria (conflito)')
    expect(added.id).not.toBe('char_001')  // fresh id
  })

  it('copy does not include dirty or baseUpdatedAt', async () => {
    const cloud = { data: makeChar(), updatedAt: 2000 }
    const local = makeChar({ dirty: true, baseUpdatedAt: 1000, updatedAt: 1500 })

    await resolveConflictKeepBoth(local, cloud, 'Aria (conflito)')

    const added = mockAddCharacter.mock.calls[0]![0] as Record<string, unknown>
    expect('dirty'         in added).toBe(false)
    expect('baseUpdatedAt' in added).toBe(false)
  })

  it('removes conflict and refreshes store', async () => {
    const cloud = { data: makeChar(), updatedAt: 2000 }
    const local = makeChar({ dirty: true, baseUpdatedAt: 1000 })

    await resolveConflictKeepBoth(local, cloud, 'Aria (conflito)')

    expect(mockRemoveConflict).toHaveBeenCalledWith('char_001')
    expect(mockFetchCharacters).toHaveBeenCalledTimes(1)
  })

  it('preserves all character fields in the copy (except id, name, createdAt, updatedAt)', async () => {
    const cloud = { data: makeChar(), updatedAt: 2000 }
    const local = makeChar({ dirty: true, baseUpdatedAt: 1000, race: 'Dwarf', updatedAt: 1500 })

    await resolveConflictKeepBoth(local, cloud, 'Copy')

    const added = mockAddCharacter.mock.calls[0]![0] as Character
    expect(added.race).toBe('Dwarf')   // preserved from local
  })
})
