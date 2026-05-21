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
  experience: 6500,
  abilities: { str: 18, dex: 10, con: 16, int: 8, wis: 12, cha: 6 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 17, initiative: 0, speed: 25,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
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

  it('shows current HP in input', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect((screen.getByTestId('hp-current-input') as HTMLInputElement).value).toBe('45')
  })

  it('shows max HP in input', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect((screen.getByTestId('hp-max-input') as HTMLInputElement).value).toBe('45')
  })

  it('shows temp HP in input', () => {
    const char = { ...BASE, hp: { current: 45, max: 45, temp: 8 } }
    renderWithI18n(<HpBlock character={char} />, 'pt')
    expect((screen.getByTestId('hp-temp-input') as HTMLInputElement).value).toBe('8')
  })

  it('temp HP input shows 0 when temp is 0', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect((screen.getByTestId('hp-temp-input') as HTMLInputElement).value).toBe('0')
  })

  it('marks hp-inputs container as low when HP < 30%', () => {
    const char = { ...BASE, hp: { current: 5, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} />, 'pt')
    expect(screen.getByTestId('hp-inputs').getAttribute('data-low')).toBe('true')
  })

  it('does not mark hp-inputs as low when HP >= 30%', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('hp-inputs').getAttribute('data-low')).toBe('false')
  })

  it('shows percentage in header', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('shows dash percentage when max HP is 0', () => {
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

  it('current HP input calls onUpdate when value changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hp-current-input'), { target: { value: '30' } })
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 30, max: 45, temp: 0 } })
  })

  it('max HP input calls onUpdate when value changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hp-max-input'), { target: { value: '50' } })
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 45, max: 50, temp: 0 } })
  })

  it('temp HP input calls onUpdate when value changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hp-temp-input'), { target: { value: '5' } })
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 45, max: 45, temp: 5 } })
  })

  it('HP inputs are disabled when no onUpdate provided', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect((screen.getByTestId('hp-current-input') as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByTestId('hp-max-input') as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByTestId('hp-temp-input') as HTMLInputElement).disabled).toBe(true)
  })
})

describe('HpBlock — current HP clamp', () => {
  beforeEach(() => { localStorage.clear() })

  it('current HP max attribute equals hp.max (not max + temp)', () => {
    const char = { ...BASE, hp: { current: 45, max: 45, temp: 10 } }
    renderWithI18n(<HpBlock character={char} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('hp-current-input') as HTMLInputElement
    expect(Number(input.max)).toBe(45)
  })

  it('current HP does not allow temp HP to extend the max', () => {
    const char = { ...BASE, hp: { current: 45, max: 45, temp: 10 } }
    renderWithI18n(<HpBlock character={char} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('hp-current-input') as HTMLInputElement
    expect(Number(input.max)).not.toBe(55) // 45 + 10 = 55 was the old bug
  })

  it('clamps current to max base when user types above max', () => {
    // value=30, max=45 — typing 50 clamps to 45
    const char = { ...BASE, hp: { current: 30, max: 45, temp: 10 } }
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hp-current-input'), { target: { value: '50' } })
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 45, max: 45, temp: 10 } })
  })

  it('allows current to equal max', () => {
    const char = { ...BASE, hp: { current: 30, max: 45, temp: 0 } }
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('hp-current-input'), { target: { value: '45' } })
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 45, max: 45, temp: 0 } })
  })
})

