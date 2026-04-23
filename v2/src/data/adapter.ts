/**
 * Adapter: V1Character (raw IndexedDB schema) → Character (domain model).
 *
 * This is the single place in v2 that knows about the v1 page1/page2/page3...
 * nesting. Every UI component consumes Character; none should touch V1Character.
 *
 * Decisions baked in:
 * - HP current empty/zero with max filled → current = max (full HP assumption)
 * - Skill/save bonuses recalculated from ability scores (not stored val field)
 * - Class hit die defaults to d8 — v1 does not store per-class die size
 * - features[] defaults to [] — v1 has no structured features array
 * - Inventory quantity defaults to 1 — v1 does not track quantity
 * - Attack proficient defaults to false — not stored in v1
 * - Attack rollType defaults to 'attack' — not stored in v1
 * - createdAt falls back to updatedAt — v1 has no createdAt field
 */

import type { V1Character, V1ClassEntry, V1Saves, V1Skills } from './schema-v1'
import type {
  Character,
  AbilityKey,
  Abilities,
  ClassEntry,
  SavingThrowState,
  SkillState,
  Attack,
  SpellSlot,
  SpellKnown,
  InventoryItem,
} from '@/domain/character'
import {
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  passivePerception,
} from '@/domain/calculations'
import { getHitDie } from '@/domain/classes'

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Safe integer parse — returns 0 for empty/NaN values. */
function parseIntSafe(val: string | number | boolean | null | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.floor(val)
  if (typeof val === 'boolean') return val ? 1 : 0
  const n = parseInt(String(val ?? ''), 10)
  return isNaN(n) ? 0 : n
}

/** Safe float parse — returns 0 for empty/NaN values. */
function parseFloatSafe(val: string | number | null | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const n = parseFloat(String(val ?? ''))
  return isNaN(n) ? 0 : n
}

/** Trim a string value, default to ''. */
function str(val: string | null | undefined): string {
  return (val ?? '').trim()
}

/**
 * Converts a v1 inspiration value to boolean.
 * v1 stores inspiration as a text input .value (string).
 * Any non-empty, non-"false", non-"0" string is treated as true.
 * Also handles true/false boolean in case records were programmatically set.
 */
function parseBoolean(val: string | boolean | null | undefined): boolean {
  if (typeof val === 'boolean') return val
  const s = str(String(val ?? ''))
  return s !== '' && s !== 'false' && s !== '0'
}

/** Deterministic id for items that have no id in v1. */
function itemId(prefix: string, index: number): string {
  return `${prefix}_${index}`
}

const VALID_ABILITY_KEYS = new Set<string>(['str', 'dex', 'con', 'int', 'wis', 'cha'])

/** Convert a raw ability key string to a typed AbilityKey or ''. */
function toAbilityKey(raw: string | undefined): AbilityKey | '' {
  const normalized = str(raw).toLowerCase()
  return VALID_ABILITY_KEYS.has(normalized) ? (normalized as AbilityKey) : ''
}

/** Map spell ability raw text (may be full name or abbreviation) to AbilityKey. */
const SPELL_ABILITY_MAP: Record<string, AbilityKey> = {
  str: 'str', strength: 'str',
  dex: 'dex', dexterity: 'dex',
  con: 'con', constitution: 'con',
  int: 'int', intelligence: 'int',
  wis: 'wis', wisdom: 'wis',
  cha: 'cha', charisma: 'cha',
}

function mapSpellAbility(raw: string | undefined): AbilityKey {
  return SPELL_ABILITY_MAP[str(raw).toLowerCase()] ?? 'cha'
}

/* ── Sub-adapters ────────────────────────────────────────────────────────── */

/**
 * Adapts v1 classes to domain ClassEntry[].
 * v1 stores level as a string; domain uses number.
 * v1 has no per-class hit die — defaults to d8.
 */
function adaptClasses(raw: V1Character): ClassEntry[] {
  const bi = raw.page1?.basic_info

  if (Array.isArray(bi?.classes) && (bi.classes as V1ClassEntry[]).length > 0) {
    const result = (bi.classes as V1ClassEntry[])
      .map((c) => {
        const name = str(c.name)
        return { name, level: parseIntSafe(c.level), hitDie: getHitDie(name) }
      })
      .filter((c) => c.name !== '' || c.level > 0)

    if (result.length > 0) return result
  }

  // Legacy fallback: single class from char_class + level fields
  const name = str(bi?.char_class)
  return [{ name, level: parseIntSafe(bi?.level), hitDie: getHitDie(name) }]
}

