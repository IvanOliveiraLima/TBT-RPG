import { describe, it, expect } from 'vitest'
import { adaptCharacter } from '@/data/adapter'
import type { V1Character } from '@/data/schema-v1'

import fullCharFixture    from './fixtures/full-character.json'
import spellcasterFixture from './fixtures/spellcaster-character.json'

/* ── Helpers ────────────────────────────────────────────────────────────── */

const fullChar    = fullCharFixture    as V1Character
const spellcaster = spellcasterFixture as V1Character

function emptyChar(): V1Character {
  return {}
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe('adaptCharacter — empty input', () => {
  it('does not throw on completely empty record', () => {
    expect(() => adaptCharacter(emptyChar())).not.toThrow()
  })

  it('returns "Unnamed" when char_name is missing', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.name).toBe('Unnamed')
  })

  it('returns default numeric zeros for abilities', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.abilities).toEqual({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 })
  })

  it('returns totalLevel 0 for empty classes', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.totalLevel).toBe(0)
  })

  it('returns proficiencyBonus 2 even at level 0', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.proficiencyBonus).toBe(2)
  })

  it('returns hp { current: 0, max: 0, temp: 0 } when all are empty', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.hp).toEqual({ current: 0, max: 0, temp: 0 })
  })

  it('returns empty attacks array', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.attacks).toEqual([])
  })

  it('returns undefined spells when no spells or slots exist', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.spells).toBeUndefined()
  })

  it('returns 18 savingThrows (6 abilities)', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.savingThrows).toHaveLength(6)
  })

  it('returns 18 skills', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.skills).toHaveLength(18)
  })

  it('returns empty inventory', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.inventory).toEqual([])
  })

  it('returns zero currency', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.currency).toEqual({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 })
  })

  it('returns features as empty array', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.features).toEqual([])
  })
})

describe('adaptCharacter — HP edge cases', () => {
  it('sets current to max when current_health is empty string', () => {
    const raw: V1Character = {
      page1: { status: { current_health: '', max_health: '42', temp_health: '' } },
    }
    const result = adaptCharacter(raw)
    expect(result.hp.current).toBe(42)
    expect(result.hp.max).toBe(42)
  })

  it('sets current to max when current_health is absent', () => {
    const raw: V1Character = {
      page1: { status: { max_health: '30', temp_health: '' } },
    }
    const result = adaptCharacter(raw)
    expect(result.hp.current).toBe(30)
  })

  it('preserves current HP when explicitly set', () => {
    const raw: V1Character = {
      page1: { status: { current_health: '15', max_health: '42', temp_health: '5' } },
    }
    const result = adaptCharacter(raw)
    expect(result.hp).toEqual({ current: 15, max: 42, temp: 5 })
  })

  it('parses current HP of 0 as 0 (not as full HP)', () => {
    const raw: V1Character = {
      page1: { status: { current_health: '0', max_health: '42', temp_health: '' } },
    }
    const result = adaptCharacter(raw)
    expect(result.hp.current).toBe(0)
  })
})

describe('adaptCharacter — classes and level', () => {
  it('derives totalLevel from classes array', () => {
    const raw: V1Character = {
      page1: {
        basic_info: {
          classes: [{ name: 'Fighter', level: '5' }, { name: 'Rogue', level: '3' }],
        },
      },
    }
    const result = adaptCharacter(raw)
    expect(result.totalLevel).toBe(8)
  })

  it('proficiencyBonus is correct for level 8 (+3)', () => {
    const raw: V1Character = {
      page1: {
        basic_info: {
          classes: [{ name: 'Fighter', level: '5' }, { name: 'Rogue', level: '3' }],
        },
      },
    }
    const result = adaptCharacter(raw)
    expect(result.proficiencyBonus).toBe(3)
  })

  it('falls back to legacy char_class + level when classes array is absent', () => {
    const raw: V1Character = {
      page1: { basic_info: { char_class: 'Wizard', level: '7' } },
    }
    const result = adaptCharacter(raw)
    expect(result.classes).toHaveLength(1)
    expect(result.classes[0]?.name).toBe('Wizard')
    expect(result.classes[0]?.level).toBe(7)
    expect(result.totalLevel).toBe(7)
  })

  it('converts class level from string to number', () => {
    const result = adaptCharacter(fullChar)
    expect(typeof result.classes[0]?.level).toBe('number')
    expect(result.classes[0]?.level).toBe(5)
  })
})

