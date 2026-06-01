import { describe, it, expect } from 'vitest'
import { createEmptyCharacter, CANONICAL_SKILLS } from '@/domain/factories'

describe('createEmptyCharacter', () => {
  it('returns an object with all required Character fields', () => {
    const char = createEmptyCharacter()
    expect(char.id).toBeTruthy()
    expect(typeof char.name).toBe('string')
    expect(char.abilities).toBeDefined()
    expect(char.savingThrows).toBeDefined()
    expect(char.skills).toBeDefined()
    expect(char.classes).toBeDefined()
    expect(char.hitDice).toBeDefined()
    expect(char.hp).toBeDefined()
    expect(char.inventory).toBeDefined()
    expect(char.spells).toBeDefined()
    expect(char.spellSlots).toBeDefined()
    expect(char.features).toBeDefined()
    expect(char.attacks).toBeDefined()
  })

  it('applies provided name', () => {
    const char = createEmptyCharacter('Aria')
    expect(char.name).toBe('Aria')
  })

  it('defaults name to empty string', () => {
    const char = createEmptyCharacter()
    expect(char.name).toBe('')
  })

  it('initialises classes with a non-empty name (invariant)', () => {
    const char = createEmptyCharacter()
    expect(char.classes.length).toBe(1)
    expect(char.classes[0]!.name).toBeTruthy()
    expect(char.classes[0]!.level).toBe(1)
  })

  it('initialises hitDice synced with class name', () => {
    const char = createEmptyCharacter()
    expect(char.hitDice.length).toBe(1)
    expect(char.hitDice[0]!.className).toBe(char.classes[0]!.name)
    expect(char.hitDice[0]!.dieSize).toBe(char.classes[0]!.hitDie)
  })

  it('initialises all 6 abilities at 10', () => {
    const { abilities } = createEmptyCharacter()
    expect(abilities.str).toBe(10)
    expect(abilities.dex).toBe(10)
    expect(abilities.con).toBe(10)
    expect(abilities.int).toBe(10)
    expect(abilities.wis).toBe(10)
    expect(abilities.cha).toBe(10)
  })

  it('proficiencyBonus is 2 at level 1', () => {
    const char = createEmptyCharacter()
    expect(char.proficiencyBonus).toBe(2)
  })

  it('initialises hp at 10/10/0', () => {
    const { hp } = createEmptyCharacter()
    expect(hp.current).toBe(10)
    expect(hp.max).toBe(10)
    expect(hp.temp).toBe(0)
  })

  it('initialises all 6 saving throws with proficient: false', () => {
    const { savingThrows } = createEmptyCharacter()
    expect(savingThrows).toHaveLength(6)
    for (const st of savingThrows) {
      expect(st.proficient).toBe(false)
    }
  })

  it('initialises all 18 skills with proficient: false and expertise: false', () => {
    const { skills } = createEmptyCharacter()
    expect(skills).toHaveLength(18)
    for (const sk of skills) {
      expect(sk.proficient).toBe(false)
      expect(sk.expertise).toBe(false)
    }
  })

  it('initialises spellSlots for all 9 levels at 0/0', () => {
    const { spellSlots } = createEmptyCharacter()
    for (let lvl = 1; lvl <= 9; lvl++) {
      const slot = spellSlots[String(lvl)]
      expect(slot).toBeDefined()
      expect(slot!.current).toBe(0)
      expect(slot!.max).toBe(0)
    }
  })

  it('initialises empty arrays for spells, inventory, attacks, features', () => {
    const char = createEmptyCharacter()
    expect(char.spells).toHaveLength(0)
    expect(char.inventory).toHaveLength(0)
    expect(char.attacks).toHaveLength(0)
    expect(char.features).toHaveLength(0)
  })

  it('initialises currency at all zeros (no ep field)', () => {
    const { currency } = createEmptyCharacter()
    expect(currency).toEqual({ pp: 0, gp: 0, sp: 0, cp: 0 })
    expect('ep' in currency).toBe(false)
  })

  it('initialises spellcastingAbility as empty string', () => {
    const char = createEmptyCharacter()
    expect(char.spellcastingAbility).toBe('')
  })

  it('initiative equals DEX modifier (0 for DEX 10)', () => {
    const char = createEmptyCharacter()
    expect(char.initiative).toBe(0)
  })

  it('passivePerception equals 10 for default abilities', () => {
    const char = createEmptyCharacter()
    expect(char.passivePerception).toBe(10)
  })

  it('generates unique IDs for successive calls', () => {
    const a = createEmptyCharacter()
    const b = createEmptyCharacter()
    expect(a.id).not.toBe(b.id)
  })

  it('sets createdAt and updatedAt to current time', () => {
    const before = Date.now()
    const char = createEmptyCharacter()
    expect(char.createdAt).toBeGreaterThanOrEqual(before)
    expect(char.updatedAt).toBeGreaterThanOrEqual(before)
  })
})

describe('CANONICAL_SKILLS', () => {
  it('has exactly 18 entries', () => {
    expect(CANONICAL_SKILLS).toHaveLength(18)
  })

  it('contains sleight_of_hand (not sleight_hand)', () => {
    const keys = CANONICAL_SKILLS.map(s => s.key)
    expect(keys).toContain('sleight_of_hand')
    expect(keys).not.toContain('sleight_hand')
  })
})
