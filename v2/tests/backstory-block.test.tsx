import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { BackstoryBlock } from '@/components/sheet/parts/BackstoryBlock'

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
  backstory: 'Guardian of the Thornwood Forest.\nProtector of the wild.',
  personality: { traits: 'Quiet observer', ideals: 'Protecting nature', bonds: 'The forest', flaws: 'Distrusts cities' },
  notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const EMPTY_BACKSTORY: Character = { ...BASE, backstory: '' }

describe('BackstoryBlock', () => {
  it('renders backstory-block testid', () => {
    render(<BackstoryBlock character={BASE} />)
    expect(screen.getByTestId('backstory-block')).toBeDefined()
  })

  it('shows backstory text when present', () => {
    render(<BackstoryBlock character={BASE} />)
    expect(screen.getByTestId('backstory-text').textContent).toContain('Guardian of the Thornwood Forest.')
  })

  it('preserves newlines (whitespace-pre-wrap) in backstory text', () => {
    render(<BackstoryBlock character={BASE} />)
    const el = screen.getByTestId('backstory-text') as HTMLElement
    expect(el.style.whiteSpace).toBe('pre-wrap')
  })

  it('shows empty state when backstory is empty', () => {
    render(<BackstoryBlock character={EMPTY_BACKSTORY} />)
    expect(screen.getByTestId('backstory-empty')).toBeDefined()
    expect(screen.getByText('Nenhuma história registrada ainda.')).toBeDefined()
  })

  it('does not show empty state when backstory is present', () => {
    render(<BackstoryBlock character={BASE} />)
    expect(screen.queryByTestId('backstory-empty')).toBeNull()
  })
})