describe('adaptCharacter — skills', () => {
  it('proficient skill has correct bonus (ability mod + prof)', () => {
    const result = adaptCharacter(fullChar)
    // Monk: STR 12 (+1 mod), Athletics proficient, profBonus 3 → +4
    const athletics = result.skills.find((s) => s.name === 'Athletics')!
    expect(athletics.proficient).toBe(true)
    expect(athletics.bonus).toBe(4)
  })

  it('non-proficient skill has only ability mod', () => {
    const result = adaptCharacter(fullChar)
    // Monk: INT 10 (+0 mod), Arcana not proficient → 0
    const arcana = result.skills.find((s) => s.name === 'Arcana')!
    expect(arcana.proficient).toBe(false)
    expect(arcana.bonus).toBe(0)
  })

  it('expertise gives ability mod + 2×profBonus', () => {
    const result = adaptCharacter(spellcaster)
    // Bard: CHA 18 (+4 mod), Performance expertise, profBonus 3 → +4 + 6 = +10
    const performance = result.skills.find((s) => s.name === 'Performance')!
    expect(performance.expertise).toBe(true)
    expect(performance.bonus).toBe(10)
  })

  it('all 18 skills are present', () => {
    const result = adaptCharacter(fullChar)
    expect(result.skills).toHaveLength(18)
    const names = result.skills.map((s) => s.name)
    expect(names).toContain('Perception')
    expect(names).toContain('Sleight of Hand')
    expect(names).toContain('Animal Handling')
  })

  it('emits display name for single-word skill', () => {
    const raw: V1Character = {
      page1: { saves_skills: { skills: { acrobatics: { prof: true, expr: false } } } },
    }
    const c = adaptCharacter(raw)
    expect(c.skills.find((s) => s.name === 'Acrobatics')).toBeDefined()
    expect(c.skills.find((s) => s.name === 'acrobatics')).toBeUndefined()
  })

  it('emits display name for multi-word skill', () => {
    const raw: V1Character = {
      page1: { saves_skills: { skills: { sleight_of_hand: { prof: true } } } },
    }
    const c = adaptCharacter(raw)
    expect(c.skills.find((s) => s.name === 'Sleight of Hand')).toBeDefined()
    expect(c.skills.find((s) => s.name === 'sleight_of_hand')).toBeUndefined()
  })

  it('passive perception derives correctly after display-name change', () => {
    // WIS 16 (+3), Perception proficient, level 5 (profBonus 3) → 10 + 3 + 3 = 16
    const raw: V1Character = {
      page1: {
        top_bar:    { passive_perception: '13' }, // stale v1 value — should be ignored
        attributes: { wis: '16' },
        basic_info: { classes: [{ name: 'Ranger', level: '5' }] },
        saves_skills: { skills: { perception: { prof: true } } },
      },
    }
    expect(adaptCharacter(raw).passivePerception).toBe(16)
  })
})

describe('adaptCharacter — saving throws', () => {
  it('proficient saving throw has correct bonus', () => {
    const result = adaptCharacter(fullChar)
    // Monk: DEX 16 (+3 mod), DEX save proficient, profBonus 3 → +6
    const dexSave = result.savingThrows.find((s) => s.ability === 'dex')!
    expect(dexSave.proficient).toBe(true)
    expect(dexSave.bonus).toBe(6)
  })

  it('non-proficient saving throw has only ability mod', () => {
    const result = adaptCharacter(fullChar)
    // Monk: STR 12 (+1 mod), STR save not proficient → +1
    const strSave = result.savingThrows.find((s) => s.ability === 'str')!
    expect(strSave.proficient).toBe(false)
    expect(strSave.bonus).toBe(1)
  })

  it('returns all 6 saving throws', () => {
    const result = adaptCharacter(fullChar)
    expect(result.savingThrows).toHaveLength(6)
    const abilities = result.savingThrows.map((s) => s.ability)
    expect(abilities).toContain('str')
    expect(abilities).toContain('cha')
  })
})

