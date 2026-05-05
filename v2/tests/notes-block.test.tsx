import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { NotesBlock } from '@/components/sheet/parts/NotesBlock'
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
  backstory: 'Guardian of the Thornwood Forest.',
  personality: { traits: 'Quiet observer', ideals: 'Protecting nature', bonds: 'The forest', flaws: 'Distrusts cities' },
  notes: 'Ki points: 5 remaining.\n\nFlurry of Blows used twice this session.',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const EMPTY_NOTES: Character = { ...BASE, notes: '' }

describe('NotesBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders notes-block testid', () => {
    renderWithI18n(<NotesBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('notes-block')).toBeDefined()
  })

  it('shows notes text when present', () => {
    renderWithI18n(<NotesBlock character={BASE} />, 'pt')
    const el = screen.getByTestId('notes-text')
    expect(el.textContent).toContain('Ki points: 5 remaining.')
    expect(el.textContent).toContain('Flurry of Blows used twice this session.')
  })

  it('preserves newlines (whitespace-pre-wrap) in notes text', () => {
    renderWithI18n(<NotesBlock character={BASE} />, 'pt')
    const el = screen.getByTestId('notes-text') as HTMLElement
    expect(el.style.whiteSpace).toBe('pre-wrap')
  })

  it('shows empty state when notes is empty', () => {
    renderWithI18n(<NotesBlock character={EMPTY_NOTES} />, 'pt')
    expect(screen.getByTestId('notes-empty')).toBeDefined()
    expect(screen.getByText('Nenhuma nota registrada ainda.')).toBeDefined()
  })

  it('does not show empty state when notes is present', () => {
    renderWithI18n(<NotesBlock character={BASE} />, 'pt')
    expect(screen.queryByTestId('notes-empty')).toBeNull()
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('shows section title NOTAS in PT', () => {
    renderWithI18n(<NotesBlock character={BASE} />, 'pt')
    expect(screen.getByText('NOTAS')).toBeDefined()
  })

  it('shows section title NOTES in EN', () => {
    renderWithI18n(<NotesBlock character={BASE} />, 'en')
    expect(screen.getByText('NOTES')).toBeDefined()
  })

  it('shows empty state title in EN', () => {
    renderWithI18n(<NotesBlock character={EMPTY_NOTES} />, 'en')
    expect(screen.getByText('No notes yet.')).toBeDefined()
  })

  it('shows empty state hint in PT', () => {
    renderWithI18n(<NotesBlock character={EMPTY_NOTES} />, 'pt')
    expect(screen.getByText('Use este espaço para anotações de sessão, NPCs e lembretes.')).toBeDefined()
  })

  it('shows empty state hint in EN', () => {
    renderWithI18n(<NotesBlock character={EMPTY_NOTES} />, 'en')
    expect(screen.getByText('Use this space for session notes, NPCs, and reminders.')).toBeDefined()
  })

  it('notes content is not translated (free-text)', () => {
    renderWithI18n(<NotesBlock character={BASE} />, 'en')
    expect(screen.getByTestId('notes-text').textContent).toContain('Ki points: 5 remaining.')
  })
})
