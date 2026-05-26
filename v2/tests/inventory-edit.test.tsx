/**
 * inventory-edit.test.tsx
 *
 * Tests covering Phase C.1.f — Editable Inventory:
 *   - Derived helpers (calculateTotalWeight, calculateWeightCapacity,
 *     getWeightLoadLevel, groupItemsByCategory)
 *   - isValidCategory canonical helper
 *   - CurrencyBlock editable mode (NumberField per coin, 4 coins, no EP)
 *   - InventoryList: ItemCard compact / expanded state, editing interactions,
 *     equipped toggle, add/remove, dual-lang labels
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, InventoryItem } from '@/domain/character'
import {
  calculateTotalWeight,
  calculateWeightCapacity,
  getWeightLoadLevel,
  groupItemsByCategory,
  isEquippableCategory,
} from '@/domain/derived'
import { isValidCategory, ITEM_CATEGORIES } from '@/data/canonical/item-categories'
import { CurrencyBlock } from '@/components/sheet/parts/CurrencyBlock'
import { InventoryList } from '@/components/sheet/parts/InventoryList'
import { renderWithI18n } from './helpers/render'

// ── Shared fixtures ───────────────────────────────────────────────────────────

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item_001',
    name: 'Shortsword',
    quantity: 1,
    weight: 2,
    category: 'weapon',
    description: '',
    equipped: false,
    ...overrides,
  }
}

const BASE_CHAR: Character = {
  id: 'test_01',
  name: 'Test Hero',
  race: 'Human',
  background: 'Soldier',
  alignment: 'Neutral Good',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  proficiencyBonus: 3,
  hp: { current: 44, max: 44, temp: 0 },
  hitDice: [{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 18, initiative: 2, speed: 30,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [
    makeItem({ id: 'w1', name: 'Longsword', category: 'weapon',  equipped: true,  weight: 3,  quantity: 1 }),
    makeItem({ id: 'a1', name: 'Shield',    category: 'armor',   equipped: true,  weight: 6,  quantity: 1 }),
    makeItem({ id: 'c1', name: 'Potion',    category: 'consumable', equipped: false, weight: 0.5, quantity: 3 }),
    makeItem({ id: 't1', name: 'Rope',      category: 'tool',    equipped: false, weight: 10, quantity: 1 }),
    makeItem({ id: 'm1', name: 'Backpack',  category: 'misc',    equipped: false, weight: 5,  quantity: 1 }),
  ],
  currency: { pp: 2, gp: 50, sp: 15, cp: 30 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

// ── calculateTotalWeight ──────────────────────────────────────────────────────

describe('calculateTotalWeight', () => {
  it('returns 0 for empty inventory', () => {
    expect(calculateTotalWeight([])).toBe(0)
  })

  it('returns item weight for single item with quantity 1', () => {
    expect(calculateTotalWeight([makeItem({ weight: 3, quantity: 1 })])).toBe(3)
  })

  it('multiplies weight by quantity', () => {
    expect(calculateTotalWeight([makeItem({ weight: 0.5, quantity: 3 })])).toBeCloseTo(1.5)
  })

  it('sums multiple items correctly', () => {
    const items = [
      makeItem({ id: 'a', weight: 3,    quantity: 1 }),
      makeItem({ id: 'b', weight: 6,    quantity: 1 }),
      makeItem({ id: 'c', weight: 0.5,  quantity: 3 }),
      makeItem({ id: 'd', weight: 10,   quantity: 1 }),
      makeItem({ id: 'e', weight: 5,    quantity: 1 }),
    ]
    expect(calculateTotalWeight(items)).toBeCloseTo(3 + 6 + 1.5 + 10 + 5)
  })

  it('handles zero-weight items without affecting total', () => {
    const items = [
      makeItem({ id: 'a', weight: 0, quantity: 5 }),
      makeItem({ id: 'b', weight: 2, quantity: 1 }),
    ]
    expect(calculateTotalWeight(items)).toBe(2)
  })

  it('handles high-quantity items', () => {
    expect(calculateTotalWeight([makeItem({ weight: 0.05, quantity: 100 })])).toBeCloseTo(5)
  })
})

// ── calculateWeightCapacity ───────────────────────────────────────────────────

describe('calculateWeightCapacity', () => {
  it('returns 0 for STR 0', () => {
    expect(calculateWeightCapacity(0)).toBe(0)
  })

  it('returns 150 for STR 10 (baseline)', () => {
    expect(calculateWeightCapacity(10)).toBe(150)
  })

  it('returns 240 for STR 16', () => {
    expect(calculateWeightCapacity(16)).toBe(240)
  })

  it('returns 300 for STR 20 (max human)', () => {
    expect(calculateWeightCapacity(20)).toBe(300)
  })
})

// ── getWeightLoadLevel ────────────────────────────────────────────────────────

describe('getWeightLoadLevel', () => {
  it('returns light when max is 0', () => {
    expect(getWeightLoadLevel(0, 0)).toBe('light')
  })

  it('returns light at exactly 0%', () => {
    expect(getWeightLoadLevel(0, 100)).toBe('light')
  })

  it('returns light below 50%', () => {
    expect(getWeightLoadLevel(49, 100)).toBe('light')
  })

  it('returns light at exactly 50%', () => {
    expect(getWeightLoadLevel(50, 100)).toBe('light')
  })

  it('returns moderate above 50%', () => {
    expect(getWeightLoadLevel(51, 100)).toBe('moderate')
  })

  it('returns moderate at 75%', () => {
    expect(getWeightLoadLevel(75, 100)).toBe('moderate')
  })

  it('returns heavy above 75%', () => {
    expect(getWeightLoadLevel(76, 100)).toBe('heavy')
  })

  it('returns heavy at exactly 100%', () => {
    expect(getWeightLoadLevel(100, 100)).toBe('heavy')
  })

  it('returns overburdened above 100%', () => {
    expect(getWeightLoadLevel(101, 100)).toBe('overburdened')
  })

  it('returns overburdened when carrying 3× capacity', () => {
    expect(getWeightLoadLevel(300, 100)).toBe('overburdened')
  })
})

// ── groupItemsByCategory ──────────────────────────────────────────────────────

describe('groupItemsByCategory', () => {
  it('returns all 5 categories even when empty', () => {
    const result = groupItemsByCategory([])
    expect(Object.keys(result)).toEqual(['weapon', 'armor', 'consumable', 'tool', 'misc'])
  })

  it('all groups are empty arrays for empty input', () => {
    const result = groupItemsByCategory([])
    expect(result.weapon).toEqual([])
    expect(result.armor).toEqual([])
    expect(result.consumable).toEqual([])
    expect(result.tool).toEqual([])
    expect(result.misc).toEqual([])
  })

  it('places weapon items in weapon group', () => {
    const items = [makeItem({ category: 'weapon' })]
    expect(groupItemsByCategory(items).weapon).toHaveLength(1)
  })

  it('places items in correct groups', () => {
    const items = [
      makeItem({ id: 'w', category: 'weapon' }),
      makeItem({ id: 'a', category: 'armor' }),
      makeItem({ id: 'c', category: 'consumable' }),
      makeItem({ id: 't', category: 'tool' }),
      makeItem({ id: 'm', category: 'misc' }),
    ]
    const result = groupItemsByCategory(items)
    expect(result.weapon).toHaveLength(1)
    expect(result.armor).toHaveLength(1)
    expect(result.consumable).toHaveLength(1)
    expect(result.tool).toHaveLength(1)
    expect(result.misc).toHaveLength(1)
  })

  it('preserves order within each category group', () => {
    const items = [
      makeItem({ id: 'w1', name: 'Dagger',    category: 'weapon' }),
      makeItem({ id: 'w2', name: 'Shortsword', category: 'weapon' }),
    ]
    const result = groupItemsByCategory(items)
    expect(result.weapon[0]?.name).toBe('Dagger')
    expect(result.weapon[1]?.name).toBe('Shortsword')
  })

  it('leaves other groups empty when all items in one category', () => {
    const items = [
      makeItem({ id: 'a', category: 'misc' }),
      makeItem({ id: 'b', category: 'misc' }),
    ]
    const result = groupItemsByCategory(items)
    expect(result.weapon).toEqual([])
    expect(result.misc).toHaveLength(2)
  })
})

// ── isValidCategory ───────────────────────────────────────────────────────────

describe('isValidCategory', () => {
  it('returns true for all 5 valid categories', () => {
    for (const cat of ITEM_CATEGORIES) {
      expect(isValidCategory(cat)).toBe(true)
    }
  })

  it('returns false for unknown string', () => {
    expect(isValidCategory('potion')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isValidCategory('')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidCategory(null)).toBe(false)
  })

  it('returns false for number', () => {
    expect(isValidCategory(42)).toBe(false)
  })

  it('ITEM_CATEGORIES has exactly 5 entries', () => {
    expect(ITEM_CATEGORIES).toHaveLength(5)
  })
})

// ── CurrencyBlock editable mode ───────────────────────────────────────────────

describe('CurrencyBlock editable mode', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders NumberField inputs for all 4 coins when onUpdate provided', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('currency-input-pp')).toBeDefined()
    expect(screen.getByTestId('currency-input-gp')).toBeDefined()
    expect(screen.getByTestId('currency-input-sp')).toBeDefined()
    expect(screen.getByTestId('currency-input-cp')).toBeDefined()
  })

  it('no EP input present', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} onUpdate={() => {}} />, 'pt')
    expect(screen.queryByTestId('currency-input-ep')).toBeNull()
  })

  it('GP input shows correct value', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} onUpdate={() => {}} />, 'pt')
    const gp = screen.getByTestId('currency-input-gp') as HTMLInputElement
    expect(gp.value).toBe('50')
  })

  it('PP input shows correct value', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} onUpdate={() => {}} />, 'pt')
    const pp = screen.getByTestId('currency-input-pp') as HTMLInputElement
    expect(pp.value).toBe('2')
  })

  it('SP input shows correct value', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} onUpdate={() => {}} />, 'pt')
    const sp = screen.getByTestId('currency-input-sp') as HTMLInputElement
    expect(sp.value).toBe('15')
  })

  it('CP input shows correct value', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} onUpdate={() => {}} />, 'pt')
    const cp = screen.getByTestId('currency-input-cp') as HTMLInputElement
    expect(cp.value).toBe('30')
  })

  it('calls onUpdate with updated GP value', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} onUpdate={onUpdate} />, 'pt')
    const gp = screen.getByTestId('currency-input-gp') as HTMLInputElement
    fireEvent.change(gp, { target: { value: '100' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ currency: expect.objectContaining({ gp: 100 }) })
    )
  })

  it('read-only mode shows static number, no input', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} />, 'pt')
    expect(screen.queryByTestId('currency-input-gp')).toBeNull()
    const gpCell = screen.getByTestId('currency-gp')
    expect(gpCell.textContent).toContain('50')
  })

  it('shows GP label in PT', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} />, 'pt')
    expect(screen.getByTestId('currency-gp').textContent).toContain('GP')
  })

  it('shows GP label in EN', () => {
    renderWithI18n(<CurrencyBlock character={BASE_CHAR} />, 'en')
    expect(screen.getByTestId('currency-gp').textContent).toContain('GP')
  })
})

// ── InventoryList — ItemCard compact row ─────────────────────────────────────

describe('InventoryList — ItemCard compact row', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows item weight display testid for each item', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    expect(screen.getByTestId('item-weight-w1')).toBeDefined()
    expect(screen.getByTestId('item-weight-a1')).toBeDefined()
  })

  it('shows total weight per item (weight × quantity)', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    // Potion: 0.5 × 3 = 1.5 lb
    expect(screen.getByTestId('item-weight-c1').textContent).toBe('1.5 lb')
  })

  it('equipped checkbox checked for equipped item', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const cb = screen.getByTestId('item-equipped-w1') as HTMLInputElement
    expect(cb.checked).toBe(true)
  })

  it('equipped checkbox unchecked for non-equipped armor item', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    // a1 = Shield (armor), equipped: true — use a weapon with equipped:false
    const charWithUnequippedWeapon: Character = {
      ...BASE_CHAR,
      inventory: [makeItem({ id: 'wu', category: 'weapon', equipped: false })],
    }
    renderWithI18n(<InventoryList character={charWithUnequippedWeapon} />, 'pt')
    const cb = screen.getByTestId('item-equipped-wu') as HTMLInputElement
    expect(cb.checked).toBe(false)
  })

  it('does not show quantity badge for quantity=1', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const itemEl = screen.getByTestId('inventory-item-w1')
    expect(itemEl.textContent).not.toContain('×3')
    expect(itemEl.textContent).not.toContain('×1')
  })

  it('shows quantity badge for quantity > 1', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const itemEl = screen.getByTestId('inventory-item-c1')
    expect(itemEl.textContent).toContain('×3')
  })
})

// ── InventoryList — add item interaction ──────────────────────────────────────

describe('InventoryList — add item interaction', () => {
  beforeEach(() => { localStorage.clear() })

  it('calls onUpdate with new item appended to inventory when add-weapon clicked', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<InventoryList character={BASE_CHAR} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-item-weapon'))
    expect(onUpdate).toHaveBeenCalledOnce()
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    expect(call.inventory).toHaveLength(BASE_CHAR.inventory.length + 1)
    const newItem = call.inventory[call.inventory.length - 1]!
    expect(newItem.category).toBe('weapon')
    expect(newItem.name).toBe('')
    expect(newItem.quantity).toBe(1)
    expect(newItem.equipped).toBe(false)
  })

  it('calls onUpdate with correct category when add-armor clicked', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<InventoryList character={BASE_CHAR} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-item-armor'))
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    const newItem = call.inventory[call.inventory.length - 1]!
    expect(newItem.category).toBe('armor')
  })

  it('new item has a UUID-shaped id', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<InventoryList character={BASE_CHAR} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-item-misc'))
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    const newId = call.inventory[call.inventory.length - 1]!.id
    expect(newId).toMatch(/^[0-9a-f-]{36}$/)
  })
})

// ── InventoryList — equipped toggle interaction ───────────────────────────────

describe('InventoryList — equipped toggle interaction', () => {
  beforeEach(() => { localStorage.clear() })

  it('calls onUpdate with equipped toggled to true for weapon item', () => {
    const charWithUnequippedWeapon: Character = {
      ...BASE_CHAR,
      inventory: [makeItem({ id: 'wu', category: 'weapon', equipped: false })],
    }
    const onUpdate = vi.fn()
    renderWithI18n(<InventoryList character={charWithUnequippedWeapon} onUpdate={onUpdate} />, 'pt')
    const cb = screen.getByTestId('item-equipped-wu') as HTMLInputElement
    fireEvent.click(cb)
    expect(onUpdate).toHaveBeenCalledOnce()
    const updatedInventory = (onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }).inventory
    const item = updatedInventory.find(i => i.id === 'wu')!
    expect(item.equipped).toBe(true)
  })
})

// ── InventoryList — category labels i18n ─────────────────────────────────────

describe('InventoryList — category labels i18n', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows armor category in PT', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const armorSection = screen.getByTestId('inventory-category-armor')
    expect(armorSection.textContent?.toUpperCase()).toContain('ARMADURA')
  })

  it('shows armor category in EN', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'en')
    const armorSection = screen.getByTestId('inventory-category-armor')
    expect(armorSection.textContent?.toUpperCase()).toContain('ARMOR')
  })

  it('shows consumable category in PT', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const section = screen.getByTestId('inventory-category-consumable')
    expect(section.textContent?.toUpperCase()).toContain('CONSUMÍVEIS')
  })

  it('shows tool category in EN', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'en')
    const section = screen.getByTestId('inventory-category-tool')
    expect(section.textContent?.toUpperCase()).toContain('TOOL')
  })

  it('shows misc category in PT', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const section = screen.getByTestId('inventory-category-misc')
    expect(section.textContent).toBeDefined()
  })
})

// ── isEquippableCategory ──────────────────────────────────────────────────────

describe('isEquippableCategory', () => {
  it('returns true for weapon', () => {
    expect(isEquippableCategory('weapon')).toBe(true)
  })

  it('returns true for armor', () => {
    expect(isEquippableCategory('armor')).toBe(true)
  })

  it('returns false for consumable', () => {
    expect(isEquippableCategory('consumable')).toBe(false)
  })

  it('returns false for tool', () => {
    expect(isEquippableCategory('tool')).toBe(false)
  })

  it('returns false for misc', () => {
    expect(isEquippableCategory('misc')).toBe(false)
  })
})

// ── InventoryList — equipped checkbox visibility by category ──────────────────

describe('InventoryList — equipped checkbox visibility by category', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows equipped checkbox for weapon items', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    expect(screen.getByTestId('item-equipped-w1')).toBeDefined()
  })

  it('shows equipped checkbox for armor items', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    expect(screen.getByTestId('item-equipped-a1')).toBeDefined()
  })

  it('hides equipped checkbox for consumable items', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    expect(screen.queryByTestId('item-equipped-c1')).toBeNull()
  })

  it('hides equipped checkbox for tool items', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    expect(screen.queryByTestId('item-equipped-t1')).toBeNull()
  })

  it('hides equipped checkbox for misc items', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    expect(screen.queryByTestId('item-equipped-m1')).toBeNull()
  })

  it('shows placeholder element for non-equippable items to preserve alignment', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    expect(screen.getByTestId('item-equipped-placeholder-c1')).toBeDefined()
    expect(screen.getByTestId('item-equipped-placeholder-t1')).toBeDefined()
    expect(screen.getByTestId('item-equipped-placeholder-m1')).toBeDefined()
  })

  it('preserves equipped=true value in domain when category is non-equippable', () => {
    // Item starts as weapon with equipped=true, then "saved" as consumable
    // The UI hides the checkbox but the value stays in domain
    const charWithEquippedConsumable: Character = {
      ...BASE_CHAR,
      inventory: [
        makeItem({ id: 'x1', category: 'consumable', equipped: true }),
      ],
    }
    renderWithI18n(<InventoryList character={charWithEquippedConsumable} />, 'pt')
    // No checkbox rendered
    expect(screen.queryByTestId('item-equipped-x1')).toBeNull()
    // But placeholder is there
    expect(screen.getByTestId('item-equipped-placeholder-x1')).toBeDefined()
  })

  it('reveals equipped checkbox and value when category is weapon', () => {
    const charWithWeapon: Character = {
      ...BASE_CHAR,
      inventory: [
        makeItem({ id: 'x2', category: 'weapon', equipped: true }),
      ],
    }
    renderWithI18n(<InventoryList character={charWithWeapon} />, 'pt')
    const cb = screen.getByTestId('item-equipped-x2') as HTMLInputElement
    expect(cb.checked).toBe(true)
  })
})

// ── InventoryList — total weight display ──────────────────────────────────────

describe('InventoryList — total weight display', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows correct total weight for BASE_CHAR (3 + 6 + 1.5 + 10 + 5 = 25.5 lb)', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const totalEl = screen.getByTestId('inventory-total-weight')
    expect(totalEl.textContent).toContain('25.5 lb')
  })

  it('shows max capacity based on STR (16 × 15 = 240 lb)', () => {
    renderWithI18n(<InventoryList character={BASE_CHAR} />, 'pt')
    const totalEl = screen.getByTestId('inventory-total-weight')
    expect(totalEl.textContent).toContain('240')
  })
})
