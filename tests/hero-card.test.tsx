import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { HeroCard } from '@/components/sheet/parts/HeroCard'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'char_hero_test',
  name: 'Eira Swiftwind',
  race: 'Elfo',
  background: 'Outlander',
  alignment: 'Caótico e Bom',
  classes: [{ name: 'Ranger', level: 4, hitDie: 10 }],
  experience: 2700,
  abilities: { str: 10, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 32, max: 32, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 4, max: 4, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15, initiative: 4, speed: 35,
  passivePerception: 15, spellSaveDC: 13, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 20, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('HeroCard', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders character name', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.getByText('Eira Swiftwind')).toBeDefined()
  })

  it('shows "Inspirado" badge in PT when inspiration is true', () => {
    renderWithI18n(<HeroCard character={{ ...BASE, inspiration: true }} />, 'pt')
    expect(screen.getByText('Inspirado')).toBeDefined()
  })

  it('shows "Inspired" badge in EN when inspiration is true', () => {
    renderWithI18n(<HeroCard character={{ ...BASE, inspiration: true }} />, 'en')
    expect(screen.getByText('Inspired')).toBeDefined()
  })

  it('hides inspiration badge when inspiration is false', () => {
    renderWithI18n(<HeroCard character={{ ...BASE, inspiration: false }} />, 'pt')
    expect(screen.queryByText('Inspirado')).toBeNull()
    expect(screen.queryByText('Inspired')).toBeNull()
  })

  it('renders portrait via background-image when character.images.character is set', () => {
    const portrait = 'data:image/png;base64,AAAA'
    const { container } = renderWithI18n(
      <HeroCard character={{ ...BASE, images: { character: portrait } }} />,
      'pt',
    )
    const portraitEl = container.querySelector('[style*="url("]')
    expect(portraitEl).not.toBeNull()
  })

  it('renders name initial as placeholder when no portrait', () => {
    renderWithI18n(<HeroCard character={{ ...BASE, images: {} }} />, 'pt')
    const initials = screen.getAllByText('E')
    expect(initials.length).toBeGreaterThanOrEqual(1)
  })

  it('renders race in meta line', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.getByText('Elfo')).toBeDefined()
  })

  it('renders class + level in meta line', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.getByText('Ranger 4')).toBeDefined()
  })

  it('renders background in meta line', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.getByText('Outlander')).toBeDefined()
  })

  it('renders total level in ruby badge', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    const fours = screen.getAllByText('4')
    expect(fours.length).toBeGreaterThanOrEqual(1)
  })

  it('does not crash when race and background are empty strings', () => {
    const { container } = renderWithI18n(
      <HeroCard character={{ ...BASE, race: '', background: '' }} />,
      'pt',
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('does not crash when classes array is empty', () => {
    const { container } = renderWithI18n(
      <HeroCard character={{ ...BASE, classes: [] }} />,
      'pt',
    )
    expect(container.firstChild).not.toBeNull()
  })
})

describe('HeroCard — editable mode', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders name as input when onUpdate is provided', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('hero-name-input') as HTMLInputElement
    expect(input.value).toBe('Eira Swiftwind')
  })

  it('calls onUpdate with new name on input change', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HeroCard character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hero-name-input'), { target: { value: 'Lyra Moonveil' } })
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Lyra Moonveil' })
  })

  it('renders XP input when onUpdate is provided', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('hero-xp-input') as HTMLInputElement
    expect(input.value).toBe('2700')
  })

  it('calls onUpdate with new XP on input change', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HeroCard character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hero-xp-input'), { target: { value: '5000' } })
    expect(onUpdate).toHaveBeenCalledWith({ experience: 5000 })
  })

  it('shows derived total level (read-only) in hero-level span', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    const levelSpan = screen.getByTestId('hero-level')
    expect(levelSpan.textContent).toBe('4')
  })

  it('shows name label in PT', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Nome')).toBeDefined()
  })

  it('shows name label in EN', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('Name')).toBeDefined()
  })

  it('shows level label in PT', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Nível')).toBeDefined()
  })

  it('shows level label in EN', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getAllByText('Level').length).toBeGreaterThanOrEqual(1)
  })

  it('shows XP label in both PT and EN', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('XP')).toBeDefined()
  })

  it('read-only mode: name shown as text not input', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.queryByTestId('hero-name-input')).toBeNull()
    expect(screen.getByText('Eira Swiftwind')).toBeDefined()
  })

  it('read-only mode: XP not rendered', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.queryByTestId('hero-xp-input')).toBeNull()
  })
})

describe('HeroCard — identity fields (editable)', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders race input with character.race value', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('hero-race-input') as HTMLInputElement
    expect(input.value).toBe('Elfo')
  })

  it('calls onUpdate with new race on input change', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HeroCard character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hero-race-input'), { target: { value: 'Anão' } })
    expect(onUpdate).toHaveBeenCalledWith({ race: 'Anão' })
  })

  it('accepts non-canonical race values', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HeroCard character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hero-race-input'), { target: { value: 'Half-Orc Custom' } })
    expect(onUpdate).toHaveBeenCalledWith({ race: 'Half-Orc Custom' })
  })

  it('renders background input with character.background value', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('hero-background-input') as HTMLInputElement
    expect(input.value).toBe('Outlander')
  })

  it('calls onUpdate with new background on input change', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HeroCard character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hero-background-input'), { target: { value: 'Sage' } })
    expect(onUpdate).toHaveBeenCalledWith({ background: 'Sage' })
  })

  it('renders AlignmentSelect in editable mode', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('alignment-select')).toBeDefined()
  })

  it('calls onUpdate with new alignment when AlignmentSelect changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HeroCard character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('alignment-select'), { target: { value: 'Lawful Good' } })
    expect(onUpdate).toHaveBeenCalledWith({ alignment: 'Lawful Good' })
  })

  it('renders ClassEditor with class rows', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('class-editor')).toBeDefined()
    expect(screen.getByTestId('class-row-0')).toBeDefined()
  })

  it('renders inspiration checkbox reflecting character.inspiration=false', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    const cb = screen.getByTestId('hero-inspiration-checkbox') as HTMLInputElement
    expect(cb.checked).toBe(false)
  })

  it('renders inspiration checkbox reflecting character.inspiration=true', () => {
    renderWithI18n(
      <HeroCard character={{ ...BASE, inspiration: true }} onUpdate={vi.fn()} />, 'pt'
    )
    const cb = screen.getByTestId('hero-inspiration-checkbox') as HTMLInputElement
    expect(cb.checked).toBe(true)
  })

  it('toggling inspiration calls onUpdate with new value', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HeroCard character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('hero-inspiration-checkbox'))
    expect(onUpdate).toHaveBeenCalledWith({ inspiration: true })
  })

  it('shows race label in PT', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Raça')).toBeDefined()
  })

  it('shows background label in PT', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Antecedente')).toBeDefined()
  })

  it('shows alignment label in PT', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Alinhamento')).toBeDefined()
  })

  it('shows classes label in PT', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Classes')).toBeDefined()
  })

  it('shows inspiration label in PT', () => {
    renderWithI18n(<HeroCard character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Inspiração')).toBeDefined()
  })

  it('read-only mode: race input not rendered', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.queryByTestId('hero-race-input')).toBeNull()
  })

  it('read-only mode: background input not rendered', () => {
    renderWithI18n(<HeroCard character={BASE} />, 'pt')
    expect(screen.queryByTestId('hero-background-input')).toBeNull()
  })
})
