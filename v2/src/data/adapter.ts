/**
 * Adapter: V1Character (raw IndexedDB schema) → Character (domain model).
 *
 * This is the single place in v2 that knows about the v1 page1/page2/page3...
 * nesting. Every UI component consumes Character; none should touch V1Character.
 *
 * v1 fields intentionally discarded:
 * - page2.mount_pet / mount_pet2 — feature discontinued in v2
 * - page1.character_info.player_name — not part of the character's own domain model
 * - page1.top_bar.proficiency — recalculated from totalLevel via proficiencyBonus()
 * - page1.top_bar.passive_perception — recalculated via passivePerception()
 * - page1.top_bar.ac — recalculated as 10+DEX when blank/zero (v1 often empty)
 * - page1.top_bar.initiative — recalculated as DEX mod when blank (v1 often empty)
 * - page1.top_bar.spell_dc — recalculated via spellSaveDC() for casters (v1 string is stale)
 * - page3.spell_info.att — recalculated via spellAttackBonus() (v1 string is stale)
 * - page3.spell_info.dc — recalculated via spellSaveDC() (v1 string is stale)
 * - page1.features — parsed from comma-separated string; v1 has no structured array
 * - page1.saves_skills.*.val — skill/save values recalculated from ability scores
 * - page1.attributes.*_mod — modifier strings recalculated by abilityModifier()
 * - page4.allies_organizations.* — organization concept removed in v2 (Lore tab has no allies field)
 * - images.symbol — organization symbol image, removed alongside allies
 *
 * v1 fields with typo/rename preserved in raw schema but corrected in domain:
 * - top_bar.insperation → Character.inspiration (string → boolean)
 * - personality.personality_traits → personality.traits
 *
 * Decisions baked in:
 * - HP current empty/zero with max filled → current = max (full HP)
 * - Class hit die defaults via getHitDie() (d8 fallback for homebrew)
 * - features[] defaults to [] — v1 has no structured features array
 * - Inventory quantity defaults to 1 — v1 does not track quantity
 * - Attack proficient defaults to false — not stored in v1
 * - Attack rollType detected from toHit pattern: "DC N" → 'dc', otherwise 'attack'
 * - Spell slots: no "used" tracking in v1 — current = max at all times
 * - Caster detection: based on class list (isCharacterCaster); not on data presence
 * - Spell ability: prefers page1.saves_skills.spell_casting; falls back to class default
 * - createdAt falls back to updatedAt — v1 has no createdAt field
 */

import type {
  V1Character,
  V1ClassEntry,
  V1Saves,
  V1Skills,
  V1AttackEntry,
  V1SpellEntry,
  V1SpellLevelBlock,
  V1EquipmentRow,
} from './schema-v1'
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
  Feature,
} from '@/domain/character'
import {
  abilityModifier,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  passivePerception,
  spellSaveDC,
  spellAttackBonus,
} from '@/domain/calculations'
import { getHitDie } from '@/domain/classes'
import { isCharacterCaster, getSpellcastingAbility } from '@/domain/casters'

/* ── Helpers ────────────────────────────────────────────────────────────── */

function parseIntSafe(val: string | number | boolean | null | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.floor(val)
  if (typeof val === 'boolean') return val ? 1 : 0
  const n = parseInt(String(val ?? ''), 10)
  return isNaN(n) ? 0 : n
}

function parseFloatSafe(val: string | number | null | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const n = parseFloat(String(val ?? ''))
  return isNaN(n) ? 0 : n
}

function str(val: string | null | undefined): string {
  return (val ?? '').trim()
}

/**
 * Converts a v1 inspiration value to boolean.
 * v1 stores top_bar.insperation as a text input .value (string).
 * Any non-empty, non-"false", non-"0" string is treated as true.
 * Also handles true/false boolean for programmatically-set records.
 */
function parseBoolean(val: string | boolean | null | undefined): boolean {
  if (typeof val === 'boolean') return val
  const s = str(String(val ?? ''))
  return s !== '' && s !== 'false' && s !== '0'
}

/** Safe array coercion — returns the value if array, otherwise []. */
function toArray<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : []
}

function itemId(prefix: string, index: number): string {
  return `${prefix}_${index}`
}

/**
 * Parses a signed string like "+3", "-1", "0" to a number.
 * Handles the leading "+" that parseInt would otherwise ignore correctly anyway,
 * but also returns 0 for empty/undefined/non-numeric values.
 */
