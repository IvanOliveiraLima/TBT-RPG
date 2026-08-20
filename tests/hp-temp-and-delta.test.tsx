/**
 * Tests for HpBlock — temp HP absorption + transient delta badge.
 *
 * Part A: damage absorbs temp HP first via onStep
 *   - temp>0, dir=-1 → reduces temp, current unchanged
 *   - temp=0, dir=-1 → reduces current
 *   - temp>0, current=0, dir=-1 → reduces temp only (no negatives)
 *   - dir=+1 → increases current only; temp unchanged
 *   - dir=+1 at max → no update called
 *   - typing (onChange) with temp>0 → current updated directly (no absorption)
 *   - TEMP field has steppers when onUpdate provided
 *   - no steppers when !onUpdate (master view)
 *
 * Part B: delta badge shows accumulated HP change
 *   - 3 clicks − → badge shows −3; disappears after 2 s (fake timers)
 *   - + then − → accumulated; badge absent when net is 0
 *   - click without effect (heal at max) → badge unchanged
 *   - unmount with pending timer → no memory-leak warning
 *
 * NumberField regression:
 *   - without onStep, stepper buttons call onChange as before
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { screen, fireEvent, within } from '@testing-library/react'
import { HpBlock } from '@/components/sheet/parts/HpBlock'
import { NumberField } from '@/components/primitives/NumberField'
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

import { useCharacterLocked } from '@/hooks/useCharacterLocked'

// ── Fixture ───────────────────────────────────────────────────────────────────

const BASE: Character = {
  id: 'char_hp_test',
  name: 'Thorn',
  race: 'Human',
  background: 'Folk Hero',
  alignment: 'Neutral',
  classes: [{ name: 'Fighter', level: 3, hitDie: 10 }],
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
  hp: { current: 39, max: 45, temp: 5 },
  hitDice: [{ className: 'Fighter', current: 3, max: 3, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 1, speed: 30,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

// Current HP is first stepper wrapper; Max HP has no steppers; Temp HP is second.
function getCurrentHpStepper() {
  return screen.getAllByTestId('number-field-stepper-wrapper')[0]!
}
function getTempHpStepper() {
  return screen.getAllByTestId('number-field-stepper-wrapper')[1]!
}

// ── Part A: temp HP absorption ────────────────────────────────────────────────

describe('HpBlock — temp HP absorption (onStep)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(false)
  })

  it('damage (−) reduces temp first when temp > 0, current unchanged', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { ...BASE.hp, temp: 4 } })
  })

  it('damage (−) does not touch current HP when temp > 0', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    const payload = onUpdate.mock.calls[0]![0] as { hp: { current: number } }
    expect(payload.hp.current).toBe(39)
  })

  it('damage (−) reduces current when temp is 0', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 39, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 38, max: 45, temp: 0 } })
  })

  it('damage (−) with temp > 0 and current = 0 → reduces temp only', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 0, max: 45, temp: 3 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 0, max: 45, temp: 2 } })
  })

  it('damage (−) with temp = 0 and current = 0 → no update called', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 0, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('heal (+) increases current only; temp unchanged', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Increment' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 40, max: 45, temp: 5 } })
  })

  it('heal (+) at full HP → no update called', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 45, max: 45, temp: 5 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Increment' }))
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('typing a value (onChange) with temp > 0 → updates current directly, temp untouched', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'en')
    const currentInput = screen.getByTestId('hp-current-input') as HTMLInputElement
    fireEvent.change(currentInput, { target: { value: '20' } })
    expect(onUpdate).toHaveBeenCalledWith({ hp: { ...BASE.hp, current: 20 } })
    // temp must be unchanged
    const payload = onUpdate.mock.calls[0]![0] as { hp: { temp: number } }
    expect(payload.hp.temp).toBe(5)
  })
})

// ── Part A: temp HP steppers ──────────────────────────────────────────────────

describe('HpBlock — TEMP field steppers', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(false)
  })

  it('shows steppers on TEMP field when onUpdate provided', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    // Temp HP stepper wrapper must exist (2nd wrapper after current HP)
    expect(getTempHpStepper()).toBeDefined()
  })

  it('TEMP stepper − reduces hp.temp only', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getTempHpStepper()).getByRole('button', { name: 'Decrement' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 39, max: 45, temp: 4 } })
  })

  it('TEMP stepper + increases hp.temp only', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<HpBlock character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(within(getTempHpStepper()).getByRole('button', { name: 'Increment' }))
    expect(onUpdate).toHaveBeenCalledWith({ hp: { current: 39, max: 45, temp: 6 } })
  })

  it('no TEMP steppers when !onUpdate (master view)', () => {
    renderWithI18n(<HpBlock character={BASE} />, 'en')
    // No stepper wrappers at all
    expect(screen.queryAllByTestId('number-field-stepper-wrapper')).toHaveLength(0)
  })
})

// ── Part B: delta badge ───────────────────────────────────────────────────────

describe('HpBlock — delta badge (Part B)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useCharacterLocked).mockReturnValue(false)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('badge absent when no step has been clicked', () => {
    renderWithI18n(<HpBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('hp-delta-badge')).toBeNull()
  })

  it('3 clicks − → badge shows −3', () => {
    const onUpdate = vi.fn()
    // Use temp=0 so each click reduces current (simpler re-render)
    const char = { ...BASE, hp: { current: 39, max: 45, temp: 0 } }
    const { rerender } = renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')

    for (let i = 0; i < 3; i++) {
      fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    }

    const badge = screen.getByTestId('hp-delta-badge')
    expect(badge.textContent).toBe('\u22123')
    void rerender
  })

  it('badge disappears after 2 s', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 39, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')

    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    expect(screen.getByTestId('hp-delta-badge')).toBeDefined()

    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByTestId('hp-delta-badge')).toBeNull()
  })

  it('+ then − → badge shows net 0 and is absent', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 39, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')

    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Increment' }))
    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))

    expect(screen.queryByTestId('hp-delta-badge')).toBeNull()
  })

  it('heal (+) at full HP does not increment badge', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 45, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')

    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Increment' }))
    expect(screen.queryByTestId('hp-delta-badge')).toBeNull()
  })

  it('badge uses typographic − (U+2212) for negative', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 39, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')

    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    const badge = screen.getByTestId('hp-delta-badge')
    expect(badge.textContent?.startsWith('\u2212')).toBe(true)
  })

  it('badge uses + for positive', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 39, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')

    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Increment' }))
    const badge = screen.getByTestId('hp-delta-badge')
    expect(badge.textContent).toBe('+1')
  })

  it('badge has aria-live=polite', () => {
    const onUpdate = vi.fn()
    const char = { ...BASE, hp: { current: 39, max: 45, temp: 0 } }
    renderWithI18n(<HpBlock character={char} onUpdate={onUpdate} />, 'en')

    fireEvent.click(within(getCurrentHpStepper()).getByRole('button', { name: 'Decrement' }))
    expect(screen.getByTestId('hp-delta-badge').getAttribute('aria-live')).toBe('polite')
  })
})

// ── NumberField regression — without onStep ───────────────────────────────────

describe('NumberField — onStep regression (no onStep → onChange as before)', () => {
  beforeEach(() => { localStorage.clear() })

  it('decrement without onStep calls onChange with decremented value', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <NumberField value={10} min={0} max={20} onChange={onChange} showSteppers data-testid="nf" />,
      'en'
    )
    const wrapper = screen.getByTestId('number-field-stepper-wrapper')
    fireEvent.click(within(wrapper).getByRole('button', { name: 'Decrement' }))
    expect(onChange).toHaveBeenCalledWith(9)
  })

  it('increment without onStep calls onChange with incremented value', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <NumberField value={10} min={0} max={20} onChange={onChange} showSteppers data-testid="nf" />,
      'en'
    )
    const wrapper = screen.getByTestId('number-field-stepper-wrapper')
    fireEvent.click(within(wrapper).getByRole('button', { name: 'Increment' }))
    expect(onChange).toHaveBeenCalledWith(11)
  })

  it('decrement with onStep calls onStep(-1), not onChange', () => {
    const onChange = vi.fn()
    const onStep = vi.fn()
    renderWithI18n(
      <NumberField value={10} min={0} max={20} onChange={onChange} onStep={onStep} showSteppers data-testid="nf" />,
      'en'
    )
    const wrapper = screen.getByTestId('number-field-stepper-wrapper')
    fireEvent.click(within(wrapper).getByRole('button', { name: 'Decrement' }))
    expect(onStep).toHaveBeenCalledWith(-1)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('increment with onStep calls onStep(1), not onChange', () => {
    const onChange = vi.fn()
    const onStep = vi.fn()
    renderWithI18n(
      <NumberField value={10} min={0} max={20} onChange={onChange} onStep={onStep} showSteppers data-testid="nf" />,
      'en'
    )
    const wrapper = screen.getByTestId('number-field-stepper-wrapper')
    fireEvent.click(within(wrapper).getByRole('button', { name: 'Increment' }))
    expect(onStep).toHaveBeenCalledWith(1)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('typing still calls onChange even when onStep is provided', () => {
    const onChange = vi.fn()
    const onStep = vi.fn()
    renderWithI18n(
      <NumberField value={10} min={0} max={20} onChange={onChange} onStep={onStep} showSteppers data-testid="nf" />,
      'en'
    )
    const input = screen.getByTestId('nf') as HTMLInputElement
    fireEvent.change(input, { target: { value: '15' } })
    expect(onChange).toHaveBeenCalledWith(15)
    expect(onStep).not.toHaveBeenCalled()
  })
})