describe('HpBlock — HP steppers', () => {
  beforeEach(() => { localStorage.clear() })

  it('current HP has decrement and increment buttons when editable (PT)', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByRole('button', { name: 'Diminuir' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeDefined()
  })

  it('current HP has decrement and increment buttons when editable (EN)', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByRole('button', { name: 'Decrement' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Increment' })).toBeDefined()
  })

  it('max HP and temp HP do not have stepper buttons — only current HP does', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    // Exactly 1 decrement button total (from current HP only)
    expect(screen.queryAllByRole('button', { name: 'Diminuir' }).length).toBe(1)
    expect(screen.queryAllByRole('button', { name: 'Aumentar' }).length).toBe(1)
  })

  it('no stepper buttons when no onUpdate provided', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'pt')
    expect(screen.queryByRole('button', { name: 'Diminuir' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Aumentar' })).toBeNull()
  })

  it('decrement button calls onUpdate with current - 1', () => {
    const char = { ...BASE, hp: { current: 30, max: 45, temp: 0 } }
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByRole('button', { name: 'Diminuir' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 29, max: 45, temp: 0 } })
  })

  it('increment button calls onUpdate with current + 1', () => {
    const char = { ...BASE, hp: { current: 30, max: 45, temp: 0 } }
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 31, max: 45, temp: 0 } })
  })

  it('decrement button is disabled when current HP is 0', () => {
    const char = { ...BASE, hp: { current: 0, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={vi.fn()} />, 'pt')
    expect((screen.getByRole('button', { name: 'Diminuir' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('increment button is disabled when current HP equals max', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    // BASE has current=45, max=45
    expect((screen.getByRole('button', { name: 'Aumentar' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('HitDicePool', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders one row for a single class', () => {
    renderWithI18n(<HitDicePool hitDice={[{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }]} />, 'pt')
    expect(screen.getByText(/d10/)).toBeDefined()
  })

  it('renders one row per class for multiclass', () => {
    renderWithI18n(
      <HitDicePool
        hitDice={[
          { className: 'Cleric', current: 3, max: 3, dieSize: 8 },
          { className: 'Sorcerer', current: 2, max: 2, dieSize: 6 },
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
    renderWithI18n(<HitDicePool hitDice={[{ className: 'Druid', current: 3, max: 5, dieSize: 8 }]} />, 'pt')
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText(/\/ 5 d8/)).toBeDefined()
  })

  it('section title is "Dados de Vida" in PT', () => {
    renderWithI18n(<HitDicePool hitDice={[{ className: 'Druid', current: 4, max: 4, dieSize: 8 }]} />, 'pt')
    expect(screen.getByText('Dados de Vida')).toBeDefined()
  })

  it('section title is "Hit Dice" in EN', () => {
    renderWithI18n(<HitDicePool hitDice={[{ className: 'Druid', current: 4, max: 4, dieSize: 8 }]} />, 'en')
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

describe('DeathSaves (editable)', () => {
  beforeEach(() => { localStorage.clear() })

  it('clicking unmarked success pip increments successes to that position', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<DeathSaves successes={0} failures={0} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('deathsave-success-2'))
    expect(onUpdate).toHaveBeenCalledWith({ successes: 2, failures: 0 })
  })

  it('clicking marked success pip decrements to position - 1', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<DeathSaves successes={2} failures={0} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('deathsave-success-2'))
    expect(onUpdate).toHaveBeenCalledWith({ successes: 1, failures: 0 })
  })

  it('clicking success pip 1 when already at 1 decrements to 0', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<DeathSaves successes={1} failures={0} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('deathsave-success-1'))
    expect(onUpdate).toHaveBeenCalledWith({ successes: 0, failures: 0 })
  })

  it('clicking unmarked failure pip increments failures to that position', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<DeathSaves successes={0} failures={1} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('deathsave-failure-3'))
    expect(onUpdate).toHaveBeenCalledWith({ successes: 0, failures: 3 })
  })

  it('clicking marked failure pip decrements to position - 1', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<DeathSaves successes={0} failures={3} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('deathsave-failure-3'))
    expect(onUpdate).toHaveBeenCalledWith({ successes: 0, failures: 2 })
  })

  it('successes and failures are independent', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<DeathSaves successes={1} failures={2} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('deathsave-success-3'))
    expect(onUpdate).toHaveBeenCalledWith({ successes: 3, failures: 2 })
  })

  it('pip buttons have aria-pressed matching fill state', () => {
    renderWithI18n(<DeathSaves successes={2} failures={0} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('deathsave-success-1').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('deathsave-success-2').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('deathsave-success-3').getAttribute('aria-pressed')).toBe('false')
  })
})

describe('HitDicePool (editable)', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders one row per class', () => {
    renderWithI18n(
      <HitDicePool
        hitDice={[
          { className: 'Fighter', current: 3, max: 5, dieSize: 10 },
          { className: 'Wizard', current: 2, max: 2, dieSize: 6 },
        ]}
        onUpdate={vi.fn()}
      />,
      'pt',
    )
    expect(screen.getByTestId('hitdice-Fighter-current')).toBeDefined()
    expect(screen.getByTestId('hitdice-Wizard-current')).toBeDefined()
  })

  it('updates current for one class without affecting others', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <HitDicePool
        hitDice={[
          { className: 'Fighter', current: 3, max: 5, dieSize: 10 },
          { className: 'Wizard', current: 2, max: 2, dieSize: 6 },
        ]}
        onUpdate={onUpdate}
      />,
      'pt',
    )
    fireEvent.change(screen.getByTestId('hitdice-Fighter-current'), { target: { value: '4' } })
    expect(onUpdate).toHaveBeenCalledWith([
      { className: 'Fighter', current: 4, max: 5, dieSize: 10 },
      { className: 'Wizard', current: 2, max: 2, dieSize: 6 },
    ])
  })

  it('clamps current to max', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <HitDicePool
        hitDice={[{ className: 'Druid', current: 3, max: 4, dieSize: 8 }]}
        onUpdate={onUpdate}
      />,
      'pt',
    )
    fireEvent.change(screen.getByTestId('hitdice-Druid-current'), { target: { value: '99' } })
    expect(onUpdate).toHaveBeenCalledWith([{ className: 'Druid', current: 4, max: 4, dieSize: 8 }])
  })

  it('does not show aggregate total for single class', () => {
    renderWithI18n(
      <HitDicePool
        hitDice={[{ className: 'Cleric', current: 3, max: 3, dieSize: 8 }]}
        onUpdate={vi.fn()}
      />,
      'pt',
    )
    expect(screen.queryByText(/total/i)).toBeNull()
  })

  it('shows aggregate total for multiclass', () => {
    renderWithI18n(
      <HitDicePool
        hitDice={[
          { className: 'Cleric', current: 3, max: 3, dieSize: 8 },
          { className: 'Rogue', current: 2, max: 2, dieSize: 8 },
        ]}
        onUpdate={vi.fn()}
      />,
      'pt',
    )
    expect(screen.getByText(/5\s*\/\s*5/)).toBeDefined()
  })

  it('shows className label for each entry when editable', () => {
    renderWithI18n(
      <HitDicePool
        hitDice={[{ className: 'Paladin', current: 2, max: 3, dieSize: 10 }]}
        onUpdate={vi.fn()}
      />,
      'pt',
    )
    expect(screen.getByText('Paladin')).toBeDefined()
  })
})
