import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { HpBlock } from '@/components/sheet/parts/HpBlock'
import { HitDicePool } from '@/components/sheet/parts/HitDicePool'
import { DeathSaves } from '@/components/sheet/parts/DeathSaves'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'char_hp_test',
  name: 'Grimbold Ironfist',
  race: 'Anão',
  background: 'Outlander',
  alignment: 'Leal e Bom',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 18, dex: 10, con: 16, int: 8, wis: 12, cha: 6 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 17, initiative: 0, speed: 25,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('HpBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows current HP number correctly', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('hp-current').textContent).toBe('45')
  })

  it('shows max HP in the slash notation', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getByText('/ 45')).toBeDefined()
  })

  it('shows temp HP badge when temp > 0', () => {
    const char = { ...BASE, hp: { current: 45, max: 45, temp: 8 } }
    renderWithI18n(<HpBlock character={char} />, 'pt')
    expect(screen.getByText('+8 temp')).toBeDefined()
  })

  it('does not show temp HP badge when temp is 0', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.queryByText(/temp/)).toBeNull()
  })

  it('marks hp-current as low when HP < 30%', () => {
    const char = { ...BASE, hp: { current: 5, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} />, 'pt')
    const el = screen.getByTestId('hp-current')
    expect(el.getAttribute('data-low')).toBe('true')
  })

  it('does not mark hp-current as low when HP >= 30%', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    const el = screen.getByTestId('hp-current')
    expect(el.getAttribute('data-low')).toBe('false')
  })

  it('Heal button is present (PT)', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getAllByText('＋ Curar').length).toBeGreaterThanOrEqual(1)
  })

  it('Damage button is present (PT)', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getAllByText('− Dano').length).toBeGreaterThanOrEqual(1)
  })

  it('Heal button is present (EN)', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'en')
    expect(screen.getAllByText('＋ Heal').length).toBeGreaterThanOrEqual(1)
  })

  it('Damage button is present (EN)', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'en')
    expect(screen.getAllByText('− Damage').length).toBeGreaterThanOrEqual(1)
  })

  it('Heal button shows alert on click (stub behaviour)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    fireEvent.click(screen.getAllByText('＋ Curar')[0]!)
    expect(alertSpy).toHaveBeenCalledWith('Edição virá na Fase C')
    alertSpy.mockRestore()
  })

  it('Damage button shows alert on click (stub behaviour)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    fireEvent.click(screen.getAllByText('− Dano')[0]!)
    expect(alertSpy).toHaveBeenCalledWith('Edição virá na Fase C')
    alertSpy.mockRestore()
  })

  it('shows dashes when max HP is 0', () => {
    const char = { ...BASE, hp: { current: 0, max: 0, temp: 0 } }
    renderWithI18n(<HpBlock character={char} />, 'pt')
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('section title is "Pontos de Vida" in PT', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getAllByText('Pontos de Vida').length).toBeGreaterThanOrEqual(1)
  })

  it('section title is "Hit Points" in EN', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'en')
    expect(screen.getAllByText('Hit Points').length).toBeGreaterThanOrEqual(1)
  })
})

describe('HitDicePool', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders one row for a single class', () => {
    renderWithI18n(<HitDicePool hitDice={[{ current: 5, max: 5, dieSize: 10 }]} />, 'pt')
    expect(screen.getByText(/d10/)).toBeDefined()
  })

  it('renders one row per class for multiclass', () => {
    renderWithI18n(
      <HitDicePool
        hitDice={[
          { current: 3, max: 3, dieSize: 8 },
          { current: 2, max: 2, dieSize: 6 },
        ]}
      />,
      'pt',
    )
    expect(screen.getByText(/d8/)).toBeDefined()
    expect(screen.getByText(/d6/)).toBeDefined()
  })

  it('shows fallback dashes when hitDice is empty', () => {
    renderWithI18n(<HitDicePool hitDice={[]} />, 'pt')
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('shows current / max values', () => {
    renderWithI18n(<HitDicePool hitDice={[{ current: 3, max: 5, dieSize: 8 }]} />, 'pt')
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText(/\/ 5 d8/)).toBeDefined()
  })

  it('section title is "Dados de Vida" in PT', () => {
    renderWithI18n(<HitDicePool hitDice={[{ current: 4, max: 4, dieSize: 8 }]} />, 'pt')
    expect(screen.getByText('Dados de Vida')).toBeDefined()
  })

  it('section title is "Hit Dice" in EN', () => {
    renderWithI18n(<HitDicePool hitDice={[{ current: 4, max: 4, dieSize: 8 }]} />, 'en')
    expect(screen.getByText('Hit Dice')).toBeDefined()
  })
})

describe('DeathSaves', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders the success check mark', () => {
    renderWithI18n(<DeathSaves successes={0} failures={0} />, 'pt')
    expect(screen.getByText('✓')).toBeDefined()
  })

  it('renders the failure cross mark', () => {
    renderWithI18n(<DeathSaves successes={0} failures={0} />, 'pt')
    expect(screen.getByText('✗')).toBeDefined()
  })

  it('renders 3 success pips total', () => {
    const { container } = renderWithI18n(<DeathSaves successes={2} failures={0} />, 'pt')
    const pips = container.querySelectorAll('[role="presentation"]')
    expect(pips.length).toBe(6)
  })

  it('renders 3 failures pips total (character dying)', () => {
    const { container } = renderWithI18n(<DeathSaves successes={0} failures={3} />, 'pt')
    const pips = container.querySelectorAll('[role="presentation"]')
    expect(pips.length).toBe(6)
  })
})