describe('adaptCharacter — spells', () => {
  it('returns undefined spells for non-spellcaster', () => {
    const result = adaptCharacter(fullChar)
    expect(result.spells).toBeUndefined()
  })

  it('returns spells object for spellcaster', () => {
    const result = adaptCharacter(spellcaster)
    expect(result.spells).toBeDefined()
  })

  it('maps spell ability correctly (cha)', () => {
    const result = adaptCharacter(spellcaster)
    expect(result.spells?.ability).toBe('cha')
  })

  it('adapts spell slots — current equals max (v1 has no used tracking)', () => {
    const result = adaptCharacter(spellcaster)
    const slot1 = result.spells?.slots.find((s) => s.level === 1)
    // level_1.total = "4"; no used field in v1 → current = max
    expect(slot1?.max).toBe(4)
    expect(slot1?.current).toBe(4)
  })

  it('includes cantrips as level-0 spells', () => {
    const result = adaptCharacter(spellcaster)
    const cantrips = result.spells?.known.filter((s) => s.level === 0) ?? []
    expect(cantrips.length).toBeGreaterThan(0)
    expect(cantrips[0]?.name).toBe('Vicious Mockery')
  })

  it('marks prepared spells correctly', () => {
    const result = adaptCharacter(spellcaster)
    const healingWord = result.spells?.known.find((s) => s.name === 'Healing Word')
    expect(healingWord?.prepared).toBe(true)
    const faeirieFire = result.spells?.known.find((s) => s.name === 'Faerie Fire')
    expect(faeirieFire?.prepared).toBe(false)
  })

  it('saveDC is read from spell_info.dc (not recalculated)', () => {
    const result = adaptCharacter(spellcaster)
    // fixture stores "14" in spell_info.dc
    expect(result.spells?.saveDC).toBe(14)
  })
})

describe('adaptCharacter — full fixture', () => {
  it('name is correct', () => {
    const result = adaptCharacter(fullChar)
    expect(result.name).toBe('Kanaan Duskwalker')
  })

  it('race is correct', () => {
    const result = adaptCharacter(fullChar)
    expect(result.race).toBe('Humano')
  })

  it('attacks are adapted', () => {
    const result = adaptCharacter(fullChar)
    expect(result.attacks).toHaveLength(2)
    expect(result.attacks[0]?.name).toBe('Unarmed Strike')
    expect(result.attacks[1]?.damage).toBe('1d6+3')
  })

  it('inventory is adapted from both equipment columns', () => {
    const result = adaptCharacter(fullChar)
    // col_1 has 3 items, col_2 has 1 item
    expect(result.inventory).toHaveLength(4)
    expect(result.inventory[0]?.name).toBe('Shortsword')
    expect(result.inventory[0]?.weight).toBe(2)
  })

  it('currency is parsed from strings to numbers', () => {
    const result = adaptCharacter(fullChar)
    expect(result.currency).toEqual({ cp: 0, sp: 5, ep: 0, gp: 15, pp: 0 })
  })

  it('personality fields are populated', () => {
    const result = adaptCharacter(fullChar)
    expect(result.personality.traits).toContain('calm')
    expect(result.personality.ideals).toContain('Respect')
  })

  it('backstory comes from page4.backstory (not personality)', () => {
    const result = adaptCharacter(fullChar)
    expect(result.backstory).toContain('monastery')
  })

  it('allies from allies_organizations.name', () => {
    const result = adaptCharacter(fullChar)
    expect(result.allies).toBe('Monastério da Palma Aberta')
  })

  it('notes are concatenated from notes_1 and notes_2', () => {
    const result = adaptCharacter(fullChar)
    expect(result.notes).toContain('Ki points')
    expect(result.notes).toContain('Flurry of Blows')
  })

  it('passivePerception is derived correctly', () => {
    const result = adaptCharacter(fullChar)
    // Monk: WIS 14 (+2), Perception proficient, profBonus 3 → 10 + 2 + 3 = 15
    expect(result.passivePerception).toBe(15)
  })

  it('deathSaves are all false', () => {
    const result = adaptCharacter(fullChar)
    expect(result.deathSaves).toEqual({ successes: 0, failures: 0 })
  })

  it('deathSaves count true booleans correctly', () => {
    const result = adaptCharacter(spellcaster)
    // spellcaster: success_1 = true, fail_1 = true
    expect(result.deathSaves).toEqual({ successes: 1, failures: 1 })
  })

  it('updatedAt is preserved from raw', () => {
    const result = adaptCharacter(fullChar)
    expect(result.updatedAt).toBe(1700000000000)
  })

  it('images are mapped when present', () => {
    const charWithImage: V1Character = {
      ...fullChar,
      images: { character: 'data:image/png;base64,abc123', symbol: '' },
    }
    const result = adaptCharacter(charWithImage)
    expect(result.images.character).toBe('data:image/png;base64,abc123')
    expect(result.images.symbol).toBeUndefined()
  })

  it('empty image strings are not included in images object', () => {
    const result = adaptCharacter(fullChar)
    expect(result.images.character).toBeUndefined()
    expect(result.images.symbol).toBeUndefined()
  })
})