function parseSigned(val: string | null | undefined): number {
  if (!val) return 0
  const n = parseInt(val.replace(/^\+/, ''), 10)
  return isNaN(n) ? 0 : n
}

/**
 * Derives Armor Class.
 * Uses the stored v1 value when the user filled it (> 0).
 * Falls back to 10 + DEX modifier (the D&D 5e unarmored baseline).
 */
function adaptAC(raw: V1Character, abilities: Abilities): number {
  const stored = parseIntSafe(raw.page1?.top_bar?.ac)
  if (stored > 0) return stored
  return 10 + abilityModifier(abilities.dex)
}

/**
 * Derives Initiative.
 * Uses the stored v1 value when the user filled it in (non-empty string).
 * Falls back to DEX modifier (the D&D 5e default).
 */
function adaptInitiative(raw: V1Character, abilities: Abilities): number {
  const stored = str(raw.page1?.top_bar?.initiative)
  if (stored !== '') return parseSigned(stored)
  return abilityModifier(abilities.dex)
}

/**
 * Parses the comma-separated features string stored in v1's page1.features.
 * v1 has no structured features array — each comma-separated token becomes
 * a passive Feature with no source, description, or uses tracking.
 */
function adaptFeatures(raw: V1Character): Feature[] {
  const text = raw.page1?.features
  if (typeof text !== 'string' || !text.trim()) return []
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, idx) => ({
      id:          `feat-${idx}`,
      name,
      description: '',
      type:        'passive' as const,
    }))
}

const VALID_ABILITY_KEYS = new Set<string>(['str', 'dex', 'con', 'int', 'wis', 'cha'])

function toAbilityKey(raw: string | undefined): AbilityKey | '' {
  const normalized = str(raw).toLowerCase()
  return VALID_ABILITY_KEYS.has(normalized) ? (normalized as AbilityKey) : ''
}

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
 * v1 stores level as string; hit die looked up case-insensitively.
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

  const name = str(bi?.char_class)
  return [{ name, level: parseIntSafe(bi?.level), hitDie: getHitDie(name) }]
}

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
 * Adapts HP.
 * If current_health is absent or blank, treats character as at full HP
 * (consistent with how v1 initialises a new character).
 * HP current explicitly set to "0" IS preserved as 0.
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

const SKILL_DISPLAY_NAME_MAP: Record<string, string> = {
  acrobatics:      'Acrobatics',
  animal_handling: 'Animal Handling',
  arcana:          'Arcana',
  athletics:       'Athletics',
  deception:       'Deception',
  history:         'History',
  insight:         'Insight',
  intimidation:    'Intimidation',
  investigation:   'Investigation',
  medicine:        'Medicine',
  nature:          'Nature',
  perception:      'Perception',
  performance:     'Performance',
  persuasion:      'Persuasion',
  religion:        'Religion',
  sleight_of_hand: 'Sleight of Hand',
  stealth:         'Stealth',
  survival:        'Survival',
}

function adaptSkills(
  raw: V1Character,
  abilities: Abilities,
  profBonus: number,
): SkillState[] {
  const v1Skills = raw.page1?.saves_skills?.skills as V1Skills | undefined
  return (Object.keys(SKILL_ABILITY_MAP) as (keyof V1Skills)[]).map((key) => {
    const entry     = v1Skills?.[key]
    const ability   = SKILL_ABILITY_MAP[key as string]!
    const proficient = entry?.prof ?? false
    const expertise  = entry?.expr ?? false
    return {
      name:      SKILL_DISPLAY_NAME_MAP[key as string] ?? (key as string),
      ability,
      proficient,
      expertise,
      bonus: skillBonus(abilities[ability], proficient, expertise, profBonus),
    }
  })
}

/**
 * Detects whether a v1 toHit string represents a spell save DC ("DC 14", "dc 12")
 * vs a normal attack roll bonus ("+5", "0").
 */
function detectRollType(toHit: string | undefined): 'attack' | 'dc' {
  if (!toHit) return 'attack'
  return /^DC\s*\d+/i.test(toHit) ? 'dc' : 'attack'
}

/**
 * Adapts attacks.
 *
 * v1 stores page1.attacks_spells as a FLAT array of attack objects (confirmed
 * from js/save.js buildSheetData and real DB exports). toArray() guards against
 * undefined or non-array values in legacy/malformed records.
 */
