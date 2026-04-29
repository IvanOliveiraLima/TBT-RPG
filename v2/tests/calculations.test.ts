import { describe, it, expect } from 'vitest'
import {
  abilityModifier,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  passivePerception,
  spellSaveDC,
  spellAttackBonus,
  initiativeBonus,
  maxHpForClass,
  currencyConversionRate,
} from '@/domain/calculations'

describe('abilityModifier', () => {
  it('returns -5 for score 1', () => expect(abilityModifier(1)).toBe(-5))
  it('returns -4 for score 2', () => expect(abilityModifier(2)).toBe(-4))
  it('returns -4 for score 3', () => expect(abilityModifier(3)).toBe(-4))
  it('returns -1 for score 8', () => expect(abilityModifier(8)).toBe(-1))
  it('returns -1 for score 9', () => expect(abilityModifier(9)).toBe(-1))
  it('returns 0 for score 10', () => expect(abilityModifier(10)).toBe(0))
  it('returns 0 for score 11', () => expect(abilityModifier(11)).toBe(0))
  it('returns +1 for score 12', () => expect(abilityModifier(12)).toBe(1))
  it('returns +2 for score 14', () => expect(abilityModifier(14)).toBe(2))
  it('returns +3 for score 16', () => expect(abilityModifier(16)).toBe(3))
  it('returns +4 for score 18', () => expect(abilityModifier(18)).toBe(4))
  it('returns +5 for score 20', () => expect(abilityModifier(20)).toBe(5))
  it('returns +10 for score 30', () => expect(abilityModifier(30)).toBe(10))
})

describe('proficiencyBonus', () => {
  it('returns +2 at level 0 (clamped)', () => expect(proficiencyBonus(0)).toBe(2))
  it('returns +2 at level 1', () => expect(proficiencyBonus(1)).toBe(2))
  it('returns +2 at level 4', () => expect(proficiencyBonus(4)).toBe(2))
  it('returns +3 at level 5', () => expect(proficiencyBonus(5)).toBe(3))
  it('returns +3 at level 8', () => expect(proficiencyBonus(8)).toBe(3))
  it('returns +4 at level 9', () => expect(proficiencyBonus(9)).toBe(4))
  it('returns +4 at level 12', () => expect(proficiencyBonus(12)).toBe(4))
  it('returns +5 at level 13', () => expect(proficiencyBonus(13)).toBe(5))
  it('returns +5 at level 16', () => expect(proficiencyBonus(16)).toBe(5))
  it('returns +6 at level 17', () => expect(proficiencyBonus(17)).toBe(6))
  it('returns +6 at level 20', () => expect(proficiencyBonus(20)).toBe(6))
})

describe('savingThrowBonus', () => {
  // score 14 = +2 mod, profBonus 3
  it('not proficient: only ability modifier', () =>
    expect(savingThrowBonus(14, false, 3)).toBe(2))
  it('proficient: ability + profBonus', () =>
    expect(savingThrowBonus(14, true, 3)).toBe(5))
  it('includes miscBonus when provided', () =>
    expect(savingThrowBonus(14, false, 3, 2)).toBe(4))
  it('proficient + miscBonus', () =>
    expect(savingThrowBonus(14, true, 3, 1)).toBe(6))
  it('score 8 (-1 mod), not proficient', () =>
    expect(savingThrowBonus(8, false, 2)).toBe(-1))
})

describe('skillBonus', () => {
  // score 14 = +2 mod, profBonus 3
  it('not proficient: only ability modifier', () =>
    expect(skillBonus(14, false, false, 3)).toBe(2))
  it('proficient: ability + profBonus', () =>
    expect(skillBonus(14, true, false, 3)).toBe(5))
  it('expertise: ability + 2 * profBonus', () =>
    expect(skillBonus(14, true, true, 3)).toBe(8))
  it('expertise without proficiency (edge case): still doubles profBonus', () =>
    expect(skillBonus(14, false, true, 3)).toBe(8))
  it('score 8 (-1 mod), proficient, profBonus 2', () =>
    expect(skillBonus(8, true, false, 2)).toBe(1))
  it('score 10 (0 mod), not proficient', () =>
    expect(skillBonus(10, false, false, 3)).toBe(0))
})

