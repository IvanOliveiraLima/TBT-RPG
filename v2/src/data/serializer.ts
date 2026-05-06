/**
 * Serializer: Character (domain model) → V1Character (raw IndexedDB schema).
 *
 * This is the inverse of the adapter in adapter.ts.
 * It is the single permitted entry point for domain → v1 conversion.
 *
 * Design principles:
 *  1. Deep-clone original as base — never construct from scratch.
 *     Fields not modeled in the domain (demographics, mount_pet, allies, etc.)
 *     are preserved automatically from the original.
 *  2. Domain values are overlaid on the clone. Only fields that Character
 *     owns are updated; everything else remains from original.
 *  3. Additive v2 fields (proficient on attacks, quantity on items, used on
 *     spell slots) are written even though v1 ignores them.
 *  4. Legacy format normalisations are intentional and documented:
 *     - Classes always written in modern format (classes[]).
 *       Legacy char_class/level/level_two fields are removed.
 *     - Proficiencies normalised to standard schema (weapon_profs + armor_profs
 *       separate). Legacy weapon_armor combined field is removed.
 *     - Notes preserved with split intact: notes_1 ↔ notes1, notes_2 ↔ notes2.
 *       The v2 domain holds both fields separately and round-trips them faithfully.
 *     - insperation typo preserved (v1 HTML input named "insperation").
 *     - Initiative normalised to signed string (e.g. "+3", "-1", "+0").
 *
 * Round-trip invariant (domain):
 *   adaptCharacter(serializeCharacter(adaptCharacter(v1), v1)) ≈ adaptCharacter(v1)
 *   (domain data survives a full cycle without loss)
 *
 * Known limitations:
 *   - Multiclass hit dice are lossy: v1 has a single current_hd field.
 *     v2 sums all class HD into it; per-class current is lost on save.
 *   - Feature descriptions created in v2 are not preserved in v1 (CSV format
 *     has no description field).
 *   - Inspiration stored as "" (false) or "true" (true) — v1 stored various
 *     truthy strings; the serialiser normalises to this canonical pair.
 *   - Inventory column layout: v1 splits items between col_1 and col_2 (purely
 *     for display). The v2 domain holds a flat list. On save, all items go to
 *     col_1 and col_2 is cleared. To be revisited in C.1.f if column semantics
 *     turn out to matter for some users.
 *   - The insperation typo in page1.top_bar.insperation is structural (the v1
 *     HTML form uses name="insperation"). The v2 serializer must write to that
 *     exact path; correcting the spelling would silently break v1 read.
 */

import type {
  V1Character,
  V1Saves,
  V1Skills,
  V1SpellLevelBlock,
} from './schema-v1'
import type {
  Character,
  AbilityKey,
} from '@/domain/character'
import {
  abilityModifier,
  formatSigned,
} from '@/domain/calculations'

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Format ability modifier as v1 stores it (e.g. "+3", "-1"). */
function fmtMod(score: number): string {
  return formatSigned(abilityModifier(score))
}

/* ── Serialiser ────────────────────────────────────────────────────────────── */

/**
 * Converts the domain Character back to a V1Character (raw v1 IndexedDB schema).
 *
 * @param character - The (possibly edited) domain model.
 * @param original  - The raw V1Character read from IndexedDB before any edits.
 *                    Used as the base to preserve fields not modeled in domain.
 */