describe('adaptCharacter — inspiration', () => {
  it('absent insperation field → inspiration false', () => {
    const result = adaptCharacter(emptyChar())
    expect(result.inspiration).toBe(false)
  })

  it('empty string → inspiration false', () => {
    const raw: V1Character = { page1: { top_bar: { insperation: '' } } }
    const result = adaptCharacter(raw)
    expect(result.inspiration).toBe(false)
  })

  it('"false" string → inspiration false', () => {
    const raw: V1Character = { page1: { top_bar: { insperation: 'false' } } }
    const result = adaptCharacter(raw)
    expect(result.inspiration).toBe(false)
  })

  it('"0" string → inspiration false', () => {
    const raw: V1Character = { page1: { top_bar: { insperation: '0' } } }
    const result = adaptCharacter(raw)
    expect(result.inspiration).toBe(false)
  })

  it('"true" string → inspiration true', () => {
    const raw: V1Character = { page1: { top_bar: { insperation: 'true' } } }
    const result = adaptCharacter(raw)
    expect(result.inspiration).toBe(true)
  })

  it('"1" string → inspiration true', () => {
    const raw: V1Character = { page1: { top_bar: { insperation: '1' } } }
    const result = adaptCharacter(raw)
    expect(result.inspiration).toBe(true)
  })

  it('any non-empty non-false string (e.g. "yes") → inspiration true', () => {
    const raw: V1Character = { page1: { top_bar: { insperation: 'yes' } } }
    const result = adaptCharacter(raw)
    expect(result.inspiration).toBe(true)
  })
})

