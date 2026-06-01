/**
 * Hit die per D&D 5e class (core rulebook + Artificer from Eberron/Tasha's).
 *
 * Keys are lowercase to allow case-insensitive lookup via getHitDie().
 * v1 stores class names as free text (Title Case from datalist suggestions,
 * but users may enter any casing). Default fallback is d8.
 */
export const CLASS_HIT_DIE: Record<string, number> = {
  barbarian: 12,
  fighter:   10,
  paladin:   10,
  ranger:    10,
  artificer: 8,
  bard:      8,
  cleric:    8,
  druid:     8,
  monk:      8,
  rogue:     8,
  warlock:   8,
  sorcerer:  6,
  wizard:    6,
}

/**
 * Returns the hit die size for a given class name.
 * Lookup is case-insensitive — "Wizard", "wizard", and "WIZARD" all return 6.
 * Returns 8 (d8) as fallback for unrecognised or homebrew classes.
 */
export function getHitDie(className: string): number {
  return CLASS_HIT_DIE[className.trim().toLowerCase()] ?? 8
}
