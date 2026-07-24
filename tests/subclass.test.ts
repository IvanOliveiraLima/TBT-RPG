import { describe, it, expect } from 'vitest'
import { subclassSuggestions } from '@/domain/classes'
import { formatClassesShort } from '@/domain/derived'
import type { Character } from '@/domain/character'

// Minimal character fixture matching the actual Character domain shape
function makeChar(classes: Character['classes']): Character {
  return {
    id: 'test',
    name: 'Test',
    race: '',
    background: '',
    alignment: '',
    classes,
    experience: 0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 2,
    hp: { current: 10, max: 10, temp: 0 },
    hitDice: [],
    deathSaves: { successes: 0, failures: 0 },
    ac: 10,
    initiative: 0,
    speed: 30,
    passivePerception: 10,
    spellSaveDC: 0,
    inspiration: false,
    savingThrows: [],
    skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] },
    languages: [],
    attacks: [],
    spells: [],
    spellSlots: {},
    spellcastingAbility: '',
    spellcastingClass: '',
    inventory: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    features: [],
    backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '',
    notes2: '',
    mountPet: '',
    mountPet2: '',
    alliesOrganizations: '',
    images: {},
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('subclassSuggestions', () => {
  it('returns suggestions for canonical EN class', () => {
    const suggestions = subclassSuggestions('Warlock')
    expect(suggestions).toContain('The Fiend')
    expect(suggestions).toContain('The Archfey')
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('resolves PT class name to canonical suggestions', () => {
    const suggestions = subclassSuggestions('Bruxo')
    expect(suggestions).toContain('The Fiend')
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('returns [] for unknown/homebrew class', () => {
    expect(subclassSuggestions('HomeBrewer')).toEqual([])
    expect(subclassSuggestions('')).toEqual([])
  })

  it('returns Cleric domain suggestions', () => {
    const suggestions = subclassSuggestions('Cleric')
    expect(suggestions).toContain('Life Domain')
    expect(suggestions).toContain('War Domain')
  })
})

describe('formatClassesShort with subclass', () => {
  it('appends subclass when present', () => {
    const char = makeChar([{ name: 'Warlock', level: 6, hitDie: 8, subclass: 'The Fiend' }])
    expect(formatClassesShort(char)).toBe('Warlock 6 · The Fiend')
  })

  it('omits subclass separator when subclass is empty', () => {
    const char = makeChar([{ name: 'Warlock', level: 6, hitDie: 8 }])
    expect(formatClassesShort(char)).toBe('Warlock 6')
  })

  it('omits subclass separator when subclass is whitespace-only', () => {
    const char = makeChar([{ name: 'Warlock', level: 6, hitDie: 8, subclass: '   ' }])
    expect(formatClassesShort(char)).toBe('Warlock 6')
  })

  it('handles multiclass with independent subclasses', () => {
    const char = makeChar([
      { name: 'Warlock', level: 6, hitDie: 8, subclass: 'The Fiend' },
      { name: 'Wizard', level: 2, hitDie: 6, subclass: 'School of Evocation' },
    ])
    expect(formatClassesShort(char)).toBe('Warlock 6 · The Fiend / Wizard 2 · School of Evocation')
  })

  it('handles multiclass where only one has subclass', () => {
    const char = makeChar([
      { name: 'Warlock', level: 6, hitDie: 8, subclass: 'The Fiend' },
      { name: 'Rogue', level: 2, hitDie: 8 },
    ])
    expect(formatClassesShort(char)).toBe('Warlock 6 · The Fiend / Rogue 2')
  })

  it('works with resolveLabel', () => {
    const char = makeChar([{ name: 'Warlock', level: 6, hitDie: 8, subclass: 'The Fiend' }])
    expect(formatClassesShort(char, name => name.toUpperCase())).toBe('WARLOCK 6 · The Fiend')
  })
})
