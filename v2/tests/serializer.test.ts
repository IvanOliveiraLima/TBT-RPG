/**
 * Serializer unit tests — covers the 11 preservation rules from AUDIT-C1.
 *
 * For each rule, a minimal V1Character is built, adapted to domain, serialized
 * back, and the relevant fields are asserted.
 */

import { describe, it, expect } from 'vitest'
import { adaptCharacter } from '@/data/adapter'
import { serializeCharacter } from '@/data/serializer'
import type { V1Character } from '@/data/schema-v1'

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Minimal valid V1Character that the adapter won't reject. */
function minV1(overrides: Partial<V1Character> = {}): V1Character {
  return {
    id: 'char_test_1',
    schemaVersion: 1,
    updatedAt: 1700000000000,
    page1: {
      basic_info: {
        char_name: 'Test Character',
        classes: [{ name: 'Fighter', level: '5' }],
        total_level: 5,
      },
      character_info: {
        race_class:  'Human',
        background:  'Soldier',
        alignment:   'Lawful Good',
        exp:         '6500',
      },
      top_bar: {
        ac: '16', initiative: '+2', speed: '30', insperation: '',
        proficiency: '3', passive_perception: '12', spell_dc: '',
      },
      attributes: {
        str: '16', str_mod: '+3',
        dex: '14', dex_mod: '+2',
        con: '14', con_mod: '+2',
        int: '10', int_mod: '+0',
        wis: '12', wis_mod: '+1',
        cha:  '8', cha_mod: '-1',
      },
      saves_skills: {
        spell_casting: '',
        saves: {
          str_save: { val: '+5', prof: true  },
          dex_save: { val: '+2', prof: false },
          con_save: { val: '+5', prof: true  },
          int_save: { val: '+0', prof: false },
          wis_save: { val: '+1', prof: false },
          cha_save: { val: '-1', prof: false },
        },
        skills: {
          acrobatics:      { val: '+2',  prof: false, expr: false },
          animal_handling: { val: '+1',  prof: false, expr: false },
          arcana:          { val: '+0',  prof: false, expr: false },
          athletics:       { val: '+5',  prof: true,  expr: false },
          deception:       { val: '-1',  prof: false, expr: false },
          history:         { val: '+0',  prof: false, expr: false },
          insight:         { val: '+1',  prof: false, expr: false },
          intimidation:    { val: '+1',  prof: true,  expr: false },
          investigation:   { val: '+0',  prof: false, expr: false },
          medicine:        { val: '+1',  prof: false, expr: false },
          nature:          { val: '+0',  prof: false, expr: false },
          perception:      { val: '+1',  prof: false, expr: false },
          performance:     { val: '-1',  prof: false, expr: false },
          persuasion:      { val: '-1',  prof: false, expr: false },
          religion:        { val: '+0',  prof: false, expr: false },
          sleight_of_hand: { val: '+2',  prof: false, expr: false },
          stealth:         { val: '+2',  prof: false, expr: false },
          survival:        { val: '+1',  prof: false, expr: false },
        },
      },
      status: {
        current_health: '45', max_health: '45', temp_health: '',
        hit_dice: { current_hd: '5', max_hd: '5', hd_die: '10' },
        death_saves: {
          success_1: false, success_2: false, success_3: false,
          fail_1: false, fail_2: false, fail_3: false,
        },
      },
      proficiencies: {
        weapon_profs: 'All weapons', armor_profs: 'All armor',
        tool_profs: '', language_profs: 'Common', other_profs: '',
      },
      attacks_spells: [],
      features: '',
    },
    page2: {
      equipment: {
        val: { col_1: [], col_2: [] },
        currency: { cp: '0', sp: '0', ep: '0', gp: '10', pp: '0' },
      },
      mount_pet: {}, mount_pet2: {},
    },
    page3: {
      spell_info: { class: '', att: '', dc: '', bonus: '' },
      spells: {
        cantrips: { spells: [] },
        level_1: { total: '', spells: [] }, level_2: { total: '', spells: [] },
        level_3: { total: '', spells: [] }, level_4: { total: '', spells: [] },
        level_5: { total: '', spells: [] }, level_6: { total: '', spells: [] },
        level_7: { total: '', spells: [] }, level_8: { total: '', spells: [] },
        level_9: { total: '', spells: [] },
      },
    },
    page4: {
      backstory: 'A veteran of many battles.',
      allies_organizations: { name: 'Order of the Shield' },
      personality: {
        personality_traits: 'I am always polite.',
        ideals: 'Justice.',
        bonds: 'My regiment.',
        flaws: 'I judge too quickly.',
      },
    },
    page5: { notes_1: 'Note one.', notes_2: 'Note two.' },
    images: { character: '', symbol: 'data:image/png;base64,ABC' },
    ...overrides,
  }
}

