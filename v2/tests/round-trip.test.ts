/**
 * Round-trip tests: serializeCharacter(adaptCharacter(v1), v1)
 * must preserve domain data exactly.
 *
 * Primary invariant (domain):
 *   adaptCharacter(serializeCharacter(adaptCharacter(v1), v1)) ≈ adaptCharacter(v1)
 *
 * Secondary invariant (preservation):
 *   Fields not in domain (demographics, mount_pet, allies, images.symbol)
 *   are preserved verbatim from original.
 *
 * Intentional normalizations documented in each test where applicable:
 *   - Notes merged into notes_1 (notes_2 cleared)
 *   - Proficiencies weapon_profs + armor_profs merged into weapon_profs
 *   - Legacy class formats normalized to modern classes[]
 *   - Initiative normalized to "+N"/"-N" signed format
 *   - insperation normalized to "" or "true"
 */

import { describe, it, expect } from 'vitest'
import { adaptCharacter } from '@/data/adapter'
import { serializeCharacter } from '@/data/serializer'
import type { V1Character } from '@/data/schema-v1'

import fullCharFixture    from './fixtures/full-character.json'
import spellcasterFixture from './fixtures/spellcaster-character.json'

const fullChar    = fullCharFixture    as V1Character
const spellcaster = spellcasterFixture as V1Character

/* ── Helpers ────────────────────────────────────────────────────────────── */

function roundTrip(v1: V1Character) {
  const domain1 = adaptCharacter(v1)
  const serialized = serializeCharacter(domain1, v1)
  const domain2 = adaptCharacter(serialized)
  return { domain1, domain2, serialized }
}

/* ── Full character fixture (Kanaan Duskwalker — Monk 5) ──────────────── */

describe('Round-trip: full-character.json (Kanaan Duskwalker, Monk 5)', () => {
  it('preserves identity fields', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    expect(domain2.name).toBe(domain1.name)
    expect(domain2.race).toBe(domain1.race)
    expect(domain2.background).toBe(domain1.background)
    expect(domain2.alignment).toBe(domain1.alignment)
    expect(domain2.experience).toBe(domain1.experience)
    expect(domain2.totalLevel).toBe(domain1.totalLevel)
  })

  it('preserves ability scores', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    expect(domain2.abilities).toEqual(domain1.abilities)
  })

  it('preserves HP', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    expect(domain2.hp).toEqual(domain1.hp)
  })

  it('preserves AC and initiative', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    expect(domain2.ac).toBe(domain1.ac)
    expect(domain2.initiative).toBe(domain1.initiative)
  })

  it('preserves saving throw proficiencies', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    const profs1 = domain1.savingThrows.map(s => ({ ability: s.ability, proficient: s.proficient }))
    const profs2 = domain2.savingThrows.map(s => ({ ability: s.ability, proficient: s.proficient }))
    expect(profs2).toEqual(profs1)
  })

  it('preserves skill proficiencies and expertise', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    const skills1 = domain1.skills.map(s => ({ name: s.name, proficient: s.proficient, expertise: s.expertise }))
    const skills2 = domain2.skills.map(s => ({ name: s.name, proficient: s.proficient, expertise: s.expertise }))
    expect(skills2).toEqual(skills1)
  })

  it('preserves attacks', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    const att1 = domain1.attacks.map(a => ({ name: a.name, bonus: a.bonus, damage: a.damage, damageType: a.damageType, rollType: a.rollType, proficient: a.proficient }))
    const att2 = domain2.attacks.map(a => ({ name: a.name, bonus: a.bonus, damage: a.damage, damageType: a.damageType, rollType: a.rollType, proficient: a.proficient }))
    expect(att2).toEqual(att1)
  })

  it('preserves inventory names and weights', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    const inv1 = domain1.inventory.map(i => ({ name: i.name, weight: i.weight, quantity: i.quantity }))
    const inv2 = domain2.inventory.map(i => ({ name: i.name, weight: i.weight, quantity: i.quantity }))
    expect(inv2).toEqual(inv1)
  })

  it('preserves currency', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    expect(domain2.currency).toEqual(domain1.currency)
  })

  it('preserves backstory and personality', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    expect(domain2.backstory).toBe(domain1.backstory)
    expect(domain2.personality).toEqual(domain1.personality)
  })

  it('preserves notes (merged normalization)', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    // Domain notes = notes_1 + '\n\n' + notes_2 (adapter merges)
    // After serialization notes are merged into notes_1; adapter reads same combined text
    expect(domain2.notes).toBe(domain1.notes)
  })

  it('preserves death saves', () => {
    const { domain1, domain2 } = roundTrip(fullChar)
    expect(domain2.deathSaves).toEqual(domain1.deathSaves)
  })

  it('preserves allies_organizations from original (not in domain)', () => {
    const { serialized } = roundTrip(fullChar)
    expect(serialized.page4?.allies_organizations?.name).toBe('Monastério da Palma Aberta')
  })

  it('preserves mount_pet from original (not in domain)', () => {
    const { serialized } = roundTrip(fullChar)
    expect(serialized.page2?.mount_pet).toEqual({})
  })

  it('normalizes notes_1/notes_2 into notes_1', () => {
    const { serialized } = roundTrip(fullChar)
    const merged = [
      (fullChar.page5?.notes_1 ?? '').trim(),
      (fullChar.page5?.notes_2 ?? '').trim(),
    ].filter(Boolean).join('\n\n')
    expect(serialized.page5?.notes_1).toBe(merged)
    expect(serialized.page5?.notes_2).toBe('')
  })

  it('writes classes in modern format only', () => {
    const { serialized } = roundTrip(fullChar)
    expect(serialized.page1?.basic_info?.classes).toBeDefined()
    expect(Array.isArray(serialized.page1?.basic_info?.classes)).toBe(true)
    // Legacy fields should not be present
    expect((serialized.page1?.basic_info as Record<string, unknown>)['char_class']).toBeUndefined()
    expect((serialized.page1?.basic_info as Record<string, unknown>)['level']).toBeUndefined()
  })
})