describe('adaptCharacter — spell adapter defensiveness', () => {
  it('undefined page3 → no crash, spells undefined', () => {
    const raw: V1Character = {
      page1: { basic_info: { char_name: 'Test', classes: [{ name: 'Cleric', level: '3' }] } },
      // page3 absent
    }
    expect(() => adaptCharacter(raw)).not.toThrow()
    expect(adaptCharacter(raw).spells).toBeUndefined()
  })

  it('cantrips block with no .spells property → no crash', () => {
    const raw: V1Character = {
      page1: { saves_skills: { spell_casting: 'wis' } },
      page3: {
        spell_info: { dc: '13', att: '+5' },
        spells: {
          cantrips: {} as never, // object with no .spells inside
          level_1: { total: '2', spells: [{ spell_name: 'Cure Wounds', preped: true }] },
        },
      },
    }
    expect(() => adaptCharacter(raw)).not.toThrow()
    const result = adaptCharacter(raw)
    // cantrips block empty → only level_1 spell present
    expect(result.spells?.known.find((s) => s.name === 'Cure Wounds')).toBeDefined()
    expect(result.spells?.known.filter((s) => s.level === 0)).toHaveLength(0)
  })

  it('cantrips block as flat array (old schema variant) → no crash, no cantrips', () => {
    // Before the schema was corrected, cantrips was stored as SpellEntry[].
    // The adapter guards against this — it should not crash and should skip the block.
    const raw: V1Character = {
      page1: { saves_skills: { spell_casting: 'wis' } },
      page3: {
        spell_info: { dc: '14', att: '+6' },
        spells: {
          cantrips: [{ spell_name: 'Sacred Flame' }] as never,
          level_1: { total: '3', spells: [] },
        },
      },
    }
    expect(() => adaptCharacter(raw)).not.toThrow()
    const result = adaptCharacter(raw)
    expect(result.spells?.known.filter((s) => s.level === 0)).toHaveLength(0)
  })

  it('attacks_spells as undefined → empty attacks array, no crash', () => {
    const raw: V1Character = {
      page1: { basic_info: { char_name: 'Pacifist', classes: [{ name: 'Monk', level: '1' }] } },
      // attacks_spells absent
    }
    expect(() => adaptCharacter(raw)).not.toThrow()
    expect(adaptCharacter(raw).attacks).toEqual([])
  })

  it('attacks_spells as legacy nested object → treated as non-array, empty attacks', () => {
    // Some old fixtures used { attacks: [...] } instead of a flat array.
    // toArray() should guard against this gracefully.
    const raw: V1Character = {
      page1: {
        attacks_spells: { attacks: [{ name: 'Dagger' }] } as never,
      },
    }
    expect(() => adaptCharacter(raw)).not.toThrow()
    expect(adaptCharacter(raw).attacks).toEqual([])
  })

  it('detects rollType=attack for normal bonus string "+5"', () => {
    const raw: V1Character = {
      page1: { attacks_spells: [{ name: 'Sword', toHit: '+5', stat: 'str' }] },
    }
    expect(adaptCharacter(raw).attacks[0]!.rollType).toBe('attack')
  })

  it('detects rollType=dc for "DC 14" toHit (spell save)', () => {
    const raw: V1Character = {
      page1: { attacks_spells: [{ name: 'Vicious Mockery', toHit: 'DC 14', stat: 'cha' }] },
    }
    expect(adaptCharacter(raw).attacks[0]!.rollType).toBe('dc')
  })

  it('detects rollType=dc for lowercase "dc 12" (case-insensitive)', () => {
    const raw: V1Character = {
      page1: { attacks_spells: [{ name: 'Burning Hands', toHit: 'dc 12' }] },
    }
    expect(adaptCharacter(raw).attacks[0]!.rollType).toBe('dc')
  })

  it('real v1 spell structure round-trips correctly', () => {
    const result = adaptCharacter(spellcaster)
    expect(result.spells).toBeDefined()
    // Cantrips
    const cantrips = result.spells!.known.filter((s) => s.level === 0)
    expect(cantrips.map((s) => s.name)).toEqual(['Vicious Mockery', 'Minor Illusion', 'Prestidigitation'])
    // Level 1 spells
    const lvl1 = result.spells!.known.filter((s) => s.level === 1)
    expect(lvl1).toHaveLength(3)
    // Level 3 slot count
    const slot3 = result.spells!.slots.find((s) => s.level === 3)
    expect(slot3?.max).toBe(2)
    expect(slot3?.current).toBe(2)
    // Empty level 4 slot not included
    expect(result.spells!.slots.find((s) => s.level === 4)).toBeUndefined()
  })
})

describe('adaptCharacter — class hit die', () => {
  it('Monk class gets d8', () => {
    const result = adaptCharacter(fullChar)
    expect(result.classes[0]?.hitDie).toBe(8)
  })

  it('Barbarian class gets d12', () => {
    const raw: V1Character = {
      page1: { basic_info: { classes: [{ name: 'Barbarian', level: '3' }] } },
    }
    const result = adaptCharacter(raw)
    expect(result.classes[0]?.hitDie).toBe(12)
  })

  it('Wizard class gets d6', () => {
    const raw: V1Character = {
      page1: { basic_info: { char_class: 'Wizard', level: '7' } },
    }
    const result = adaptCharacter(raw)
    expect(result.classes[0]?.hitDie).toBe(6)
  })

  it('unknown homebrew class gets d8 fallback', () => {
    const raw: V1Character = {
      page1: { basic_info: { classes: [{ name: 'Homebrew', level: '4' }] } },
    }
    const result = adaptCharacter(raw)
    expect(result.classes[0]?.hitDie).toBe(8)
  })

  it('multi-class gets correct hit die per class', () => {
    const raw: V1Character = {
      page1: {
        basic_info: {
          classes: [
            { name: 'Fighter', level: '5' },
            { name: 'Wizard', level: '3' },
          ],
        },
      },
    }
    const result = adaptCharacter(raw)
    expect(result.classes[0]?.hitDie).toBe(10) // Fighter
    expect(result.classes[1]?.hitDie).toBe(6)  // Wizard
  })
})

