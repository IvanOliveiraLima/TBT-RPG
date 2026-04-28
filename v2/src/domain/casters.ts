/**
 * D&D 5e spellcasting class detection and spell ability helpers.
 *
 * Limitation: subclass-based casters (Eldritch Knight, Arcane Trickster,
 * Arcane Archer, etc.) are NOT included here. v1 stores only the base class
 * name ("Fighter", "Rogue"), not the subclass, so reliable detection is
 * impossible at the adapter layer. This is a Phase C concern.
 */

import type { AbilityKey } from './character'

/** Full casters — gain spell slots from level 1 (or 2 for Ranger). */
export const FULL_CASTER_CLASSES = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'] as const

/** Half casters — gain spell slots from level 2, slower progression. */
export const HALF_CASTER_CLASSES = ['Paladin', 'Ranger'] as const

/** Pact magic — Warlock: short-rest recovery, different slot mechanics. */
export const PACT_CASTER_CLASSES = ['Warlock'] as const

export const ALL_CASTER_CLASSES: readonly string[] = [
  ...FULL_CASTER_CLASSES,
  ...HALF_CASTER_CLASSES,
  ...PACT_CASTER_CLASSES,
]

/** Returns true if the given class name (case-insensitive, trimmed) is a spellcasting class. */
export function isCasterClass(className: string): boolean {
  const normalized = className.trim().toLowerCase()
  return ALL_CASTER_CLASSES.some((c) => c.toLowerCase() === normalized)
}

/**
 * Returns true if any of the character's classes is a spellcasting class.
 * For multiclass characters, having at least one caster class counts.
 */
export function isCharacterCaster(classes: { name: string }[]): boolean {
  return classes.some((c) => isCasterClass(c.name))
}

/**
 * Default spellcasting ability per class.
 * Used as a fallback when the character's spell_casting field is blank in v1.
 */
const CLASS_SPELL_ABILITY_MAP: Record<string, AbilityKey> = {
  bard:    'cha',
  cleric:  'wis',
  druid:   'wis',
  paladin: 'cha',
  ranger:  'wis',
  sorcerer:'cha',
  warlock: 'cha',
  wizard:  'int',
}

/**
 * Returns the standard spellcasting ability for a class.
 * Falls back to 'cha' for unknown/homebrew casters.
 */
export function getSpellcastingAbility(className: string): AbilityKey {
  return CLASS_SPELL_ABILITY_MAP[className.trim().toLowerCase()] ?? 'cha'
}