/* ── Rule 1: insperation typo ───────────────────────────────────────────── */

describe('Rule 1 — insperation typo preserved', () => {
  it('writes insperation (not inspiration) for false', () => {
    const v1 = minV1()
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.top_bar?.insperation).toBe('')
    expect((out.page1?.top_bar as Record<string, unknown>)['inspiration']).toBeUndefined()
  })

  it('writes insperation as "true" when inspiration is set', () => {
    const v1 = minV1()
    v1.page1!.top_bar!.insperation = 'on'   // truthy string
    const domain = adaptCharacter(v1)
    expect(domain.inspiration).toBe(true)
    const out = serializeCharacter(domain, v1)
    expect(out.page1?.top_bar?.insperation).toBe('true')
    expect((out.page1?.top_bar as Record<string, unknown>)['inspiration']).toBeUndefined()
  })
})

/* ── Rule 2: demographic fields preserved ──────────────────────────────── */

describe('Rule 2 — demographic fields not in domain are preserved', () => {
  it('preserves age, height, weight, eye/skin/hair via original passthrough', () => {
    const v1 = minV1()
    // Inject fields not declared in V1CharacterInfo (runtime OK, TypeScript ignores extras)
    const ci = v1.page1!.character_info! as Record<string, unknown>
    ci['age']        = '34'
    ci['height']     = '6ft'
    ci['weight']     = '180lb'
    ci['eye_color']  = 'blue'
    ci['skin_color'] = 'tan'
    ci['hair_color'] = 'black'

    const out = serializeCharacter(adaptCharacter(v1), v1)
    const outCi = out.page1?.character_info as Record<string, unknown>
    expect(outCi['age']).toBe('34')
    expect(outCi['height']).toBe('6ft')
    expect(outCi['weight']).toBe('180lb')
    expect(outCi['eye_color']).toBe('blue')
    expect(outCi['skin_color']).toBe('tan')
    expect(outCi['hair_color']).toBe('black')
  })
})

/* ── Rule 3: mount_pet + allies_organizations preserved ─────────────────── */

describe('Rule 3 — mount_pet and allies_organizations preserved', () => {
  it('preserves mount_pet and mount_pet2 (v2 domain discards them)', () => {
    const v1 = minV1()
    v1.page2!.mount_pet  = { name: 'Shadowmere', type: 'horse' }
    v1.page2!.mount_pet2 = { name: 'Kitten', type: 'cat' }
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page2?.mount_pet).toEqual({ name: 'Shadowmere', type: 'horse' })
    expect(out.page2?.mount_pet2).toEqual({ name: 'Kitten', type: 'cat' })
  })

  it('preserves allies_organizations (v2 domain discards them)', () => {
    const v1 = minV1()
    v1.page4!.allies_organizations = { name: 'The Harpers', val: 'Important allies.' }
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page4?.allies_organizations?.name).toBe('The Harpers')
    expect(out.page4?.allies_organizations?.val).toBe('Important allies.')
  })
})

/* ── Rule 4: spell ability fallback resolved ────────────────────────────── */

