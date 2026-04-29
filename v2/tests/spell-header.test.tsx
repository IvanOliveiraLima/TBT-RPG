import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { SpellHeader } from '@/components/sheet/parts/SpellHeader'

const KAEL: Character = {
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
  ac: 14,
  initiative: 2,
  speed: 30,
  passivePerception: 13,
  spellSaveDC: 15,
  inspiration: false,
  savingThrows: [],
  skills: [],
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  spells: {
    ability: 'cha',
    attackBonus: 7,
    saveDC: 15,
    slots: [{ level: 1, current: 4, max: 4 }],
    known: [],
  },
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

describe('SpellHeader', () => {
  it('renders CLASSE cell with first class name', () => {
    render(<SpellHeader character={KAEL} />)
    expect(screen.getByText('Bard')).toBeDefined()
  })

  it('renders HABILIDADE cell with uppercase ability key', () => {
    render(<SpellHeader character={KAEL} />)
    expect(screen.getByText('CHA')).toBeDefined()
  })

  it('renders DC DE SALVAGUARDA cell with numeric value', () => {
    render(<SpellHeader character={KAEL} />)
    expect(screen.getByText('15')).toBeDefined()
  })

  it('renders BÔNUS DE ATAQUE cell with signed bonus', () => {
    render(<SpellHeader character={KAEL} />)
    expect(screen.getByText('+7')).toBeDefined()
  })

  it('attack bonus has "+" prefix for positive values', () => {
    render(<SpellHeader character={KAEL} />)
    const header = screen.getByTestId('spell-header')
    expect(header.textContent).toContain('+7')
  })

  it('returns null for non-caster (spells undefined)', () => {
    const nonCaster = { ...KAEL, spells: undefined }
    const { container } = render(<SpellHeader character={nonCaster} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows WIS as ability and Druid as class', () => {
    const druid = {
      ...KAEL,
      classes: [{ name: 'Druid', level: 5, hitDie: 8 }],
      spells: { ...KAEL.spells!, ability: 'wis' as const, saveDC: 14, attackBonus: 6 },
    }
    render(<SpellHeader character={druid} />)
    expect(screen.getByText('WIS')).toBeDefined()
    expect(screen.getByText('Druid')).toBeDefined()
  })

  it('shows INT as ability for Wizard', () => {
    const wizard = {
      ...KAEL,
      classes: [{ name: 'Wizard', level: 5, hitDie: 6 }],
      spells: { ...KAEL.spells!, ability: 'int' as const },
    }
    render(<SpellHeader character={wizard} />)
    expect(screen.getByText('INT')).toBeDefined()
  })

  it('negative attack bonus shows without "+"', () => {
    const weak = {
      ...KAEL,
      spells: { ...KAEL.spells!, attackBonus: -1 },
    }
    render(<SpellHeader character={weak} />)
    expect(screen.getByText('-1')).toBeDefined()
  })
})
