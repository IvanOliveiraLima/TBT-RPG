import type { Character, Attack, InventoryItem, ItemCategory } from './character'

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

// ── Inventory helpers ──────────────────────────────────────────────────────

/**
 * Total weight carried = sum of (item.weight × item.quantity) for all items.
 * Always derived; never stored.
 */
export function calculateTotalWeight(items: InventoryItem[]): number {
  return items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
}

/**
 * Maximum carrying capacity = STR × 15 (D&D 5e RAW).
 * Always derived from the STR ability score.
 */
export function calculateWeightCapacity(strength: number): number {
  return strength * 15
}

/** Visual weight load level — used by WeightBar to pick a color. */
export type WeightLoadLevel = 'light' | 'moderate' | 'heavy' | 'overburdened'

export function getWeightLoadLevel(current: number, max: number): WeightLoadLevel {
  if (max === 0) return 'light'
  const ratio = current / max
  if (ratio > 1)    return 'overburdened'
  if (ratio > 0.75) return 'heavy'
  if (ratio > 0.5)  return 'moderate'
  return 'light'
}

/**
 * Group items by category. Returns a record with all 5 categories present,
 * each containing only the items belonging to it.
 */
export function groupItemsByCategory(items: InventoryItem[]): Record<ItemCategory, InventoryItem[]> {
  const groups: Record<ItemCategory, InventoryItem[]> = {
    weapon: [], armor: [], consumable: [], tool: [], misc: [],
  }
  for (const item of items) {
    groups[item.category]?.push(item)
  }
  return groups
}

/**
 * Returns true if items in this category can be equipped.
 * Only weapons and armor are equippable per D&D 5e conventions.
 */
export function isEquippableCategory(category: ItemCategory): boolean {
  return category === 'weapon' || category === 'armor'
}