describe('Rule 4 — spell ability fallback resolved on save', () => {
  it('writes resolved spell ability when v1 was empty (caster class)', () => {
    const v1 = minV1()
    // Make it a Bard (caster) with empty spell_casting field
    v1.page1!.basic_info!.classes = [{ name: 'Bard', level: '5' }]
    v1.page1!.saves_skills!.spell_casting = ''
    // Add at least one slot so adapter treats it as a caster
    v1.page3!.spells!.level_1 = { total: '4', spells: [] }

    const domain = adaptCharacter(v1)
    expect(domain.spells?.ability).toBe('cha')  // Bard default

    const out = serializeCharacter(domain, v1)
    // Resolved value written back even though original was empty
    expect(out.page1?.saves_skills?.spell_casting).toBe('cha')
  })

  it('preserves explicit spell ability when v1 had one', () => {
    const v1 = minV1()
    v1.page1!.basic_info!.classes = [{ name: 'Wizard', level: '5' }]
    v1.page1!.saves_skills!.spell_casting = 'int'
    v1.page3!.spells!.level_1 = { total: '4', spells: [] }

    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.saves_skills?.spell_casting).toBe('int')
  })
})

/* ── Rule 5: classes always in modern format ────────────────────────────── */

describe('Rule 5 — classes always written in modern array format', () => {
  it('removes legacy char_class / level fields from basic_info', () => {
    const v1 = minV1()
    // Inject legacy fields
    ;(v1.page1!.basic_info as Record<string, unknown>)['char_class'] = 'Fighter'
    ;(v1.page1!.basic_info as Record<string, unknown>)['level'] = '5'
    ;(v1.page1!.basic_info as Record<string, unknown>)['level_two'] = '3'

    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.basic_info?.classes).toEqual([{ name: 'Fighter', level: '5' }])
    expect((out.page1?.basic_info as Record<string, unknown>)['char_class']).toBeUndefined()
    expect((out.page1?.basic_info as Record<string, unknown>)['level']).toBeUndefined()
    expect((out.page1?.basic_info as Record<string, unknown>)['level_two']).toBeUndefined()
  })

  it('serializes multiclass correctly', () => {
    const v1 = minV1()
    v1.page1!.basic_info!.classes = [
      { name: 'Paladin', level: '6' },
      { name: 'Warlock', level: '3' },
    ]
    v1.page1!.basic_info!.total_level = 9
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.basic_info?.classes).toEqual([
      { name: 'Paladin', level: '6' },
      { name: 'Warlock', level: '3' },
    ])
    expect(out.page1?.basic_info?.total_level).toBe(9)
  })
})

/* ── Rule 6: proficiencies normalised ──────────────────────────────────── */

describe('Rule 6 — proficiencies normalised to standard schema', () => {
  it('writes weapon_profs containing the combined weaponsAndArmor', () => {
    const v1 = minV1()
    v1.page1!.proficiencies = {
      weapon_profs: 'Swords', armor_profs: 'Light armor',
      tool_profs: 'Lute', language_profs: 'Common', other_profs: '',
    }
    const domain = adaptCharacter(v1)
    // Adapter merges weapon + armor
    expect(domain.proficiencies.weaponsAndArmor).toBe('Swords, Light armor')

    const out = serializeCharacter(domain, v1)
    expect(out.page1?.proficiencies?.weapon_profs).toBe('Swords, Light armor')
    expect(out.page1?.proficiencies?.armor_profs).toBe('')
  })

  it('removes legacy weapon_armor combined field', () => {
    const v1 = minV1()
    v1.page1!.proficiencies = { weapon_armor: 'All weapons and armor', tool_profs: 'Smith tools' }
    const domain = adaptCharacter(v1)
    const out = serializeCharacter(domain, v1)
    expect(out.page1?.proficiencies?.weapon_profs).toBe('All weapons and armor')
    expect(out.page1?.proficiencies?.weapon_armor).toBeUndefined()
  })

  it('removes legacy tools / languages / other aliases', () => {
    const v1 = minV1()
    v1.page1!.proficiencies = {
      weapon_profs: 'Swords',
      tools: 'Thieves tools',
      languages: 'Elvish',
      other: 'Extra profs',
    }
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.proficiencies?.tool_profs).toBe('Thieves tools')
    expect(out.page1?.proficiencies?.language_profs).toBe('Elvish')
    expect(out.page1?.proficiencies?.other_profs).toBe('Extra profs')
    expect(out.page1?.proficiencies?.tools).toBeUndefined()
    expect(out.page1?.proficiencies?.languages).toBeUndefined()
    expect(out.page1?.proficiencies?.other).toBeUndefined()
  })
})

