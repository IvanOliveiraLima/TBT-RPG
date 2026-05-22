import type { Character } from './character'

/**
 * Sum of all class levels. Derived from `classes` — never stored.
 *
 * Always call at read time. Do NOT add a `totalLevel` field to Character;
 * that would re-introduce dual-source-of-truth that derived-model avoids.
 */
export function deriveTotalLevel(character: Character): number {
  return character.classes.reduce((sum, c) => sum + (c.level || 0), 0)
}

/**
 * Short class string for display, e.g. "Cleric 5" or "Cleric 5 / Fighter 3".
 * Empty classes (no name) are omitted.
 */
export function formatClassesShort(character: Character): string {
  return character.classes
    .filter(c => c.name)
    .map(c => `${c.name} ${c.level}`)
    .join(' / ')
}
