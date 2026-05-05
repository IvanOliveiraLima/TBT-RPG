import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character, Feature } from '@/domain/character'
import { FeaturesList } from '@/components/sheet/parts/FeaturesList'
import { renderWithI18n } from './helpers/render'

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
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: FEATURES,
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('FeaturesList', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders all features', () => {
    renderWithI18n(<FeaturesList character={BASE} />, 'pt')
    expect(screen.getByTestId('feature-f1')).toBeDefined()
    expect(screen.getByTestId('feature-f2')).toBeDefined()
    expect(screen.getByTestId('feature-f3')).toBeDefined()
    expect(screen.getByTestId('feature-f4')).toBeDefined()
  })

  it('shows feature names', () => {
    renderWithI18n(<FeaturesList character={BASE} />, 'pt')
    expect(screen.getByText('Druidic')).toBeDefined()
    expect(screen.getByText('Wild Shape')).toBeDefined()
    expect(screen.getByText('Stonecunning')).toBeDefined()
  })

  it('shows feature source text', () => {
    renderWithI18n(<FeaturesList character={BASE} />, 'pt')
    expect(screen.getAllByText('Classe').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Raça')).toBeDefined()
  })

  it('shows uses badge for active features with usesMax', () => {
    renderWithI18n(<FeaturesList character={BASE} />, 'pt')
    expect(screen.getByText('2/2')).toBeDefined()
  })

  it('shows 0/1 uses badge when all uses spent', () => {
    renderWithI18n(<FeaturesList character={BASE} />, 'pt')
    expect(screen.getByText('0/1')).toBeDefined()
  })

  it('does not show uses badge for passive features', () => {
    renderWithI18n(<FeaturesList character={BASE} />, 'pt')
    const druidicRow = screen.getByTestId('feature-f1')
    expect(druidicRow.querySelector('span[style*="inline-flex"]')).toBeNull()
  })

  it('shows gold diamond icon for each feature', () => {
    renderWithI18n(<FeaturesList character={BASE} />, 'pt')
    const list = screen.getByTestId('features-list')
    const diamonds = list.querySelectorAll('span')
    const goldSpans = Array.from(diamonds).filter(
      (s) => (s as HTMLElement).style.color === 'rgb(212, 160, 23)',
    )
    expect(goldSpans.length).toBeGreaterThanOrEqual(4)
  })

  it('shows PT empty state text', () => {
    renderWithI18n(<FeaturesList character={{ ...BASE, features: [] }} />, 'pt')
    expect(screen.getByTestId('features-empty')).toBeDefined()
    expect(screen.getByText('Nenhuma feature registrada.')).toBeDefined()
  })

  it('shows EN empty state text', () => {
    renderWithI18n(<FeaturesList character={{ ...BASE, features: [] }} />, 'en')
    expect(screen.getByText('No features recorded.')).toBeDefined()
  })

  it('does not render features-list container when empty', () => {
    renderWithI18n(<FeaturesList character={{ ...BASE, features: [] }} />, 'pt')
    expect(screen.queryByTestId('features-list')).toBeNull()
  })
})
