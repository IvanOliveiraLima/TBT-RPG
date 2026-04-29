import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { ProficienciesBlock } from '@/components/sheet/parts/ProficienciesBlock'

const BASE: Character = {
  id: 'kael_01',
  name: 'Kael Brightweave',
  race: 'Half-Elf',
  background: 'Entertainer',
  alignment: 'Chaotic Good',
  classes: [{ name: 'Bard', level: 5, hitDie: 8 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
  proficiencyBonus: 3,
  hp: { current: 35, max: 35, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 13, spellSaveDC: 15, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: {
    weaponsAndArmor: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords, Light armor',
    tools:           'Lute, lyre, pan flute',
    languages:       'Common, Elvish, Draconic',
    other:           'Bardic Inspiration (d8)',
  },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

const EMPTY_PROFS: Character = {
  ...BASE,
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
}

describe('ProficienciesBlock', () => {
  it('renders proficiencies-block testid', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByTestId('proficiencies-block')).toBeDefined()
  })

  it('renders all 4 rows', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByTestId('prof-row-weaponsAndArmor')).toBeDefined()
    expect(screen.getByTestId('prof-row-tools')).toBeDefined()
    expect(screen.getByTestId('prof-row-languages')).toBeDefined()
    expect(screen.getByTestId('prof-row-other')).toBeDefined()
  })

  it('shows weaponsAndArmor text verbatim', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(
      screen.getByText('Simple weapons, hand crossbows, longswords, rapiers, shortswords, Light armor'),
    ).toBeDefined()
  })

  it('shows tools text', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByText('Lute, lyre, pan flute')).toBeDefined()
  })

  it('shows languages text', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByText('Common, Elvish, Draconic')).toBeDefined()
  })

  it('shows other text', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByText('Bardic Inspiration (d8)')).toBeDefined()
  })

  it('shows "PROFICIÊNCIAS" label', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByText('PROFICIÊNCIAS')).toBeDefined()
  })

  it('shows "—" placeholder for each empty field', () => {
    render(<ProficienciesBlock character={EMPTY_PROFS} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  it('shows "ARMAS E ARMADURAS" row label', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByText('ARMAS E ARMADURAS')).toBeDefined()
  })

  it('shows "FERRAMENTAS" row label', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByText('FERRAMENTAS')).toBeDefined()
  })

  it('shows "IDIOMAS" row label', () => {
    render(<ProficienciesBlock character={BASE} />)
    expect(screen.getByText('IDIOMAS')).toBeDefined()
  })
})