/**
 * Adapts v1 attributes to domain Abilities.
 * v1 stores all scores as strings from DOM inputs.
 */
function adaptAbilities(raw: V1Character): Abilities {
  const a = raw.page1?.attributes
  return {
    str: parseIntSafe(a?.str),
    dex: parseIntSafe(a?.dex),
    con: parseIntSafe(a?.con),
    int: parseIntSafe(a?.int),
    wis: parseIntSafe(a?.wis),
    cha: parseIntSafe(a?.cha),
  }
}

/**
 * Adapts HP from v1 status.
 * If current_health is blank but max_health is set, treats the character as at
 * full HP (consistent with creating a new character via v1 UI).
 */
function adaptHp(raw: V1Character): { current: number; max: number; temp: number } {
  const st = raw.page1?.status
  const max = parseIntSafe(st?.max_health)
  const currentRaw = st?.current_health
  const isBlank = currentRaw === undefined || currentRaw === null || str(currentRaw) === ''
  const current = isBlank ? max : parseIntSafe(currentRaw)
  return { current, max, temp: parseIntSafe(st?.temp_health) }
}

const SAVE_ABILITY_PAIRS: [keyof V1Saves, AbilityKey][] = [
  ['str_save', 'str'],
  ['dex_save', 'dex'],
  ['con_save', 'con'],
  ['int_save', 'int'],
  ['wis_save', 'wis'],
  ['cha_save', 'cha'],
]

/**
 * Adapts saving throws.
 * Recalculates bonus from ability scores + proficiency (ignores stored val).
 */
function adaptSavingThrows(
  raw: V1Character,
  abilities: Abilities,
  profBonus: number,
): SavingThrowState[] {
  const saves = raw.page1?.saves_skills?.saves
  return SAVE_ABILITY_PAIRS.map(([key, ability]) => {
    const proficient = saves?.[key]?.prof ?? false
    return {
      ability,
      proficient,
      bonus: savingThrowBonus(abilities[ability], proficient, profBonus),
    }
  })
}

/** D&D 5e skill → governing ability mapping. */
const SKILL_ABILITY_MAP: Record<string, AbilityKey> = {
  acrobatics:      'dex',
  animal_handling: 'wis',
  arcana:          'int',
  athletics:       'str',
  deception:       'cha',
  history:         'int',
  insight:         'wis',
  intimidation:    'cha',
  investigation:   'int',
  medicine:        'wis',
  nature:          'int',
  perception:      'wis',
  performance:     'cha',
  persuasion:      'cha',
  religion:        'int',
  sleight_of_hand: 'dex',
  stealth:         'dex',
  survival:        'wis',
}

/**
 * Adapts skills from v1 saves_skills.skills.
 * Recalculates bonus from ability scores + proficiency + expertise.
 */
function adaptSkills(
  raw: V1Character,
  abilities: Abilities,
  profBonus: number,
): SkillState[] {
  const v1Skills = raw.page1?.saves_skills?.skills as V1Skills | undefined
  return (Object.keys(SKILL_ABILITY_MAP) as (keyof V1Skills)[]).map((name) => {
    const entry    = v1Skills?.[name]
    const ability  = SKILL_ABILITY_MAP[name as string]!
    const proficient = entry?.prof ?? false
    const expertise  = entry?.expr ?? false
    return {
      name:      name as string,
      ability,
      proficient,
      expertise,
      bonus: skillBonus(abilities[ability], proficient, expertise, profBonus),
    }
  })
}

/**
 * Adapts attacks from v1 attacks_spells.attacks.
 * rollType and proficient cannot be derived from v1 — defaults to 'attack' / false.
 */
function adaptAttacks(raw: V1Character): Attack[] {
  const v1Attacks = raw.page1?.attacks_spells?.attacks ?? []
  return v1Attacks.map((a, i) => ({
    id:         itemId('atk', i),
    name:       str(a.name),
    baseStat:   toAbilityKey(a.stat),
    bonus:      str(a.toHit),
    damage:     str(a.damage),
    damageType: str(a.damage_type),
    rollType:   'attack' as const,
    proficient: false,
  }))
}

