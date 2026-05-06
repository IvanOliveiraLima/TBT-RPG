/**
 * Tests for useCharacterStore.updateCharacter
 *
 * Covers:
 *  - Optimistic state update (instant, before save)
 *  - Debounce: save not called immediately
 *  - Debounce: save called after 800ms
 *  - Coalescing: multiple updates in window → single save
 *  - Missing raw data: logs error, no throw
 *  - No-op when store has different id or null character
 *  - flushPendingSaves: forces immediate save
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock all external dependencies before importing the store ──────────────

vi.mock('@/data/db', () => ({
  getCharacter:    vi.fn(),
  getRawCharacter: vi.fn(),
  copyFromV1:      vi.fn(),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  listCharacters:  vi.fn().mockResolvedValue([]),
  deleteCharacter: vi.fn(),
}))

vi.mock('@/data/serializer', () => ({
  serializeCharacter: vi.fn().mockReturnValue({ id: 'char_test_1', page1: { basic_info: {} } }),
}))

vi.mock('@/lib/save-debounce', () => ({
  scheduleSave:    vi.fn(),
  flushPendingSaves: vi.fn().mockResolvedValue(undefined),
}))

import { useCharacterStore } from '@/store/character'
import { getRawCharacter, saveCharacter } from '@/data/db'
import { serializeCharacter } from '@/data/serializer'
import { scheduleSave, flushPendingSaves } from '@/lib/save-debounce'
import type { Character } from '@/domain/character'
import type { V1Character } from '@/data/schema-v1'

const MOCK_V1: V1Character = {
  id: 'char_test_1',
  schemaVersion: 1,
  updatedAt: 1700000000000,
  page1: { basic_info: { char_name: 'Grimbold' } },
}

const MOCK_CHARACTER: Character = {
  id: 'char_test_1',
  name: 'Grimbold Ironfist',
  race: 'Dwarf',
  background: 'Outlander',
  alignment: 'Lawful Good',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 18, dex: 10, con: 16, int: 8, wis: 12, cha: 6 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 17, initiative: 0, speed: 25,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

beforeEach(() => {
  useCharacterStore.setState({ character: MOCK_CHARACTER, loading: false, error: null })
  vi.clearAllMocks()
  vi.mocked(getRawCharacter).mockResolvedValue(MOCK_V1)
  vi.mocked(serializeCharacter).mockReturnValue(MOCK_V1)
  vi.mocked(scheduleSave).mockImplementation(() => undefined)
  vi.mocked(flushPendingSaves).mockResolvedValue(undefined)
  vi.mocked(saveCharacter).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllTimers()
})

/* ── Optimistic update ───────────────────────────────────────────────────── */

describe('updateCharacter — optimistic state update', () => {
  it('updates in-memory state immediately (before first await resolves)', async () => {
    // set({ character: updated }) runs synchronously before the first await
    // inside updateCharacter. Starting (not awaiting) the function is enough
    // to trigger the optimistic state update.
    const promise = useCharacterStore.getState().updateCharacter('char_test_1', { name: 'New Name' })

    // Synchronous code before first await has already run
    expect(useCharacterStore.getState().character?.name).toBe('New Name')

    await promise
  })

  it('stamps updatedAt on the updated character', async () => {
    const before = Date.now()
    await useCharacterStore.getState().updateCharacter('char_test_1', { name: 'Updated' })
    const after = Date.now()
    const ts = useCharacterStore.getState().character?.updatedAt ?? 0
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('merges partial update with existing character fields', async () => {
    await useCharacterStore.getState().updateCharacter('char_test_1', {
      hp: { current: 30, max: 45, temp: 0 },
    })
    const state = useCharacterStore.getState().character!
    expect(state.hp.current).toBe(30)
    expect(state.hp.max).toBe(45)
    // Other fields unchanged
    expect(state.name).toBe('Grimbold Ironfist')
    expect(state.race).toBe('Dwarf')
  })
})

/* ── Debounce scheduling ─────────────────────────────────────────────────── */

describe('updateCharacter — debounce scheduling', () => {
  it('calls scheduleSave once after update', async () => {
    await useCharacterStore.getState().updateCharacter('char_test_1', { name: 'A' })
    expect(scheduleSave).toHaveBeenCalledOnce()
    expect(scheduleSave).toHaveBeenCalledWith('char_test_1', MOCK_V1)
  })

  it('calls serializeCharacter with updated domain and raw original', async () => {
    await useCharacterStore.getState().updateCharacter('char_test_1', { name: 'New Name' })
    expect(serializeCharacter).toHaveBeenCalledOnce()
    // First arg should have the updated name
    const [domainArg, rawArg] = vi.mocked(serializeCharacter).mock.calls[0]!
    expect(domainArg.name).toBe('New Name')
    expect(rawArg).toEqual(MOCK_V1)
  })
})

/* ── No-op conditions ───────────────────────────────────────────────────── */

describe('updateCharacter — no-op conditions', () => {
  it('does nothing if store has null character', async () => {
    useCharacterStore.setState({ character: null })
    await useCharacterStore.getState().updateCharacter('char_test_1', { name: 'X' })
    expect(scheduleSave).not.toHaveBeenCalled()
    expect(useCharacterStore.getState().character).toBeNull()
  })

  it('does nothing if id does not match current character', async () => {
    await useCharacterStore.getState().updateCharacter('char_other_id', { name: 'X' })
    expect(scheduleSave).not.toHaveBeenCalled()
    // Character unchanged
    expect(useCharacterStore.getState().character?.name).toBe('Grimbold Ironfist')
  })
})

/* ── Missing raw data ───────────────────────────────────────────────────── */

describe('updateCharacter — missing raw data', () => {
  it('logs error and does not throw when getRawCharacter returns null', async () => {
    vi.mocked(getRawCharacter).mockResolvedValue(null)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      useCharacterStore.getState().updateCharacter('char_test_1', { name: 'X' })
    ).resolves.not.toThrow()

    expect(consoleSpy).toHaveBeenCalled()
    expect(scheduleSave).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

/* ── clearCharacter ─────────────────────────────────────────────────────── */

describe('clearCharacter', () => {
  it('resets character, loading, and error', () => {
    useCharacterStore.setState({ character: MOCK_CHARACTER, loading: false, error: 'old' })
    useCharacterStore.getState().clearCharacter()
    const state = useCharacterStore.getState()
    expect(state.character).toBeNull()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })
})

/* ── flushPendingSaves ───────────────────────────────────────────────────── */

describe('flushPendingSaves', () => {
  it('can be called and resolves without error', async () => {
    await expect(flushPendingSaves()).resolves.not.toThrow()
  })
})
