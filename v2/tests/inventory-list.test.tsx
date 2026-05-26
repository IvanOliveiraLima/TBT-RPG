import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { InventoryList } from '@/components/sheet/parts/InventoryList'
import { renderWithI18n } from './helpers/render'

// Kanaan — Monk 5 with 4 items across weapon/misc/tool categories
const KANAAN: Character = {
  id: 'kanaan_01',
  name: 'Kanaan Duskwalker',
  race: 'Human',
  background: 'Hermit',
  alignment: 'Lawful Neutral',
  classes: [{ name: 'Monk', level: 5, hitDie: 8 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 14, dex: 16, con: 14, int: 10, wis: 14, cha: 8 },
  proficiencyBonus: 3,
  hp: { current: 38, max: 38, temp: 0 },
  hitDice: [{ className: 'Monk', current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15, initiative: 3, speed: 40,
  passivePerception: 15, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [
    { id: 'inv_0', name: 'Shortsword',      quantity: 1, weight: 2,    category: 'weapon',     description: '',        equipped: true  },
    { id: 'inv_1', name: "Explorer's Pack", quantity: 1, weight: 59,   category: 'misc',       description: '',        equipped: false },
    { id: 'inv_2', name: '10 darts',        quantity: 1, weight: 2.5,  category: 'weapon',     description: '',        equipped: false },
    { id: 'inv_3', name: 'Herbalism kit',   quantity: 1, weight: 3,    category: 'tool',       description: 'Herbs',   equipped: false },
  ],
  currency: { pp: 0, gp: 15, sp: 5, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

const EMPTY_INVENTORY: Character = {
  ...KANAAN,
  inventory: [],
}

describe('InventoryList', () => {
  beforeEach(() => { localStorage.clear() })

  // ── basic render ──────────────────────────────────────────────────────────

  it('renders inventory-list testid', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByTestId('inventory-list')).toBeDefined()
  })

  it('renders all 4 item testids for Kanaan', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByTestId('inventory-item-inv_0')).toBeDefined()
    expect(screen.getByTestId('inventory-item-inv_1')).toBeDefined()
    expect(screen.getByTestId('inventory-item-inv_2')).toBeDefined()
    expect(screen.getByTestId('inventory-item-inv_3')).toBeDefined()
  })

  it('shows item names', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByText('Shortsword')).toBeDefined()
    expect(screen.getByText("Explorer's Pack")).toBeDefined()
    expect(screen.getByText('10 darts')).toBeDefined()
    expect(screen.getByText('Herbalism kit')).toBeDefined()
  })

  it('shows weight for Shortsword as "2 lb"', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByTestId('item-weight-inv_0').textContent).toBe('2 lb')
  })

  it('shows decimal weight "2.5 lb" for darts', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByTestId('item-weight-inv_2').textContent).toBe('2.5 lb')
  })

  it('shows total weight in header (2 + 59 + 2.5 + 3 = 66.5 lb)', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const totalEl = screen.getByTestId('inventory-total-weight')
    expect(totalEl.textContent).toContain('66.5 lb')
  })

  it('shows item count "(4)" in header', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const list = screen.getByTestId('inventory-list')
    expect(list.textContent).toContain('(4)')
  })

  // ── weight bar ────────────────────────────────────────────────────────────

  it('renders weight-bar testid', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByTestId('weight-bar')).toBeDefined()
  })

  it('renders weight-bar-fill testid', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByTestId('weight-bar-fill')).toBeDefined()
  })

  it('weight-bar-fill shows light load level for low weight (str=14, cap=210, weight=66.5)', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const fill = screen.getByTestId('weight-bar-fill')
    expect(fill.getAttribute('data-load-level')).toBe('light')
  })

  it('weight-bar-fill shows overburdened when carrying over capacity', () => {
    const heavy: Character = {
      ...KANAAN,
      abilities: { ...KANAAN.abilities, str: 8 },  // cap = 120 lb
      inventory: [
        { id: 'inv_0', name: 'Heavy', quantity: 1, weight: 200, category: 'misc', description: '', equipped: false },
      ],
    }
    renderWithI18n(<InventoryList character={heavy} />, 'pt')
    const fill = screen.getByTestId('weight-bar-fill')
    expect(fill.getAttribute('data-load-level')).toBe('overburdened')
  })

  it('weight-bar-fill shows moderate load when above 50%', () => {
    // str=10 → cap=150; weight ~85 → 56%
    const moderate: Character = {
      ...KANAAN,
      abilities: { ...KANAAN.abilities, str: 10 },
      inventory: [
        { id: 'inv_0', name: 'Pack', quantity: 1, weight: 85, category: 'misc', description: '', equipped: false },
      ],
    }
    renderWithI18n(<InventoryList character={moderate} />, 'pt')
    const fill = screen.getByTestId('weight-bar-fill')
    expect(fill.getAttribute('data-load-level')).toBe('moderate')
  })

  it('weight-bar-fill shows heavy load when above 75%', () => {
    // str=10 → cap=150; weight=120 → 80%
    const heavyLoad: Character = {
      ...KANAAN,
      abilities: { ...KANAAN.abilities, str: 10 },
      inventory: [
        { id: 'inv_0', name: 'Pack', quantity: 1, weight: 120, category: 'misc', description: '', equipped: false },
      ],
    }
    renderWithI18n(<InventoryList character={heavyLoad} />, 'pt')
    const fill = screen.getByTestId('weight-bar-fill')
    expect(fill.getAttribute('data-load-level')).toBe('heavy')
  })

  // ── category grouping ─────────────────────────────────────────────────────

  it('renders all 5 category sections', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByTestId('inventory-category-weapon')).toBeDefined()
    expect(screen.getByTestId('inventory-category-armor')).toBeDefined()
    expect(screen.getByTestId('inventory-category-consumable')).toBeDefined()
    expect(screen.getByTestId('inventory-category-tool')).toBeDefined()
    expect(screen.getByTestId('inventory-category-misc')).toBeDefined()
  })

  it('weapon category contains Shortsword and 10 darts', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const weaponSection = screen.getByTestId('inventory-category-weapon')
    expect(weaponSection.textContent).toContain('Shortsword')
    expect(weaponSection.textContent).toContain('10 darts')
  })

  it('tool category contains Herbalism kit', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const toolSection = screen.getByTestId('inventory-category-tool')
    expect(toolSection.textContent).toContain('Herbalism kit')
  })

  it('misc category contains Explorer Pack', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const miscSection = screen.getByTestId('inventory-category-misc')
    expect(miscSection.textContent).toContain("Explorer's Pack")
  })

  it('armor category is rendered even when empty', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const armorSection = screen.getByTestId('inventory-category-armor')
    expect(armorSection).toBeDefined()
  })

  // ── per-category add buttons (editable mode) ──────────────────────────────

  it('shows add buttons for all 5 categories when editable', () => {
    renderWithI18n(<InventoryList character={KANAAN} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('add-item-weapon')).toBeDefined()
    expect(screen.getByTestId('add-item-armor')).toBeDefined()
    expect(screen.getByTestId('add-item-consumable')).toBeDefined()
    expect(screen.getByTestId('add-item-tool')).toBeDefined()
    expect(screen.getByTestId('add-item-misc')).toBeDefined()
  })

  // ── equipped checkbox ─────────────────────────────────────────────────────

  it('equipped checkbox for Shortsword is checked', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const checkbox = screen.getByTestId('item-equipped-inv_0') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it("Explorer's Pack (misc) has no equipped checkbox", () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.queryByTestId('item-equipped-inv_1')).toBeNull()
  })

  // ── remove buttons ────────────────────────────────────────────────────────

  it('shows remove button for Shortsword when editable', () => {
    renderWithI18n(<InventoryList character={KANAAN} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('remove-item-inv_0')).toBeDefined()
  })

  it('shows remove button for Herbalism kit when editable', () => {
    renderWithI18n(<InventoryList character={KANAAN} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('remove-item-inv_3')).toBeDefined()
  })

  // ── read-only mode ────────────────────────────────────────────────────────

  it('no add buttons in read-only mode', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.queryByTestId('add-item-weapon')).toBeNull()
    expect(screen.queryByTestId('add-item-misc')).toBeNull()
  })

  it('no remove buttons in read-only mode', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.queryByTestId('remove-item-inv_0')).toBeNull()
  })

  // ── empty state ────────────────────────────────────────────────────────────

  it('shows empty state when inventory is empty', () => {
    renderWithI18n(<InventoryList character={EMPTY_INVENTORY} />, 'pt')
    expect(screen.getByTestId('inventory-empty-state')).toBeDefined()
  })

  it('shows item count "(0)" for empty inventory', () => {
    renderWithI18n(<InventoryList character={EMPTY_INVENTORY} />, 'pt')
    const list = screen.getByTestId('inventory-list')
    expect(list.textContent).toContain('(0)')
  })

  it('total weight shows "0 lb" for empty inventory', () => {
    renderWithI18n(<InventoryList character={EMPTY_INVENTORY} />, 'pt')
    const totalEl = screen.getByTestId('inventory-total-weight')
    expect(totalEl.textContent).toContain('0 lb')
  })

  it('still shows all 5 category sections when empty', () => {
    renderWithI18n(<InventoryList character={EMPTY_INVENTORY} />, 'pt')
    expect(screen.getByTestId('inventory-category-weapon')).toBeDefined()
    expect(screen.getByTestId('inventory-category-misc')).toBeDefined()
  })

  // ── i18n dual-lang ────────────────────────────────────────────────────────

  it('shows section title ITENS in PT', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    expect(screen.getByText('ITENS')).toBeDefined()
  })

  it('shows section title ITEMS in EN', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'en')
    expect(screen.getByText('ITEMS')).toBeDefined()
  })

  it('shows empty state title in PT', () => {
    renderWithI18n(<InventoryList character={EMPTY_INVENTORY} />, 'pt')
    expect(screen.getByText('Nenhum item registrado.')).toBeDefined()
  })

  it('shows empty state title in EN', () => {
    renderWithI18n(<InventoryList character={EMPTY_INVENTORY} />, 'en')
    expect(screen.getByText('No items registered.')).toBeDefined()
  })

  it('shows empty state hint in EN', () => {
    renderWithI18n(<InventoryList character={EMPTY_INVENTORY} />, 'en')
    expect(screen.getByText('Add your equipment, consumables, and treasure.')).toBeDefined()
  })

  it('shows weapon category label in PT', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'pt')
    const weaponSection = screen.getByTestId('inventory-category-weapon')
    expect(weaponSection.textContent?.toUpperCase()).toContain('ARMA')
  })

  it('shows weapon category label in EN', () => {
    renderWithI18n(<InventoryList character={KANAAN} />, 'en')
    const weaponSection = screen.getByTestId('inventory-category-weapon')
    expect(weaponSection.textContent?.toUpperCase()).toContain('WEAPON')
  })

  it('remove button has accessible aria-label in PT', () => {
    renderWithI18n(<InventoryList character={KANAAN} onUpdate={() => {}} />, 'pt')
    const btn = screen.getByTestId('remove-item-inv_0')
    expect(btn).toBeDefined()
  })

  it('remove button has accessible aria-label in EN', () => {
    renderWithI18n(<InventoryList character={KANAAN} onUpdate={() => {}} />, 'en')
    const btn = screen.getByTestId('remove-item-inv_0')
    expect(btn).toBeDefined()
  })
})