function adaptAttacks(raw: V1Character): Attack[] {
  const v1Attacks = toArray<V1AttackEntry>(raw.page1?.attacks_spells)
  return v1Attacks.map((a, i) => ({
    id:         itemId('atk', i),
    name:       str(a.name),
    baseStat:   toAbilityKey(a.stat),
    bonus:      str(a.toHit),  // raw v1 string; can be "+5" or "DC 14"
    damage:     str(a.damage),
    damageType: str(a.damage_type),
    rollType:   detectRollType(a.toHit),
    // v1 does not store proficiency on attacks — defaults to false on import.
    // v2 edit mode (Phase C) will let users toggle this.
    proficient: false,
  }))
}

/**
 * Adapts spell slots.
 *
 * Real v1 schema: slots are in page3.spells.level_N.total (a string).
 * There is NO "used" tracking in v1 — current always equals max at load time.
 * Slots with empty or "0" total are excluded.
 */
function adaptSpellSlots(raw: V1Character): SpellSlot[] {
  const spells = raw.page3?.spells
  if (!spells) return []

  const slots: SpellSlot[] = []
  for (let level = 1; level <= 9; level++) {
    const key = `level_${level}` as keyof typeof spells
    const block = spells[key] as V1SpellLevelBlock | undefined
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue

    const max = parseIntSafe(block.total)
    if (max > 0) slots.push({ level, current: max, max })
  }
  return slots
}

/**
 * Adapts known spells.
 *
 * Real v1 schema (verified from js/save.js + real DB exports):
 *   cantrips: { spells: SpellEntry[] }          ← object, NOT flat array
 *   level_N:  { total: string, spells: SpellEntry[] }
 *
 * toArray() guards against non-array .spells fields in malformed records.
 * Empty spell_name entries are filtered out.
 */
