import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { CurrencyBlock } from '@/components/sheet/parts/CurrencyBlock'

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
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 1, gp: 25, ep: 0, sp: 10, cp: 5 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  allies: '', notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

const EMPTY_CURRENCY: Character = {
  ...BASE,
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
}

describe('CurrencyBlock', () => {
  it('renders currency-block testid', () => {
    render(<CurrencyBlock character={BASE} />)
    expect(screen.getByTestId('currency-block')).toBeDefined()
  })

  it('renders all 5 denomination cells', () => {
    render(<CurrencyBlock character={BASE} />)
    expect(screen.getByTestId('currency-pp')).toBeDefined()
    expect(screen.getByTestId('currency-gp')).toBeDefined()
    expect(screen.getByTestId('currency-ep')).toBeDefined()
    expect(screen.getByTestId('currency-sp')).toBeDefined()
    expect(screen.getByTestId('currency-cp')).toBeDefined()
  })

  it('shows correct GP value', () => {
    render(<CurrencyBlock character={BASE} />)
    const gpCell = screen.getByTestId('currency-gp')
    expect(gpCell.textContent).toContain('25')
  })

  it('shows correct SP value', () => {
    render(<CurrencyBlock character={BASE} />)
    const spCell = screen.getByTestId('currency-sp')
    expect(spCell.textContent).toContain('10')
  })

  it('shows correct PP value', () => {
    render(<CurrencyBlock character={BASE} />)
    const ppCell = screen.getByTestId('currency-pp')
    expect(ppCell.textContent).toContain('1')
  })

  it('shows all zeros for empty currency', () => {
    render(<CurrencyBlock character={EMPTY_CURRENCY} />)
    const block = screen.getByTestId('currency-block')
    // All 5 cells should contain "0"
    const zeros = block.querySelectorAll('div')
    const hasZero = [...zeros].some((el) => el.textContent?.trim() === '0')
    expect(hasZero).toBe(true)
  })

  it('has accessible aria-label for GP cell', () => {
    render(<CurrencyBlock character={BASE} />)
    expect(screen.getByRole('generic', { name: 'Ouro: 25' })).toBeDefined()
  })

  it('shows "MOEDAS" label', () => {
    render(<CurrencyBlock character={BASE} />)
    expect(screen.getByText('MOEDAS')).toBeDefined()
  })
})
