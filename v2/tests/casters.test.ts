import { describe, it, expect } from 'vitest'
import { isCasterClass, isCharacterCaster, getSpellcastingAbility } from '@/domain/casters'

describe('isCasterClass', () => {
  it.each(['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'])(
    '%s is a full caster',
    (cls) => expect(isCasterClass(cls)).toBe(true),
  )

  it.each(['Paladin', 'Ranger'])(
    '%s is a half caster',
    (cls) => expect(isCasterClass(cls)).toBe(true),
  )

  it.each(['Warlock'])(
    '%s is a pact magic caster',
    (cls) => expect(isCasterClass(cls)).toBe(true),
  )

  it.each(['Barbarian', 'Fighter', 'Monk', 'Rogue'])(
    '%s is not a caster',
    (cls) => expect(isCasterClass(cls)).toBe(false),
  )

  it('is case-insensitive', () => {
    expect(isCasterClass('druid')).toBe(true)
    expect(isCasterClass('DRUID')).toBe(true)
    expect(isCasterClass('Druid')).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    expect(isCasterClass(' Druid ')).toBe(true)
    expect(isCasterClass(' Monk ')).toBe(false)
  })

  it('unknown or homebrew class is not a caster', () => {
    expect(isCasterClass('Homebrew')).toBe(false)
    expect(isCasterClass('')).toBe(false)
  })
})

describe('isCharacterCaster', () => {
  it('single caster class returns true', () => {
    expect(isCharacterCaster([{ name: 'Druid' }])).toBe(true)
  })

  it('single non-caster class returns false', () => {
    expect(isCharacterCaster([{ name: 'Barbarian' }])).toBe(false)
  })

  it('multiclass with at least one caster returns true', () => {
    expect(isCharacterCaster([{ name: 'Fighter' }, { name: 'Wizard' }])).toBe(true)
  })

  it('multiclass with no casters returns false', () => {
    expect(isCharacterCaster([{ name: 'Fighter' }, { name: 'Barbarian' }])).toBe(false)
  })

  it('empty class list returns false', () => {
    expect(isCharacterCaster([])).toBe(false)
  })

  it('all-caster multiclass returns true', () => {
    expect(isCharacterCaster([{ name: 'Wizard' }, { name: 'Sorcerer' }])).toBe(true)
  })
})

describe('getSpellcastingAbility', () => {
  it.each([
    ['Bard',     'cha'],
    ['Sorcerer', 'cha'],
    ['Warlock',  'cha'],
    ['Paladin',  'cha'],
  ] as const)('%s uses CHA', (cls, expected) => {
    expect(getSpellcastingAbility(cls)).toBe(expected)
  })

  it.each([
    ['Cleric', 'wis'],
    ['Druid',  'wis'],
    ['Ranger', 'wis'],
  ] as const)('%s uses WIS', (cls, expected) => {
    expect(getSpellcastingAbility(cls)).toBe(expected)
  })

  it('Wizard uses INT', () => {
    expect(getSpellcastingAbility('Wizard')).toBe('int')
  })

  it('is case-insensitive', () => {
    expect(getSpellcastingAbility('druid')).toBe('wis')
    expect(getSpellcastingAbility('WIZARD')).toBe('int')
    expect(getSpellcastingAbility('bard')).toBe('cha')
  })

  it('trims surrounding whitespace', () => {
    expect(getSpellcastingAbility(' Druid ')).toBe('wis')
  })

  it('unknown class falls back to CHA', () => {
    expect(getSpellcastingAbility('Homebrew')).toBe('cha')
    expect(getSpellcastingAbility('')).toBe('cha')
  })
})