/* ── Spellcaster fixture (Kael Brightweave — Bard 5) ─────────────────── */

describe('Round-trip: spellcaster-character.json (Kael Brightweave, Bard 5)', () => {
  it('preserves identity', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    expect(domain2.name).toBe(domain1.name)
    expect(domain2.race).toBe(domain1.race)
    expect(domain2.classes).toEqual(domain1.classes)
  })

  it('preserves abilities', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    expect(domain2.abilities).toEqual(domain1.abilities)
  })

  it('preserves spell ability', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    expect(domain2.spells?.ability).toBe(domain1.spells?.ability)
  })

  it('preserves spell slots (max)', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    const slots1 = domain1.spells?.slots.map(s => ({ level: s.level, max: s.max })) ?? []
    const slots2 = domain2.spells?.slots.map(s => ({ level: s.level, max: s.max })) ?? []
    expect(slots2).toEqual(slots1)
  })

  it('preserves known spells and prepared flags', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    const known1 = domain1.spells?.known.map(s => ({ level: s.level, name: s.name, prepared: s.prepared })) ?? []
    const known2 = domain2.spells?.known.map(s => ({ level: s.level, name: s.name, prepared: s.prepared })) ?? []
    expect(known2).toEqual(known1)
  })

  it('preserves DC attack with rollType detection', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    const dcAtk1 = domain1.attacks.find(a => a.rollType === 'dc')
    const dcAtk2 = domain2.attacks.find(a => a.rollType === 'dc')
    expect(dcAtk2?.name).toBe(dcAtk1?.name)
    expect(dcAtk2?.rollType).toBe('dc')
  })

  it('preserves expertise flags through cycle', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    const perf1 = domain1.skills.find(s => s.name === 'Performance')!
    const perf2 = domain2.skills.find(s => s.name === 'Performance')!
    expect(perf2.expertise).toBe(true)
    expect(perf2.expertise).toBe(perf1.expertise)
  })

  it('preserves partial death saves (Kael has 1 success, 1 failure)', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    expect(domain2.deathSaves).toEqual(domain1.deathSaves)
    expect(domain2.deathSaves.successes).toBe(1)
    expect(domain2.deathSaves.failures).toBe(1)
  })

  it('preserves HP including temp (Kael has 5 temp HP)', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    expect(domain2.hp).toEqual(domain1.hp)
    expect(domain2.hp.temp).toBe(5)
  })

  it('preserves hit dice current (Kael has 3/5)', () => {
    const { domain1, domain2 } = roundTrip(spellcaster)
    expect(domain2.hitDice[0]?.current).toBe(domain1.hitDice[0]?.current)
    expect(domain2.hitDice[0]?.max).toBe(domain1.hitDice[0]?.max)
  })
})

/* ── Legacy single-class format ─────────────────────────────────────────── */

