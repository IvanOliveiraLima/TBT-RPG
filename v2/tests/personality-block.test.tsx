import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { PersonalityBlock } from '@/components/sheet/parts/PersonalityBlock'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'eira_01',
  name: 'Eira Thornwood',
  race: 'Wood Elf',
  background: 'Outlander',
  alignment: 'Neutral Good',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 42, max: 42, temp: 5 },
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 4, speed: 35,
  passivePerception: 16, spellSaveDC: 14, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 20, cp: 5 },
  features: [],
  backstory: 'Guardian of the Thornwood Forest.',
  personality: {
    traits: 'Quiet and observant',
    ideals: 'Protecting the wild',
    bonds: 'Bonded to the forest',
    flaws: 'Distrusts cities',
  },
  notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const EMPTY_PERSONALITY: Character = {
  ...BASE,
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
}

describe('PersonalityBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders personality-block testid', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('personality-block')).toBeDefined()
  })

  it('renders all 4 personality fields (stable key-based testids)', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('personality-field-traits')).toBeDefined()
    expect(screen.getByTestId('personality-field-ideals')).toBeDefined()
    expect(screen.getByTestId('personality-field-bonds')).toBeDefined()
    expect(screen.getByTestId('personality-field-flaws')).toBeDefined()
  })

  it('shows PT labels: Traços, Ideais, Vínculos, Defeitos', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByText('Traços')).toBeDefined()
    expect(screen.getByText('Ideais')).toBeDefined()
    expect(screen.getByText('Vínculos')).toBeDefined()
    expect(screen.getByText('Defeitos')).toBeDefined()
  })

  it('shows traits text', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByText('Quiet and observant')).toBeDefined()
  })

  it('shows ideals text', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByText('Protecting the wild')).toBeDefined()
  })

  it('shows bonds text', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByText('Bonded to the forest')).toBeDefined()
  })

  it('shows flaws text', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByText('Distrusts cities')).toBeDefined()
  })

  it('empty field shows "—" placeholder', () => {
    renderWithI18n(<PersonalityBlock character={EMPTY_PERSONALITY} />, 'pt')
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('shows section title PERSONALIDADE in PT', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'pt')
    expect(screen.getByText('PERSONALIDADE')).toBeDefined()
  })

  it('shows section title PERSONALITY in EN', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'en')
    expect(screen.getByText('PERSONALITY')).toBeDefined()
  })

  it('shows EN labels: Traits, Ideals, Bonds, Flaws', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'en')
    expect(screen.getByText('Traits')).toBeDefined()
    expect(screen.getByText('Ideals')).toBeDefined()
    expect(screen.getByText('Bonds')).toBeDefined()
    expect(screen.getByText('Flaws')).toBeDefined()
  })

  it('personality values are not translated (free-text)', () => {
    renderWithI18n(<PersonalityBlock character={BASE} />, 'en')
    expect(screen.getByText('Quiet and observant')).toBeDefined()
    expect(screen.getByText('Protecting the wild')).toBeDefined()
  })
})
