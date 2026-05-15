import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { BackstoryBlock } from '@/components/sheet/parts/BackstoryBlock'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'eira_01',
  name: 'Eira Thornwood',
  race: 'Wood Elf',
  background: 'Outlander',
  alignment: 'Neutral Good',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  totalLevel: 5,
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 42, max: 42, temp: 5 },
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 4, speed: 35,
  passivePerception: 16, spellSaveDC: 14, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 20, cp: 5 },
  features: [],
  backstory: 'Guardian of the Thornwood Forest.\nProtector of the wild.',
  personality: { traits: 'Quiet observer', ideals: 'Protecting nature', bonds: 'The forest', flaws: 'Distrusts cities' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const EMPTY_BACKSTORY: Character = { ...BASE, backstory: '' }

describe('BackstoryBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders backstory-block testid', () => {
    renderWithI18n(<BackstoryBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('backstory-block')).toBeDefined()
  })

  it('shows backstory value in textarea', () => {
    renderWithI18n(<BackstoryBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('backstory-textarea') as HTMLTextAreaElement
    expect(ta.value).toContain('Guardian of the Thornwood Forest.')
  })

  it('textarea has white-space:pre-wrap style', () => {
    renderWithI18n(<BackstoryBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('backstory-textarea') as HTMLTextAreaElement
    expect(ta.style.whiteSpace).toBe('pre-wrap')
  })

  it('shows placeholder when backstory is empty', () => {
    renderWithI18n(<BackstoryBlock character={EMPTY_BACKSTORY} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('backstory-textarea') as HTMLTextAreaElement
    expect(ta.placeholder).toBe('Documente o passado do seu personagem...')
  })

  it('shows placeholder in EN when backstory is empty', () => {
    renderWithI18n(<BackstoryBlock character={EMPTY_BACKSTORY} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('backstory-textarea') as HTMLTextAreaElement
    expect(ta.placeholder).toBe("Document your character's past...")
  })

  // ── editing ───────────────────────────────────────────────────────────────

  it('calls onUpdate with new backstory on change', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<BackstoryBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const ta = screen.getByTestId('backstory-textarea')
    fireEvent.change(ta, { target: { value: 'New story' } })
    expect(onUpdate).toHaveBeenCalledWith({ backstory: 'New story' })
  })

  it('calls onUpdate with empty string when content cleared', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<BackstoryBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const ta = screen.getByTestId('backstory-textarea')
    fireEvent.change(ta, { target: { value: '' } })
    expect(onUpdate).toHaveBeenCalledWith({ backstory: '' })
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('shows section title HISTÓRIA in PT', () => {
    renderWithI18n(<BackstoryBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('HISTÓRIA')).toBeDefined()
  })

  it('shows section title BACKSTORY in EN', () => {
    renderWithI18n(<BackstoryBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('BACKSTORY')).toBeDefined()
  })
})
