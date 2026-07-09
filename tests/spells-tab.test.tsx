import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { SpellsTab } from '@/components/sheet/tabs/SpellsTab'
import { useCharacterStore } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

// Kael Brightweave — Bard 5, full spells and slots
const KAEL: Character = {
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
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  spells: [
    { id: 's1', name: 'Vicious Mockery', level: 0, school: 'enchantment', castingTime: '1 action', range: '60 ft', description: '', prepared: false },
    { id: 's2', name: 'Healing Word', level: 1, school: 'evocation', castingTime: '1 bonus action', range: '60 ft', description: '', prepared: true },
  ],
  spellSlots: {
    '1': { current: 4, max: 4 },
    '2': { current: 3, max: 3 },
    '3': { current: 2, max: 2 },
  },
  spellcastingAbility: 'cha',
  spellcastingClass: 'Bard',
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0, updatedAt: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
}

// Eira — Druid 5, caster with no spells or slots entered yet
const EIRA: Character = {
  ...KAEL,
  id: 'eira_01',
  name: 'Eira',
  classes: [{ name: 'Druid', level: 5, hitDie: 8 }],
  abilities: { str: 10, dex: 12, con: 14, int: 12, wis: 16, cha: 10 },
  spells: [],
  spellSlots: {},
  spellcastingAbility: 'wis',
  spellcastingClass: 'Druid',
  spellSaveDC: 14, // 8 + 3 (prof) + 3 (WIS mod)
}

// Kanaan — Monk 5, non-caster
const KANAAN: Character = {
  ...KAEL,
  id: 'kanaan_01',
  name: 'Kanaan Duskwalker',
  classes: [{ name: 'Monk', level: 5, hitDie: 8 }],
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  spellSaveDC: 0,
}

describe('SpellsTab integration', () => {
  beforeEach(() => { localStorage.clear() })

  afterEach(() => {
    useCharacterStore.setState({ activeId: null, loading: false, error: null })
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('renders nothing when character store is empty', () => {
    const { container } = renderWithI18n(<SpellsTab />, 'pt')
    expect(container.firstChild).toBeNull()
  })

  // ── All characters always show all three blocks ────────────────────────────

  it('caster with spells (Kael): shows spell-header', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-header')).toBeDefined()
  })

  it('caster with spells (Kael): shows spell-slots', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-slots')).toBeDefined()
  })

  it('caster with spells (Kael): shows spell-list', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-list')).toBeDefined()
  })

  it('caster with spells (Kael): header class input shows Bard', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    // In editable mode (onUpdate passed), class is an <input> with value
    expect(screen.getByDisplayValue('Bard')).toBeDefined()
  })

  it('caster with spells (Kael): DC 15 is visible', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('15')).toBeDefined()
  })

  it('caster with spells (Kael): attack bonus +7 is visible', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('+7')).toBeDefined()
  })

  it('caster without spells (Eira): shows spell-header', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    expect(screen.getByTestId('spell-header')).toBeDefined()
  })

  it('caster without spells (Eira): shows spell-slots (editable mode always renders)', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-slots')).toBeDefined()
  })

  it('caster without spells (Eira): shows spell-list with empty state', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-list')).toBeDefined()
    expect(screen.getByTestId('spell-empty-state')).toBeDefined()
  })

  it('caster without spells (Eira): header DC 14 is visible', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('14')).toBeDefined()
  })

  it('non-caster (Kanaan): shows spell-header', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-header')).toBeDefined()
  })

  it('non-caster (Kanaan): shows spell-slots (editable mode)', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-slots')).toBeDefined()
  })

  it('non-caster (Kanaan): shows spell-list', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-list')).toBeDefined()
  })

  it('non-caster (Kanaan): header shows — for DC (no spellcasting ability)', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    const header = screen.getByTestId('spell-header')
    const dashes = [...header.querySelectorAll('*')].filter(el => el.textContent?.trim() === '—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────────────

  it('spell-slots section label shows ESPAÇOS DE MAGIA in PT', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('ESPAÇOS DE MAGIA')).toBeDefined()
  })

  it('spell-slots section label shows SPELL SLOTS in EN', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    expect(screen.getByText('SPELL SLOTS')).toBeDefined()
  })

  it('caster header class input shows Druid for Eira', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    expect(screen.getByDisplayValue('Druid')).toBeDefined()
  })

  it('ability select shows CHA option for Kael in EN', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    // In edit mode the ability select always contains the CHA option
    expect(screen.getByDisplayValue('CHA')).toBeDefined()
  })

  it('ability select shows CAR for KAEL in PT', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByDisplayValue('CAR')).toBeDefined()
  })

  it('ability select shows SAB for Eira in PT', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByDisplayValue('SAB')).toBeDefined()
  })

  it('ability select shows WIS for Eira in EN', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    expect(screen.getByDisplayValue('WIS')).toBeDefined()
  })

  // ── HpBlock on spells tab ─────────────────────────────────────────────────

  it('shows HpBlock on spells tab', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('hp-inputs')).toBeDefined()
  })

  it('HpBlock on spells tab shows current HP value', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    const currentInput = screen.getByTestId('hp-current-input') as HTMLInputElement
    expect(currentInput.value).toBe('35')
  })
})
