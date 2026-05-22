import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { ProficienciesBlock } from '@/components/sheet/parts/ProficienciesBlock'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'kael_01',
  name: 'Kael Brightweave',
  race: 'Half-Elf',
  background: 'Entertainer',
  alignment: 'Chaotic Good',
  classes: [{ name: 'Bard', level: 5, hitDie: 8 }],
  experience: 6500,
  abilities: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
  proficiencyBonus: 3,
  hp: { current: 35, max: 35, temp: 0 },
  hitDice: [{ className: 'Bard', current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 13, spellSaveDC: 15, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: {
    weapons: ['Longsword', 'Rapier', 'Shortsword'],
    armor:   ['Light armor'],
    tools:   ['Lute', 'Lyre'],
    other:   ['Bardic Inspiration'],
  },
  languages: ['Common', 'Elvish', 'Draconic'],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

const EMPTY: Character = {
  ...BASE,
  proficiencies: { weapons: [], armor: [], tools: [], other: [] },
  languages: [],
}

describe('ProficienciesBlock (editable)', () => {
  beforeEach(() => { localStorage.clear() })

  // ── Render ─────────────────────────────────────────────────────────────────

  it('renders proficiencies-block testid', () => {
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('proficiencies-block')).toBeDefined()
  })

  it('renders all 4 sub-list sections', () => {
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('prof-list-weapons')).toBeDefined()
    expect(screen.getByTestId('prof-list-armor')).toBeDefined()
    expect(screen.getByTestId('prof-list-tools')).toBeDefined()
    expect(screen.getByTestId('prof-list-other')).toBeDefined()
  })

  it('shows existing weapon items as inputs', () => {
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={() => {}} />, 'pt')
    const inputs = screen.getAllByDisplayValue('Longsword')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state for sections with no items (PT)', () => {
    renderWithI18n(<ProficienciesBlock character={EMPTY} onUpdate={() => {}} />, 'pt')
    expect(screen.getAllByText('Nenhuma proficiência em armas.').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state for sections with no items (EN)', () => {
    renderWithI18n(<ProficienciesBlock character={EMPTY} onUpdate={() => {}} />, 'en')
    expect(screen.getAllByText('No weapon proficiencies.').length).toBeGreaterThanOrEqual(1)
  })

  it('shows section label in PT', () => {
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByText('Proficiências')).toBeDefined()
  })

  it('shows section label in EN', () => {
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={() => {}} />, 'en')
    expect(screen.getByText('Proficiencies')).toBeDefined()
  })

  // ── Adding items ────────────────────────────────────────────────────────────

  it('calls onUpdate with new weapons item appended', async () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // Weapons section add button
    const weaponsSection = screen.getByTestId('prof-list-weapons')
    const addBtn = weaponsSection.querySelector('button[data-action="add"]') as HTMLElement
    fireEvent.click(addBtn)
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        proficiencies: expect.objectContaining({
          weapons: [...BASE.proficiencies.weapons, ''],
        }),
      }),
    )
  })

  it('adding to weapons does not affect armor or tools', async () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const weaponsSection = screen.getByTestId('prof-list-weapons')
    const addBtn = weaponsSection.querySelector('button[data-action="add"]') as HTMLElement
    fireEvent.click(addBtn)
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    expect(call.proficiencies!.armor).toEqual(BASE.proficiencies.armor)
    expect(call.proficiencies!.tools).toEqual(BASE.proficiencies.tools)
    expect(call.proficiencies!.other).toEqual(BASE.proficiencies.other)
  })

  // ── Removing items ──────────────────────────────────────────────────────────

  it('calls onUpdate when removing a weapon item', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const weaponsSection = screen.getByTestId('prof-list-weapons')
    const removeBtns = weaponsSection.querySelectorAll('button[data-action="remove"]')
    fireEvent.click(removeBtns[0]!)
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    expect(call.proficiencies!.weapons).toHaveLength(BASE.proficiencies.weapons.length - 1)
    // armor untouched
    expect(call.proficiencies!.armor).toEqual(BASE.proficiencies.armor)
  })

  // ── Editing items ───────────────────────────────────────────────────────────

  it('calls onUpdate when editing a weapon input', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ProficienciesBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const longswordInput = screen.getByDisplayValue('Longsword')
    fireEvent.change(longswordInput, { target: { value: 'Longsword +1' } })
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    expect(call.proficiencies!.weapons).toContain('Longsword +1')
    expect(call.proficiencies!.armor).toEqual(BASE.proficiencies.armor)
  })
})
