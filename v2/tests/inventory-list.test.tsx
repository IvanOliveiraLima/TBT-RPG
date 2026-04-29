import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { InventoryList } from '@/components/sheet/parts/InventoryList'

// Kanaan — Monk 5 with 4 items (mirrors full-character.json fixture)
const KANAAN: Character = {
  id: 'kanaan_01',
  name: 'Kanaan Duskwalker',
  race: 'Human',
  background: 'Hermit',
  alignment: 'Lawful Neutral',
  classes: [{ name: 'Monk', level: 5, hitDie: 8 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 14, dex: 16, con: 14, int: 10, wis: 14, cha: 8 },
  proficiencyBonus: 3,
  hp: { current: 38, max: 38, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15, initiative: 3, speed: 40,
  passivePerception: 15, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [
    { id: 'inv_0', name: 'Shortsword',      quantity: 1, weight: 2   },
    { id: 'inv_1', name: "Explorer's Pack", quantity: 1, weight: 59  },
    { id: 'inv_2', name: '10 darts',        quantity: 1, weight: 2.5 },
    { id: 'inv_3', name: 'Herbalism kit',   quantity: 1, weight: 3   },
  ],
  currency: { pp: 0, gp: 15, ep: 0, sp: 5, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

const EMPTY_INVENTORY: Character = {
  ...KANAAN,
  inventory: [],
}

describe('InventoryList', () => {
  it('renders inventory-list testid', () => {
    render(<InventoryList character={KANAAN} />)
    expect(screen.getByTestId('inventory-list')).toBeDefined()
  })

  it('renders all 4 items for Kanaan', () => {
    render(<InventoryList character={KANAAN} />)
    expect(screen.getByTestId('inventory-item-inv_0')).toBeDefined()
    expect(screen.getByTestId('inventory-item-inv_1')).toBeDefined()
    expect(screen.getByTestId('inventory-item-inv_2')).toBeDefined()
    expect(screen.getByTestId('inventory-item-inv_3')).toBeDefined()
  })

  it('shows item names', () => {
    render(<InventoryList character={KANAAN} />)
    expect(screen.getByText('Shortsword')).toBeDefined()
    expect(screen.getByText("Explorer's Pack")).toBeDefined()
    expect(screen.getByText('10 darts')).toBeDefined()
    expect(screen.getByText('Herbalism kit')).toBeDefined()
  })

  it('shows weight for first item as "2 lb"', () => {
    render(<InventoryList character={KANAAN} />)
    expect(screen.getByText('2 lb')).toBeDefined()
  })

  it('shows decimal weight "2.5 lb" for darts', () => {
    render(<InventoryList character={KANAAN} />)
    expect(screen.getByText('2.5 lb')).toBeDefined()
  })

  it('shows total weight in header (2 + 59 + 2.5 + 3 = 66.5 lb)', () => {
    render(<InventoryList character={KANAAN} />)
    const totalEl = screen.getByTestId('inventory-total-weight')
    expect(totalEl.textContent).toContain('66.5 lb')
  })

  it('preserves insertion order (Shortsword before Herbalism kit)', () => {
    render(<InventoryList character={KANAAN} />)
    const list = screen.getByTestId('inventory-list')
    const items = list.querySelectorAll('[data-testid^="inventory-item-"]')
    expect(items[0]?.textContent).toContain('Shortsword')
    expect(items[3]?.textContent).toContain('Herbalism kit')
  })

  it('shows item count "(4)" in header', () => {
    render(<InventoryList character={KANAAN} />)
    const list = screen.getByTestId('inventory-list')
    expect(list.textContent).toContain('(4)')
  })

  it('shows "+ Adicionar" button', () => {
    render(<InventoryList character={KANAAN} />)
    expect(screen.getByTestId('add-item-btn')).toBeDefined()
  })

  it('shows remove button for each item', () => {
    render(<InventoryList character={KANAAN} />)
    expect(screen.getByTestId('remove-item-inv_0')).toBeDefined()
    expect(screen.getByTestId('remove-item-inv_3')).toBeDefined()
  })

  it('shows empty state when inventory is empty', () => {
    render(<InventoryList character={EMPTY_INVENTORY} />)
    expect(screen.getByTestId('inventory-empty-state')).toBeDefined()
    expect(screen.getByText('Nenhum item registrado.')).toBeDefined()
  })

  it('empty state shows help text', () => {
    render(<InventoryList character={EMPTY_INVENTORY} />)
    expect(screen.getByText('Adicione itens para gerenciar seu inventário.')).toBeDefined()
  })

  it('shows item count "(0)" for empty inventory', () => {
    render(<InventoryList character={EMPTY_INVENTORY} />)
    const list = screen.getByTestId('inventory-list')
    expect(list.textContent).toContain('(0)')
  })

  it('still shows "+ Adicionar" when empty', () => {
    render(<InventoryList character={EMPTY_INVENTORY} />)
    expect(screen.getByTestId('add-item-btn')).toBeDefined()
  })

  it('total weight shows "0 lb" for empty inventory', () => {
    render(<InventoryList character={EMPTY_INVENTORY} />)
    const totalEl = screen.getByTestId('inventory-total-weight')
    expect(totalEl.textContent).toContain('0 lb')
  })
})
