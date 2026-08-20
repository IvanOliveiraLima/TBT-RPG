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
    hp: { current: 18, max: 18, temp: 0 },
    hitDice: [{ className: 'Wizard', current: 3, max: 3, dieSize: 6 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 12, initiative: 2, speed: 30,
    inspiration: false,
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

  afterEach(async () => {
    // Advance fake time past maxWait so any pending debounce/maxWait timers fire,
    // which calls flushEditSync and sets editDebounceTimer/editMaxWaitTimer back to null.
    // Without this, a test that leaves pending timers would leak stale IDs into the
    // next test, preventing the maxWait from being scheduled (it guards with !== null).
    await vi.advanceTimersByTimeAsync(10_000)
    vi.useRealTimers()
  })

  it('triggers syncAll after 2s of quiet', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    scheduleEditSync()
    expect(statuses).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(2_000)
    unsub()
    expect(statuses).toContain('syncing')
  })

  it('debounces: second call resets the debounce timer', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    scheduleEditSync()
    await vi.advanceTimersByTimeAsync(1_000)
    scheduleEditSync()  // reset debounce — should not fire until 2s from now
    await vi.advanceTimersByTimeAsync(1_000)  // only 1s since last call
    unsub()
    expect(statuses.filter(s => s === 'syncing')).toHaveLength(0)
  })

  it('does not fire before 2s', async () => {
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    scheduleEditSync()
    await vi.advanceTimersByTimeAsync(1_999)
    unsub()
    expect(statuses.filter(s => s === 'syncing')).toHaveLength(0)
  })

  it('maxWait fires during continuous editing (the bug fix)', async () => {
    // Bug: pure debounce never fires while edits arrive faster than the debounce window.
    // maxWait=5s guarantees at least one sync even under continuous editing.
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    // Call every 1s for 5s — debounce would never fire, maxWait must fire by 5s
    for (let i = 0; i < 5; i++) {
      scheduleEditSync()
      await vi.advanceTimersByTimeAsync(1_000)
    }
    unsub()
    expect(statuses.filter(s => s === 'syncing').length).toBeGreaterThanOrEqual(1)
  })

  it('maxWait timer is not reset by further scheduleEditSync calls', async () => {
    // maxWait must fire at 5s from the FIRST call, not pushed forward by later calls.
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))
    scheduleEditSync()                         // t=0s: debounce@2s, maxWait@5s
    await vi.advanceTimersByTimeAsync(1_000)   // t=1s
    scheduleEditSync()                         // debounce reset to t+2s; maxWait stays at 5s
    await vi.advanceTimersByTimeAsync(1_000)   // t=2s
    scheduleEditSync()                         // debounce reset to t+2s; maxWait stays at 5s
    await vi.advanceTimersByTimeAsync(3_000)   // t=5s — maxWait fires here
    unsub()
    expect(statuses.filter(s => s === 'syncing').length).toBeGreaterThanOrEqual(1)
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

// ── syncAll — reentrancy coalescing ───────────────────────────────────────────

describe('syncAll — reentrancy coalescing', () => {
  beforeEach(() => {
    setupLoggedIn()
    vi.clearAllMocks()
    mockGetPendingTombstones.mockResolvedValue([])
    mockRemoveTombstone.mockResolvedValue(undefined)
    mockUpsert.mockResolvedValue({ error: null })
    mockListCharacters.mockResolvedValue([])
    mockImportCharacter.mockResolvedValue(undefined)
    mockFetchCharacters.mockResolvedValue(undefined)
    mockMaybySingle.mockResolvedValue({ data: null })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    mockCharacters.length = 0
  })

  it('concurrent calls return the same in-flight promise', async () => {
    let resolveBlock!: (v: DeletedCharacterTombstone[]) => void
    mockGetPendingTombstones.mockReturnValueOnce(
      new Promise<DeletedCharacterTombstone[]>(res => { resolveBlock = res })
    )
    mockGetPendingTombstones.mockResolvedValue([])

    const p1 = syncAll()
    const p2 = syncAll()  // arrives while p1 in-flight — must return the same promise

    expect(p1).toBe(p2)

    resolveBlock([])
    await p1
    // Drain the queued follow-up (triggered by p2 setting syncQueued=true)
    await new Promise(r => setTimeout(r, 10))
  })

  it('body does not run concurrently: at most one parallel execution', async () => {
    let concurrent = 0
    let maxConcurrent = 0

    mockGetPendingTombstones.mockImplementation(async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise(r => setTimeout(r, 10))
      concurrent--
      return []
    })

    const p1 = syncAll()
    const p2 = syncAll()

    await Promise.all([p1, p2])
    // Let the queued follow-up complete
    await new Promise(r => setTimeout(r, 50))

    expect(maxConcurrent).toBe(1)
  })

  it('call during execution queues one follow-up and does not lose it', async () => {
    // Each runSyncAll calls mockGetPendingTombstones twice (processTombstones +
    // downloadCharacters), so we count 'syncing' status events as a proxy for run count.
    const statuses: string[] = []
    const unsub = onSyncStatusChange(s => statuses.push(s))

    let resolveBlock!: (v: DeletedCharacterTombstone[]) => void
    mockGetPendingTombstones
      .mockReturnValueOnce(
        new Promise<DeletedCharacterTombstone[]>(res => { resolveBlock = res })
      )
      .mockResolvedValue([])

    const p1 = syncAll()
    syncAll()  // queued — sets syncQueued=true, returns same promise

    resolveBlock([])
    await p1

    // Give the queued run time to complete
    await new Promise(r => setTimeout(r, 20))
    unsub()

    // First run + exactly one queued run = 2 'syncing' events
    expect(statuses.filter(s => s === 'syncing')).toHaveLength(2)
  })
})
