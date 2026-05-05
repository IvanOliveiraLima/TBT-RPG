import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { AttrGrid } from '@/components/sheet/parts/AttrGrid'
import { renderWithI18n } from './helpers/render'

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
  beforeEach(() => { localStorage.clear() })

  it('renders all 6 attributes', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str')).toBeDefined()
    expect(screen.getByTestId('attr-dex')).toBeDefined()
    expect(screen.getByTestId('attr-con')).toBeDefined()
    expect(screen.getByTestId('attr-int')).toBeDefined()
    expect(screen.getByTestId('attr-wis')).toBeDefined()
    expect(screen.getByTestId('attr-cha')).toBeDefined()
  })

  it('shows correct order: str, dex, con, int, wis, cha', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    const grid = screen.getByTestId('attr-grid')
    const attrs = Array.from(grid.children).map((el) => el.getAttribute('data-testid'))
    expect(attrs).toEqual(['attr-str', 'attr-dex', 'attr-con', 'attr-int', 'attr-wis', 'attr-cha'])
  })

  it('formats positive modifier with + sign (STR 18 → +4)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str-mod').textContent).toBe('+4')
  })

  it('formats negative modifier (CHA 8 → -1)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-cha-mod').textContent).toBe('-1')
  })

  it('formats zero modifier as +0 (INT 10 → +0)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-int-mod').textContent).toBe('+0')
  })

  it('shows raw score below modifier', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str-score').textContent).toBe('18')
    expect(screen.getByTestId('attr-cha-score').textContent).toBe('8')
  })

  it('shows save proficiency dot when ability has save prof', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str-save-dot')).toBeDefined()
    expect(screen.getByTestId('attr-con-save-dot')).toBeDefined()
  })

  it('does not show save dot for non-proficient abilities', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.queryByTestId('attr-dex-save-dot')).toBeNull()
    expect(screen.queryByTestId('attr-int-save-dot')).toBeNull()
  })

  it('uses 3-col grid by default', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    const grid = screen.getByTestId('attr-grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })

  it('uses 6-col grid when cols=6', () => {
    renderWithI18n(<AttrGrid character={BASE} cols={6} />, 'pt')
    const grid = screen.getByTestId('attr-grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(6, 1fr)')
  })

  it('compact reduces modifier font size', () => {
    renderWithI18n(<AttrGrid character={BASE} compact />, 'pt')
    const mod = screen.getByTestId('attr-str-mod')
    expect(mod.style.fontSize).toBe('28px')
  })

  it('non-compact uses larger modifier font', () => {
    renderWithI18n(<AttrGrid character={BASE} compact={false} />, 'pt')
    const mod = screen.getByTestId('attr-str-mod')
    expect(mod.style.fontSize).toBe('32px')
  })

  it('renders PT ability abbreviations (FOR/DES/CON/INT/SAB/CAR)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByText('FOR')).toBeDefined()
    expect(screen.getByText('DES')).toBeDefined()
    expect(screen.getByText('SAB')).toBeDefined()
    expect(screen.getByText('CAR')).toBeDefined()
  })

  it('renders EN ability abbreviations (STR/DEX/WIS/CHA)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'en')
    expect(screen.getByText('STR')).toBeDefined()
    expect(screen.getByText('DEX')).toBeDefined()
    expect(screen.getByText('WIS')).toBeDefined()
    expect(screen.getByText('CHA')).toBeDefined()
  })
})