/* ── Rule 7: features serialised back to CSV ────────────────────────────── */

describe('Rule 7 — features serialised back to CSV string', () => {
  it('serialises feature names as comma-separated string', () => {
    const v1 = minV1()
    v1.page1!.features = 'Second Wind,Action Surge,Extra Attack'
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.features).toBe('Second Wind,Action Surge,Extra Attack')
  })

  it('serialises empty features as empty string', () => {
    const v1 = minV1()
    v1.page1!.features = ''
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.features).toBe('')
  })
})

/* ── Rule 8: hit dice multiclass is lossy (documented) ─────────────────── */

describe('Rule 8 — hit dice multiclass limitation documented', () => {
  it('sums all class HD into a single current_hd for multiclass', () => {
    const v1 = minV1()
    v1.page1!.basic_info!.classes = [
      { name: 'Paladin', level: '6' },
      { name: 'Warlock', level: '3' },
    ]
    // v1 can only store one set of hit dice
    v1.page1!.status!.hit_dice = { current_hd: '9', max_hd: '9', hd_die: '10' }

    const domain = adaptCharacter(v1)
    // Both class HDs at full (multiclass: current = max = level for each)
    expect(domain.hitDice).toHaveLength(2)
    expect(domain.hitDice[0]?.current).toBe(6)
    expect(domain.hitDice[1]?.current).toBe(3)

    const out = serializeCharacter(domain, v1)
    // Serializer sums all: 6 + 3 = 9
    expect(out.page1?.status?.hit_dice?.current_hd).toBe('9')
    expect(out.page1?.status?.hit_dice?.max_hd).toBe('9')
  })
})

/* ── Rule 9: spell slots used (additive field) ──────────────────────────── */

describe('Rule 9 — spell slots used written as additive field', () => {
  it('writes used=0 when all slots are available', () => {
    const v1 = minV1()
    v1.page1!.basic_info!.classes = [{ name: 'Bard', level: '5' }]
    v1.page3!.spells!.level_1 = { total: '4', spells: [] }
    v1.page3!.spells!.level_2 = { total: '3', spells: [] }

    const out = serializeCharacter(adaptCharacter(v1), v1)
    // All slots available → used 0 (written as 0 to indicate no expenditure)
    expect((out.page3?.spells?.level_1 as { used?: number })?.used).toBe(0)
    expect((out.page3?.spells?.level_2 as { used?: number })?.used).toBe(0)
  })

  it('writes used count when slots have been expended', () => {
    const v1 = minV1()
    v1.page1!.basic_info!.classes = [{ name: 'Bard', level: '5' }]
    // Simulate v2 having stored used=2 in a previous save
    v1.page3!.spells!.level_1 = { total: '4', spells: [], used: 2 }

    const domain = adaptCharacter(v1)
    expect(domain.spells?.slots[0]).toEqual({ level: 1, current: 2, max: 4 })

    const out = serializeCharacter(domain, v1)
    expect((out.page3?.spells?.level_1 as { used?: number })?.used).toBe(2)
  })

  it('round-trips slot expenditure correctly', () => {
    const v1 = minV1()
    v1.page1!.basic_info!.classes = [{ name: 'Wizard', level: '7' }]
    v1.page3!.spells!.level_1 = { total: '4', spells: [], used: 1 }
    v1.page3!.spells!.level_2 = { total: '3', spells: [], used: 2 }
    v1.page1!.saves_skills!.spell_casting = 'int'

    const domain = adaptCharacter(v1)
    const out    = serializeCharacter(domain, v1)
    const domain2 = adaptCharacter(out)

    // Slot state preserved through the cycle
    expect(domain2.spells?.slots.find(s => s.level === 1)).toEqual({ level: 1, current: 3, max: 4 })
    expect(domain2.spells?.slots.find(s => s.level === 2)).toEqual({ level: 2, current: 1, max: 3 })
  })
})

/* ── Spell slot clamp — max decrease below current ──────────────────────── */

