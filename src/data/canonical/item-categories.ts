import type { ItemCategory } from '@/domain/character'

export const ITEM_CATEGORIES: ItemCategory[] = [
  'weapon',
  'armor',
  'consumable',
  'tool',
  'misc',
]

export function isValidCategory(value: unknown): value is ItemCategory {
  return typeof value === 'string' && (ITEM_CATEGORIES as string[]).includes(value)
}
