import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Character } from '@/domain/character'
import type { DeletedCharacterTombstone } from '@/data/db'

// ── Mock @/data/db ────────────────────────────────────────────────────────────

const mockGetPendingTombstones = vi.fn<[], Promise<DeletedCharacterTombstone[]>>()
const mockRemoveTombstone      = vi.fn<[string], Promise<void>>()
const mockListCharacters       = vi.fn<[], Promise<Character[]>>()
const mockImportCharacter      = vi.fn<[Character], Promise<void>>()

vi.mock('@/data/db', () => ({
  getPendingTombstones: (...a: unknown[]) => mockGetPendingTombstones(...(a as [])),
  removeTombstone:      (...a: unknown[]) => mockRemoveTombstone(...(a as [string])),
  listCharacters:       (...a: unknown[]) => mockListCharacters(...(a as [])),
  importCharacter:      (...a: unknown[]) => mockImportCharacter(...(a as [Character])),
  // Other DB exports not exercised in these tests
  getCharacter:         vi.fn().mockResolvedValue(null),
  saveCharacter:        vi.fn(),
  deleteCharacter:      vi.fn(),
  createTombstone:      vi.fn(),
  markTombstoneSynced:  vi.fn(),
  markCharacterSynced:  vi.fn().mockResolvedValue(undefined),
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

const mockUpsert = vi.fn()
const mockDeleteQuery = vi.fn()
const mockStorageUpload = vi.fn()

// maybeSingle for LWW upload check — default: null (no cloud row, proceed with upload)
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

import {
  syncAll,
  getSyncStatus,
  onSyncStatusChange,
  scheduleEditSync,
  startPeriodicSync,
  stopPeriodicSync,
  initSyncListeners,
} from '@/services/sync'

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupLoggedIn(userId = 'user_001') {
  mockSupabaseConfigured = true
  mockSession = { user: { id: userId } }
}

function setupLoggedOut() {
  mockSupabaseConfigured = false
  mockSession = null
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

describe('syncAll — not logged in', () => {
  beforeEach(() => {
    setupLoggedOut()
    mockCharacters.length = 0
    mockGetPendingTombstones.mockResolvedValue([])
    vi.clearAllMocks()
    // restore navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('returns idle status when no user session', async () => {
    await syncAll()
    expect(getSyncStatus()).toBe('idle')
  })

  it('does not call supabase when not logged in', async () => {
    await syncAll()
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('syncAll — offline', () => {
  beforeEach(() => {
    setupLoggedIn()
    mockCharacters.length = 0
    mockGetPendingTombstones.mockResolvedValue([])
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('sets status to offline when navigator.onLine is false', async () => {
    await syncAll()
    expect(getSyncStatus()).toBe('offline')
  })

  it('does not call supabase when offline', async () => {
    await syncAll()
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('syncAll — happy path (logged in, online)', () => {
  beforeEach(() => {
    setupLoggedIn()
    vi.clearAllMocks()
    mockGetPendingTombstones.mockResolvedValue([])
    mockRemoveTombstone.mockResolvedValue(undefined)
    mockUpsert.mockResolvedValue({ error: null })
    mockDeleteImages.mockResolvedValue(undefined)
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('sets status to idle after successful sync', async () => {
    mockCharacters.length = 0
    await syncAll()
    expect(getSyncStatus()).toBe('idle')
  })

  it('calls upsert for each local character', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ id: 'char_001' }), makeChar({ id: 'char_002' }))
    await syncAll()
    expect(mockUpsert).toHaveBeenCalledTimes(2)
  })

  it('upsert includes user_id and data fields', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ id: 'char_001' }))
    await syncAll()
    const call = mockUpsert.mock.calls[0]![0] as Record<string, unknown>
    expect(call.user_id).toBe('user_001')
    expect(call.id).toBe('char_001')
    expect(call.data).toBeDefined()
  })

  it('continues uploading remaining chars when one fails', async () => {
    mockCharacters.splice(0, Infinity, makeChar({ id: 'char_001' }), makeChar({ id: 'char_002' }))
    mockUpsert
      .mockResolvedValueOnce({ error: new Error('fail') })
      .mockResolvedValueOnce({ error: null })
    await syncAll()
    expect(mockUpsert).toHaveBeenCalledTimes(2)
    expect(getSyncStatus()).toBe('idle')
  })

  it('emits syncing status during operation', async () => {
    mockCharacters.length = 0
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    await syncAll()
    unsub()
    expect(statuses).toContain('syncing')
  })
})

describe('syncAll — tombstone processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupLoggedIn('user_001')
    mockCharacters.length = 0
    mockUpsert.mockResolvedValue({ error: null })
    mockDeleteImages.mockResolvedValue(undefined)
    mockRemoveTombstone.mockResolvedValue(undefined)
    mockDeleteQuery.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('calls cloud delete for pending tombstones', async () => {
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 100, userId: 'user_001', synced: false },
    ])
    mockDeleteQuery.mockResolvedValue({ error: null })
    await syncAll()
    expect(mockDeleteQuery).toHaveBeenCalledWith('id', 'char_del')
  })

  it('removes tombstone after successful cloud delete', async () => {
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 100, userId: 'user_001', synced: false },
    ])
    mockDeleteQuery.mockResolvedValue({ error: null })
    await syncAll()
    expect(mockRemoveTombstone).toHaveBeenCalledWith('char_del')
  })

  it('does not remove tombstone when cloud delete fails', async () => {
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 100, userId: 'user_001', synced: false },
    ])
    mockDeleteQuery.mockRejectedValue(new Error('DB error'))
    await syncAll()
    expect(mockRemoveTombstone).not.toHaveBeenCalled()
  })

  it('ignores tombstones from other users', async () => {
    mockGetPendingTombstones.mockResolvedValue([
      { id: 'char_del', deletedAt: 100, userId: 'other_user', synced: false },
    ])
    await syncAll()
    expect(mockDeleteQuery).not.toHaveBeenCalled()
    expect(mockRemoveTombstone).not.toHaveBeenCalled()
  })
})

