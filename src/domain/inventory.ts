import type { InventoryItem } from './character'

/**
 * Items offered as ammunition: those with category 'ammunition'.
 * The currently linked item is always included (even if in another category),
 * so existing attacks don't lose their ammo reference after the category was introduced.
 */
export function ammoCandidates(
  inventory: InventoryItem[],
  currentAmmoItemId?: string,
): InventoryItem[] {
  const list = inventory.filter(i => i.category === 'ammunition')
  if (currentAmmoItemId && !list.some(i => i.id === currentAmmoItemId)) {
    const linked = inventory.find(i => i.id === currentAmmoItemId)
    if (linked) return [linked, ...list]
  }
  return list
}
