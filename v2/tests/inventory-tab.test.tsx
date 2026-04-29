import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InventoryTab } from '@/components/sheet/tabs/InventoryTab'
import { useCharacterStore } from '@/store/character'
import type { Character } from '@/domain/character'

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
  proficiencies: { weaponsAndArmor: 'Simple weapons, shortswords', tools: 'Herbalism kit', languages: 'Common, Elvish', other: '' },
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

describe('InventoryTab integration', () => {
  afterEach(() => {
    useCharacterStore.setState({ character: null, loading: false, error: null })
  })

  it('renders nothing when character store is empty', () => {
    const { container } = render(<InventoryTab />)
    expect(container.firstChild).toBeNull()
  })

  it('renders InventoryList when character is loaded', () => {
    useCharacterStore.setState({ character: KANAAN, loading: false, error: null })
    render(<InventoryTab />)
    expect(screen.getAllByTestId('inventory-list').length).toBeGreaterThanOrEqual(1)
  })

  it('renders CurrencyBlock when character is loaded', () => {
    useCharacterStore.setState({ character: KANAAN, loading: false, error: null })
    render(<InventoryTab />)
    expect(screen.getAllByTestId('currency-block').length).toBeGreaterThanOrEqual(1)
  })

  it('shows item names', () => {
    useCharacterStore.setState({ character: KANAAN, loading: false, error: null })
    render(<InventoryTab />)
    expect(screen.getAllByText('Shortsword').length).toBeGreaterThanOrEqual(1)
  })

  it('shows currency values', () => {
    useCharacterStore.setState({ character: KANAAN, loading: false, error: null })
    render(<InventoryTab />)
    // GP cell should show "15"
    const gpCells = screen.getAllByTestId('currency-gp')
    expect(gpCells[0]?.textContent).toContain('15')
  })
})
