import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { PersonalityBlock } from '@/components/sheet/parts/PersonalityBlock'

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
  it('renders personality-block testid', () => {
    render(<PersonalityBlock character={BASE} />)
    expect(screen.getByTestId('personality-block')).toBeDefined()
  })

  it('renders all 4 personality fields', () => {
    render(<PersonalityBlock character={BASE} />)
    expect(screen.getByTestId('personality-field-traços')).toBeDefined()
    expect(screen.getByTestId('personality-field-ideais')).toBeDefined()
    expect(screen.getByTestId('personality-field-vínculos')).toBeDefined()
    expect(screen.getByTestId('personality-field-defeitos')).toBeDefined()
  })

  it('shows PT-BR labels: Traços, Ideais, Vínculos, Defeitos', () => {
    render(<PersonalityBlock character={BASE} />)
    expect(screen.getByText('Traços')).toBeDefined()
    expect(screen.getByText('Ideais')).toBeDefined()
    expect(screen.getByText('Vínculos')).toBeDefined()
    expect(screen.getByText('Defeitos')).toBeDefined()
  })

  it('shows traits text', () => {
    render(<PersonalityBlock character={BASE} />)
    expect(screen.getByText('Quiet and observant')).toBeDefined()
  })

  it('shows ideals text', () => {
    render(<PersonalityBlock character={BASE} />)
    expect(screen.getByText('Protecting the wild')).toBeDefined()
  })

  it('shows bonds text', () => {
    render(<PersonalityBlock character={BASE} />)
    expect(screen.getByText('Bonded to the forest')).toBeDefined()
  })

  it('shows flaws text', () => {
    render(<PersonalityBlock character={BASE} />)
    expect(screen.getByText('Distrusts cities')).toBeDefined()
  })

  it('empty field shows "—" placeholder', () => {
    render(<PersonalityBlock character={EMPTY_PERSONALITY} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })
})