export function serializeCharacter(
  character: Character,
  original: V1Character,
): V1Character {
  // Strategy: deep-clone original, then overlay domain values.
  // Anything v2 doesn't model stays untouched from original.
  const out = structuredClone(original)

  // ── Page 1 ────────────────────────────────────────────────────────────────

  out.page1 ??= {}

  // Identity — basic_info
  // Use spread to exclude legacy single-class fields (char_class / level / level_two).
  const { char_class: _cc, level: _lv, level_two: _l2, ...restBi } = out.page1.basic_info ?? {}
  void _cc; void _lv; void _l2  // satisfy noUnusedLocals
  out.page1.basic_info = {
    ...restBi,
    char_name:   character.name,
    classes:     character.classes.map(c => ({ name: c.name, level: String(c.level) })),
    total_level: character.totalLevel,
  }

  // Identity — character_info
  // player_name is preserved from original (v2 doesn't model it).
  out.page1.character_info = {
    ...out.page1.character_info,
    race_class:  character.race,
    background:  character.background,
    alignment:   character.alignment,
    exp:         String(character.experience),
  }

  // top_bar — combat strip + derived display values
  out.page1.top_bar = {
    ...out.page1.top_bar,
    ac:                 String(character.ac),
    // v1 stores initiative as a signed string; normalise to "+N" / "-N" / "+0"
    initiative:         formatSigned(character.initiative),
    speed:              String(character.speed),
    // insperation: v1 typo preserved. false → "", true → "true"
    insperation:        character.inspiration ? 'true' : '',
    // Derived display fields that v1 renders from stored values
    proficiency:        String(character.proficiencyBonus),
    passive_perception: String(character.passivePerception),
    spell_dc:           character.spells ? String(character.spells.saveDC) : '',
  }

  // Ability scores + modifier strings
  out.page1.attributes = {
    ...out.page1.attributes,
    str:     String(character.abilities.str),
    str_mod: fmtMod(character.abilities.str),
    dex:     String(character.abilities.dex),
    dex_mod: fmtMod(character.abilities.dex),
    con:     String(character.abilities.con),
    con_mod: fmtMod(character.abilities.con),
    int:     String(character.abilities.int),
    int_mod: fmtMod(character.abilities.int),
    wis:     String(character.abilities.wis),
    wis_mod: fmtMod(character.abilities.wis),
    cha:     String(character.abilities.cha),
    cha_mod: fmtMod(character.abilities.cha),
  }

  // Status — HP
  out.page1.status ??= {}
  out.page1.status = {
    ...out.page1.status,
    current_health: String(character.hp.current),
    max_health:     String(character.hp.max),
    temp_health:    character.hp.temp > 0 ? String(character.hp.temp) : '',
  }

  // Status — death saves
  const ds = character.deathSaves
  out.page1.status.death_saves = {
    success_1: ds.successes >= 1,
    success_2: ds.successes >= 2,
    success_3: ds.successes >= 3,
    fail_1:    ds.failures  >= 1,
    fail_2:    ds.failures  >= 2,
    fail_3:    ds.failures  >= 3,
  }

  // Status — hit dice
  // KNOWN LIMITATION: v1 has a single current_hd field.
  // For multiclass characters, sum all class HD totals. Per-class current is lost.
  if (character.hitDice.length > 0) {
    const totalCurrent = character.hitDice.reduce((s, hd) => s + hd.current, 0)
    const totalMax     = character.hitDice.reduce((s, hd) => s + hd.max, 0)
    const firstHD      = character.hitDice[0]!
    out.page1.status.hit_dice = {
      ...out.page1.status.hit_dice,
      current_hd: String(totalCurrent),
      max_hd:     String(totalMax),
      hd_die:     String(firstHD.dieSize),
    }
  }

  // Saving throws
  out.page1.saves_skills ??= {}
  const savesOut: Partial<V1Saves> = {}
  const saveAbilityPairs: [keyof V1Saves, AbilityKey][] = [
    ['str_save', 'str'], ['dex_save', 'dex'], ['con_save', 'con'],
    ['int_save', 'int'], ['wis_save', 'wis'], ['cha_save', 'cha'],
  ]
  for (const [key, ability] of saveAbilityPairs) {
    const st = character.savingThrows.find(s => s.ability === ability)
    savesOut[key] = {
      prof: st?.proficient ?? false,
      val:  formatSigned(st?.bonus ?? 0),
    }
  }
  out.page1.saves_skills.saves = savesOut as V1Saves

  // Skills
  const skillsOut: Partial<V1Skills> = {}
  const skillAbilityDisplayPairs: [keyof V1Skills, string][] = [
    ['acrobatics',      'Acrobatics'],
    ['animal_handling', 'Animal Handling'],
    ['arcana',          'Arcana'],
    ['athletics',       'Athletics'],
    ['deception',       'Deception'],
    ['history',         'History'],
    ['insight',         'Insight'],
    ['intimidation',    'Intimidation'],
    ['investigation',   'Investigation'],
    ['medicine',        'Medicine'],
    ['nature',          'Nature'],
    ['perception',      'Perception'],
    ['performance',     'Performance'],
    ['persuasion',      'Persuasion'],
    ['religion',        'Religion'],
    ['sleight_of_hand', 'Sleight of Hand'],
    ['stealth',         'Stealth'],
    ['survival',        'Survival'],
  ]
  for (const [key, displayName] of skillAbilityDisplayPairs) {
    const sk = character.skills.find(s => s.name === displayName)
    skillsOut[key] = {
      prof: sk?.proficient ?? false,
      expr: sk?.expertise ?? false,
      val:  formatSigned(sk?.bonus ?? 0),
    }
  }
  out.page1.saves_skills.skills = skillsOut as V1Skills

  // Spell casting ability — write resolved value (even if v1 was empty)
  out.page1.saves_skills.spell_casting = character.spells?.ability ?? ''

  // Proficiencies — normalise to standard schema.
  // weaponsAndArmor combined → weapon_profs (armor_profs cleared).
  // Legacy combined weapon_armor field removed via destructuring.
  const {
    weapon_armor: _wa,
    tools: _tools,
    languages: _langs,
    other: _other,
    ...restProfs
  } = out.page1.proficiencies ?? {}
  void _wa; void _tools; void _langs; void _other
  out.page1.proficiencies = {
    ...restProfs,
    weapon_profs:   character.proficiencies.weaponsAndArmor,
    armor_profs:    '',
    tool_profs:     character.proficiencies.tools,
    language_profs: character.proficiencies.languages,
    other_profs:    character.proficiencies.other,
  }

  // Features — back to comma-separated string.
  // KNOWN LIMITATION: feature descriptions created in v2 are not preserved.
  out.page1.features = character.features.map(f => f.name).join(',')

  // Attacks — flat array with additive proficient field
  out.page1.attacks_spells = character.attacks.map(a => ({
    name:        a.name,
    // stat is optional; omit rather than assign undefined (exactOptionalPropertyTypes)
    ...(a.baseStat ? { stat: a.baseStat } : {}),
    toHit:       a.bonus,
    damage:      a.damage,
    damage_type: a.damageType,
    proficient:  a.proficient,  // v2-additive
  }))

  // ── Page 2 ────────────────────────────────────────────────────────────────

  out.page2 ??= {}
  out.page2.equipment ??= {}

  // Inventory — flatten to col_1 (v1 had 2 columns for display only).
  // All items go to col_1; col_2 is cleared.
  out.page2.equipment.val = {
    col_1: character.inventory.map(item => ({
      name:     item.name,
      weight:   item.weight > 0 ? String(item.weight) : '',
      quantity: item.quantity,  // v2-additive
    })),
    col_2: [],
  }

  // Currency — standard abbreviated form
  out.page2.equipment.currency = {
    cp: String(character.currency.cp),
    sp: String(character.currency.sp),
    ep: String(character.currency.ep),
    gp: String(character.currency.gp),
    pp: String(character.currency.pp),
  }

  // ── Page 3 ────────────────────────────────────────────────────────────────

  out.page3 ??= {}
  out.page3.spells ??= {}

  if (character.spells) {
    // Spell info — update derived attack bonus and DC
    out.page3.spell_info = {
      ...out.page3.spell_info,
      att:   formatSigned(character.spells.attackBonus),
      dc:    String(character.spells.saveDC),
    }

    // Rebuild spell slots — with additive `used` field
    for (let level = 1; level <= 9; level++) {
      const key   = `level_${level}` as keyof typeof out.page3.spells
      const slot  = character.spells.slots.find(s => s.level === level)
      const existing = out.page3.spells[key] as V1SpellLevelBlock | undefined

      if (slot) {
        const used = slot.max - slot.current
        out.page3.spells[key] = {
          ...existing,
          total:  String(slot.max),
          used:   used > 0 ? used : 0,  // v2-additive; omit if 0 to keep output clean
          spells: existing?.spells ?? [],
        }
      } else {
        out.page3.spells[key] = {
          ...existing,
          total:  '',
          spells: existing?.spells ?? [],
        }
      }
    }

    // Rebuild known spells organised by level
    const byLevel = new Map<number, typeof character.spells.known>()
    for (const spell of character.spells.known) {
      const arr = byLevel.get(spell.level) ?? []
      arr.push(spell)
      byLevel.set(spell.level, arr)
    }

    // Cantrips
    out.page3.spells.cantrips = {
      spells: (byLevel.get(0) ?? []).map(s => ({ spell_name: s.name })),
    }

    // Leveled spells (1–9)
    for (let level = 1; level <= 9; level++) {
      const key    = `level_${level}` as keyof typeof out.page3.spells
      const known  = byLevel.get(level) ?? []
      const existing = out.page3.spells[key] as V1SpellLevelBlock | undefined
      out.page3.spells[key] = {
        ...existing,
        spells: known.map(s => ({
          spell_name: s.name,
          ...(s.prepared !== undefined ? { preped: s.prepared } : {}),
        })),
      }
    }
  }

  // ── Page 4 ────────────────────────────────────────────────────────────────

  out.page4 ??= {}
  out.page4.backstory = character.backstory
  out.page4.personality = {
    ...out.page4.personality,
    personality_traits: character.personality.traits,
    ideals:             character.personality.ideals,
    bonds:              character.personality.bonds,
    flaws:              character.personality.flaws,
  }
  // allies_organizations preserved from original (not in domain)

  // ── Page 5 ────────────────────────────────────────────────────────────────

  // Notes preserved with split intact — 1:1 mapping to v1 fields.
  out.page5 = {
    ...out.page5,
    notes_1: character.notes1,
    notes_2: character.notes2,
  }

  // ── Images ────────────────────────────────────────────────────────────────

  out.images = {
    ...out.images,
    character: character.images.character ?? '',
  }
  // images.symbol preserved from original (not in domain)

  // ── Metadata ──────────────────────────────────────────────────────────────

  out.updatedAt = character.updatedAt

  return out
}
