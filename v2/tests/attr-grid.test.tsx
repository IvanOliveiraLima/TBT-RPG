import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { AttrGrid } from '@/components/sheet/parts/AttrGrid'

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Human',
  background: 'Soldier',
  alignment: 'LG',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  totalLevel: 5,
  experience: 0,
  abilities: { str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
  proficiencyBonus: 3,
  hp: { current: 50, max: 50, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 18, initiative: 2, speed: 30,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [
    { ability: 'str', proficient: true, bonus: 7 },
    { ability: 'con', proficient: true, bonus: 6 },
    { ability: 'dex', proficient: false, bonus: 2 },
    { ability: 'int', proficient: false, bonus: 0 },
    { ability: 'wis', proficient: false, bonus: 1 },
    { ability: 'cha', proficient: false, bonus: -1 },
  ],
  skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('AttrGrid', () => {
  it('renders all 6 attributes', () => {
    render(<AttrGrid character={BASE} />)
    expect(screen.getByTestId('attr-str')).toBeDefined()
    expect(screen.getByTestId('attr-dex')).toBeDefined()
    expect(screen.getByTestId('attr-con')).toBeDefined()
    expect(screen.getByTestId('attr-int')).toBeDefined()
    expect(screen.getByTestId('attr-wis')).toBeDefined()
    expect(screen.getByTestId('attr-cha')).toBeDefined()
  })

  it('shows correct order: STR, DEX, CON, INT, WIS, CHA', () => {
    render(<AttrGrid character={BASE} />)
    const grid = screen.getByTestId('attr-grid')
    // direct children are the attr cards
    const attrs = Array.from(grid.children).map((el) => el.getAttribute('data-testid'))
    expect(attrs).toEqual(['attr-str', 'attr-dex', 'attr-con', 'attr-int', 'attr-wis', 'attr-cha'])
  })

  it('formats positive modifier with + sign (STR 18 → +4)', () => {
    render(<AttrGrid character={BASE} />)
    expect(screen.getByTestId('attr-str-mod').textContent).toBe('+4')
  })

  it('formats negative modifier (CHA 8 → -1)', () => {
    render(<AttrGrid character={BASE} />)
    expect(screen.getByTestId('attr-cha-mod').textContent).toBe('-1')
  })

  it('formats zero modifier as +0 (INT 10 → +0)', () => {
    render(<AttrGrid character={BASE} />)
    expect(screen.getByTestId('attr-int-mod').textContent).toBe('+0')
  })

  it('shows raw score below modifier', () => {
    render(<AttrGrid character={BASE} />)
    expect(screen.getByTestId('attr-str-score').textContent).toBe('18')
    expect(screen.getByTestId('attr-cha-score').textContent).toBe('8')
  })

  it('shows save proficiency dot when ability has save prof', () => {
    render(<AttrGrid character={BASE} />)
    expect(screen.getByTestId('attr-str-save-dot')).toBeDefined()
    expect(screen.getByTestId('attr-con-save-dot')).toBeDefined()
  })

  it('does not show save dot for non-proficient abilities', () => {
    render(<AttrGrid character={BASE} />)
    expect(screen.queryByTestId('attr-dex-save-dot')).toBeNull()
    expect(screen.queryByTestId('attr-int-save-dot')).toBeNull()
  })

  it('uses 3-col grid by default', () => {
    render(<AttrGrid character={BASE} />)
    const grid = screen.getByTestId('attr-grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })

  it('uses 6-col grid when cols=6', () => {
    render(<AttrGrid character={BASE} cols={6} />)
    const grid = screen.getByTestId('attr-grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(6, 1fr)')
  })

  it('compact reduces modifier font size', () => {
    render(<AttrGrid character={BASE} compact />)
    const mod = screen.getByTestId('attr-str-mod')
    expect(mod.style.fontSize).toBe('28px')
  })

  it('non-compact uses larger modifier font', () => {
    render(<AttrGrid character={BASE} compact={false} />)
    const mod = screen.getByTestId('attr-str-mod')
    expect(mod.style.fontSize).toBe('32px')
  })
})