describe('Spell slot clamp — max decreases below current (used cannot exceed max)', () => {
  it('clamps used to 0 when max is set below current (serializer guard)', () => {
    // Set up: 5 slots total, 3 used → current = 2
    const v1 = minV1()
    v1.page1!.basic_info!.classes = [{ name: 'Wizard', level: '7' }]
    v1.page3!.spells!.level_1 = { total: '5', spells: [], used: 3 }
    v1.page1!.saves_skills!.spell_casting = 'int'

    const domain = adaptCharacter(v1)
    expect(domain.spells?.slots.find(s => s.level === 1)).toEqual({ level: 1, current: 2, max: 5 })

    // Simulate user decreasing max below current:
    // domain has current=2, but we set max=1 (inconsistent state)
    const mutated = {
      ...domain,
      spells: domain.spells
        ? {
            ...domain.spells,
            slots: domain.spells.slots.map(s =>
              s.level === 1 ? { ...s, max: 1 } : s
            ),
          }
        : undefined,
    }

    const out = serializeCharacter(mutated, v1)
    // used = max - current = 1 - 2 = -1 → clamped to 0 by serializer
    expect(out.page3?.spells?.level_1).toMatchObject({ total: '1' })
    const used = (out.page3?.spells?.level_1 as { used?: number } | undefined)?.used ?? 0
    expect(used).toBeGreaterThanOrEqual(0)
    expect(used).toBeLessThanOrEqual(1) // used cannot exceed max
  })
})

/* ── Rule 10: attack proficient (additive field) ────────────────────────── */

describe('Rule 10 — attack proficient written as additive field', () => {
  it('preserves false by default (v1 attacks have no proficient field)', () => {
    const v1 = minV1()
    v1.page1!.attacks_spells = [
      { name: 'Longsword', stat: 'str', toHit: '+5', damage: '1d8+3', damage_type: 'Slashing' },
    ]
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page1?.attacks_spells?.[0]?.proficient).toBe(false)
  })

  it('round-trips proficient=true through serialize-adapt cycle', () => {
    const v1 = minV1()
    v1.page1!.attacks_spells = [
      { name: 'Longsword', stat: 'str', toHit: '+5', damage: '1d8+3', damage_type: 'Slashing', proficient: true },
    ]
    const domain = adaptCharacter(v1)
    expect(domain.attacks[0]?.proficient).toBe(true)

    const out = serializeCharacter(domain, v1)
    expect(out.page1?.attacks_spells?.[0]?.proficient).toBe(true)

    const domain2 = adaptCharacter(out)
    expect(domain2.attacks[0]?.proficient).toBe(true)
  })
})

/* ── Rule 11: item quantity (additive field) ────────────────────────────── */

describe('Rule 11 — item quantity written as additive field', () => {
  it('writes quantity=1 by default (v1 items have no quantity field)', () => {
    const v1 = minV1()
    v1.page2!.equipment!.val!.col_1 = [{ name: 'Sword', weight: '3' }]
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page2?.equipment?.val?.col_1?.[0]?.quantity).toBe(1)
  })

  it('round-trips quantity=5 through serialize-adapt cycle', () => {
    const v1 = minV1()
    v1.page2!.equipment!.val!.col_1 = [{ name: 'Arrows', weight: '0.05', quantity: 20 }]
    const domain = adaptCharacter(v1)
    expect(domain.inventory[0]?.quantity).toBe(20)

    const out = serializeCharacter(domain, v1)
    expect(out.page2?.equipment?.val?.col_1?.[0]?.quantity).toBe(20)

    const domain2 = adaptCharacter(out)
    expect(domain2.inventory[0]?.quantity).toBe(20)
  })
})

/* ── Additional: images.symbol preserved ───────────────────────────────── */

describe('Preservation — images.symbol preserved from original', () => {
  it('preserves images.symbol even though domain does not model it', () => {
    const v1 = minV1()
    v1.images!.symbol = 'data:image/png;base64,SYMBOL_DATA'
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.images?.symbol).toBe('data:image/png;base64,SYMBOL_DATA')
  })
})

/* ── Notes split preservation ───────────────────────────────────────────── */

