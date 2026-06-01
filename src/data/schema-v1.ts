/**
 * TypeScript types mirroring the v1 IndexedDB character schema verbatim.
 *
 * All fields optional to handle partial/legacy records. Types reflect what
 * is ACTUALLY persisted — verified against js/save.js, js/load.js, and
 * real character exports from the production v1 DB.
 *
 * Notable v1 quirks documented here:
 *  - page1.attacks_spells is a FLAT array of attacks, not a nested object
 *  - page3.spells.cantrips is { spells: SpellEntry[] }, not SpellEntry[]
 *  - page3.spells.level_N is { total: string, spells: SpellEntry[] }, not SpellEntry[]
 *  - page3.spell_info uses "class", "att", "dc", "bonus" (not longer names)
 *  - page4.personality uses "personality_traits" (not "traits")
 *  - Spell slot usage is NOT stored; only total slots per level
 */

/* ── Shared primitives ────────────────────────────────────────────────── */

export interface V1ClassEntry {
  name?:  string
  level?: string  // stored as string from DOM input
}

export interface V1SkillEntry {
  val?:  string   // numeric, stored as string
  prof?: boolean
  expr?: boolean  // expertise
}

export interface V1SaveEntry {
  val?:  string
  prof?: boolean
}

/* ── Page 1 ───────────────────────────────────────────────────────────── */

export interface V1BasicInfo {
  char_name?:   string
  classes?:     V1ClassEntry[]
  total_level?: number | string
  char_class?:  string
  level?:       string
  level_two?:   string  // legacy pre-multiclass field
}

export interface V1CharacterInfo {
  race_class?:  string  // stores the race value; field named "race_class" in v1
  background?:  string
  player_name?: string
  exp?:         string
  alignment?:   string
}

export interface V1TopBar {
  proficiency?:        string
  initiative?:         string
  passive_perception?: string
  ac?:                 string
  speed?:              string
  spell_dc?:           string
  insperation?:        string  // typo preserved from v1 field name
}

export interface V1Attributes {
  str?: string; str_mod?: string
  dex?: string; dex_mod?: string
  con?: string; con_mod?: string
  int?: string; int_mod?: string
  wis?: string; wis_mod?: string
  cha?: string; cha_mod?: string
}

export interface V1Saves {
  str_save?: V1SaveEntry
  dex_save?: V1SaveEntry
  con_save?: V1SaveEntry
  int_save?: V1SaveEntry
  wis_save?: V1SaveEntry
  cha_save?: V1SaveEntry
}

export interface V1Skills {
  acrobatics?:      V1SkillEntry
  animal_handling?: V1SkillEntry
  arcana?:          V1SkillEntry
  athletics?:       V1SkillEntry
  deception?:       V1SkillEntry
  history?:         V1SkillEntry
  insight?:         V1SkillEntry
  intimidation?:    V1SkillEntry
  investigation?:   V1SkillEntry
  medicine?:        V1SkillEntry
  nature?:          V1SkillEntry
  perception?:      V1SkillEntry
  performance?:     V1SkillEntry
  persuasion?:      V1SkillEntry
  religion?:        V1SkillEntry
  sleight_of_hand?: V1SkillEntry
  stealth?:         V1SkillEntry
  survival?:        V1SkillEntry
}

export interface V1SavesSkills {
  spell_casting?: string  // e.g. "cha", "int", "none", ""
  saves?:         V1Saves
  skills?:        V1Skills
}

export interface V1HitDice {
  current_hd?: string
  max_hd?:     string
  hd_die?:     string
}

export interface V1DeathSaves {
  success_1?: boolean; success_2?: boolean; success_3?: boolean
  fail_1?:    boolean; fail_2?:    boolean; fail_3?:    boolean
}

export interface V1Status {
  temp_health?:    string
  current_health?: string
  max_health?:     string
  hit_dice?:       V1HitDice
  death_saves?:    V1DeathSaves
}

export interface V1AttackEntry {
  name?:        string
  stat?:        string
  toHit?:       string
  damage?:      string
  damage_type?: string
}

export interface V1Proficiencies {
  // Standard v1 schema (fixtures)
  weapon_profs?:   string
  armor_profs?:    string
  tool_profs?:     string
  language_profs?: string
  other_profs?:    string
  // Legacy v1 schema (older exports, e.g. Eira design-reference)
  weapon_armor?: string   // weapons + armor combined in a single field
  tools?:        string
  languages?:    string
  other?:        string
}