function adaptSpellKnown(raw: V1Character): SpellKnown[] {
  const spells = raw.page3?.spells
  if (!spells || typeof spells !== 'object' || Array.isArray(spells)) return []

  const known: SpellKnown[] = []

  // Cantrips — nested under .spells (not a flat array)
  const cantripBlock = spells.cantrips
  if (cantripBlock && typeof cantripBlock === 'object' && !Array.isArray(cantripBlock)) {
    for (const s of toArray<V1SpellEntry>(cantripBlock.spells)) {
      const name = str(s.spell_name)
      if (name) known.push({ level: 0, name })
    }
  }

  // Leveled spells (1–9)
  for (let level = 1; level <= 9; level++) {
    const key   = `level_${level}` as keyof typeof spells
    const block = spells[key] as V1SpellLevelBlock | undefined
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue

    for (const s of toArray<V1SpellEntry>(block.spells)) {
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
 * Adapts inventory from both equipment columns.
 * v1 does not track quantity — defaults to 1.
 */
function adaptInventory(raw: V1Character): InventoryItem[] {
  const eq = raw.page2?.equipment?.val
  if (!eq) return []

  const items: InventoryItem[] = []
  let i = 0
  for (const col of [toArray<V1EquipmentRow>(eq.col_1), toArray<V1EquipmentRow>(eq.col_2)]) {
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

function adaptCurrency(raw: V1Character) {
  const c = raw.page2?.equipment?.currency
  if (!c) return { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }
  // Prefer abbreviated schema (cp/sp/ep/gp/pp); fall back to long-form (copper/silver/…)
  return {
    pp: parseIntSafe(c.pp ?? c.platinum),
    gp: parseIntSafe(c.gp ?? c.gold),
    ep: parseIntSafe(c.ep ?? c.electrum),
    sp: parseIntSafe(c.sp ?? c.silver),
    cp: parseIntSafe(c.cp ?? c.copper),
  }
}

function joinNonEmpty(a: string | undefined, b: string | undefined, sep: string): string {
  const aTrim = (a ?? '').trim()
  const bTrim = (b ?? '').trim()
  if (aTrim && bTrim) return `${aTrim}${sep}${bTrim}`
  return aTrim || bTrim
}

function adaptProficiencies(raw: V1Character): Character['proficiencies'] {
  const p = raw.page1?.proficiencies
  if (!p) return { weaponsAndArmor: '', tools: '', languages: '', other: '' }
  // Legacy schema has weapon_armor combined; standard schema has weapon_profs + armor_profs separate
  const weaponsAndArmor = p.weapon_armor ?? joinNonEmpty(p.weapon_profs, p.armor_profs, ', ')
  return {
    weaponsAndArmor: str(weaponsAndArmor),
    tools:           str(p.tool_profs ?? p.tools),
    languages:       str(p.language_profs ?? p.languages),
    other:           str(p.other_profs ?? p.other),
  }
}

/**
 * Derives hit dice from the classes array.
 *
 * v1 stores hit_dice as a single {current_hd, max_hd, hd_die} block.
 * In practice these fields are often blank/empty because many users never
 * interact with the hit dice inputs. Instead we derive max and dieSize from
 * the already-adapted classes (which are authoritative), and only use
 * current_hd from v1 for single-class characters where it was explicitly set.
 *
 * For multiclass characters: one entry per class, current = max (v1 has no
 * per-class current tracking).
 */
function adaptHitDice(
  raw: V1Character,
  classes: ClassEntry[],
): { current: number; max: number; dieSize: number }[] {
  if (classes.length === 0) return []

  if (classes.length === 1) {
    const cls = classes[0]!
    const maxFromClass = cls.level
    const currentRaw = parseIntSafe(raw.page1?.status?.hit_dice?.current_hd)
    const current = currentRaw > 0 ? currentRaw : maxFromClass
    return [{ current, max: maxFromClass, dieSize: cls.hitDie }]
  }

  // Multiclass: one entry per class; current = max since v1 has no per-class tracking
  return classes.map((cls) => ({ current: cls.level, max: cls.level, dieSize: cls.hitDie }))
}

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
 */
export function adaptCharacter(raw: V1Character): Character {
  const classes   = adaptClasses(raw)
  const totalLvl  = classes.reduce((sum, c) => sum + c.level, 0)
  const profBonus = proficiencyBonus(totalLvl)
  const abilities = adaptAbilities(raw)

  const bi = raw.page1?.basic_info
  const ci = raw.page1?.character_info
  const tb = raw.page1?.top_bar
  const p4 = raw.page4
  const p5 = raw.page5

  const skills     = adaptSkills(raw, abilities, profBonus)
  const perception = skills.find((s) => s.name === 'Perception')
  const passPerc   = passivePerception(
    abilities.wis,
    perception?.proficient ?? false,
    perception?.expertise  ?? false,
    profBonus,
  )

  const spellSlots = adaptSpellSlots(raw)
  const spellKnown = adaptSpellKnown(raw)

  // Caster detection: derive from class list. Characters whose class is in the
  // caster list always get a spells object — even if they never filled the spell
  // page in v1 (e.g. a Druid who hasn't entered spells yet).
  const isCaster = isCharacterCaster(classes)

  // Spell ability: prefer page1.saves_skills.spell_casting (select element,
  // stores "cha"/"int"/etc.). Falls back to class-based default when blank
  // (common for casters who skipped that field in v1).
  const spellAbilityRaw = str(raw.page1?.saves_skills?.spell_casting)
  const primaryClassName = classes[0]?.name ?? ''
  const spellAbility = spellAbilityRaw
    ? mapSpellAbility(spellAbilityRaw)
    : getSpellcastingAbility(primaryClassName)

  const spells = isCaster
    ? {
        ability:     spellAbility,
        attackBonus: spellAttackBonus(abilities[spellAbility], profBonus),
        saveDC:      spellSaveDC(abilities[spellAbility], profBonus),
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

    hp:         adaptHp(raw),
    hitDice:    adaptHitDice(raw, classes),
    deathSaves: adaptDeathSaves(raw),

    ac:               adaptAC(raw, abilities),
    initiative:       adaptInitiative(raw, abilities),
    speed:            parseIntSafe(tb?.speed),
    passivePerception: passPerc,
    spellSaveDC:      isCaster ? spellSaveDC(abilities[spellAbility], profBonus) : 0,
    inspiration:      parseBoolean(tb?.insperation),

    savingThrows: adaptSavingThrows(raw, abilities, profBonus),
    skills,

    proficiencies: adaptProficiencies(raw),

    attacks: adaptAttacks(raw),
    ...(spells !== undefined ? { spells } : {}),

    inventory: adaptInventory(raw),
    currency:  adaptCurrency(raw),

    features: adaptFeatures(raw),

    // page4.backstory is the primary location (verified from real data).
    // page4.personality does NOT have a backstory field.
    backstory: str(p4?.backstory),
    personality: {
      // v1 uses "personality_traits" (not "traits") — verified from real DB exports
      traits: str(p4?.personality?.personality_traits),
      ideals: str(p4?.personality?.ideals),
      bonds:  str(p4?.personality?.bonds),
      flaws:  str(p4?.personality?.flaws),
    },
    notes,

    images: {
      ...(raw.images?.character ? { character: raw.images.character } : {}),
    },

    createdAt: raw.updatedAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  }
}