/**
 * Adapts spell slots from v1 page3.spell_info (slot_1..slot_9).
 * current = total - used (slots expended during the session).
 */
function adaptSpellSlots(raw: V1Character): SpellSlot[] {
  const info = raw.page3?.spell_info
  if (!info) return []

  const slots: SpellSlot[] = []
  for (let level = 1; level <= 9; level++) {
    const key = `slot_${level}` as keyof typeof info
    const slot = info[key] as { total?: string; used?: string } | undefined
    if (!slot) continue
    const max  = parseIntSafe(slot.total)
    const used = parseIntSafe(slot.used)
    if (max > 0) slots.push({ level, current: Math.max(0, max - used), max })
  }
  return slots
}

/**
 * Adapts known spells from v1 page3.spells.
 * Cantrips → level 0; level_1..level_9 → their numeric level.
 */
function adaptSpellKnown(raw: V1Character): SpellKnown[] {
  const spells = raw.page3?.spells
  if (!spells) return []

  const known: SpellKnown[] = []

  for (const s of spells.cantrips ?? []) {
    const name = str(s.spell_name)
    if (name) known.push({ level: 0, name })
  }

  for (let level = 1; level <= 9; level++) {
    const key = `level_${level}` as keyof typeof spells
    const arr = spells[key] as typeof spells.cantrips | undefined
    for (const s of arr ?? []) {
      const name = str(s.spell_name)
      if (name) {
        known.push({
          level,
          name,
          ...(s.preped !== undefined ? { prepared: s.preped } : {}),
        })
      }
    }
  }

  return known
}

/**
 * Adapts inventory from v1 equipment columns (col_1 + col_2).
 * v1 does not track quantity — defaults to 1.
 */
function adaptInventory(raw: V1Character): InventoryItem[] {
  const eq = raw.page2?.equipment?.val
  if (!eq) return []

  const items: InventoryItem[] = []
  let i = 0
  for (const col of [eq.col_1 ?? [], eq.col_2 ?? []]) {
    for (const item of col) {
      const name = str(item.name)
      if (name) {
        items.push({
          id:       itemId('inv', i++),
          name,
          quantity: 1,
          weight:   parseFloatSafe(item.weight),
        })
      }
    }
  }
  return items
}

/** Adapts currency from v1 equipment.currency (all stored as strings). */
function adaptCurrency(raw: V1Character) {
  const c = raw.page2?.equipment?.currency
  return {
    pp: parseIntSafe(c?.pp),
    gp: parseIntSafe(c?.gp),
    ep: parseIntSafe(c?.ep),
    sp: parseIntSafe(c?.sp),
    cp: parseIntSafe(c?.cp),
  }
}

/**
 * Adapts death saves from v1 status.death_saves.
 * v1 stores six individual booleans (success_1/2/3, fail_1/2/3).
 */
function adaptDeathSaves(raw: V1Character): { successes: number; failures: number } {
  const ds = raw.page1?.status?.death_saves
  const successes = [ds?.success_1, ds?.success_2, ds?.success_3].filter(Boolean).length
  const failures  = [ds?.fail_1,    ds?.fail_2,    ds?.fail_3   ].filter(Boolean).length
  return { successes, failures }
}

/* ── Main adapter ─────────────────────────────────────────────────────────── */

/**
 * Converts a raw v1 character record to the domain Character shape.
 *
 * This function is the only permitted entry point for v1 → domain conversion.
 * All UI components must work with Character, never V1Character.
 *
 * v1 fields intentionally discarded:
 * - page2.mount_pet / mount_pet2 — feature discontinued in v2
 * - page1.character_info.player_name — not part of the character's own domain model
 * - page1.top_bar.proficiency — recalculated from totalLevel via proficiencyBonus()
 * - page1.top_bar.passive_perception — recalculated via passivePerception()
 * - page1.saves_skills.*.val — skill/save values recalculated from ability scores
 * - page1.attributes.*_mod — modifier strings recalculated by abilityModifier()
 *
 * v1 fields with typo preserved in raw schema but corrected in domain:
 * - top_bar.insperation → Character.inspiration (string → boolean)
 */
