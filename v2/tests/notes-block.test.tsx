import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
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
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 20, cp: 5 },
  features: [],
  backstory: 'Guardian of the Thornwood Forest.',
  personality: { traits: 'Quiet observer', ideals: 'Protecting nature', bonds: 'The forest', flaws: 'Distrusts cities' },
  notes1: 'Ki points: 5 remaining.',
  notes2: 'Flurry of Blows used twice this session.',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const NOTES1_ONLY: Character = { ...BASE, notes1: 'Session summary here.', notes2: '' }
const EMPTY_NOTES: Character = { ...BASE, notes1: '', notes2: '' }

describe('NotesBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders notes-block testid', () => {
    renderWithI18n(<NotesBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('notes-block')).toBeDefined()
  })

  it('shows notes1 in editable textarea', () => {
    renderWithI18n(<NotesBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('notes-textarea') as HTMLTextAreaElement
    expect(ta.value).toBe('Ki points: 5 remaining.')
  })

  it('shows notes2 as read-only text when both notes present', () => {
    renderWithI18n(<NotesBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const ro = screen.getByTestId('notes-readonly')
    expect(ro.textContent).toContain('Flurry of Blows used twice this session.')
  })

  it('does not show notes-readonly when notes2 is empty', () => {
    renderWithI18n(<NotesBlock character={NOTES1_ONLY} onUpdate={vi.fn()} />, 'pt')
    expect(screen.queryByTestId('notes-readonly')).toBeNull()
  })

  it('shows placeholder when both notes are empty (PT)', () => {
    renderWithI18n(<NotesBlock character={EMPTY_NOTES} onUpdate={vi.fn()} />, 'pt')
    const ta = screen.getByTestId('notes-textarea') as HTMLTextAreaElement
    expect(ta.placeholder).toBe('Anotações de sessão, NPCs, lembretes...')
  })

  it('shows placeholder when both notes are empty (EN)', () => {
    renderWithI18n(<NotesBlock character={EMPTY_NOTES} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('notes-textarea') as HTMLTextAreaElement
    expect(ta.placeholder).toBe('Session notes, NPCs, reminders...')
  })

  // ── editing ───────────────────────────────────────────────────────────────

  it('calls onUpdate with notes1 when textarea changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<NotesBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const ta = screen.getByTestId('notes-textarea')
    fireEvent.change(ta, { target: { value: 'Updated notes' } })
    expect(onUpdate).toHaveBeenCalledWith({ notes1: 'Updated notes' })
  })

  it('editing notes does NOT include notes2 in onUpdate payload', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<NotesBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    const ta = screen.getByTestId('notes-textarea')
    fireEvent.change(ta, { target: { value: 'Changed' } })
    const payload = onUpdate.mock.calls[0]![0] as Record<string, unknown>
    expect(payload).not.toHaveProperty('notes2')
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('shows section title NOTAS in PT', () => {
    renderWithI18n(<NotesBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('NOTAS')).toBeDefined()
  })

  it('shows section title NOTES in EN', () => {
    renderWithI18n(<NotesBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('NOTES')).toBeDefined()
  })

  it('notes content is not translated (free-text)', () => {
    renderWithI18n(<NotesBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('notes-textarea') as HTMLTextAreaElement
    expect(ta.value).toContain('Ki points: 5 remaining.')
  })
})