export interface V1Page1 {
  basic_info?:     V1BasicInfo
  character_info?: V1CharacterInfo
  top_bar?:        V1TopBar
  attributes?:     V1Attributes
  saves_skills?:   V1SavesSkills
  status?:         V1Status
  proficiencies?:  V1Proficiencies
  /**
   * Flat array of attack entries — NOT a nested { attacks: [] } object.
   * Verified against js/save.js buildSheetData() and real DB exports.
   */
  attacks_spells?: V1AttackEntry[]
  /**
   * Free-text features/traits as a comma-separated string.
   * v1 has no structured features array — this is parsed in the adapter.
   */
  features?: string
}

/* ── Page 2 ───────────────────────────────────────────────────────────── */

export interface V1EquipmentRow {
  name?:   string
  weight?: string
}

export interface V1Currency {
  // Abbreviated form (standard v1 fixtures)
  cp?: string; sp?: string; ep?: string; gp?: string; pp?: string
  // Long-form (legacy v1 versions, e.g. design-reference exports)
  copper?: string; silver?: string; electrum?: string; gold?: string; platinum?: string
  // Computed/auxiliary fields — ignored by adapter
  total?: string; base?: string
}

export interface V1Equipment {
  val?:          { col_1?: V1EquipmentRow[]; col_2?: V1EquipmentRow[] }
  currency?:     V1Currency
  encumberance?: string
}

export interface V1Page2 {
  equipment?:  V1Equipment
  mount_pet?:  Record<string, string>
  mount_pet2?: Record<string, string>
}

/* ── Page 3 ───────────────────────────────────────────────────────────── */

export interface V1SpellEntry {
  spell_name?: string
  preped?:     boolean
}

/**
 * Spell info block — field names confirmed from js/save.js and load.js.
 * Note: "class" is the spellcasting class name, NOT an ability key.
 * The spellcasting ability key is in page1.saves_skills.spell_casting.
 * Spell slots are NOT stored here — they live in V1SpellLevelBlock.total.
 */
export interface V1SpellInfo {
  class?: string  // e.g. "Bard", "Wizard" (the casting class label)
  att?:   string  // spell attack bonus, e.g. "+6"
  dc?:    string  // spell save DC, e.g. "14"
  bonus?: string  // misc bonus field
}

/** Cantrips block — spells are nested under .spells (not a flat array). */
export interface V1SpellCantripsBlock {
  spells?: V1SpellEntry[]
}

/**
 * Leveled spell block — includes slot total AND spell list.
 * v1 does NOT track used slots; current = max at session start.
 */
export interface V1SpellLevelBlock {
  total?:  string          // slot count, e.g. "4" or ""
  spells?: V1SpellEntry[]
}

export interface V1Spells {
  cantrips?: V1SpellCantripsBlock
  level_1?:  V1SpellLevelBlock; level_2?: V1SpellLevelBlock; level_3?: V1SpellLevelBlock
  level_4?:  V1SpellLevelBlock; level_5?: V1SpellLevelBlock; level_6?: V1SpellLevelBlock
  level_7?:  V1SpellLevelBlock; level_8?: V1SpellLevelBlock; level_9?: V1SpellLevelBlock
}

export interface V1Page3 {
  spell_info?: V1SpellInfo
  spells?:     V1Spells
}

/* ── Page 4 ───────────────────────────────────────────────────────────── */

/**
 * Personality block — uses "personality_traits" (not "traits").
 * Backstory is NOT nested here; it lives at page4.backstory directly.
 */
export interface V1Personality {
  personality_traits?: string  // verified field name from real v1 DB exports
  ideals?:             string
  bonds?:              string
  flaws?:              string
}

/**
 * @deprecated Organization concept removed in v2.
 * Type kept for v1 schema fidelity, but never adapted to domain.
 */
export interface V1AlliesOrganizations {
  name?:         string
  val?:          string   // textarea description — never mapped to domain
  symbol_image?: string   // legacy field, never used in v1 code
}

export interface V1Page4 {
  backstory?:            string
  allies_organizations?: V1AlliesOrganizations
  personality?:          V1Personality
}

/* ── Page 5 ───────────────────────────────────────────────────────────── */

export interface V1Page5 {
  notes_1?: string
  notes_2?: string
}

/* ── Images ───────────────────────────────────────────────────────────── */

export interface V1CharacterImages {
  character?: string  // base64 data URL or ''
  /** @deprecated Symbol image removed from v2 domain (organization concept) */
  symbol?: string
}

/* ── Root character record ────────────────────────────────────────────── */

export interface V1Character {
  id?:            string
  schemaVersion?: number
  updatedAt?:     number
  page1?:         V1Page1
  page2?:         V1Page2
  page3?:         V1Page3
  page4?:         V1Page4
  page5?:         V1Page5
  images?:        V1CharacterImages
}
