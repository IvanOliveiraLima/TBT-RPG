/**
 * Canonical D&D 5e classes for autocomplete suggestions.
 * See races.ts for the policy on free-text vs. canonical values.
 */
export const CANONICAL_CLASSES = [
  // PHB core
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',

  // Tasha's / Xanathar's expansions
  'Artificer',

  // Critical Role / commonly-seen homebrew
  'Blood Hunter',
  'Gunslinger',
] as const

export type CanonicalClass = typeof CANONICAL_CLASSES[number]
