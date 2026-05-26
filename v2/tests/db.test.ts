import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Character } from '@/domain/character'

// ── In-memory IndexedDB mock ─────────────────────────────────────────────────
const store = new Map<string, unknown>()

vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    getAll:  vi.fn().mockImplementation(() => Promise.resolve([...store.values()])),
    get:     vi.fn().mockImplementation((_storeName: string, id: string) =>
               Promise.resolve(store.get(id))),
    put:     vi.fn().mockImplementation((_storeName: string, value: unknown) => {
               const record = value as { id: string }
               store.set(record.id, record)
               return Promise.resolve()
             }),
    delete:  vi.fn().mockImplementation((_storeName: string, id: string) => {
               store.delete(id)
               return Promise.resolve()
             }),
    close:   vi.fn(),
    objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
    deleteObjectStore: vi.fn(),
    createObjectStore: vi.fn(),
    transaction: vi.fn(),
  }),
}))

import { listCharacters, getCharacter, saveCharacter, deleteCharacter } from '@/data/db'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id:          'char_001',
    name:        'Eira Thornwood',
    race:        'Wood Elf',
    background:  'Outlander',
    alignment:   'Neutral Good',
    classes:     [{ name: 'Ranger', level: 5, hitDie: 10 }],
    experience:  0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities:   { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
    proficiencyBonus: 3,
    hp:          { current: 42, max: 42, temp: 0 },
    hitDice:     [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
    deathSaves:  { successes: 0, failures: 0 },
    ac: 16, initiative: 4, speed: 35,
    passivePerception: 16, spellSaveDC: 0, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks: [], inventory: [],
    currency:    { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features:    [],
    backstory:   '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [],
    spellSlots: {},
    spellcastingAbility: '',
    spellcastingClass: '',
    images:      {},
    createdAt:   1700000000000,
    updatedAt:   1700000000000,
    ...overrides,
  }
}

describe('v2-native db (Character persisted directly)', () => {
  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
  })

  // ── listCharacters ───────────────────────────────────────────────────────

  describe('listCharacters', () => {
    it('returns an array', async () => {
      expect(Array.isArray(await listCharacters())).toBe(true)
    })

    it('returns empty array when store is empty', async () => {
      expect(await listCharacters()).toHaveLength(0)
    })

    it('returns characters stored in v2 DB', async () => {
      store.set('char_001', makeChar())
      const result = await listCharacters()
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('char_001')
    })

    it('sorts by updatedAt descending (most recent first)', async () => {
      store.set('older', makeChar({ id: 'older', updatedAt: 1000 }))
      store.set('newer', makeChar({ id: 'newer', updatedAt: 2000 }))
      const result = await listCharacters()
      expect(result[0]!.id).toBe('newer')
      expect(result[1]!.id).toBe('older')
    })
  })

  // ── getCharacter ─────────────────────────────────────────────────────────

  describe('getCharacter', () => {
    it('returns null when id not found', async () => {
      expect(await getCharacter('nonexistent')).toBeNull()
    })

    it('returns the Character when id exists', async () => {
      store.set('char_001', makeChar({ name: 'Hero' }))
      const result = await getCharacter('char_001')
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Hero')
    })
  })

  // ── saveCharacter ────────────────────────────────────────────────────────

  describe('saveCharacter', () => {
    it('persists Character to the store', async () => {
      const char = makeChar({ name: 'Persisted Hero' })
      await saveCharacter(char)
      expect(store.has('char_001')).toBe(true)
      expect((store.get('char_001') as Character).name).toBe('Persisted Hero')
    })

    it('stamps updatedAt to current time on save', async () => {
      const before = Date.now()
      await saveCharacter(makeChar({ updatedAt: 0 }))
      const stored = store.get('char_001') as Character
      expect(stored.updatedAt).toBeGreaterThanOrEqual(before)
    })

    it('overwrites existing record on re-save', async () => {
      await saveCharacter(makeChar({ name: 'Original' }))
      await saveCharacter(makeChar({ name: 'Updated' }))
      const result = await listCharacters()
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Updated')
    })
  })

  // ── deleteCharacter ──────────────────────────────────────────────────────

  describe('deleteCharacter', () => {
    it('removes character from store', async () => {
      store.set('char_001', makeChar())
      await deleteCharacter('char_001')
      expect(store.has('char_001')).toBe(false)
    })

    it('does not throw when deleting non-existent id', async () => {
      await expect(deleteCharacter('nonexistent')).resolves.toBeUndefined()
    })
  })

  // ── hitDice normalization ────────────────────────────────────────────────

  describe('hitDice normalization on read', () => {
    it('listCharacters removes hitDice entries with empty className', async () => {
      store.set('char_001', makeChar({
        classes: [{ name: 'Fighter', level: 3, hitDie: 10 }],
        hitDice: [
          { className: '', current: 1, max: 1, dieSize: 8 },
          { className: 'Fighter', current: 3, max: 3, dieSize: 10 },
        ],
      }))
      const result = await listCharacters()
      expect(result[0]!.hitDice).toHaveLength(1)
      expect(result[0]!.hitDice[0]!.className).toBe('Fighter')
    })

    it('listCharacters removes hitDice entries orphaned from classes', async () => {
      store.set('char_001', makeChar({
        classes: [{ name: 'Fighter', level: 3, hitDie: 10 }],
        hitDice: [
          { className: 'Fighter', current: 3, max: 3, dieSize: 10 },
          { className: 'Cleric', current: 2, max: 2, dieSize: 8 },  // orphan
        ],
      }))
      const result = await listCharacters()
      expect(result[0]!.hitDice).toHaveLength(1)
      expect(result[0]!.hitDice[0]!.className).toBe('Fighter')
    })

    it('listCharacters leaves consistent hitDice unchanged', async () => {
      store.set('char_001', makeChar({
        classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
        hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
      }))
      const result = await listCharacters()
      expect(result[0]!.hitDice).toHaveLength(1)
      expect(result[0]!.hitDice[0]!.className).toBe('Ranger')
    })

    it('getCharacter removes hitDice entries with empty className', async () => {
      store.set('char_001', makeChar({
        classes: [{ name: 'Wizard', level: 4, hitDie: 6 }],
        hitDice: [
          { className: '', current: 1, max: 1, dieSize: 8 },
          { className: 'Wizard', current: 4, max: 4, dieSize: 6 },
        ],
      }))
      const result = await getCharacter('char_001')
      expect(result!.hitDice).toHaveLength(1)
      expect(result!.hitDice[0]!.className).toBe('Wizard')
    })

    it('getCharacter returns null for missing id (unaffected by normalization)', async () => {
      expect(await getCharacter('missing')).toBeNull()
    })
  })

  // ── spells normalization ─────────────────────────────────────────────────

  describe('spells normalization on read', () => {
    it('listCharacters converts legacy spells object (known array) to Spell[]', async () => {
      const legacy = {
        ...makeChar({ id: 'legacy_spells_01' }),
        spells: {
          ability: 'cha',
          attackBonus: 7,
          saveDC: 15,
          slots: [
            { level: 1, current: 4, max: 4 },
            { level: 2, current: 3, max: 3 },
          ],
          known: [
            { level: 1, name: 'Healing Word', prepared: true },
            { level: 0, name: 'Vicious Mockery' },
          ],
        },
        spellSlots:          undefined,
        spellcastingAbility: undefined,
        spellcastingClass:   undefined,
      }
      store.set('legacy_spells_01', legacy)
      const result = await listCharacters()
      const char = result.find(c => c.id === 'legacy_spells_01')!
      expect(Array.isArray(char.spells)).toBe(true)
      expect(char.spells).toHaveLength(2)
      const healingWord = char.spells.find(s => s.name === 'Healing Word')!
      expect(healingWord.prepared).toBe(true)
      expect(healingWord.level).toBe(1)
      expect(char.spellcastingAbility).toBe('cha')
      expect(char.spellSlots['1']?.max).toBe(4)
      expect(char.spellSlots['1']?.current).toBe(4)
      expect(char.spellSlots['2']?.max).toBe(3)
    })

    it('getCharacter converts legacy spells object to Spell[]', async () => {
      const legacy = {
        ...makeChar({ id: 'legacy_spells_02' }),
        spells: {
          ability: 'int',
          slots: [{ level: 3, current: 2, max: 2 }],
          known: [{ level: 0, name: 'Mage Hand' }, { level: 3, name: 'Fireball', prepared: true }],
        },
        spellSlots:          undefined,
        spellcastingAbility: undefined,
        spellcastingClass:   undefined,
      }
      store.set('legacy_spells_02', legacy)
      const result = await getCharacter('legacy_spells_02')
      expect(result).not.toBeNull()
      expect(Array.isArray(result!.spells)).toBe(true)
      expect(result!.spells).toHaveLength(2)
      expect(result!.spells.find(s => s.name === 'Fireball')!.prepared).toBe(true)
      expect(result!.spellcastingAbility).toBe('int')
      expect(result!.spellSlots['3']?.max).toBe(2)
      expect(result!.spellSlots['4']).toBeUndefined()
    })

    it('leaves spells unchanged when already a Spell[]', async () => {
      const char = makeChar({
        id: 'modern_spells_01',
        spells: [
          { id: 'sp1', name: 'Fireball', level: 3, school: 'evocation', castingTime: '1 action', range: '150 ft', description: '', prepared: true },
        ],
        spellSlots:          { '3': { current: 2, max: 2 } },
        spellcastingAbility: 'int',
        spellcastingClass:   'Wizard',
      })
      store.set('modern_spells_01', char)
      const result = await listCharacters()
      const found = result.find(c => c.id === 'modern_spells_01')!
      expect(found.spells).toHaveLength(1)
      expect(found.spells[0]!.name).toBe('Fireball')
      expect(found.spellcastingAbility).toBe('int')
      expect(found.spellSlots['3']?.max).toBe(2)
    })

    it('backfills all spell fields with defaults when entirely missing (non-caster)', async () => {
      const partial = { ...makeChar({ id: 'partial_spells_01' }) } as Record<string, unknown>
      delete partial['spells']
      delete partial['spellSlots']
      delete partial['spellcastingAbility']
      delete partial['spellcastingClass']
      store.set('partial_spells_01', partial)
      const result = await getCharacter('partial_spells_01')
      expect(result).not.toBeNull()
      expect(Array.isArray(result!.spells)).toBe(true)
      expect(result!.spells).toHaveLength(0)
      expect(result!.spellSlots).toEqual({})
      expect(result!.spellcastingAbility).toBe('')
      expect(typeof result!.spellcastingClass).toBe('string')
    })

    it('non-caster legacy character (spells: null) gets empty array', async () => {
      const legacy = {
        ...makeChar({ id: 'legacy_noncaster_01' }),
        spells: null,
        spellSlots: undefined,
        spellcastingAbility: undefined,
        spellcastingClass: undefined,
      }
      store.set('legacy_noncaster_01', legacy)
      const result = await getCharacter('legacy_noncaster_01')
      expect(result).not.toBeNull()
      expect(Array.isArray(result!.spells)).toBe(true)
      expect(result!.spells).toHaveLength(0)
      expect(result!.spellcastingAbility).toBe('')
    })
  })
})
