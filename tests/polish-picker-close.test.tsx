/**
 * Polish — Fix 2: import pickers close on backdrop click and Esc
 *
 * Covers:
 * - ImportSpellsPicker: backdrop click closes
 * - ImportSpellsPicker: click inside dialog does NOT close
 * - ImportSpellsPicker: Esc closes
 * - ImportSpellsPicker: "Concluir" button closes (unchanged behaviour)
 * - ImportWeaponsPicker: backdrop click closes
 * - ImportWeaponsPicker: click inside dialog does NOT close
 * - ImportWeaponsPicker: Esc closes
 * - ImportWeaponsPicker: "Concluir" button closes (unchanged behaviour)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Spell, InventoryItem } from '@/domain/character'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { renderWithI18n } from './helpers/render'
import { useCharactersStore } from '@/store/characters'

vi.mock('@/services/sync', () => ({
  scheduleEditSync:   vi.fn(),
  startPeriodicSync:  vi.fn(),
  stopPeriodicSync:   vi.fn(),
  getSyncStatus:      () => 'idle' as const,
  onSyncStatusChange: () => () => undefined,
}))

vi.mock('@/hooks/useSheetRoll', () => ({
  useSheetRoll: () => ({ rollCheck: vi.fn(), rollDamage: vi.fn() }),
}))

/* ── Fixtures ──────────────────────────────────────────────────────────────── */

function makeSpell(overrides: Pick<Spell, 'id'> & Partial<Spell>): Spell {
  return {
    name: 'Test Spell',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '60 ft',
    description: '',
    prepared: false,
    damage: '1d6',
    damageType: 'Fire',
    ...overrides,
  }
}

function makeWeapon(overrides: Pick<InventoryItem, 'id'> & Partial<InventoryItem>): InventoryItem {
  return {
    name: 'Test Weapon',
    quantity: 1,
    weight: 2,
    equipped: true,
    category: 'weapon',
    description: '',
    damage: '1d8',
    damageType: 'Slashing',
    attackKind: 'melee',
    ...overrides,
  }
}

const BASE: Character = {
  id: 'c1',
  name: 'Test',
  race: '', background: '', alignment: '',
  classes: [{ name: 'Fighter', level: 1, hitDie: 10 }],
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 10, max: 10, temp: 0 },
  hitDice: [],
  deathSaves: { successes: 0, failures: 0 },
  ac: 10, initiative: 0, speed: 30,
  passivePerception: 10, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  spells: [makeSpell({ id: 'sp1' })],
  spellSlots: {
    '1': { current: 0, max: 0 }, '2': { current: 0, max: 0 }, '3': { current: 0, max: 0 },
    '4': { current: 0, max: 0 }, '5': { current: 0, max: 0 }, '6': { current: 0, max: 0 },
    '7': { current: 0, max: 0 }, '8': { current: 0, max: 0 }, '9': { current: 0, max: 0 },
  },
  spellcastingAbility: 'int',
  spellcastingClass: 'Wizard',
  inventory: [makeWeapon({ id: 'it1' })],
  currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function openSpellsPicker() {
  fireEvent.click(screen.getByTestId('import-spells-btn'))
}

function openWeaponsPicker() {
  fireEvent.click(screen.getByTestId('import-weapons-btn'))
}

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe('Polish.2 — ImportSpellsPicker closes on backdrop/Esc', () => {
  beforeEach(() => {
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('backdrop click closes the picker', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openSpellsPicker()
    const backdrop = screen.getByTestId('import-spells-picker')
    fireEvent.click(backdrop)
    expect(screen.queryByTestId('import-spells-picker')).not.toBeInTheDocument()
  })

  it('click inside the dialog does NOT close', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openSpellsPicker()
    // Click the "Concluir" button (inside the dialog) — should close via Done, but let's
    // click the spell import button instead which is also inside
    const inner = screen.getByTestId('import-spell-sp1')
    fireEvent.click(inner)
    // Picker should still be open (click was inside dialog, not the backdrop)
    expect(screen.getByTestId('import-spells-picker')).toBeInTheDocument()
  })

  it('Esc closes the picker', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openSpellsPicker()
    expect(screen.getByTestId('import-spells-picker')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('import-spells-picker')).not.toBeInTheDocument()
  })

  it('"Concluir" button still closes', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openSpellsPicker()
    fireEvent.click(screen.getByTestId('import-spells-done'))
    expect(screen.queryByTestId('import-spells-picker')).not.toBeInTheDocument()
  })
})

describe('Polish.2 — ImportWeaponsPicker closes on backdrop/Esc', () => {
  beforeEach(() => {
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('backdrop click closes the picker', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openWeaponsPicker()
    const backdrop = screen.getByTestId('import-weapons-picker')
    fireEvent.click(backdrop)
    expect(screen.queryByTestId('import-weapons-picker')).not.toBeInTheDocument()
  })

  it('click inside the dialog does NOT close', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openWeaponsPicker()
    // Click an item button inside the dialog
    const inner = screen.getByTestId('import-weapon-it1')
    fireEvent.click(inner)
    // Picker stays open after adding (it doesn't auto-close on import)
    expect(screen.getByTestId('import-weapons-picker')).toBeInTheDocument()
  })

  it('Esc closes the picker', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openWeaponsPicker()
    expect(screen.getByTestId('import-weapons-picker')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('import-weapons-picker')).not.toBeInTheDocument()
  })

  it('"Concluir" button still closes', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openWeaponsPicker()
    fireEvent.click(screen.getByTestId('import-weapons-done'))
    expect(screen.queryByTestId('import-weapons-picker')).not.toBeInTheDocument()
  })
})
