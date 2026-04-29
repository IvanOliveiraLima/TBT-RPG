import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { SavingThrows } from '@/components/sheet/parts/SavingThrows'

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Dwarf',
  background: 'Guild Artisan',
  alignment: 'LG',
  classes: [{ name: 'Cleric', level: 3, hitDie: 8 }],
  totalLevel: 3,
  experience: 0,
  abilities: { str: 14, dex: 10, con: 16, int: 12, wis: 18, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 24, max: 24, temp: 0 },
  hitDice: [{ current: 3, max: 3, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 0, speed: 25,
  passivePerception: 14, spellSaveDC: 14, inspiration: false,
  savingThrows: [
    { ability: 'str', proficient: false, bonus: 2 },
    { ability: 'dex', proficient: false, bonus: 0 },
    { ability: 'con', proficient: false, bonus: 3 },
    { ability: 'int', proficient: true, bonus: 3 },
    { ability: 'wis', proficient: true, bonus: 6 },
    { ability: 'cha', proficient: false, bonus: 0 },
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

describe('SavingThrows', () => {
  it('renders all 6 saving throws', () => {
    render(<SavingThrows character={BASE} />)
    const container = screen.getByTestId('saving-throws')
    expect(container.querySelectorAll('[data-testid^="save-"][data-testid$="-bonus"]')).toHaveLength(6)
  })

  it('shows full ability names', () => {
    render(<SavingThrows character={BASE} />)
    expect(screen.getByText('Strength')).toBeDefined()
    expect(screen.getByText('Dexterity')).toBeDefined()
    expect(screen.getByText('Constitution')).toBeDefined()
    expect(screen.getByText('Intelligence')).toBeDefined()
    expect(screen.getByText('Wisdom')).toBeDefined()
    expect(screen.getByText('Charisma')).toBeDefined()
  })

  it('formats positive bonus with + sign', () => {
    render(<SavingThrows character={BASE} />)
    expect(screen.getByTestId('save-wis-bonus').textContent).toBe('+6')
  })

  it('formats zero bonus as +0', () => {
    render(<SavingThrows character={BASE} />)
    expect(screen.getByTestId('save-dex-bonus').textContent).toBe('+0')
  })

  it('formats positive non-prof bonus with + sign', () => {
    render(<SavingThrows character={BASE} />)
    expect(screen.getByTestId('save-str-bonus').textContent).toBe('+2')
  })

  it('renders filled pip for proficient saves (int and wis)', () => {
    render(<SavingThrows character={BASE} />)
    const intRow = screen.getByTestId('save-int')
    const intPip = intRow.querySelector('[role="presentation"]') as HTMLElement
    // filled pip has non-transparent background
    expect(intPip.style.background).not.toBe('transparent')
  })

  it('renders empty pip for non-proficient saves', () => {
    render(<SavingThrows character={BASE} />)
    const strRow = screen.getByTestId('save-str')
    const strPip = strRow.querySelector('[role="presentation"]') as HTMLElement
    expect(strPip.style.background).toBe('transparent')
  })

  it('shows correct order: STR, DEX, CON, INT, WIS, CHA', () => {
    render(<SavingThrows character={BASE} />)
    const container = screen.getByTestId('saving-throws')
    const rows = Array.from(container.querySelectorAll('[data-testid^="save-"]:not([data-testid$="-bonus"])'))
    expect(rows[0]?.getAttribute('data-testid')).toBe('save-str')
    expect(rows[5]?.getAttribute('data-testid')).toBe('save-cha')
  })

  it('falls back to +0 when savingThrows array is empty', () => {
    render(<SavingThrows character={{ ...BASE, savingThrows: [] }} />)
    expect(screen.getByTestId('save-str-bonus').textContent).toBe('+0')
  })
})
