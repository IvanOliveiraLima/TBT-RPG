import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { LoreHero } from '@/components/sheet/parts/LoreHero'
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
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const WITH_PORTRAIT: Character = {
  ...BASE,
  images: { character: 'data:image/png;base64,abc123' },
}

describe('LoreHero', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders lore-hero testid', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('lore-hero')).toBeDefined()
  })

  it('shows character name in name input', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('lore-name') as HTMLInputElement
    expect(input.value).toBe('Eira Thornwood')
  })

  it('shows meta line with race, class, level, background, and alignment', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    const meta = screen.getByTestId('lore-meta').textContent ?? ''
    expect(meta).toContain('Wood Elf')
    expect(meta).toContain('Ranger 5')
    expect(meta).toContain('Outlander')
    expect(meta).toContain('Neutral Good')
  })

  it('portrait button has aria-label for edit (PT)', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByRole('button', { name: 'Editar imagem do personagem' })).toBeDefined()
  })

  it('portrait button has aria-label for edit (EN)', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByRole('button', { name: 'Edit character image' })).toBeDefined()
  })

  it('shows placeholder initial when no portrait', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    const initial = screen.getByTestId('lore-portrait-initial')
    expect(initial.textContent).toBe('E')
  })

  it('does not show initial when portrait is provided', () => {
    renderWithI18n(<LoreHero character={WITH_PORTRAIT} onUpdate={vi.fn()} />, 'pt')
    expect(screen.queryByTestId('lore-portrait-initial')).toBeNull()
  })

  it('shows XP in xp input', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    const xpInput = screen.getByTestId('lore-xp-input') as HTMLInputElement
    expect(xpInput.value).toBe('6500')
  })

  it('shows level in lore-hero', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    const hero = screen.getByTestId('lore-hero')
    expect(hero.textContent).toContain('5')
  })

  // ── editing: name ────────────────────────────────────────────────────────

  it('calls onUpdate with new name when name input changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<LoreHero character={BASE} onUpdate={onUpdate} />, 'pt')
    const input = screen.getByTestId('lore-name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Lyra Starweave' } })
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Lyra Starweave' })
  })

  it('calls onUpdate with numeric experience when XP input changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<LoreHero character={BASE} onUpdate={onUpdate} />, 'pt')
    const input = screen.getByTestId('lore-xp-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '10000' } })
    expect(onUpdate).toHaveBeenCalledWith({ experience: 10000 })
  })

  // ── editing: image modal ─────────────────────────────────────────────────

  it('clicking portrait opens image modal', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    fireEvent.click(screen.getByTestId('lore-portrait'))
    expect(screen.getByTestId('image-modal')).toBeDefined()
  })

  it('clicking modal cancel closes modal', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    fireEvent.click(screen.getByTestId('lore-portrait'))
    fireEvent.click(screen.getByTestId('image-modal-cancel'))
    expect(screen.queryByTestId('image-modal')).toBeNull()
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('shows level text in PT context', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('lore-level-text').textContent).toContain('Nível 5')
  })

  it('shows level text in EN context', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('lore-level-text').textContent).toContain('Level 5')
  })

  it('character name, race, class, alignment are not translated (free-text)', () => {
    renderWithI18n(<LoreHero character={BASE} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('lore-name') as HTMLInputElement
    expect(input.value).toBe('Eira Thornwood')
    const meta = screen.getByTestId('lore-meta').textContent ?? ''
    expect(meta).toContain('Wood Elf')
    expect(meta).toContain('Ranger 5')
    expect(meta).toContain('Neutral Good')
  })
})
