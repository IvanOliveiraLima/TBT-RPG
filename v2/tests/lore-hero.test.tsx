import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { LoreHero } from '@/components/sheet/parts/LoreHero'

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
  notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const WITH_PORTRAIT: Character = {
  ...BASE,
  images: { character: 'data:image/png;base64,abc123' },
}

describe('LoreHero', () => {
  it('renders lore-hero testid', () => {
    render(<LoreHero character={BASE} />)
    expect(screen.getByTestId('lore-hero')).toBeDefined()
  })

  it('shows character name', () => {
    render(<LoreHero character={BASE} />)
    expect(screen.getByTestId('lore-name').textContent).toBe('Eira Thornwood')
  })

  it('shows meta line with race, class, level, background, and alignment', () => {
    render(<LoreHero character={BASE} />)
    const meta = screen.getByTestId('lore-meta').textContent ?? ''
    expect(meta).toContain('Wood Elf')
    expect(meta).toContain('Ranger 5')
    expect(meta).toContain('Outlander')
    expect(meta).toContain('Neutral Good')
  })

  it('shows portrait with aria-label when image exists', () => {
    render(<LoreHero character={WITH_PORTRAIT} />)
    expect(screen.getByRole('img', { name: 'Retrato de Eira Thornwood' })).toBeDefined()
  })

  it('shows placeholder initial when no portrait', () => {
    render(<LoreHero character={BASE} />)
    const initial = screen.getByTestId('lore-portrait-initial')
    expect(initial.textContent).toBe('E')
  })

  it('does not show initial when portrait is provided', () => {
    render(<LoreHero character={WITH_PORTRAIT} />)
    expect(screen.queryByTestId('lore-portrait-initial')).toBeNull()
  })

  it('shows level and XP line', () => {
    render(<LoreHero character={BASE} />)
    const hero = screen.getByTestId('lore-hero')
    expect(hero.textContent).toContain('Nível 5')
    expect(hero.textContent).toContain('6500 XP')
  })
})
