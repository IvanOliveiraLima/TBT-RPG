import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoreTab } from '@/components/sheet/tabs/LoreTab'
import { useCharacterStore } from '@/store/character'
import type { Character } from '@/domain/character'

const EIRA: Character = {
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
  personality: {
    traits: 'Silent and vigilant',
    ideals: 'Protecting all living things',
    bonds: 'The Thornwood is home',
    flaws: 'Cannot trust strangers',
  },
  notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('LoreTab integration', () => {
  afterEach(() => {
    useCharacterStore.setState({ character: null, loading: false, error: null })
  })

  it('renders nothing when character store is empty', () => {
    const { container } = render(<LoreTab />)
    expect(container.firstChild).toBeNull()
  })

  it('renders LoreHero when character is loaded', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByTestId('lore-hero')).toBeDefined()
  })

  it('renders BackstoryBlock', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByTestId('backstory-block')).toBeDefined()
  })

  it('renders PersonalityBlock', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByTestId('personality-block')).toBeDefined()
  })

  it('renders NotesBlock', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByTestId('notes-block')).toBeDefined()
  })

  it('shows character name in LoreHero', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByTestId('lore-name').textContent).toBe('Eira Thornwood')
  })

  it('shows backstory text in BackstoryBlock', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByTestId('backstory-text').textContent).toContain('Guardian of the Thornwood Forest.')
  })

  it('shows all 4 personality fields', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByText('Silent and vigilant')).toBeDefined()
    expect(screen.getByText('Protecting all living things')).toBeDefined()
    expect(screen.getByText('The Thornwood is home')).toBeDefined()
    expect(screen.getByText('Cannot trust strangers')).toBeDefined()
  })

  it('shows notes empty state when notes is empty', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<LoreTab />)
    expect(screen.getByTestId('notes-empty')).toBeDefined()
  })
})