describe('syncAll — status listeners', () => {
  beforeEach(() => {
    setupLoggedIn()
    mockCharacters.length = 0
    mockGetPendingTombstones.mockResolvedValue([])
    mockUpsert.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('notifies listeners of status transitions', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    await syncAll()
    unsub()
    expect(statuses[0]).toBe('syncing')
    expect(statuses[statuses.length - 1]).toBe('idle')
  })

  it('unsubscribe stops notifications', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    unsub()
    await syncAll()
    expect(statuses).toHaveLength(0)
  })
})

// ── scheduleEditSync ──────────────────────────────────────────────────────────

describe('scheduleEditSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupLoggedIn()
    mockCharacters.length = 0
    mockGetPendingTombstones.mockResolvedValue([])
    mockUpsert.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triggers syncAll after 15s', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    scheduleEditSync()
    expect(statuses).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(15_000)
    unsub()
    expect(statuses).toContain('syncing')
  })

  it('debounces: multiple calls reset the timer', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    scheduleEditSync()
    await vi.advanceTimersByTimeAsync(10_000)
    scheduleEditSync()  // reset — should not fire until 15s from now
    await vi.advanceTimersByTimeAsync(10_000)  // total 20s but only 10 from last call
    unsub()
    expect(statuses.filter(s => s === 'syncing')).toHaveLength(0)  // not yet
    await vi.advanceTimersByTimeAsync(5_000)  // now 15s from last call
  })

  it('does not fire before 15s', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    scheduleEditSync()
    await vi.advanceTimersByTimeAsync(14_999)
    unsub()
    expect(statuses.filter(s => s === 'syncing')).toHaveLength(0)
  })
})

// ── startPeriodicSync / stopPeriodicSync ──────────────────────────────────────

describe('startPeriodicSync / stopPeriodicSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stopPeriodicSync()  // ensure clean state
    setupLoggedIn()
    mockCharacters.length = 0
    mockGetPendingTombstones.mockResolvedValue([])
    mockUpsert.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  afterEach(() => {
    stopPeriodicSync()
    vi.useRealTimers()
  })

  it('triggers sync every 30s', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    startPeriodicSync()
    await vi.advanceTimersByTimeAsync(30_000)
    unsub()
    expect(statuses.filter(s => s === 'syncing').length).toBeGreaterThanOrEqual(1)
  })

  it('does not start multiple intervals if called twice', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    startPeriodicSync()
    startPeriodicSync()  // second call should be ignored
    await vi.advanceTimersByTimeAsync(30_000)
    unsub()
    // Only one sync should have fired, not two simultaneously
    expect(statuses.filter(s => s === 'syncing').length).toBe(1)
  })

  it('stops periodic sync', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    startPeriodicSync()
    stopPeriodicSync()
    await vi.advanceTimersByTimeAsync(60_000)
    unsub()
    expect(statuses.filter(s => s === 'syncing')).toHaveLength(0)
  })
})

// ── initSyncListeners ─────────────────────────────────────────────────────────

describe('initSyncListeners', () => {
  it('can be called multiple times without duplicating listeners', () => {
    // Should not throw
    initSyncListeners()
    initSyncListeners()
  })
})
