import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { LoreTab } from '@/components/sheet/tabs/LoreTab'
import { useCharacterStore } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

const EIRA: Character = {
  id: 'eira_01',
  name: 'Eira Thornwood',
  race: 'Wood Elf',
  background: 'Outlander',
  alignment: 'Neutral Good',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 42, max: 42, temp: 5 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 4, speed: 35,
  passivePerception: 16, spellSaveDC: 14, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 20, cp: 5 },
  features: [],
  backstory: 'Guardian of the Thornwood Forest.',
  personality: {
    traits: 'Silent and vigilant',
    ideals: 'Protecting all living things',
    bonds: 'The Thornwood is home',
    flaws: 'Cannot trust strangers',
  },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

/** Activate EIRA as the open character in both stores. */
function activateEira() {
  useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
  useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
}

describe('LoreTab integration', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
    useCharacterStore.setState({ activeId: null, loading: false, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
    useCharacterStore.setState({ activeId: null, loading: false, error: null })
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('renders nothing when no active character', () => {
    const { container } = renderWithI18n(<LoreTab />, 'pt')
    expect(container.firstChild).toBeNull()
  })

  it('renders LoreHero when character is loaded', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    expect(screen.getByTestId('lore-hero')).toBeDefined()
  })

  it('renders BackstoryBlock', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    expect(screen.getByTestId('backstory-block')).toBeDefined()
  })

  it('renders PersonalityBlock', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    expect(screen.getByTestId('personality-block')).toBeDefined()
  })

  it('renders NotesBlock', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    expect(screen.getByTestId('notes-block')).toBeDefined()
  })

  it('shows character meta (race, class) in LoreHero', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    const meta = screen.getByTestId('lore-meta').textContent ?? ''
    expect(meta).toContain('Wood Elf')
    expect(meta).toContain('Ranger 5')
  })

  it('shows backstory value in BackstoryBlock textarea', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    const ta = screen.getByTestId('backstory-textarea') as HTMLTextAreaElement
    expect(ta.value).toContain('Guardian of the Thornwood Forest.')
  })

  it('shows all 4 personality values in textareas', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    expect((screen.getByTestId('personality-textarea-traits') as HTMLTextAreaElement).value).toBe('Silent and vigilant')
    expect((screen.getByTestId('personality-textarea-ideals') as HTMLTextAreaElement).value).toBe('Protecting all living things')
    expect((screen.getByTestId('personality-textarea-bonds') as HTMLTextAreaElement).value).toBe('The Thornwood is home')
    expect((screen.getByTestId('personality-textarea-flaws') as HTMLTextAreaElement).value).toBe('Cannot trust strangers')
  })

  it('shows notes placeholder when notes are empty', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    const ta = screen.getByTestId('notes-textarea') as HTMLTextAreaElement
    expect(ta.placeholder).toBe('Anotações de sessão, NPCs, lembretes...')
  })

  // ── edit integration: updateCharacter is the single write path ───────────

  it('editing backstory updates characters store optimistically', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    const ta = screen.getByTestId('backstory-textarea')
    fireEvent.change(ta, { target: { value: 'New backstory' } })
    const updated = useCharactersStore.getState().characters.find(c => c.id === EIRA.id)
    expect(updated?.backstory).toBe('New backstory')
  })

  it('editing backstory in LoreTab updates characters store optimistically', () => {
    activateEira()
    renderWithI18n(<LoreTab />, 'pt')
    const ta = screen.getByTestId('backstory-textarea')
    fireEvent.change(ta, { target: { value: 'New adventure begins.' } })
    const updated = useCharactersStore.getState().characters.find(c => c.id === EIRA.id)
    expect(updated?.backstory).toBe('New adventure begins.')
  })
})