describe('passivePerception', () => {
  // wis 14 = +2 mod, profBonus 3, proficient = total +5, passive = 15
  it('proficient perception gives 10 + skill bonus', () =>
    expect(passivePerception(14, true, false, 3)).toBe(15))
  it('not proficient gives 10 + ability mod only', () =>
    expect(passivePerception(14, false, false, 3)).toBe(12))
  it('expertise gives 10 + ability + 2*prof', () =>
    expect(passivePerception(14, true, true, 3)).toBe(18))
  it('wis 10 (0 mod), not proficient → 10', () =>
    expect(passivePerception(10, false, false, 2)).toBe(10))
})

describe('spellSaveDC', () => {
  // 8 + profBonus + abilityMod
  it('cha 18 (+4), profBonus 3 → DC 15', () =>
    expect(spellSaveDC(18, 3)).toBe(15))
  it('int 16 (+3), profBonus 2 → DC 13', () =>
    expect(spellSaveDC(16, 2)).toBe(13))
  it('wis 10 (0), profBonus 2 → DC 10', () =>
    expect(spellSaveDC(10, 2)).toBe(10))
})

describe('spellAttackBonus', () => {
  it('cha 18 (+4), profBonus 3 → +7', () =>
    expect(spellAttackBonus(18, 3)).toBe(7))
  it('int 12 (+1), profBonus 2 → +3', () =>
    expect(spellAttackBonus(12, 2)).toBe(3))
})

describe('initiativeBonus', () => {
  it('dex 14 (+2) → +2 with no misc', () =>
    expect(initiativeBonus(14)).toBe(2))
  it('dex 14 (+2) + miscBonus 1 → +3', () =>
    expect(initiativeBonus(14, 1)).toBe(3))
  it('dex 8 (-1) → -1', () =>
    expect(initiativeBonus(8)).toBe(-1))
})

describe('maxHpForClass', () => {
  it('level 0 always returns 0', () =>
    expect(maxHpForClass(0, 8, 2, true)).toBe(0))

  it('level 1 first class: max die + con mod (d8, con +2)', () =>
    expect(maxHpForClass(1, 8, 2, true)).toBe(10))

  it('level 1 second class: average die + con mod (d8, con +2) = (4+1)+2 = 7', () =>
    expect(maxHpForClass(1, 8, 2, false)).toBe(7))

  it('level 5 first class d8 con +2: 10 + 4×7 = 38', () =>
    expect(maxHpForClass(5, 8, 2, true)).toBe(38))

  it('level 5 second class d6 con +1: 5×(3+1+1) = 25', () =>
    expect(maxHpForClass(5, 6, 1, false)).toBe(25))

  it('d12 class (barbarian) level 1 first: 12 + con mod', () =>
    expect(maxHpForClass(1, 12, 3, true)).toBe(15))
})

describe('currencyConversionRate', () => {
  it('gold → gold is 1', () =>
    expect(currencyConversionRate('gold', 'g')).toBe(1))
  it('gold → copper is 100', () =>
    expect(currencyConversionRate('gold', 'c')).toBe(100))
  it('gold → silver is 10', () =>
    expect(currencyConversionRate('gold', 's')).toBe(10))
  it('platinum → gold is 10', () =>
    expect(currencyConversionRate('platinum', 'g')).toBe(10))
  it('copper → gold is 1/100', () =>
    expect(currencyConversionRate('copper', 'g')).toBeCloseTo(0.01))
  it('silver → copper is 10', () =>
    expect(currencyConversionRate('silver', 'c')).toBe(10))
})
