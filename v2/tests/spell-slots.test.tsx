import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { SpellSlots } from '@/components/sheet/parts/SpellSlots'
import { renderWithI18n } from './helpers/render'

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
    slots: [
      { level: 1, current: 4, max: 4 },
      { level: 2, current: 3, max: 3 },
      { level: 3, current: 2, max: 2 },
    ],
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

describe('SpellSlots', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders section label in PT', () => {
    renderWithI18n(<SpellSlots character={BASE} />, 'pt')
    expect(screen.getByText('ESPAÇOS DE MAGIA')).toBeDefined()
  })

  it('renders level 1 row when max > 0', () => {
    renderWithI18n(<SpellSlots character={BASE} />, 'pt')
    expect(screen.getByTestId('spell-slot-level-1')).toBeDefined()
  })

  it('renders level 2 and 3 rows', () => {
    renderWithI18n(<SpellSlots character={BASE} />, 'pt')
    expect(screen.getByTestId('spell-slot-level-2')).toBeDefined()
    expect(screen.getByTestId('spell-slot-level-3')).toBeDefined()
  })

  it('does not render a level with max === 0', () => {
    const c = {
      ...BASE,
      spells: {
        ...BASE.spells!,
        slots: [
          { level: 1, current: 4, max: 4 },
          { level: 2, current: 0, max: 0 },
        ],
      },
    }
    renderWithI18n(<SpellSlots character={c} />, 'pt')
    expect(screen.getByTestId('spell-slot-level-1')).toBeDefined()
    expect(screen.queryByTestId('spell-slot-level-2')).toBeNull()
  })

  it('renders correct number of filled pips (current)', () => {
    const c = {
      ...BASE,
      spells: { ...BASE.spells!, slots: [{ level: 1, current: 3, max: 4 }] },
    }
    renderWithI18n(<SpellSlots character={c} />, 'pt')
    const row = screen.getByTestId('spell-slot-level-1')
    const filled = row.querySelectorAll('[data-filled="true"]')
    expect(filled.length).toBe(3)
  })

  it('renders correct number of empty pips (max - current)', () => {
    const c = {
      ...BASE,
      spells: { ...BASE.spells!, slots: [{ level: 1, current: 3, max: 4 }] },
    }
    renderWithI18n(<SpellSlots character={c} />, 'pt')
    const row = screen.getByTestId('spell-slot-level-1')
    const empty = row.querySelectorAll('[data-filled="false"]')
    expect(empty.length).toBe(1)
  })

  it('shows slot count as current/max', () => {
    const c = {
      ...BASE,
      spells: { ...BASE.spells!, slots: [{ level: 2, current: 2, max: 3 }] },
    }
    renderWithI18n(<SpellSlots character={c} />, 'pt')
    expect(screen.getByText('2/3')).toBeDefined()
  })

  it('shows 4/4 for fully available slots', () => {
    renderWithI18n(<SpellSlots character={BASE} />, 'pt')
    expect(screen.getByText('4/4')).toBeDefined()
  })

  it('has accessible aria-label on slot row in PT', () => {
    const c = {
      ...BASE,
      spells: { ...BASE.spells!, slots: [{ level: 1, current: 4, max: 4 }] },
    }
    renderWithI18n(<SpellSlots character={c} />, 'pt')
    expect(
      screen.getByRole('group', { name: 'Espaço de nível 1 (4 de 4 disponíveis)' }),
    ).toBeDefined()
  })

  it('returns null when all slots have max === 0', () => {
    const c = {
      ...BASE,
      spells: { ...BASE.spells!, slots: [{ level: 1, current: 0, max: 0 }] },
    }
    const { container } = renderWithI18n(<SpellSlots character={c} />, 'pt')
    expect(container.firstChild).toBeNull()
  })

  it('returns null when slots array is empty', () => {
    const c = { ...BASE, spells: { ...BASE.spells!, slots: [] } }
    const { container } = renderWithI18n(<SpellSlots character={c} />, 'pt')
    expect(container.firstChild).toBeNull()
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('renders section label in EN', () => {
    renderWithI18n(<SpellSlots character={BASE} />, 'en')
    expect(screen.getByText('SPELL SLOTS')).toBeDefined()
  })

  it('renders level label in PT (NÍVEL 1)', () => {
    renderWithI18n(<SpellSlots character={BASE} />, 'pt')
    expect(screen.getByText('NÍVEL 1')).toBeDefined()
  })

  it('renders level label in EN (LEVEL 1)', () => {
    renderWithI18n(<SpellSlots character={BASE} />, 'en')
    expect(screen.getByText('LEVEL 1')).toBeDefined()
  })

  it('has accessible aria-label on slot row in EN', () => {
    const c = {
      ...BASE,
      spells: { ...BASE.spells!, slots: [{ level: 2, current: 1, max: 3 }] },
    }
    renderWithI18n(<SpellSlots character={c} />, 'en')
    expect(
      screen.getByRole('group', { name: 'Level 2 slot (1 of 3 available)' }),
    ).toBeDefined()
  })
})
