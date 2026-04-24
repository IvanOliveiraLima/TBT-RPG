import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroCard } from '@/components/sheet/parts/HeroCard'
import type { Character } from '@/domain/character'

const BASE: Character = {
  id: 'char_hero_test',
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
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 20, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  allies: '', notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('HeroCard', () => {
  it('renders character name', () => {
    render(<HeroCard character={BASE} />)
    expect(screen.getByText('Eira Swiftwind')).toBeDefined()
  })

  it('shows "Inspirado" badge when inspiration is true', () => {
    render(<HeroCard character={{ ...BASE, inspiration: true }} />)
    expect(screen.getByText('Inspirado')).toBeDefined()
  })

  it('hides "Inspirado" badge when inspiration is false', () => {
    render(<HeroCard character={{ ...BASE, inspiration: false }} />)
    expect(screen.queryByText('Inspirado')).toBeNull()
  })

  it('renders portrait via background-image when character.images.character is set', () => {
    const portrait = 'data:image/png;base64,AAAA'
    const { container } = render(
      <HeroCard character={{ ...BASE, images: { character: portrait } }} />,
    )
    const portraitEl = container.querySelector('[style*="url("]')
    expect(portraitEl).not.toBeNull()
  })

  it('renders name initial as placeholder when no portrait', () => {
    render(<HeroCard character={{ ...BASE, images: {} }} />)
    // 'E' is the first letter of 'Eira'
    const initials = screen.getAllByText('E')
    expect(initials.length).toBeGreaterThanOrEqual(1)
  })

  it('renders race in meta line', () => {
    render(<HeroCard character={BASE} />)
    expect(screen.getByText('Elfo')).toBeDefined()
  })

  it('renders class + level in meta line', () => {
    render(<HeroCard character={BASE} />)
    expect(screen.getByText('Ranger 4')).toBeDefined()
  })

  it('renders background in meta line', () => {
    render(<HeroCard character={BASE} />)
    expect(screen.getByText('Outlander')).toBeDefined()
  })

  it('renders total level in ruby badge', () => {
    render(<HeroCard character={BASE} />)
    // Level "4" appears in the small badge
    const fours = screen.getAllByText('4')
    expect(fours.length).toBeGreaterThanOrEqual(1)
  })

  it('does not crash when race and background are empty strings', () => {
    const { container } = render(
      <HeroCard character={{ ...BASE, race: '', background: '' }} />,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('does not crash when classes array is empty', () => {
    const { container } = render(
      <HeroCard character={{ ...BASE, classes: [] }} />,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
