import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SheetLayout } from '@/components/sheet/SheetLayout'
import type { Character } from '@/domain/character'

const MOCK_CHARACTER: Character = {
  id: 'char_test_layout',
  name: 'Eira Swiftwind',
  race: 'Elfo',
  background: 'Outlander',
  alignment: 'Caótico e Bom',
  classes: [{ name: 'Ranger', level: 4, hitDie: 10 }],
  totalLevel: 4,
  experience: 2700,
  abilities: { str: 10, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 32, max: 32, temp: 0 },
  hitDice: [{ current: 4, max: 4, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15, initiative: 4, speed: 35,
  passivePerception: 15, spellSaveDC: 13, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 20, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

function Wrapper({ activeTab = 'status' as const, onTabChange = () => undefined }) {
  return (
    <MemoryRouter>
      <SheetLayout
        character={MOCK_CHARACTER}
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
        <div data-testid="tab-content">placeholder</div>
      </SheetLayout>
    </MemoryRouter>
  )
}

describe('SheetLayout', () => {
  it('renders the character name in the mobile header', () => {
    render(<Wrapper />)
    // Name appears in MobileHeader (sticky header)
    const names = screen.getAllByText('Eira Swiftwind')
    expect(names.length).toBeGreaterThanOrEqual(1)
  })

  it('renders both desktop and mobile shells simultaneously in the DOM', () => {
    const { container } = render(<Wrapper />)
    // lg:hidden wraps mobile; hidden lg:block wraps desktop
    const lgHiddenDivs = container.querySelectorAll('.lg\\:hidden')
    const hiddenLgDivs = container.querySelectorAll('.hidden')
    expect(lgHiddenDivs.length).toBeGreaterThanOrEqual(1)
    expect(hiddenLgDivs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the tab content children in both shells', () => {
    render(<Wrapper />)
    // Both mobile and desktop mount children → 2 instances
    const slots = screen.getAllByTestId('tab-content')
    expect(slots.length).toBe(2)
  })

  it('renders the bottom tab bar with all 5 mobile tabs', () => {
    render(<Wrapper />)
    // Status, Combate, Magias, Inv, Lore buttons in BottomTabBar
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Combate').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Magias').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Inv').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Lore').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the 6 desktop sidebar nav items including Notas', () => {
    render(<Wrapper />)
    // Desktop sidebar has Atributos, Combate & Skills, Magias, Inventário, História, Notas
    expect(screen.getAllByText('Atributos').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Notas').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the open menu button (hamburger) in mobile header', () => {
    render(<Wrapper />)
    expect(screen.getByLabelText('Abrir menu')).toBeDefined()
  })
})
