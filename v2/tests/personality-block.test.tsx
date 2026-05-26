import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { PersonalityBlock } from '@/components/sheet/parts/PersonalityBlock'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
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
    traits: 'Quiet and observant',
    ideals: 'Protecting the wild',
    bonds: 'Bonded to the forest',
    flaws: 'Distrusts cities',
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

const EMPTY_PERSONALITY: Character = {
  ...BASE,
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
}

describe('PersonalityBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders personality-block testid', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('personality-block')).toBeDefined()
  })

  it('renders all 4 personality field containers (stable key-based testids)', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('personality-field-traits')).toBeDefined()
    expect(screen.getByTestId('personality-field-ideals')).toBeDefined()
    expect(screen.getByTestId('personality-field-bonds')).toBeDefined()
    expect(screen.getByTestId('personality-field-flaws')).toBeDefined()
  })

  it('renders 4 textareas (one per field)', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('personality-textarea-traits')).toBeDefined()
    expect(screen.getByTestId('personality-textarea-ideals')).toBeDefined()
    expect(screen.getByTestId('personality-textarea-bonds')).toBeDefined()
    expect(screen.getByTestId('personality-textarea-flaws')).toBeDefined()
  })

  it('shows PT labels: Traços, Ideais, Vínculos, Defeitos', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Traços')).toBeDefined()
    expect(screen.getByText('Ideais')).toBeDefined()
    expect(screen.getByText('Vínculos')).toBeDefined()
    expect(screen.getByText('Defeitos')).toBeDefined()
  })

  it('shows traits value in textarea', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-traits') as HTMLTextAreaElement
    expect(ta.value).toBe('Quiet and observant')
  })

  it('shows ideals value in textarea', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-ideals') as HTMLTextAreaElement
    expect(ta.value).toBe('Protecting the wild')
  })

  it('shows bonds value in textarea', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-bonds') as HTMLTextAreaElement
    expect(ta.value).toBe('Bonded to the forest')
  })

  it('shows flaws value in textarea', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-flaws') as HTMLTextAreaElement
    expect(ta.value).toBe('Distrusts cities')
  })

  it('shows placeholder for empty field (PT)', () => {
    renderWithI18n(<PersonalityBlock character={EMPTY_PERSONALITY} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-traits') as HTMLTextAreaElement
    expect(ta.placeholder).toBe('Traços de personalidade...')
  })

  it('shows placeholder for empty field (EN)', () => {
    renderWithI18n(<PersonalityBlock character={EMPTY_PERSONALITY} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('personality-textarea-traits') as HTMLTextAreaElement
    expect(ta.placeholder).toBe('Personality traits...')
  })

  // ── editing ───────────────────────────────────────────────────────────────

  it('calls onUpdate with updated traits on change', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-traits')
    fireEvent.change(ta, { target: { value: 'New trait' } })
    expect(onUpdate).toHaveBeenCalledWith({
      personality: { ...BASE.personality, traits: 'New trait' },
    })
  })

  it('editing traits does not affect ideals in onUpdate payload', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-traits')
    fireEvent.change(ta, { target: { value: 'New trait' } })
    const payload = onUpdate.mock.calls[0]![0] as { personality: Character['personality'] }
    expect(payload.personality.ideals).toBe(BASE.personality.ideals)
  })

  it('calls onUpdate with updated flaws on change', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const ta = screen.getByTestId('personality-textarea-flaws')
    fireEvent.change(ta, { target: { value: 'Reckless' } })
    expect(onUpdate).toHaveBeenCalledWith({
      personality: { ...BASE.personality, flaws: 'Reckless' },
    })
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('shows section title PERSONALIDADE in PT', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('PERSONALIDADE')).toBeDefined()
  })

  it('shows section title PERSONALITY in EN', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('PERSONALITY')).toBeDefined()
  })

  it('shows EN labels: Traits, Ideals, Bonds, Flaws', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('Traits')).toBeDefined()
    expect(screen.getByText('Ideals')).toBeDefined()
    expect(screen.getByText('Bonds')).toBeDefined()
    expect(screen.getByText('Flaws')).toBeDefined()
  })

  it('personality values are not translated (free-text)', () => {
    renderWithI18n(<PersonalityBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('personality-textarea-traits') as HTMLTextAreaElement
    expect(ta.value).toBe('Quiet and observant')
  })
})
