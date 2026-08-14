import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SheetLayout } from '@/components/sheet/SheetLayout'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'
import { mockViewport, resetViewport } from './helpers/viewport'

const MOCK_CHARACTER: Character = {
  id: 'char_test_layout',
  name: 'Eira Swiftwind',
  race: 'Elfo',
  background: 'Outlander',
  alignment: 'Caótico e Bom',
  classes: [{ name: 'Ranger', level: 4, hitDie: 10 }],
  experience: 2700,
  abilities: { str: 10, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  hp: { current: 32, max: 32, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 4, max: 4, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15, initiative: 4, speed: 35,
  inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 20, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
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

describe('SheetLayout — mobile shell (viewport < 1024px)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockViewport('mobile')
  })

  afterEach(resetViewport)

  it('mounts only the mobile shell when the viewport is mobile', () => {
    renderWithI18n(<Wrapper />, 'pt')
    const slots = screen.getAllByTestId('tab-content')
    expect(slots.length).toBe(1)
  })

  it('renders the character name in the mobile header', () => {
    renderWithI18n(<Wrapper />, 'pt')
    const names = screen.getAllByText('Eira Swiftwind')
    expect(names.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the bottom tab bar with all 5 mobile tabs in PT', () => {
    renderWithI18n(<Wrapper />, 'pt')
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Combate').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Magias').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Inv').length).toBeGreaterThanOrEqual(1)
    // PT: tab.lore = 'Histórico'
    expect(screen.getAllByText('Histórico').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the bottom tab bar with all 5 mobile tabs in EN', () => {
    renderWithI18n(<Wrapper />, 'en')
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Combat').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Spells').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Inv').length).toBeGreaterThanOrEqual(1)
    // EN: tab.lore = 'Lore'
    expect(screen.getAllByText('Lore').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the open menu button in PT (aria-label translated)', () => {
    renderWithI18n(<Wrapper />, 'pt')
    expect(screen.getByLabelText('Abrir menu')).toBeDefined()
  })

  it('renders the open menu button in EN (aria-label translated)', () => {
    renderWithI18n(<Wrapper />, 'en')
    expect(screen.getByLabelText('Open menu')).toBeDefined()
  })
})

describe('SheetLayout — desktop shell (viewport >= 1024px)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockViewport('desktop')
  })

  afterEach(resetViewport)

  it('mounts only the desktop shell on the desktop viewport', () => {
    renderWithI18n(<Wrapper />, 'pt')
    const slots = screen.getAllByTestId('tab-content')
    expect(slots.length).toBe(1)
  })

  it('renders the 5 desktop sidebar nav items in PT (Notas removed)', () => {
    renderWithI18n(<Wrapper />, 'pt')
    expect(screen.getAllByText('Atributos').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('História').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Notas')).toBeNull()
  })

  it('renders the 5 desktop sidebar nav items in EN', () => {
    renderWithI18n(<Wrapper />, 'en')
    expect(screen.getAllByText('Attributes').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Lore').length).toBeGreaterThanOrEqual(1)
  })
})
