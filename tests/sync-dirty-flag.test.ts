import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Character } from '@/domain/character'
import type { DeletedCharacterTombstone } from '@/data/db'

// ── Mock @/data/db ────────────────────────────────────────────────────────────

const mockMarkCharacterSynced = vi.fn<[string, number], Promise<void>>()
const mockGetPendingTombstones = vi.fn<[], Promise<DeletedCharacterTombstone[]>>()
const mockRemoveTombstone      = vi.fn<[string], Promise<void>>()
const mockListCharacters       = vi.fn<[], Promise<Character[]>>()
const mockImportCharacter      = vi.fn<[Character], Promise<void>>()

vi.mock('@/data/db', () => ({
  markCharacterSynced: (...a: unknown[]) => mockMarkCharacterSynced(...(a as [string, number])),
  getPendingTombstones: (...a: unknown[]) => mockGetPendingTombstones(...(a as [])),
  removeTombstone:      (...a: unknown[]) => mockRemoveTombstone(...(a as [string])),
  listCharacters:       (...a: unknown[]) => mockListCharacters(...(a as [])),
  importCharacter:      (...a: unknown[]) => mockImportCharacter(...(a as [Character])),
  getCharacter:         vi.fn().mockResolvedValue(null),
  saveCharacter:        vi.fn(),
  deleteCharacter:      vi.fn(),
  createTombstone:      vi.fn(),
  markTombstoneSynced:  vi.fn(),
}))

// ── Mock @/store/characters ───────────────────────────────────────────────────

const mockCharacters: Character[] = []
const mockFetchCharacters = vi.fn<[], Promise<void>>()

vi.mock('@/store/characters', () => ({
  useCharactersStore: {
    getState: () => ({
      characters: mockCharacters,
      fetchCharacters: mockFetchCharacters,
    }),
  },
}))

// ── Mock @/services/delete-character ─────────────────────────────────────────

vi.mock('@/services/delete-character', () => ({
  deleteCharacterImages: vi.fn().mockResolvedValue(undefined),
  deleteCharacterService: vi.fn(),
  DeleteCharacterError: class {},
  parseDeleteErrorCode: vi.fn(),
}))

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSession: { user: { id: string } } | null = null
let mockSupabaseConfigured = false

const mockUpsert = vi.fn()
const mockDeleteQuery = vi.fn()
const mockStorageUpload = vi.fn()
const mockMaybySingle = vi.fn().mockResolvedValue({ data: null })

const mockFrom = vi.fn().mockImplementation(() => ({
  select: () => ({
    eq: () => ({
      maybeSingle: mockMaybySingle,
      returns: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
  upsert: mockUpsert,
  delete: () => ({ eq: mockDeleteQuery }),
}))

const mockStorageFrom = vi.fn().mockImplementation(() => ({
  upload: mockStorageUpload,
  list:   vi.fn().mockResolvedValue({ data: [], error: null }),
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

import { syncAll } from '@/services/sync'

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('dirty flag — upload filtering in syncAll', () => {
  beforeEach(() => {
    setupLoggedIn()
    mockCharacters.length = 0
    vi.clearAllMocks()
    mockGetPendingTombstones.mockResolvedValue([])
    mockRemoveTombstone.mockResolvedValue(undefined)
    mockUpsert.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    mockMarkCharacterSynced.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('skips upload for char with dirty === false (already synced)', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: false }))
    await syncAll()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('uploads char with dirty === true', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: true }))
    await syncAll()
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it('uploads char with dirty === undefined (legacy compatibility)', async () => {
    mockCharacters.splice(0, Infinity, makeChar())  // no dirty field → undefined
    await syncAll()
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it('uploads dirty chars and skips clean ones in mixed list', async () => {
    mockCharacters.splice(0, Infinity,
      makeChar({ id: 'char_dirty', dirty: true }),
      makeChar({ id: 'char_clean', dirty: false }),
      makeChar({ id: 'char_legacy' }),  // dirty: undefined → treated as dirty
    )
    await syncAll()
    expect(mockUpsert).toHaveBeenCalledTimes(2)  // dirty + legacy; clean skipped
  })
})

describe('dirty flag — cloud payload stripping', () => {
  beforeEach(() => {
    setupLoggedIn()
    mockCharacters.length = 0
    vi.clearAllMocks()
    mockGetPendingTombstones.mockResolvedValue([])
    mockUpsert.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    mockMarkCharacterSynced.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('does not include dirty in the cloud payload data', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: true }))
    await syncAll()
    const payload = mockUpsert.mock.calls[0]![0] as Record<string, unknown>
    const data = payload.data as Record<string, unknown>
    expect('dirty' in data).toBe(false)
  })

  it('does not include baseUpdatedAt in the cloud payload data', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, baseUpdatedAt: 1699999999000 }))
    await syncAll()
    const payload = mockUpsert.mock.calls[0]![0] as Record<string, unknown>
    const data = payload.data as Record<string, unknown>
    expect('baseUpdatedAt' in data).toBe(false)
  })

  it('payload data still contains character fields (id, name)', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: true }))
    await syncAll()
    const payload = mockUpsert.mock.calls[0]![0] as Record<string, unknown>
    const data = payload.data as Record<string, unknown>
    expect(data.id).toBe('char_001')
    expect(data.name).toBe('Aria')
  })
})

describe('dirty flag — markCharacterSynced called after upload', () => {
  beforeEach(() => {
    setupLoggedIn()
    mockCharacters.length = 0
    vi.clearAllMocks()
    mockGetPendingTombstones.mockResolvedValue([])
    mockUpsert.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    mockMarkCharacterSynced.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('calls markCharacterSynced with char id and updatedAt after successful upload', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: true, updatedAt: 1700000000000 }))
    await syncAll()
    expect(mockMarkCharacterSynced).toHaveBeenCalledWith('char_001', 1700000000000)
  })

  it('does not call markCharacterSynced when upload fails', async () => {
    mockUpsert.mockResolvedValueOnce({ error: new Error('network error') })
    mockCharacters.splice(0, Infinity, makeChar({ dirty: true }))
    await syncAll()
    expect(mockMarkCharacterSynced).not.toHaveBeenCalled()
  })

  it('does not call markCharacterSynced for skipped clean chars', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ dirty: false }))
    await syncAll()
    expect(mockMarkCharacterSynced).not.toHaveBeenCalled()
  })
})
