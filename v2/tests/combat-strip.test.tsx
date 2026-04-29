import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { CombatStrip } from '@/components/sheet/parts/CombatStrip'

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Elf',
  background: 'Outlander',
  alignment: 'CN',
  classes: [{ name: 'Ranger', level: 4, hitDie: 10 }],
  totalLevel: 4,
  experience: 0,
  abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 14, cha: 8 },
  proficiencyBonus: 2,
  hp: { current: 30, max: 30, temp: 0 },
  hitDice: [{ current: 4, max: 4, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15,
  initiative: 2,
  speed: 30,
  passivePerception: 14,
  spellSaveDC: 0, // non-caster
  inspiration: false,
  savingThrows: [],
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

describe('CombatStrip', () => {
  it('renders AC value', () => {
    render(<CombatStrip character={BASE} />)
    expect(screen.getByTestId('combat-stat-ac').textContent).toContain('15')
  })

  it('formats positive initiative with + sign', () => {
    render(<CombatStrip character={BASE} />)
    expect(screen.getByTestId('combat-stat-init').textContent).toContain('+2')
  })

  it('formats negative initiative correctly', () => {
    render(<CombatStrip character={{ ...BASE, initiative: -1 }} />)
    expect(screen.getByTestId('combat-stat-init').textContent).toContain('-1')
  })

  it('formats zero initiative as +0', () => {
    render(<CombatStrip character={{ ...BASE, initiative: 0 }} />)
    expect(screen.getByTestId('combat-stat-init').textContent).toContain('+0')
  })

  it('renders speed with ft unit', () => {
    render(<CombatStrip character={BASE} />)
    expect(screen.getByTestId('combat-stat-spd').textContent).toContain('30 ft')
  })

  it('renders passive perception', () => {
    render(<CombatStrip character={BASE} />)
    expect(screen.getByTestId('combat-stat-pp').textContent).toContain('14')
  })

  it('omits DC when spellSaveDC is 0', () => {
    render(<CombatStrip character={BASE} />)
    expect(screen.queryByTestId('combat-stat-dc')).toBeNull()
  })

  it('shows DC when spellSaveDC is defined', () => {
    render(<CombatStrip character={{ ...BASE, spellSaveDC: 14 }} />)
    expect(screen.getByTestId('combat-stat-dc').textContent).toContain('14')
  })

  it('formats proficiency bonus with + sign', () => {
    render(<CombatStrip character={BASE} />)
    expect(screen.getByTestId('combat-stat-prof').textContent).toContain('+2')
  })

  it('uses 3-col grid by default', () => {
    render(<CombatStrip character={BASE} />)
    const strip = screen.getByTestId('combat-strip')
    expect(strip.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })

  it('uses 6-col grid when cols=6', () => {
    render(<CombatStrip character={BASE} cols={6} />)
    const strip = screen.getByTestId('combat-strip')
    expect(strip.style.gridTemplateColumns).toBe('repeat(6, 1fr)')
  })
})
