import type { Character, Attack } from './character'

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

/** Format attack bonus for display: 0 → "+0", 5 → "+5", -2 → "-2". */
export function formatAttackBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`
}

/**
 * One-line summary for compact attack card.
 * Omits empty segments. Example: "STR · 1d8+3 Slashing · 5 ft"
 * The ability abbreviation must be provided as a translated string
 * (caller resolves via i18n); pass '' to omit.
 */
export function formatAttackSummary(attack: Attack, abilityAbbrev: string): string {
  const parts: string[] = []
  if (abilityAbbrev) parts.push(abilityAbbrev)
  if (attack.damage) {
    const dmg = attack.damageType ? `${attack.damage} ${attack.damageType}` : attack.damage
    parts.push(dmg)
  }
  if (attack.range) parts.push(attack.range)
  return parts.join(' · ')
}

