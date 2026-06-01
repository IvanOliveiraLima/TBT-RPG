/**
 * Formats a weight value in pounds.
 * Shows 1 decimal only when non-integer.
 * Examples: 2.5 → "2.5 lb", 10 → "10 lb", 0 → "0 lb"
 */
export function formatWeight(weight: number): string {
  const rounded = Math.round(weight * 10) / 10
  const text = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
  return `${text} lb`
}

/**
 * Sums total weight across all inventory items.
 * Multiplies by quantity to remain correct for Phase C when quantity > 1.
 */
export function totalInventoryWeight(items: { weight: number; quantity: number }[]): number {
  return items.reduce((acc, item) => acc + item.weight * item.quantity, 0)
}