describe('adaptCharacter — hit dice derivation from classes', () => {
  it('Druid 5 with blank v1 hit_dice → hitDice[0] = { current:5, max:5, dieSize:8 }', () => {
    const raw: V1Character = {
      page1: {
        basic_info: { classes: [{ name: 'Druid', level: '5' }] },
        // hit_dice fields absent (blank in real v1 data for many characters)
      },
    }
    const result = adaptCharacter(raw)
    expect(result.hitDice).toHaveLength(1)
    expect(result.hitDice[0]).toEqual({ current: 5, max: 5, dieSize: 8 })
  })

  it('Ranger 4 with blank v1 hit_dice → hitDice[0] = { current:4, max:4, dieSize:10 }', () => {
    const raw: V1Character = {
      page1: { basic_info: { classes: [{ name: 'Ranger', level: '4' }] } },
    }
    const result = adaptCharacter(raw)
    expect(result.hitDice[0]).toEqual({ current: 4, max: 4, dieSize: 10 })
  })

  it('uses current_hd from v1 when it is explicitly set', () => {
    const raw: V1Character = {
      page1: {
        basic_info: { classes: [{ name: 'Fighter', level: '5' }] },
        status: { hit_dice: { current_hd: '3', max_hd: '5', hd_die: '10' } },
      },
    }
    const result = adaptCharacter(raw)
    // current comes from v1 (3 dice spent), max and dieSize from class
    expect(result.hitDice[0]).toEqual({ current: 3, max: 5, dieSize: 10 })
  })

  it('falls back to max when current_hd is empty string', () => {
    const raw: V1Character = {
      page1: {
        basic_info: { classes: [{ name: 'Cleric', level: '6' }] },
        status: { hit_dice: { current_hd: '', max_hd: '6', hd_die: '8' } },
      },
    }
    const result = adaptCharacter(raw)
    expect(result.hitDice[0]).toEqual({ current: 6, max: 6, dieSize: 8 })
  })

  it('multiclass Fighter 3 / Rogue 2 → two hit dice entries', () => {
    const raw: V1Character = {
      page1: {
        basic_info: {
          classes: [
            { name: 'Fighter', level: '3' },
            { name: 'Rogue', level: '2' },
          ],
        },
      },
    }
    const result = adaptCharacter(raw)
    expect(result.hitDice).toHaveLength(2)
    expect(result.hitDice[0]).toEqual({ current: 3, max: 3, dieSize: 10 }) // Fighter d10
    expect(result.hitDice[1]).toEqual({ current: 2, max: 2, dieSize: 8 })  // Rogue d8
  })

  it('multiclass uses max for current (no per-class tracking in v1)', () => {
    const raw: V1Character = {
      page1: {
        basic_info: {
          classes: [
            { name: 'Wizard', level: '4' },
            { name: 'Sorcerer', level: '4' },
          ],
        },
        // even if current_hd set, multiclass ignores it
        status: { hit_dice: { current_hd: '6' } },
      },
    }
    const result = adaptCharacter(raw)
    expect(result.hitDice).toHaveLength(2)
    expect(result.hitDice[0]?.current).toBe(result.hitDice[0]?.max)
    expect(result.hitDice[1]?.current).toBe(result.hitDice[1]?.max)
  })
})

