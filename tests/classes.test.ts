import { describe, it, expect } from 'vitest'
import { getHitDie, CLASS_HIT_DIE } from '@/domain/classes'

describe('getHitDie — English names', () => {
  it('Barbarian → d12', () => expect(getHitDie('Barbarian')).toBe(12))
  it('Fighter → d10', () => expect(getHitDie('Fighter')).toBe(10))
  it('Paladin → d10', () => expect(getHitDie('Paladin')).toBe(10))
  it('Ranger → d10', () => expect(getHitDie('Ranger')).toBe(10))
  it('Monk → d8', () => expect(getHitDie('Monk')).toBe(8))
  it('Rogue → d8', () => expect(getHitDie('Rogue')).toBe(8))
  it('Bard → d8', () => expect(getHitDie('Bard')).toBe(8))
  it('Cleric → d8', () => expect(getHitDie('Cleric')).toBe(8))
  it('Druid → d8', () => expect(getHitDie('Druid')).toBe(8))
  it('Warlock → d8', () => expect(getHitDie('Warlock')).toBe(8))
  it('Artificer → d8', () => expect(getHitDie('Artificer')).toBe(8))
  it('Sorcerer → d6', () => expect(getHitDie('Sorcerer')).toBe(6))
  it('Wizard → d6', () => expect(getHitDie('Wizard')).toBe(6))
})

describe('getHitDie — PT-BR names (with accents)', () => {
  it('Bárbaro → d12', () => expect(getHitDie('Bárbaro')).toBe(12))
  it('Guerreiro → d10', () => expect(getHitDie('Guerreiro')).toBe(10))
  it('Paladino → d10', () => expect(getHitDie('Paladino')).toBe(10))
  it('Patrulheiro → d10', () => expect(getHitDie('Patrulheiro')).toBe(10))
  it('Artífice → d8', () => expect(getHitDie('Artífice')).toBe(8))
  it('Bardo → d8', () => expect(getHitDie('Bardo')).toBe(8))
  it('Clérigo → d8', () => expect(getHitDie('Clérigo')).toBe(8))
  it('Druida → d8', () => expect(getHitDie('Druida')).toBe(8))
  it('Monge → d8', () => expect(getHitDie('Monge')).toBe(8))
  it('Ladino → d8', () => expect(getHitDie('Ladino')).toBe(8))
  it('Bruxo → d8', () => expect(getHitDie('Bruxo')).toBe(8))
  it('Feiticeiro → d6', () => expect(getHitDie('Feiticeiro')).toBe(6))
  it('Mago → d6', () => expect(getHitDie('Mago')).toBe(6))
})

describe('getHitDie — case insensitivity', () => {
  it('lowercase "barbarian" → d12', () => expect(getHitDie('barbarian')).toBe(12))
  it('lowercase "wizard" → d6', () => expect(getHitDie('wizard')).toBe(6))
  it('uppercase "DRUID" → d8', () => expect(getHitDie('DRUID')).toBe(8))
  it('mixed case "fIgHtEr" → d10', () => expect(getHitDie('fIgHtEr')).toBe(10))
})

describe('getHitDie — accent insensitivity', () => {
  it('"barbaro" (no accent) → d12', () => expect(getHitDie('barbaro')).toBe(12))
  it('"clerigo" (no accent) → d8', () => expect(getHitDie('clerigo')).toBe(8))
  it('"artifice" (no accent) → d8', () => expect(getHitDie('artifice')).toBe(8))
  it('"CLÉRIGO" (uppercase accented) → d8', () => expect(getHitDie('CLÉRIGO')).toBe(8))
  it('"  Mago  " (whitespace + PT-BR) → d6', () => expect(getHitDie('  Mago  ')).toBe(6))
})

describe('getHitDie — whitespace and fallback', () => {
  it('leading/trailing spaces trimmed', () => expect(getHitDie('  Monk  ')).toBe(8))
  it('unknown class "Homebrew" → d8 fallback', () => expect(getHitDie('Homebrew')).toBe(8))
  it('empty string → d8 fallback', () => expect(getHitDie('')).toBe(8))
  it('partial class name "War" → d8 fallback', () => expect(getHitDie('War')).toBe(8))
})

describe('CLASS_HIT_DIE map', () => {
  it('has 26 entries (13 EN + 13 PT-BR)', () => expect(Object.keys(CLASS_HIT_DIE)).toHaveLength(26))
  it('all keys are lowercase', () => {
    for (const key of Object.keys(CLASS_HIT_DIE)) {
      expect(key).toBe(key.toLowerCase())
    }
  })
  it('all keys are accent-free', () => {
    for (const key of Object.keys(CLASS_HIT_DIE)) {
      expect(key).toBe(key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    }
  })
  it('all values are one of [6, 8, 10, 12]', () => {
    const validDice = new Set([6, 8, 10, 12])
    for (const val of Object.values(CLASS_HIT_DIE)) {
      expect(validDice.has(val)).toBe(true)
    }
  })
})