describe('Round-trip: legacy single-class format (char_class + level)', () => {
  it('normalises legacy single-class format to modern classes[]', () => {
    const v1: V1Character = {
      id: 'char_legacy_1',
      updatedAt: 1700000000000,
      page1: {
        basic_info: {
          char_name: 'Thorn',
          char_class: 'Rogue',
          level: '4',
          // No classes array
        },
        character_info: { race_class: 'Halfling', background: 'Criminal', exp: '2700' },
        top_bar: { ac: '14', initiative: '+3', speed: '25', insperation: '' },
        attributes: {
          str: '8',  str_mod: '-1',
          dex: '16', dex_mod: '+3',
          con: '12', con_mod: '+1',
          int: '14', int_mod: '+2',
          wis: '10', wis_mod: '+0',
          cha: '12', cha_mod: '+1',
        },
        saves_skills: {
          spell_casting: '',
          saves: {
            str_save: { val: '-1', prof: false }, dex_save: { val: '+5', prof: true  },
            con_save: { val: '+1', prof: false }, int_save: { val: '+2', prof: false },
            wis_save: { val: '+0', prof: false }, cha_save: { val: '+1', prof: false },
          },
          skills: {
            acrobatics:      { val: '+5', prof: true,  expr: false },
            animal_handling: { val: '+0', prof: false, expr: false },
            arcana:          { val: '+2', prof: false, expr: false },
            athletics:       { val: '-1', prof: false, expr: false },
            deception:       { val: '+3', prof: true,  expr: false },
            history:         { val: '+2', prof: false, expr: false },
            insight:         { val: '+0', prof: false, expr: false },
            intimidation:    { val: '+1', prof: false, expr: false },
            investigation:   { val: '+4', prof: true,  expr: false },
            medicine:        { val: '+0', prof: false, expr: false },
            nature:          { val: '+2', prof: false, expr: false },
            perception:      { val: '+2', prof: true,  expr: false },
            performance:     { val: '+1', prof: false, expr: false },
            persuasion:      { val: '+1', prof: false, expr: false },
            religion:        { val: '+2', prof: false, expr: false },
            sleight_of_hand: { val: '+5', prof: true,  expr: false },
            stealth:         { val: '+5', prof: true,  expr: false },
            survival:        { val: '+0', prof: false, expr: false },
          },
        },
        status: {
          current_health: '28', max_health: '28', temp_health: '',
          hit_dice: { current_hd: '4', max_hd: '4', hd_die: '8' },
          death_saves: {
            success_1: false, success_2: false, success_3: false,
            fail_1: false, fail_2: false, fail_3: false,
          },
        },
        proficiencies: {
          weapon_profs: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
          armor_profs: 'Light armor',
          tool_profs: "Thieves' tools",
          language_profs: 'Common, Halfling',
          other_profs: '',
        },
        attacks_spells: [],
        features: 'Sneak Attack,Cunning Action,Thieves Cant',
      },
      page2: {
        equipment: {
          val: { col_1: [{ name: 'Shortsword', weight: '2' }], col_2: [] },
          currency: { cp: '0', sp: '15', ep: '0', gp: '5', pp: '0' },
        },
      },
      page3: { spells: { cantrips: { spells: [] } } },
      page4: { backstory: "Grew up on the streets.", personality: { personality_traits: 'Always careful.', ideals: 'Freedom.', bonds: 'My crew.', flaws: 'Too cautious.' } },
      page5: { notes_1: '', notes_2: '' },
      images: { character: '', symbol: '' },
    }

    const domain1 = adaptCharacter(v1)
    expect(domain1.classes[0]?.name).toBe('Rogue')
    expect(domain1.classes[0]?.level).toBe(4)

    const serialized = serializeCharacter(domain1, v1)
    // Legacy fields should be gone
    expect((serialized.page1?.basic_info as Record<string, unknown>)['char_class']).toBeUndefined()
    expect((serialized.page1?.basic_info as Record<string, unknown>)['level']).toBeUndefined()
    // Modern format present
    expect(serialized.page1?.basic_info?.classes).toEqual([{ name: 'Rogue', level: '4' }])

    const domain2 = adaptCharacter(serialized)
    expect(domain2.classes[0]?.name).toBe('Rogue')
    expect(domain2.classes[0]?.level).toBe(4)
    expect(domain2.totalLevel).toBe(4)
    expect(domain2.features.map(f => f.name)).toEqual(['Sneak Attack', 'Cunning Action', 'Thieves Cant'])
  })
})

/* ── Legacy combined weapon_armor format ────────────────────────────────── */

describe('Round-trip: legacy weapon_armor combined proficiency format', () => {
  it('normalises weapon_armor to weapon_profs and preserves domain data', () => {
    const v1: V1Character = {
      id: 'char_legacy_profs',
      updatedAt: 1700000000000,
      page1: {
        basic_info: { char_name: 'Brom', classes: [{ name: 'Barbarian', level: '3' }] },
        character_info: { race_class: 'Human', background: 'Outlander' },
        top_bar: { ac: '15', speed: '30', insperation: '' },
        attributes: { str: '18', dex: '14', con: '16', int: '8', wis: '12', cha: '10' },
        saves_skills: { saves: {}, skills: {} },
        status: { current_health: '36', max_health: '36', temp_health: '', hit_dice: { current_hd: '3', max_hd: '3', hd_die: '12' }, death_saves: { success_1: false, success_2: false, success_3: false, fail_1: false, fail_2: false, fail_3: false } },
        proficiencies: { weapon_armor: 'All weapons and armor' },
        attacks_spells: [],
        features: '',
      },
      page2: { equipment: { val: { col_1: [], col_2: [] }, currency: {} } },
      page3: {},
      page4: { backstory: '', personality: {} },
      page5: { notes_1: '', notes_2: '' },
      images: {},
    }

    const { domain1, domain2 } = roundTrip(v1)
    expect(domain2.proficiencies.weaponsAndArmor).toBe(domain1.proficiencies.weaponsAndArmor)
    expect(domain2.proficiencies.weaponsAndArmor).toBe('All weapons and armor')
  })
})
