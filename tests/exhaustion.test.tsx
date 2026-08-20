/**
 * Exhaustion marker tests — verifies the 6-level exhaustion tracker in HpBlock:
 *   - absent → level 0, no effect text
 *   - click marker n → onUpdate({ exhaustion: n }); effect displayed
 *   - click current level → decrement to n-1
 *   - locked → markers are read-only (no buttons)
 *   - level 6 shows death effect text
 *   - PT/EN labels
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { HpBlock } from '@/components/sheet/parts/HpBlock'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/hooks/useCharacterLocked')
vi.mock('@/components/HelpHint', () => ({ HelpHint: () => null }))
vi.mock('@/store/useDiceStore', () => ({
  useDiceStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isOpen: false, toggle: vi.fn(), close: vi.fn(), open: vi.fn(),
      rollMode: 'normal', setRollMode: vi.fn(), addRoll: vi.fn(),
      setCampaignContext: vi.fn(), clearCampaignContext: vi.fn(),
    }),
}))

// ── Import mocked hook for control ────────────────────────────────────────────

import { useCharacterLocked } from '@/hooks/useCharacterLocked'

// ── Base character fixture ────────────────────────────────────────────────────

const BASE: Character = {
  id: 'char_exhaust_test',
  name: 'Gorak',
  race: 'Half-Orc',
  background: 'Outlander',
  alignment: 'Chaotic Neutral',
  classes: [{ name: 'Barbarian', level: 4, hitDie: 12 }],
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 18, dex: 12, con: 16, int: 8, wis: 10, cha: 8 },
  hp: { current: 40, max: 40, temp: 0 },
  hitDice: [{ className: 'Barbarian', current: 4, max: 4, dieSize: 12 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 1, speed: 30,
  inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 10, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  images: {},
  createdAt: 0, updatedAt: 0,
}

describe('Exhaustion — absent / level 0', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(false)
  })

  it('renders 6 markers even when exhaustion is absent', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    for (let n = 1; n <= 6; n++) {
      expect(screen.getByTestId(`exhaustion-level-${n}`)).toBeDefined()
    }
  })

  it('shows no effect text when exhaustion is absent (level 0)', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.queryByTestId('exhaustion-effect')).toBeNull()
  })

  it('shows no effect text when exhaustion is explicitly 0', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 0 }} onUpdate={vi.fn()} />, 'pt')
    expect(screen.queryByTestId('exhaustion-effect')).toBeNull()
  })

  it('shows PT label "Exaustão"', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Exaustão')).toBeDefined()
  })

  it('shows EN label "Exhaustion"', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('Exhaustion')).toBeDefined()
  })
})

describe('Exhaustion — interactive markers', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(false)
  })

  it('clicking marker 3 calls onUpdate({ exhaustion: 3 })', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('exhaustion-level-3'))
    expect(onUpdate).toHaveBeenCalledWith({ exhaustion: 3 })
  })

  it('clicking marker 3 when already at level 3 decrements to 2', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 3 }} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('exhaustion-level-3'))
    expect(onUpdate).toHaveBeenCalledWith({ exhaustion: 2 })
  })

  it('clicking marker 1 when at level 1 decrements to 0', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 1 }} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('exhaustion-level-1'))
    expect(onUpdate).toHaveBeenCalledWith({ exhaustion: 0 })
  })

  it('clicking marker 5 raises level from 3 to 5', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 3 }} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('exhaustion-level-5'))
    expect(onUpdate).toHaveBeenCalledWith({ exhaustion: 5 })
  })

  it('markers have aria-pressed=true up to current level', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 2 }} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('exhaustion-level-1').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('exhaustion-level-2').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('exhaustion-level-3').getAttribute('aria-pressed')).toBe('false')
  })
})

describe('Exhaustion — effect text', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(false)
  })

  it('shows level-1 PT effect', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 1 }} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('exhaustion-effect').textContent).toBe('Desvantagem em testes de habilidade')
  })

  it('shows level-3 PT effect', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 3 }} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('exhaustion-effect').textContent).toBe('Desvantagem em jogadas de ataque e salvaguardas')
  })

  it('shows level-6 PT effect (Morte)', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 6 }} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('exhaustion-effect').textContent).toBe('Morte')
  })

  it('shows level-1 EN effect', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 1 }} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('exhaustion-effect').textContent).toBe('Disadvantage on ability checks')
  })

  it('shows level-6 EN effect (Death)', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 6 }} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('exhaustion-effect').textContent).toBe('Death')
  })
})

describe('Exhaustion — read-only (no onUpdate = master view)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(false)
  })

  it('markers render as divs (not buttons) when no onUpdate', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    const marker = screen.getByTestId('exhaustion-level-1')
    expect(marker.tagName.toLowerCase()).toBe('div')
  })

  it('no aria-pressed when markers are presentation divs', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('exhaustion-level-1').getAttribute('aria-pressed')).toBeNull()
  })
})

describe('Exhaustion — locked mode', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(true)
  })

  afterEach(() => {
    vi.mocked(useCharacterLocked).mockReturnValue(false)
  })

  it('markers render as divs (not buttons) when locked', () => {
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 2 }} onUpdate={vi.fn()} />, 'pt')
    const marker = screen.getByTestId('exhaustion-level-1')
    expect(marker.tagName.toLowerCase()).toBe('div')
  })

  it('clicking a marker does not call onUpdate when locked', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={{ ...BASE, exhaustion: 2 }} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('exhaustion-level-3'))
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
