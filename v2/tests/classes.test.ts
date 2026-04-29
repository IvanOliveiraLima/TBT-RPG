import { describe, it, expect } from 'vitest'
import { getHitDie, CLASS_HIT_DIE } from '@/domain/classes'

describe('getHitDie', () => {
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

  // Case-insensitivity — v1 is a free-text input
  it('lowercase "barbarian" → d12', () => expect(getHitDie('barbarian')).toBe(12))
  it('lowercase "wizard" → d6', () => expect(getHitDie('wizard')).toBe(6))
  it('uppercase "DRUID" → d8', () => expect(getHitDie('DRUID')).toBe(8))
  it('mixed case "fIgHtEr" → d10', () => expect(getHitDie('fIgHtEr')).toBe(10))

  // Whitespace handling
  it('leading/trailing spaces trimmed', () => expect(getHitDie('  Monk  ')).toBe(8))

  // Fallback for unknown / homebrew classes
  it('unknown class "Homebrew" → d8 fallback', () => expect(getHitDie('Homebrew')).toBe(8))
  it('empty string → d8 fallback', () => expect(getHitDie('')).toBe(8))
  it('partial class name "War" → d8 fallback', () => expect(getHitDie('War')).toBe(8))
})

describe('CLASS_HIT_DIE map', () => {
  it('has 13 entries', () => expect(Object.keys(CLASS_HIT_DIE)).toHaveLength(13))
  it('all keys are lowercase', () => {
    for (const key of Object.keys(CLASS_HIT_DIE)) {
      expect(key).toBe(key.toLowerCase())
    }
  })
  it('all values are one of [6, 8, 10, 12]', () => {
    const validDice = new Set([6, 8, 10, 12])
    for (const val of Object.values(CLASS_HIT_DIE)) {
      expect(validDice.has(val)).toBe(true)
    }
  })
})
