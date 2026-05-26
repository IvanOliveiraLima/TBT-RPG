import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { SavingThrows } from '@/components/sheet/parts/SavingThrows'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Dwarf',
  background: 'Guild Artisan',
  alignment: 'LG',
  classes: [{ name: 'Cleric', level: 3, hitDie: 8 }],
  experience: 0,
  abilities: { str: 14, dex: 10, con: 16, int: 12, wis: 18, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 24, max: 24, temp: 0 },
  hitDice: [{ className: 'Cleric', current: 3, max: 3, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 0, speed: 25,
  passivePerception: 14, spellSaveDC: 14, inspiration: false,
  savingThrows: [
    { ability: 'str', proficient: false, bonus: 2 },
    { ability: 'dex', proficient: false, bonus: 0 },
    { ability: 'con', proficient: false, bonus: 3 },
    { ability: 'int', proficient: true,  bonus: 3 },
    { ability: 'wis', proficient: true,  bonus: 6 },
    { ability: 'cha', proficient: false, bonus: 0 },
  ],
  skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('SavingThrows', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders all 6 saving throws', () => {
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    const container = screen.getByTestId('saving-throws')
    expect(container.querySelectorAll('[data-testid^="save-"][data-testid$="-bonus"]')).toHaveLength(6)
  })

  it('shows full ability names in EN', () => {
    renderWithI18n(<SavingThrows character={BASE} />, 'en')
    expect(screen.getByText('Strength')).toBeDefined()
    expect(screen.getByText('Dexterity')).toBeDefined()
    expect(screen.getByText('Constitution')).toBeDefined()
    expect(screen.getByText('Intelligence')).toBeDefined()
    expect(screen.getByText('Wisdom')).toBeDefined()
    expect(screen.getByText('Charisma')).toBeDefined()
  })

  it('shows translated ability names in PT', () => {
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    expect(screen.getByText('Força')).toBeDefined()
    expect(screen.getByText('Destreza')).toBeDefined()
    expect(screen.getByText('Constituição')).toBeDefined()
    expect(screen.getByText('Inteligência')).toBeDefined()
    expect(screen.getByText('Sabedoria')).toBeDefined()
    expect(screen.getByText('Carisma')).toBeDefined()
  })

  it('formats positive bonus with + sign (WIS prof → +6)', () => {
    // WIS 18 (mod +4) + proficient + profBonus(level 3)=2 → +6
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    expect(screen.getByTestId('save-wis-bonus').textContent).toBe('+6')
  })

  it('formats zero bonus as +0 (DEX not proficient)', () => {
    // DEX 10 (mod 0) not proficient → +0
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    expect(screen.getByTestId('save-dex-bonus').textContent).toBe('+0')
  })

  it('formats positive non-prof bonus with + sign (STR mod → +2)', () => {
    // STR 14 (mod +2) not proficient → +2
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    expect(screen.getByTestId('save-str-bonus').textContent).toBe('+2')
  })

  it('renders filled pip for proficient saves (int and wis)', () => {
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    const intRow = screen.getByTestId('save-int')
    const intPip = intRow.querySelector('[role="presentation"]') as HTMLElement
    expect(intPip.style.background).not.toBe('transparent')
  })

  it('renders empty pip for non-proficient saves', () => {
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    const strRow = screen.getByTestId('save-str')
    const strPip = strRow.querySelector('[role="presentation"]') as HTMLElement
    expect(strPip.style.background).toBe('transparent')
  })

  it('shows correct order: STR, DEX, CON, INT, WIS, CHA', () => {
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    const container = screen.getByTestId('saving-throws')
    const rows = Array.from(container.querySelectorAll('[data-testid^="save-"]:not([data-testid$="-bonus"]):not([data-testid$="-toggle"])'))
    expect(rows[0]?.getAttribute('data-testid')).toBe('save-str')
    expect(rows[5]?.getAttribute('data-testid')).toBe('save-cha')
  })

  it('shows ability modifier as bonus when savingThrows array is empty', () => {
    // With empty savingThrows: no proficiency → bonus = ability modifier
    // STR 14 → mod +2, not proficient → +2
    renderWithI18n(<SavingThrows character={{ ...BASE, savingThrows: [] }} />, 'pt')
    expect(screen.getByTestId('save-str-bonus').textContent).toBe('+2')
  })

  it('bonus is derived live from ability score (not from stored bonus field)', () => {
    // Stored bonus for STR is 2 (correct). Change ability score to 20 (mod +5).
    // If derived live: +5; if reading stored: +2.
    const highStr = { ...BASE, abilities: { ...BASE.abilities, str: 20 } }
    renderWithI18n(<SavingThrows character={highStr} />, 'pt')
    expect(screen.getByTestId('save-str-bonus').textContent).toBe('+5')
  })

  // ── Proficiency toggle ───────────────────────────────────────────────────

  it('renders toggle button for each save row', () => {
    renderWithI18n(<SavingThrows character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('save-str-toggle')).toBeDefined()
    expect(screen.getByTestId('save-wis-toggle')).toBeDefined()
  })

  it('toggle button has aria-pressed=true for proficient save', () => {
    renderWithI18n(<SavingThrows character={BASE} onUpdate={vi.fn()} />, 'pt')
    const wisToggle = screen.getByTestId('save-wis-toggle')
    expect(wisToggle.getAttribute('aria-pressed')).toBe('true')
  })

  it('toggle button has aria-pressed=false for non-proficient save', () => {
    renderWithI18n(<SavingThrows character={BASE} onUpdate={vi.fn()} />, 'pt')
    const strToggle = screen.getByTestId('save-str-toggle')
    expect(strToggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('clicking toggle calls onUpdate toggling proficiency to true', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SavingThrows character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('save-str-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { savingThrows: Array<{ ability: string; proficient: boolean }> }
    const strSave = call.savingThrows.find(s => s.ability === 'str')
    expect(strSave?.proficient).toBe(true)
  })

  it('clicking toggle calls onUpdate toggling proficiency to false', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SavingThrows character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('save-wis-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { savingThrows: Array<{ ability: string; proficient: boolean }> }
    const wisSave = call.savingThrows.find(s => s.ability === 'wis')
    expect(wisSave?.proficient).toBe(false)
  })

  it('toggling one save preserves other saves (spread test)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SavingThrows character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('save-str-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { savingThrows: Array<{ ability: string; proficient: boolean }> }
    const wisSave = call.savingThrows.find(s => s.ability === 'wis')
    const intSave = call.savingThrows.find(s => s.ability === 'int')
    expect(wisSave?.proficient).toBe(true)  // unchanged
    expect(intSave?.proficient).toBe(true)  // unchanged
  })

  it('onUpdate called with all 6 saves in the array', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SavingThrows character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('save-str-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { savingThrows: unknown[] }
    expect(call.savingThrows).toHaveLength(6)
  })

  it('does not call onUpdate when toggle is clicked without onUpdate prop', () => {
    // No onUpdate — buttons are disabled, no call expected
    renderWithI18n(<SavingThrows character={BASE} />, 'pt')
    // Clicks on disabled button should not throw
    fireEvent.click(screen.getByTestId('save-str-toggle'))
    // No assertion needed — just verifying no exception
  })

  it('toggle button aria-label is in PT', () => {
    renderWithI18n(<SavingThrows character={BASE} onUpdate={vi.fn()} />, 'pt')
    const strToggle = screen.getByTestId('save-str-toggle')
    expect(strToggle.getAttribute('aria-label')).toContain('Força')
  })

  it('toggle button aria-label is in EN', () => {
    renderWithI18n(<SavingThrows character={BASE} onUpdate={vi.fn()} />, 'en')
    const strToggle = screen.getByTestId('save-str-toggle')
    expect(strToggle.getAttribute('aria-label')).toContain('Strength')
  })

  it('new bonus is recalculated after toggle (proficient str → mod+prof)', () => {
    // profBonus for Cleric 3 = 2; STR 14 mod = +2; proficient → +4
    const onUpdate = vi.fn()
    renderWithI18n(<SavingThrows character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('save-str-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { savingThrows: Array<{ ability: string; bonus: number }> }
    const strSave = call.savingThrows.find(s => s.ability === 'str')
    expect(strSave?.bonus).toBe(4) // +2 mod + 2 profBonus
  })
})
