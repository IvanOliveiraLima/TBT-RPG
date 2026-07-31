import type { InventoryItem } from './character'

/**
 * Items that can be used as ammunition. Today: all inventory items.
 * FUTURE: when ItemCategory 'ammunition' exists, filter by category === 'ammunition'
 * — change only this function (single point).
 */
export function ammoCandidates(inventory: InventoryItem[]): InventoryItem[] {
  return inventory
}