describe('adaptCharacter — combat stats from incomplete v1', () => {
  it('calculates AC when v1 ac is empty (10 + DEX mod)', () => {
    const raw: V1Character = {
      page1: { top_bar: { ac: '' }, attributes: { dex: '18' } },
    }
    expect(adaptCharacter(raw).ac).toBe(14) // 10 + 4
  })

  it('uses stored AC when v1 ac is set', () => {
    const raw: V1Character = {
      page1: { top_bar: { ac: '17' }, attributes: { dex: '18' } },
    }
    expect(adaptCharacter(raw).ac).toBe(17)
  })

  it('calculates AC for low DEX (10 + DEX mod negative)', () => {
    const raw: V1Character = {
      page1: { top_bar: { ac: '' }, attributes: { dex: '8' } },
    }
    expect(adaptCharacter(raw).ac).toBe(9) // 10 + (-1)
  })

  it('calculates initiative from DEX modifier when field is empty', () => {
    const raw: V1Character = {
      page1: { top_bar: { initiative: '' }, attributes: { dex: '18' } },
    }
    expect(adaptCharacter(raw).initiative).toBe(4) // DEX mod
  })

  it('uses stored initiative when user entered a custom bonus', () => {
    const raw: V1Character = {
      page1: { top_bar: { initiative: '+6' }, attributes: { dex: '18' } },
    }
    expect(adaptCharacter(raw).initiative).toBe(6)
  })

  it('handles negative stored initiative', () => {
    const raw: V1Character = {
      page1: { top_bar: { initiative: '-1' }, attributes: { dex: '8' } },
    }
    expect(adaptCharacter(raw).initiative).toBe(-1)
  })

  it('calculates passive perception from skills, ignoring v1 stored value', () => {
    // WIS 16 (+3), perception proficient, level 5 (profBonus 3) → 10 + 3 + 3 = 16
    const raw: V1Character = {
      page1: {
        top_bar: { passive_perception: '13' }, // stale v1 value — should be ignored
        attributes: { wis: '16' },
        basic_info: { classes: [{ name: 'Ranger', level: '5' }] },
        saves_skills: {
          skills: { perception: { prof: true } },
        },
      },
    }
    expect(adaptCharacter(raw).passivePerception).toBe(16)
  })

  it('passive perception uses expertise when set (doubles prof bonus)', () => {
    // WIS 14 (+2), expertise in perception, level 4 (profBonus 2) → 10 + 2 + 4 = 16
    const raw: V1Character = {
      page1: {
        attributes: { wis: '14' },
        basic_info: { classes: [{ name: 'Rogue', level: '4' }] },
        saves_skills: {
          skills: { perception: { prof: true, expr: true } },
        },
      },
    }
    expect(adaptCharacter(raw).passivePerception).toBe(16)
  })
})

describe('adaptCharacter — features from v1 string', () => {
  it('parses comma-separated features into Feature array', () => {
    const raw: V1Character = {
      page1: { features: 'Wild Shape, Druidic Circle, Healing Word' },
    }
    const result = adaptCharacter(raw).features
    expect(result).toHaveLength(3)
    expect(result[0]?.name).toBe('Wild Shape')
    expect(result[1]?.name).toBe('Druidic Circle')
    expect(result[2]?.name).toBe('Healing Word')
  })

  it('returns empty array when features field is missing', () => {
    const raw: V1Character = { page1: {} }
    expect(adaptCharacter(raw).features).toEqual([])
  })

  it('handles extra whitespace and empty tokens', () => {
    const raw: V1Character = {
      page1: { features: ' Foo ,  Bar ,,Baz ' },
    }
    const result = adaptCharacter(raw).features
    expect(result).toHaveLength(3)
    expect(result.map((f) => f.name)).toEqual(['Foo', 'Bar', 'Baz'])
  })

  it('all parsed features default to type passive', () => {
    const raw: V1Character = {
      page1: { features: 'Wild Shape, Druidic' },
    }
    const result = adaptCharacter(raw).features
    expect(result.every((f) => f.type === 'passive')).toBe(true)
  })

  it('parsed features have unique ids', () => {
    const raw: V1Character = {
      page1: { features: 'Wild Shape, Druidic Circle, Healing Surge' },
    }
    const ids = adaptCharacter(raw).features.map((f) => f.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('returns empty array when features is an empty string', () => {
    const raw: V1Character = { page1: { features: '' } }
    expect(adaptCharacter(raw).features).toEqual([])
  })

  it('returns empty array when features is only whitespace', () => {
    const raw: V1Character = { page1: { features: '   ' } }
    expect(adaptCharacter(raw).features).toEqual([])
  })
})