export function adaptCharacter(raw: V1Character): Character {
  const classes   = adaptClasses(raw)
  const totalLvl  = classes.reduce((sum, c) => sum + c.level, 0)
  const profBonus = proficiencyBonus(totalLvl)
  const abilities = adaptAbilities(raw)

  const bi    = raw.page1?.basic_info
  const ci    = raw.page1?.character_info
  const tb    = raw.page1?.top_bar
  const profs = raw.page1?.proficiencies
  const p4    = raw.page4
  const p5    = raw.page5

  const skills     = adaptSkills(raw, abilities, profBonus)
  const perception = skills.find((s) => s.name === 'perception')
  const passPerc   = passivePerception(
    abilities.wis,
    perception?.proficient ?? false,
    perception?.expertise  ?? false,
    profBonus,
  )

  const spellSlots = adaptSpellSlots(raw)
  const spellKnown = adaptSpellKnown(raw)
  const hasSpells  = spellSlots.length > 0 || spellKnown.length > 0
  const spellAbilityRaw =
    str(raw.page3?.spell_info?.spell_ability) ||
    str(raw.page1?.saves_skills?.spell_casting)
  const spells = hasSpells
    ? {
        ability:     mapSpellAbility(spellAbilityRaw),
        attackBonus: parseIntSafe(raw.page3?.spell_info?.spell_atk_bonus),
        saveDC:      parseIntSafe(raw.page3?.spell_info?.spell_save_dc),
        slots:       spellSlots,
        known:       spellKnown,
      }
    : undefined

  const notes1 = str(p5?.notes_1)
  const notes2 = str(p5?.notes_2)
  const notes  = [notes1, notes2].filter(Boolean).join('\n\n')

  const now = Date.now()

  return {
    id:   raw.id ?? `char_${now}`,
    name: str(bi?.char_name) || 'Unnamed',

    race:       str(ci?.race_class),
    background: str(ci?.background),
    alignment:  str(ci?.alignment),
    classes,
    totalLevel: totalLvl,
    experience: parseIntSafe(ci?.exp),

    abilities,
    proficiencyBonus: profBonus,

    hp:       adaptHp(raw),
    hitDice: [{
      current: parseIntSafe(raw.page1?.status?.hit_dice?.current_hd),
      max:     parseIntSafe(raw.page1?.status?.hit_dice?.max_hd),
      dieSize: parseIntSafe(raw.page1?.status?.hit_dice?.hd_die) || 8,
    }],
    deathSaves: adaptDeathSaves(raw),

    ac:               parseIntSafe(tb?.ac),
    initiative:       parseIntSafe(tb?.initiative),
    speed:            parseIntSafe(tb?.speed),
    passivePerception: passPerc,
    spellSaveDC:      parseIntSafe(tb?.spell_dc),
    // v1 stores as top_bar.insperation (typo preserved in raw schema)
    inspiration:      parseBoolean(tb?.insperation),

    savingThrows: adaptSavingThrows(raw, abilities, profBonus),
    skills,

    proficiencies: {
      weapons:   str(profs?.weapon_profs),
      armor:     str(profs?.armor_profs),
      tools:     str(profs?.tool_profs),
      languages: str(profs?.language_profs),
      other:     str(profs?.other_profs),
    },

    attacks: adaptAttacks(raw),
    ...(spells !== undefined ? { spells } : {}),

    inventory: adaptInventory(raw),
    currency:  adaptCurrency(raw),

    features: [],

    backstory: str(p4?.personality?.backstory) || str(p4?.backstory),
    personality: {
      traits: str(p4?.personality?.traits),
      ideals: str(p4?.personality?.ideals),
      bonds:  str(p4?.personality?.bonds),
      flaws:  str(p4?.personality?.flaws),
    },
    allies: str(p4?.allies_organizations?.name),
    notes,

    images: {
      ...(raw.images?.character ? { character: raw.images.character } : {}),
      ...(raw.images?.symbol    ? { symbol:    raw.images.symbol    } : {}),
    },

    // v1 has no createdAt — use updatedAt as best approximation
    createdAt: raw.updatedAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  }
}
