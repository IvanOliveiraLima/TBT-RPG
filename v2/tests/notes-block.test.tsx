import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { NotesBlock } from '@/components/sheet/parts/NotesBlock'

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
  it('renders notes-block testid', () => {
    render(<NotesBlock character={BASE} />)
    expect(screen.getByTestId('notes-block')).toBeDefined()
  })

  it('shows notes text when present', () => {
    render(<NotesBlock character={BASE} />)
    const el = screen.getByTestId('notes-text')
    expect(el.textContent).toContain('Ki points: 5 remaining.')
    expect(el.textContent).toContain('Flurry of Blows used twice this session.')
  })

  it('preserves newlines (whitespace-pre-wrap) in notes text', () => {
    render(<NotesBlock character={BASE} />)
    const el = screen.getByTestId('notes-text') as HTMLElement
    expect(el.style.whiteSpace).toBe('pre-wrap')
  })

  it('shows empty state when notes is empty', () => {
    render(<NotesBlock character={EMPTY_NOTES} />)
    expect(screen.getByTestId('notes-empty')).toBeDefined()
    expect(screen.getByText('Nenhuma nota registrada.')).toBeDefined()
  })

  it('does not show empty state when notes is present', () => {
    render(<NotesBlock character={BASE} />)
    expect(screen.queryByTestId('notes-empty')).toBeNull()
  })
})
