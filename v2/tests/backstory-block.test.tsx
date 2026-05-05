import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
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
  beforeEach(() => { localStorage.clear() })

  it('renders backstory-block testid', () => {
    renderWithI18n(<BackstoryBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('backstory-block')).toBeDefined()
  })

  it('shows backstory text when present', () => {
    renderWithI18n(<BackstoryBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('backstory-text').textContent).toContain('Guardian of the Thornwood Forest.')
  })

  it('preserves newlines (whitespace-pre-wrap) in backstory text', () => {
    renderWithI18n(<BackstoryBlock character={BASE} />, 'pt')
    const el = screen.getByTestId('backstory-text') as HTMLElement
    expect(el.style.whiteSpace).toBe('pre-wrap')
  })

  it('shows empty state when backstory is empty', () => {
    renderWithI18n(<BackstoryBlock character={EMPTY_BACKSTORY} />, 'pt')
    expect(screen.getByTestId('backstory-empty')).toBeDefined()
    expect(screen.getByText('Nenhuma história registrada ainda.')).toBeDefined()
  })

  it('does not show empty state when backstory is present', () => {
    renderWithI18n(<BackstoryBlock character={BASE} />, 'pt')
    expect(screen.queryByTestId('backstory-empty')).toBeNull()
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('shows section title HISTÓRIA in PT', () => {
    renderWithI18n(<BackstoryBlock character={BASE} />, 'pt')
    expect(screen.getByText('HISTÓRIA')).toBeDefined()
  })

  it('shows section title BACKSTORY in EN', () => {
    renderWithI18n(<BackstoryBlock character={BASE} />, 'en')
    expect(screen.getByText('BACKSTORY')).toBeDefined()
  })

  it('shows empty state title in EN', () => {
    renderWithI18n(<BackstoryBlock character={EMPTY_BACKSTORY} />, 'en')
    expect(screen.getByText('No story recorded yet.')).toBeDefined()
  })

  it('shows empty state hint in PT', () => {
    renderWithI18n(<BackstoryBlock character={EMPTY_BACKSTORY} />, 'pt')
    expect(screen.getByText('Documente o passado, motivações e momentos marcantes do seu personagem.')).toBeDefined()
  })

  it('shows empty state hint in EN', () => {
    renderWithI18n(<BackstoryBlock character={EMPTY_BACKSTORY} />, 'en')
    expect(screen.getByText("Document your character's past, motivations, and pivotal moments.")).toBeDefined()
  })
})
