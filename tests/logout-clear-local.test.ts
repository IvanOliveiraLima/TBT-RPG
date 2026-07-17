import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/store/auth'
import { useCharactersStore } from '@/store/characters'
import { useCharacterStore } from '@/store/character'
import type { Character } from '@/domain/character'

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  signIn:   vi.fn(),
  signOut:  vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/delete-account', () => ({
  deleteAccountService: vi.fn(),
}))

const mockSyncAll = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/sync', () => ({
  syncAll:           () => mockSyncAll(),
  stopPeriodicSync:  vi.fn(),
  startPeriodicSync: vi.fn(),
  scheduleEditSync:  vi.fn(),
  initSyncListeners: vi.fn(),
}))

const mockClearAllLocalData = vi.fn().mockResolvedValue(undefined)
vi.mock('@/data/db', () => ({
  listCharacters: vi.fn().mockResolvedValue([]),
  saveCharacter:  vi.fn().mockResolvedValue(undefined),
  clearAllLocalData: () => mockClearAllLocalData(),
}))

vi.mock('@/services/delete-character', () => ({
  deleteCharacterService: vi.fn(),
}))

// ── helpers ───────────────────────────────────────────────────────────────────

const STUB_CHAR: Character = {
  id: 'c1', name: 'Eira', race: '', background: '', alignment: '',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  experience: 0, age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 10, max: 10, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 10, initiative: 0, speed: 30,
  passivePerception: 10, spellSaveDC: 10, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '', mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

function seedStores() {
  useCharactersStore.setState({ characters: [STUB_CHAR], loading: false, error: null })
  useCharacterStore.setState({ activeId: STUB_CHAR.id, loading: false, error: null })
  useAuthStore.setState({ user: { id: 'u1' } as never, session: {} as never, loading: false, localKept: false })
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('signOut — explicit logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.stubGlobal('navigator', { onLine: true })
    mockSyncAll.mockResolvedValue(undefined)
    mockClearAllLocalData.mockResolvedValue(undefined)
    seedStores()
  })

  it('calls syncAll before signing out (while session is still valid)', async () => {
    const order: string[] = []
    mockSyncAll.mockImplementation(async () => { order.push('sync') })
    const { signOut: supaSignOut } = await import('@/lib/supabase')
    vi.mocked(supaSignOut).mockImplementation(async () => { order.push('supaSignOut'); return { error: null } })

    await useAuthStore.getState().signOut()

    expect(order[0]).toBe('sync')
    expect(order[1]).toBe('supaSignOut')
  })

  it('calls clearAllLocalData after successful sync', async () => {
    await useAuthStore.getState().signOut()
    expect(mockClearAllLocalData).toHaveBeenCalledOnce()
  })

  it('resets characters store after successful sync', async () => {
    await useAuthStore.getState().signOut()
    expect(useCharactersStore.getState().characters).toEqual([])
  })

  it('clears active character after successful sync', async () => {
    await useAuthStore.getState().signOut()
    expect(useCharacterStore.getState().activeId).toBeNull()
  })

  it('clears user and session from auth store', async () => {
    await useAuthStore.getState().signOut()
    const { user, session } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(session).toBeNull()
  })

  it('sets localKept: false after successful sync', async () => {
    await useAuthStore.getState().signOut()
    expect(useAuthStore.getState().localKept).toBe(false)
  })

  // ── sync failure: keep local data ──────────────────────────────────────────

  it('does NOT call clearAllLocalData when syncAll throws', async () => {
    mockSyncAll.mockRejectedValue(new Error('network error'))
    await useAuthStore.getState().signOut()
    expect(mockClearAllLocalData).not.toHaveBeenCalled()
  })

  it('keeps characters in store when sync fails', async () => {
    mockSyncAll.mockRejectedValue(new Error('network error'))
    await useAuthStore.getState().signOut()
    expect(useCharactersStore.getState().characters).toEqual([STUB_CHAR])
  })

  it('sets localKept: true when sync fails', async () => {
    mockSyncAll.mockRejectedValue(new Error('network error'))
    await useAuthStore.getState().signOut()
    expect(useAuthStore.getState().localKept).toBe(true)
  })

  it('still clears user and session even when sync fails', async () => {
    mockSyncAll.mockRejectedValue(new Error('network error'))
    await useAuthStore.getState().signOut()
    const { user, session } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(session).toBeNull()
  })

  // ── offline: skip sync, keep local data ───────────────────────────────────

  it('skips syncAll when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    await useAuthStore.getState().signOut()
    expect(mockSyncAll).not.toHaveBeenCalled()
  })

  it('does NOT call clearAllLocalData when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    await useAuthStore.getState().signOut()
    expect(mockClearAllLocalData).not.toHaveBeenCalled()
  })

  it('sets localKept: true when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    await useAuthStore.getState().signOut()
    expect(useAuthStore.getState().localKept).toBe(true)
  })

  it('keeps characters in store when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    await useAuthStore.getState().signOut()
    expect(useCharactersStore.getState().characters).toEqual([STUB_CHAR])
  })
})

// ── useCharactersStore.reset ───────────────────────────────────────────────────

describe('useCharactersStore.reset', () => {
  beforeEach(() => {
    useCharactersStore.setState({ characters: [STUB_CHAR], loading: false, error: null })
  })

  it('clears the characters array', () => {
    useCharactersStore.getState().reset()
    expect(useCharactersStore.getState().characters).toEqual([])
  })

  it('resets loading and error to initial values', () => {
    useCharactersStore.setState({ loading: true, error: 'oops' })
    useCharactersStore.getState().reset()
    const { loading, error } = useCharactersStore.getState()
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })
})
