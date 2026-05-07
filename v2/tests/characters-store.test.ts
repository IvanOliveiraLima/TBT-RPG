import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Character } from '@/domain/character'

vi.mock('@/data/db', () => ({
  listCharacters: vi.fn().mockResolvedValue([]),
  saveCharacter:  vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

import { useCharactersStore } from '@/store/characters'
import { saveCharacter } from '@/data/db'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id:          'char_001',
    name:        'Eira Thornwood',
    race:        'Wood Elf',
    background:  'Outlander',
    alignment:   'Neutral Good',
    classes:     [{ name: 'Ranger', level: 5, hitDie: 10 }],
    totalLevel:  5,
    experience:  0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities:   { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
    proficiencyBonus: 3,
    hp:          { current: 42, max: 42, temp: 0 },
    hitDice:     [{ current: 5, max: 5, dieSize: 10 }],
    deathSaves:  { successes: 0, failures: 0 },
    ac: 16, initiative: 4, speed: 35,
    passivePerception: 16, spellSaveDC: 0, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
    attacks: [], inventory: [],
    currency:    { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features:    [],
    backstory:   '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    images:      {},
    createdAt:   1700000000000,
    updatedAt:   1700000000000,
    ...overrides,
  }
}

describe('useCharactersStore', () => {
  beforeEach(() => {
    useCharactersStore.setState({ characters: [], loading: false, error: null })
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── updateCharacter: optimistic update ───────────────────────────────────

  describe('updateCharacter — optimistic update', () => {
    it('immediately reflects the partial update in store state', async () => {
      const char = makeChar()
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'New Name' })

      const updated = useCharactersStore.getState().characters.find(c => c.id === 'char_001')
      expect(updated!.name).toBe('New Name')
    })

    it('does not change other characters', async () => {
      const char1 = makeChar({ id: 'char_001', name: 'Eira' })
      const char2 = makeChar({ id: 'char_002', name: 'Grimbold' })
      useCharactersStore.setState({ characters: [char1, char2] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Updated Eira' })

      const other = useCharactersStore.getState().characters.find(c => c.id === 'char_002')
      expect(other!.name).toBe('Grimbold')
    })

    it('does nothing when character id is not in store', async () => {
      useCharactersStore.setState({ characters: [] })
      await useCharactersStore.getState().updateCharacter('nonexistent', { name: 'Ghost' })
      expect(useCharactersStore.getState().characters).toHaveLength(0)
    })
  })

  // ── updateCharacter: debounced save ──────────────────────────────────────

  describe('updateCharacter — debounced save', () => {
    it('does not call saveCharacter before the 800ms window', async () => {
      const char = makeChar()
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'New Name' })

      expect(saveCharacter).not.toHaveBeenCalled()
    })

    it('calls saveCharacter after 800ms', async () => {
      const char = makeChar()
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'New Name' })
      vi.advanceTimersByTime(800)

      expect(saveCharacter).toHaveBeenCalledOnce()
    })

    it('coalesces rapid updates into a single save', async () => {
      const char = makeChar()
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Update 1' })
      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Update 2' })
      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Update 3' })
      vi.advanceTimersByTime(800)

      // Only one save despite 3 updates
      expect(saveCharacter).toHaveBeenCalledOnce()
    })

    it('saves the latest state after coalescing', async () => {
      const char = makeChar()
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'First' })
      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Final' })
      vi.advanceTimersByTime(800)

      const savedArg = vi.mocked(saveCharacter).mock.calls[0]![0] as Character
      expect(savedArg.name).toBe('Final')
    })
  })

  // ── flushPendingSaves ────────────────────────────────────────────────────

  describe('flushPendingSaves', () => {
    it('triggers immediate save without waiting for debounce', async () => {
      const char = makeChar()
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Flushed' })
      // Timer has not fired yet
      expect(saveCharacter).not.toHaveBeenCalled()

      await useCharactersStore.getState().flushPendingSaves()
      expect(saveCharacter).toHaveBeenCalledOnce()
    })

    it('does not double-save when timer fires after flush', async () => {
      const char = makeChar()
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Flushed' })
      await useCharactersStore.getState().flushPendingSaves()
      vi.advanceTimersByTime(800)

      // Flush saved once; timer was cancelled so no second call
      expect(saveCharacter).toHaveBeenCalledOnce()
    })

    it('saves with current store state (optimistic update applied)', async () => {
      const char = makeChar({ name: 'Original' })
      useCharactersStore.setState({ characters: [char] })

      await useCharactersStore.getState().updateCharacter('char_001', { name: 'Optimistic' })
      await useCharactersStore.getState().flushPendingSaves()

      const savedArg = vi.mocked(saveCharacter).mock.calls[0]![0] as Character
      expect(savedArg.name).toBe('Optimistic')
    })
  })
})
