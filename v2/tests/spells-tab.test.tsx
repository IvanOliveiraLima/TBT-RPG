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

// Kael Brightweave — Bard 5, full spells (caster with spells)
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
    known: [
      { level: 0, name: 'Vicious Mockery' },
      { level: 0, name: 'Minor Illusion' },
      { level: 1, name: 'Healing Word', prepared: true },
      { level: 1, name: 'Faerie Fire', prepared: false },
      { level: 3, name: 'Hypnotic Pattern', prepared: true },
    ],
  },
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

// Eira — Druid 5, no spells filled (caster without spells)
const EIRA: Character = {
  ...KAEL,
  id: 'eira_01',
  name: 'Eira',
  classes: [{ name: 'Druid', level: 5, hitDie: 8 }],
  spells: {
    ability: 'wis',
    attackBonus: 6,
    saveDC: 14,
    slots: [],
    known: [],
  },
}

// Kanaan Duskwalker — Monk 5 (non-caster)
const KANAAN: Character = {
  ...KAEL,
  id: 'kanaan_01',
  name: 'Kanaan Duskwalker',
  classes: [{ name: 'Monk', level: 5, hitDie: 8 }],
  spellSaveDC: 0,
  spells: undefined,
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

  it('non-caster (Kanaan): shows non-caster title in PT', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('Esta classe não possui conjuração de magias.')).toBeDefined()
  })

  it('non-caster (Kanaan): does not show spell-header', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.queryByTestId('spell-header')).toBeNull()
  })

  it('non-caster (Kanaan): does not show spell-list', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.queryByTestId('spell-list')).toBeNull()
  })

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

  it('caster with spells (Kael): header shows class name', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('Bard')).toBeDefined()
  })

  it('caster with spells (Kael): header shows CHA ability in EN', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    expect(screen.getByText('CHA')).toBeDefined()
  })

  it('caster without spells (Eira): shows spell-header with WIS in EN', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    expect(screen.getByTestId('spell-header')).toBeDefined()
    expect(screen.getByText('WIS')).toBeDefined()
  })

  it('caster without spells (Eira): does NOT show spell-slots', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.queryByTestId('spell-slots')).toBeNull()
  })

  it('caster without spells (Eira): shows spell-list with empty state', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByTestId('spell-list')).toBeDefined()
    expect(screen.getByTestId('spell-empty-state')).toBeDefined()
  })

  it('caster without spells (Eira): shows header DC 14', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('14')).toBeDefined()
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('non-caster shows title in EN', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'en')
    expect(screen.getByText('This class does not cast spells.')).toBeDefined()
  })

  it('non-caster shows hint in PT', () => {
    useCharactersStore.setState({ characters: [KANAAN], loading: false, error: null })
    useCharacterStore.setState({ activeId: KANAAN.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('Magias são acessadas por classes como Druid, Bard, Cleric, Wizard, Sorcerer e outras.')).toBeDefined()
  })

  it('caster header shows CAR for CHA ability in PT', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('CAR')).toBeDefined()
  })

  it('caster header shows SAB for WIS ability (Eira) in PT', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<SpellsTab />, 'pt')
    expect(screen.getByText('SAB')).toBeDefined()
  })

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
})
