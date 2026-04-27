import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character, Feature } from '@/domain/character'
import { FeaturesList } from '@/components/sheet/parts/FeaturesList'

function feature(
  id: string,
  name: string,
  source: string,
  type: Feature['type'] = 'passive',
  usesLeft?: number,
  usesMax?: number,
): Feature {
  return { id, name, source, description: '', type, usesLeft, usesMax }
}

const FEATURES: Feature[] = [
  feature('f1', 'Druidic', 'Classe', 'passive'),
  feature('f2', 'Wild Shape', 'Classe', 'active', 2, 2),
  feature('f3', 'Stonecunning', 'Raça', 'passive'),
  feature('f4', 'Channel Divinity', 'Classe', 'active', 0, 1),
]

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Dwarf',
  background: 'Hermit',
  alignment: 'NG',
  classes: [{ name: 'Druid', level: 4, hitDie: 8 }],
  totalLevel: 4,
  experience: 0,
  abilities: { str: 10, dex: 12, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 28, max: 28, temp: 0 },
  hitDice: [{ current: 4, max: 4, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 1, speed: 25,
  passivePerception: 13, spellSaveDC: 13, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: FEATURES,
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  allies: '',
  notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('FeaturesList', () => {
  it('renders all features', () => {
    render(<FeaturesList character={BASE} />)
    expect(screen.getByTestId('feature-f1')).toBeDefined()
    expect(screen.getByTestId('feature-f2')).toBeDefined()
    expect(screen.getByTestId('feature-f3')).toBeDefined()
    expect(screen.getByTestId('feature-f4')).toBeDefined()
  })

  it('shows feature names', () => {
    render(<FeaturesList character={BASE} />)
    expect(screen.getByText('Druidic')).toBeDefined()
    expect(screen.getByText('Wild Shape')).toBeDefined()
    expect(screen.getByText('Stonecunning')).toBeDefined()
  })

  it('shows feature source text', () => {
    render(<FeaturesList character={BASE} />)
    expect(screen.getAllByText('Classe').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Raça')).toBeDefined()
  })

  it('shows uses badge for active features with usesMax', () => {
    render(<FeaturesList character={BASE} />)
    // Wild Shape: 2/2
    expect(screen.getByText('2/2')).toBeDefined()
  })

  it('shows 0/1 uses badge when all uses spent', () => {
    render(<FeaturesList character={BASE} />)
    // Channel Divinity: 0/1
    expect(screen.getByText('0/1')).toBeDefined()
  })

  it('does not show uses badge for passive features', () => {
    render(<FeaturesList character={BASE} />)
    // Druidic is passive — no badge in its row
    const druidicRow = screen.getByTestId('feature-f1')
    expect(druidicRow.querySelector('span[style*="inline-flex"]')).toBeNull()
  })

  it('shows gold diamond icon for each feature', () => {
    render(<FeaturesList character={BASE} />)
    const list = screen.getByTestId('features-list')
    const diamonds = list.querySelectorAll('span')
    // At least 4 diamond icons
    const goldSpans = Array.from(diamonds).filter(
      (s) => (s as HTMLElement).style.color === 'rgb(212, 160, 23)',
    )
    expect(goldSpans.length).toBeGreaterThanOrEqual(4)
  })

  it('shows fallback text when features array is empty', () => {
    render(<FeaturesList character={{ ...BASE, features: [] }} />)
    expect(screen.getByTestId('features-empty')).toBeDefined()
    expect(screen.getByText('Nenhuma feature registrada.')).toBeDefined()
  })

  it('does not render features-list container when empty', () => {
    render(<FeaturesList character={{ ...BASE, features: [] }} />)
    expect(screen.queryByTestId('features-list')).toBeNull()
  })
})