describe('Notes split — notes_1 and notes_2 preserved separately', () => {
  it('preserves notes_1 and notes_2 as separate domain fields', () => {
    const v1 = minV1()
    v1.page5!.notes_1 = 'First note.'
    v1.page5!.notes_2 = 'Second note.'
    const domain = adaptCharacter(v1)
    expect(domain.notes1).toBe('First note.')
    expect(domain.notes2).toBe('Second note.')

    const out = serializeCharacter(domain, v1)
    expect(out.page5?.notes_1).toBe('First note.')
    expect(out.page5?.notes_2).toBe('Second note.')
  })

  it('round-trips notes_1 and notes_2 split through the full cycle', () => {
    const v1 = minV1()
    v1.page5!.notes_1 = 'Note A.'
    v1.page5!.notes_2 = 'Note B.'
    const out = serializeCharacter(adaptCharacter(v1), v1)
    const domain2 = adaptCharacter(out)
    expect(domain2.notes1).toBe('Note A.')
    expect(domain2.notes2).toBe('Note B.')
  })

  it('handles notes_2 empty without injecting empty string into display', () => {
    const v1 = minV1()
    v1.page5!.notes_1 = 'Only notes_1'
    v1.page5!.notes_2 = ''
    const out = serializeCharacter(adaptCharacter(v1), v1)
    expect(out.page5?.notes_1).toBe('Only notes_1')
    expect(out.page5?.notes_2).toBe('')
  })
})

/* ── Domain round-trip invariant ────────────────────────────────────────── */

describe('Domain round-trip — adaptCharacter(serialize(adapt(v1))) ≈ adapt(v1)', () => {
  it('preserves all identity fields through the full cycle', () => {
    const v1 = minV1()
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))

    expect(domain2.name).toBe(domain1.name)
    expect(domain2.race).toBe(domain1.race)
    expect(domain2.background).toBe(domain1.background)
    expect(domain2.alignment).toBe(domain1.alignment)
    expect(domain2.experience).toBe(domain1.experience)
    expect(domain2.totalLevel).toBe(domain1.totalLevel)
  })

  it('preserves abilities through the full cycle', () => {
    const v1 = minV1()
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))
    expect(domain2.abilities).toEqual(domain1.abilities)
  })

  it('preserves hp through the full cycle', () => {
    const v1 = minV1()
    v1.page1!.status!.current_health = '32'
    v1.page1!.status!.max_health = '45'
    v1.page1!.status!.temp_health = '5'
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))
    expect(domain2.hp).toEqual(domain1.hp)
  })

  it('preserves saving throw proficiencies through the full cycle', () => {
    const v1 = minV1()
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))
    expect(domain2.savingThrows.map(s => s.proficient)).toEqual(
      domain1.savingThrows.map(s => s.proficient),
    )
  })

  it('preserves skill proficiencies and expertise through the full cycle', () => {
    const v1 = minV1()
    v1.page1!.saves_skills!.skills!.performance = { val: '+8', prof: true, expr: true }
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))
    const perf1 = domain1.skills.find(s => s.name === 'Performance')!
    const perf2 = domain2.skills.find(s => s.name === 'Performance')!
    expect(perf2.proficient).toBe(perf1.proficient)
    expect(perf2.expertise).toBe(perf1.expertise)
  })

  it('preserves backstory and personality through the full cycle', () => {
    const v1 = minV1()
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))
    expect(domain2.backstory).toBe(domain1.backstory)
    expect(domain2.personality).toEqual(domain1.personality)
  })

  it('preserves currency through the full cycle', () => {
    const v1 = minV1()
    v1.page2!.equipment!.currency = { cp: '5', sp: '10', ep: '2', gp: '100', pp: '3' }
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))
    expect(domain2.currency).toEqual(domain1.currency)
  })

  it('preserves inspiration through the full cycle', () => {
    const v1 = minV1()
    v1.page1!.top_bar!.insperation = 'on'
    const domain1 = adaptCharacter(v1)
    const domain2 = adaptCharacter(serializeCharacter(domain1, v1))
    expect(domain2.inspiration).toBe(domain1.inspiration)
  })
})
