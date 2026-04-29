import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { SpellList } from '@/components/sheet/parts/SpellList'

// Kael Brightweave — Bard 5, full spell list (unsorted, to verify sort)
const KAEL: Character = {
  id: 'kael_01',
  name: 'Kael Brightweave',
  race: 'Half-Elf',
  background: 'Entertainer',
  alignment: 'Chaotic Good',
  classes: [{ name: 'Bard', level: 5, hitDie: 8 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
  proficiencyBonus: 3,
  hp: { current: 35, max: 35, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14,
  initiative: 2,
  speed: 30,
  passivePerception: 13,
  spellSaveDC: 15,
  inspiration: false,
  savingThrows: [],
  skills: [],
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  // spells intentionally unsorted to verify alphabetical rendering
  spells: {
    ability: 'cha',
    attackBonus: 7,
    saveDC: 15,
    slots: [
      { level: 1, current: 4, max: 4 },
      { level: 2, current: 3, max: 3 },
      { level: 3, current: 2, max: 2 },
    ],
    known: [
      // Cantrips (level 0) — inserted in non-alphabetical order
      { level: 0, name: 'Vicious Mockery' },
      { level: 0, name: 'Minor Illusion' },
      { level: 0, name: 'Prestidigitation' },
      // Level 1 — non-alphabetical
      { level: 1, name: 'Thunderwave', prepared: true },
      { level: 1, name: 'Faerie Fire', prepared: false },
      { level: 1, name: 'Healing Word', prepared: true },
      // Level 2
      { level: 2, name: 'Shatter', prepared: true },
      { level: 2, name: 'Invisibility', prepared: false },
      // Level 3
      { level: 3, name: 'Hypnotic Pattern', prepared: true },
    ],
  },
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

const EMPTY_SPELLS: Character = {
  ...KAEL,
  spells: { ...KAEL.spells!, known: [] },
}

describe('SpellList', () => {
  it('renders "TRUQUES" section for cantrips (level 0)', () => {
    render(<SpellList character={KAEL} />)
    expect(screen.getByTestId('spell-section-0')).toBeDefined()
    expect(screen.getByText('TRUQUES')).toBeDefined()
  })

  it('renders "NÍVEL 1" section for level 1 spells', () => {
    render(<SpellList character={KAEL} />)
    expect(screen.getByTestId('spell-section-1')).toBeDefined()
    expect(screen.getByText('NÍVEL 1')).toBeDefined()
  })

  it('renders "NÍVEL 2" and "NÍVEL 3" sections', () => {
    render(<SpellList character={KAEL} />)
    expect(screen.getByText('NÍVEL 2')).toBeDefined()
    expect(screen.getByText('NÍVEL 3')).toBeDefined()
  })

  it('renders cantrip names', () => {
    render(<SpellList character={KAEL} />)
    expect(screen.getByText('Vicious Mockery')).toBeDefined()
    expect(screen.getByText('Minor Illusion')).toBeDefined()
    expect(screen.getByText('Prestidigitation')).toBeDefined()
  })

  it('renders leveled spell names', () => {
    render(<SpellList character={KAEL} />)
    expect(screen.getByText('Healing Word')).toBeDefined()
    expect(screen.getByText('Faerie Fire')).toBeDefined()
    expect(screen.getByText('Hypnotic Pattern')).toBeDefined()
  })

  it('sorts cantrips alphabetically (Minor Illusion before Vicious Mockery)', () => {
    render(<SpellList character={KAEL} />)
    const section0 = screen.getByTestId('spell-section-0')
    const rows = [...section0.querySelectorAll('[data-testid^="spell-row-"]')]
    expect(rows[0]?.textContent).toContain('Minor Illusion')
    expect(rows[2]?.textContent).toContain('Vicious Mockery')
  })

  it('sorts level 1 spells alphabetically (Faerie Fire before Healing Word before Thunderwave)', () => {
    render(<SpellList character={KAEL} />)
    const section1 = screen.getByTestId('spell-section-1')
    const rows = [...section1.querySelectorAll('[data-testid^="spell-row-"]')]
    expect(rows[0]?.textContent).toContain('Faerie Fire')
    expect(rows[1]?.textContent).toContain('Healing Word')
    expect(rows[2]?.textContent).toContain('Thunderwave')
  })

  it('spell with prepared: false has data-prepared="false"', () => {
    render(<SpellList character={KAEL} />)
    const row = screen.getByTestId('spell-row-faerie-fire')
    expect(row.getAttribute('data-prepared')).toBe('false')
  })

  it('spell with prepared: true has data-prepared="true"', () => {
    render(<SpellList character={KAEL} />)
    const row = screen.getByTestId('spell-row-healing-word')
    expect(row.getAttribute('data-prepared')).toBe('true')
  })

  it('cantrip (no prepared field) has data-prepared="true"', () => {
    render(<SpellList character={KAEL} />)
    const row = screen.getByTestId('spell-row-vicious-mockery')
    expect(row.getAttribute('data-prepared')).toBe('true')
  })

  it('shows empty state when known list is empty', () => {
    render(<SpellList character={EMPTY_SPELLS} />)
    expect(screen.getByTestId('spell-empty-state')).toBeDefined()
    expect(screen.getByText('Nenhuma magia cadastrada.')).toBeDefined()
  })

  it('empty state shows help text', () => {
    render(<SpellList character={EMPTY_SPELLS} />)
    expect(screen.getByText('Adicione cantrips e magias para gerenciar slots.')).toBeDefined()
  })

  it('shows "+ Adicionar" button when list is populated', () => {
    render(<SpellList character={KAEL} />)
    expect(screen.getByTestId('add-spell-btn')).toBeDefined()
  })

  it('shows "+ Adicionar" button even when list is empty', () => {
    render(<SpellList character={EMPTY_SPELLS} />)
    expect(screen.getByTestId('add-spell-btn')).toBeDefined()
  })

  it('shows total spell count in header', () => {
    // 3 cantrips + 3 level-1 + 2 level-2 + 1 level-3 = 9
    render(<SpellList character={KAEL} />)
    const list = screen.getByTestId('spell-list')
    expect(list.textContent).toContain('(9)')
  })

  it('shows (0) count when list is empty', () => {
    render(<SpellList character={EMPTY_SPELLS} />)
    const list = screen.getByTestId('spell-list')
    expect(list.textContent).toContain('(0)')
  })

  it('remove button is present for each spell', () => {
    render(<SpellList character={KAEL} />)
    expect(screen.getByTestId('remove-spell-vicious-mockery')).toBeDefined()
    expect(screen.getByTestId('remove-spell-faerie-fire')).toBeDefined()
  })

  it('remove button has accessible aria-label', () => {
    render(<SpellList character={KAEL} />)
    const btn = screen.getByRole('button', { name: 'Remover magia Healing Word' })
    expect(btn).toBeDefined()
  })
})
