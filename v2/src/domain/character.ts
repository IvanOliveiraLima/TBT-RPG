/**
 * Domain model for a D&D 5e character.
 *
 * This is the "ideal" shape that all UI components consume.
 * It uses proper types (number for numeric fields, not string) and
 * normalised structures (no page1/page2 nesting).
 *
 * Source of truth for v1 raw schema: @/data/schema-v1.ts
 * Adapter that converts v1 → Character: @/data/adapter.ts
 */

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface Abilities {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export interface ClassEntry {
  name: string
  level: number
  hitDie: number         // 6, 8, 10, or 12
  subclass?: string
}

export interface SavingThrowState {
  ability: AbilityKey
  proficient: boolean
  bonus: number          // derived from ability score + proficiency
}

export interface SkillState {
  name: string           // display name, e.g. "Acrobatics", "Sleight of Hand"
  ability: AbilityKey
  proficient: boolean
  expertise: boolean
  bonus: number          // derived
}

export interface Attack {
  id: string
  name: string
  baseStat: AbilityKey | ''
  bonus: string          // e.g. "+6" or "DC 14"
  damage: string         // e.g. "1d8+3"
  damageType: string
  rollType: 'attack' | 'dc'
  proficient: boolean
}

export interface SpellSlot {
  level: number          // 1–9
  current: number
  max: number
}

export interface SpellKnown {
  level: number          // 0 for cantrips
  name: string
  prepared?: boolean
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  weight: number
  notes?: string
}

export interface Feature {
  id: string
  name: string
  source?: string        // class, race, or background
  description: string
  type: 'passive' | 'active' | 'reaction'
  usesLeft?: number
  usesMax?: number
}

export interface Character {
  id: string
  name: string

  // Identity
  race: string
  background: string
  alignment: string
  classes: ClassEntry[]
  totalLevel: number     // sum of all class levels
  experience: number

  // Core stats
  abilities: Abilities
  proficiencyBonus: number   // derived from totalLevel

  // Status
  hp: {
    current: number
    max: number
    temp: number
  }
  hitDice: { current: number; max: number; dieSize: number }[]
  deathSaves: { successes: number; failures: number }

  // Combat
  ac: number
  initiative: number         // stored as is from v1; ideally dex mod + misc
  speed: number
  passivePerception: number  // derived: 10 + perception skill bonus
  spellSaveDC: number        // 0 if not a caster (stored from top_bar)
  inspiration: boolean       // v1 stores as string in top_bar.insperation (typo preserved in raw)

  // Saving throws & skills
  savingThrows: SavingThrowState[]
  skills: SkillState[]

  // Proficiencies (free text)
  proficiencies: {
    weaponsAndArmor: string  // weapons + armor combined (v1 stores combined or separate)
    tools: string
    languages: string
    other: string
  }

  // Combat items
  attacks: Attack[]

  // Spellcasting — undefined if the character has no spells or slots
  spells?: {
    ability: AbilityKey
    attackBonus: number
    saveDC: number
    slots: SpellSlot[]
    known: SpellKnown[]
  }

  // Inventory
  inventory: InventoryItem[]
  currency: { pp: number; gp: number; ep: number; sp: number; cp: number }

  // Features & lore
  features: Feature[]
  backstory: string
  personality: { traits: string; ideals: string; bonds: string; flaws: string }
  notes: string

  // Images (base64 data URLs)
  images: {
    character?: string
  }

  // Metadata
  createdAt: number
  updatedAt: number
}
