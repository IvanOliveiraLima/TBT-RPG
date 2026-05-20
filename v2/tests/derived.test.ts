import { describe, it, expect } from 'vitest'
import type { Character } from '@/domain/character'
import { deriveTotalLevel, formatClassesShort } from '@/domain/derived'

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char_test',
    name: 'Test Character',
    race: 'Human',
    background: 'Soldier',
    alignment: 'Neutral Good',
    classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
    experience: 0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 3,
    hp: { current: 10, max: 10, temp: 0 },
    hitDice: [{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 10, initiative: 0, speed: 30,
    passivePerception: 10, spellSaveDC: 0, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
    attacks: [], inventory: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features: [],
    backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    images: {},
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('deriveTotalLevel', () => {
  it('returns 0 for character with no classes', () => {
    const c = makeChar({ classes: [] })
    expect(deriveTotalLevel(c)).toBe(0)
  })

  it('sums single class', () => {
    const c = makeChar({ classes: [{ name: 'Fighter', level: 5, hitDie: 10 }] })
    expect(deriveTotalLevel(c)).toBe(5)
  })

  it('sums multiclass', () => {
    const c = makeChar({
      classes: [
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
    })
    expect(deriveTotalLevel(c)).toBe(5)
  })

  it('sums triple class', () => {
    const c = makeChar({
      classes: [
        { name: 'Cleric', level: 5, hitDie: 8 },
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Rogue', level: 2, hitDie: 8 },
      ],
    })
    expect(deriveTotalLevel(c)).toBe(10)
  })

  it('handles level 0 gracefully', () => {
    const c = makeChar({ classes: [{ name: 'Fighter', level: 0, hitDie: 10 }] })
    expect(deriveTotalLevel(c)).toBe(0)
  })

  it('matches proficiencyBonus table at level 5 (+3)', () => {
    const c = makeChar({ classes: [{ name: 'Ranger', level: 5, hitDie: 10 }] })
    expect(deriveTotalLevel(c)).toBe(5)
  })
})

describe('formatClassesShort', () => {
  it('returns empty string for no classes', () => {
    const c = makeChar({ classes: [] })
    expect(formatClassesShort(c)).toBe('')
  })

  it('formats single class', () => {
    const c = makeChar({ classes: [{ name: 'Cleric', level: 5, hitDie: 8 }] })
    expect(formatClassesShort(c)).toBe('Cleric 5')
  })

  it('formats multiclass with slash separator', () => {
    const c = makeChar({
      classes: [
        { name: 'Cleric', level: 5, hitDie: 8 },
        { name: 'Fighter', level: 3, hitDie: 10 },
      ],
    })
    expect(formatClassesShort(c)).toBe('Cleric 5 / Fighter 3')
  })

  it('formats triple class', () => {
    const c = makeChar({
      classes: [
        { name: 'Cleric', level: 5, hitDie: 8 },
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
    })
    expect(formatClassesShort(c)).toBe('Cleric 5 / Fighter 3 / Wizard 2')
  })

  it('omits entries with empty name', () => {
    const c = makeChar({
      classes: [
        { name: 'Fighter', level: 5, hitDie: 10 },
        { name: '', level: 1, hitDie: 8 },
      ],
    })
    expect(formatClassesShort(c)).toBe('Fighter 5')
  })
})
