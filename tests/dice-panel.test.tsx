/**
 * DicePanel UI tests
 *
 * Covers:
 *  - Panel renders with die buttons, quantity, modifier inputs
 *  - Roll button triggers a roll and shows result with total + individual dice
 *  - Discarded die has line-through styling (kept=false)
 *  - Advantage/disadvantage mode buttons appear only for d20
 *  - Crit hit/miss label rendered on critical d20
 *  - History grows; clear button empties it
 *  - Empty state message shown when history is empty
 *  - PT and EN translations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { DicePanel } from '@/components/dice/DicePanel'
import { useDiceStore } from '@/store/useDiceStore'

// Mock the dice domain so tests are deterministic
vi.mock('@/domain/dice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/dice')>()
  return {
    ...actual,
    roll: vi.fn(),
    rollMulti: vi.fn(),
  }
})

import { roll, rollMulti } from '@/domain/dice'
const mockRoll = vi.mocked(roll)
const mockRollMulti = vi.mocked(rollMulti)

let nextResultId = 0

function makeResult(overrides: Partial<import('@/domain/dice').RollResult> = {}): import('@/domain/dice').RollResult {
  return {
    id: `test-id-${++nextResultId}`,
    notation: 'd20',
    dice: [{ sides: 20, value: 15, kept: true }],
    modifier: 0,
    total: 15,
    mode: 'normal',
    crit: null,
    at: Date.now(),
    ...overrides,
  }
}

describe('DicePanel', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null })
    mockRoll.mockImplementation(() => makeResult())
    mockRollMulti.mockImplementation(() => makeResult())
  })

  it('renders title in EN', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByText('Dice Tray')).toBeDefined()
  })

  it('renders title in PT', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    expect(screen.getByText('Bandeja de Dados')).toBeDefined()
  })

  it('renders all 7 die buttons', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
      expect(screen.getByTestId(`die-btn-d${sides}`)).toBeDefined()
    }
  })

  it('renders quantity and modifier inputs', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByTestId('quantity-input')).toBeDefined()
    expect(screen.getByTestId('modifier-input')).toBeDefined()
  })

  it('roll button calls roll() and shows result', async () => {
    mockRoll.mockReturnValue(makeResult({ total: 17 }))
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    expect(mockRoll).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.getByTestId('roll-result')).toBeDefined()
      expect(screen.getByTestId('roll-total').textContent).toBe('17')
    })
  })

  it('shows kept die in result', async () => {
    mockRoll.mockReturnValue(makeResult({
      dice: [{ sides: 20, value: 15, kept: true }],
      total: 15,
    }))
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('die-kept')).toBeDefined()
    })
  })

  it('shows discarded die when advantage', async () => {
    mockRoll.mockReturnValue(makeResult({
      dice: [
        { sides: 20, value: 18, kept: true },
        { sides: 20, value: 8, kept: false },
      ],
      total: 18,
      mode: 'advantage',
    }))
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('die-kept')).toBeDefined()
      expect(screen.getByTestId('die-discarded')).toBeDefined()
    })
  })

  it('shows crit hit label on natural 20', async () => {
    mockRoll.mockReturnValue(makeResult({ total: 20, crit: 'hit', dice: [{ sides: 20, value: 20, kept: true }] }))
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('roll-crit-label').textContent).toBe('Critical!')
    })
  })

  it('shows crit miss label on natural 1', async () => {
    mockRoll.mockReturnValue(makeResult({ total: 1, crit: 'miss', dice: [{ sides: 20, value: 1, kept: true }] }))
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('roll-crit-label').textContent).toBe('Fumble')
    })
  })

  it('shows crit labels in PT', async () => {
    mockRoll.mockReturnValue(makeResult({ total: 20, crit: 'hit', dice: [{ sides: 20, value: 20, kept: true }] }))
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('roll-crit-label').textContent).toBe('Crítico!')
    })
  })

  it('advantage/disadvantage buttons appear for d20 (default)', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByTestId('mode-advantage')).toBeDefined()
    expect(screen.getByTestId('mode-disadvantage')).toBeDefined()
  })

  it('advantage/disadvantage buttons disappear for non-d20', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('die-btn-d6'))
    expect(screen.queryByTestId('mode-advantage')).toBeNull()
    expect(screen.queryByTestId('mode-disadvantage')).toBeNull()
  })

  it('history grows with each roll', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getAllByTestId('history-entry')).toHaveLength(2)
    })
  })

  it('clear button empties history', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('clear-history-btn')).toBeDefined()
    })
    fireEvent.click(screen.getByTestId('clear-history-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('history-entry')).toBeNull()
    })
  })

  it('empty state shown when no history', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByText('No rolls yet')).toBeDefined()
  })

  it('empty state in PT', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    expect(screen.getByText('Nenhuma rolagem ainda')).toBeDefined()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(<DicePanel onClose={onClose} />, 'en')
    fireEvent.click(screen.getByTestId('dice-panel-close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('normal mode button shown alongside advantage/disadvantage for d20', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByTestId('mode-normal')).toBeDefined()
    expect(screen.getByTestId('mode-advantage')).toBeDefined()
    expect(screen.getByTestId('mode-disadvantage')).toBeDefined()
  })

  it('clicking advantage sets rollMode in store', () => {
    useDiceStore.setState({ rollMode: 'normal' })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('mode-advantage'))
    expect(useDiceStore.getState().rollMode).toBe('advantage')
  })

  it('clicking normal resets rollMode in store', () => {
    useDiceStore.setState({ rollMode: 'advantage' })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('mode-normal'))
    expect(useDiceStore.getState().rollMode).toBe('normal')
  })

  it('crit damage button not shown when critContext is null', () => {
    useDiceStore.setState({ critContext: null })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.queryByTestId('crit-damage-btn')).toBeNull()
  })

  it('crit damage button shown when critContext is set', () => {
    useDiceStore.setState({ critContext: { label: 'Dano: Espada', damage: '1d8+3' } })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByTestId('crit-damage-btn')).toBeDefined()
    expect(screen.getByTestId('crit-damage-btn').textContent).toBe('Roll critical damage')
  })

  it('crit damage button in PT', () => {
    useDiceStore.setState({ critContext: { label: 'Dano: Espada', damage: '1d8+3' } })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    expect(screen.getByTestId('crit-damage-btn').textContent).toBe('Rolar dano crítico')
  })

  it('clicking crit damage rolls doubled dice and clears critContext', async () => {
    const critResult = makeResult({
      total: 16,
      dice: [{ sides: 8, value: 8, kept: true }, { sides: 8, value: 5, kept: true }],
      notation: '2d8+3',
    })
    mockRoll.mockReturnValue(critResult)
    useDiceStore.setState({ critContext: { label: 'Dano', damage: '1d8+3' } })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('crit-damage-btn'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledWith('2d8+3', { mode: 'normal', label: 'Dano' })
      expect(useDiceStore.getState().critContext).toBeNull()
    })
  })
})

// ── Multi-die mode ────────────────────────────────────────────────────────────

describe('DicePanel — multi-die mode', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null })
    mockRoll.mockImplementation(() => makeResult())
    mockRollMulti.mockImplementation(() => makeResult())
  })

  it('activating multi-toggle shows the checkbox checked', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    const toggle = screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!
    expect((toggle as HTMLInputElement).checked).toBe(false)
    fireEvent.click(toggle)
    expect((toggle as HTMLInputElement).checked).toBe(true)
  })

  it('clicking a die button in multi mode arms it (shows qty stepper)', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!)
    fireEvent.click(screen.getByTestId('die-btn-d6'))
    await waitFor(() => {
      expect(screen.getByTestId('multi-qty-d6')).toBeDefined()
    })
  })

  it('clicking an armed die again in multi mode disarms it', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!)
    fireEvent.click(screen.getByTestId('die-btn-d6'))
    await waitFor(() => { expect(screen.getByTestId('multi-qty-d6')).toBeDefined() })
    fireEvent.click(screen.getByTestId('die-btn-d6'))
    await waitFor(() => {
      expect(screen.queryByTestId('multi-qty-d6')).toBeNull()
    })
  })

  it('roll button shows "Roll all" in EN when multi mode active', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!)
    await waitFor(() => {
      expect(screen.getByTestId('roll-btn').textContent).toBe('Roll all')
    })
  })

  it('roll button shows "Lançar todos" in PT when multi mode active', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    fireEvent.click(screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!)
    await waitFor(() => {
      expect(screen.getByTestId('roll-btn').textContent).toBe('Lançar todos')
    })
  })

  it('roll button is disabled in multi mode with no dice armed', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!)
    await waitFor(() => {
      expect((screen.getByTestId('roll-btn') as HTMLButtonElement).disabled).toBe(true)
    })
  })

  it('clicking roll in multi mode calls rollMulti and shows result', async () => {
    const multiResult = makeResult({
      total: 11,
      dice: [
        { sides: 6, value: 3, kept: true },
        { sides: 6, value: 4, kept: true },
        { sides: 8, value: 4, kept: true },
      ],
      notation: '2d6 + 1d8',
    })
    mockRollMulti.mockReturnValue(multiResult)
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    const checkbox = screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByTestId('die-btn-d6'))
    fireEvent.click(screen.getByTestId('die-btn-d8'))
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(mockRollMulti).toHaveBeenCalled()
      expect(screen.getByTestId('roll-result')).toBeDefined()
      expect(screen.getByTestId('roll-total').textContent).toBe('11')
      expect(screen.getAllByTestId('die-kept')).toHaveLength(3)
    })
  })

  it('adv/dis buttons are hidden in multi mode even when d20 is selected', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    // d20 is selected by default; adv/dis should be visible
    expect(screen.getByTestId('mode-advantage')).toBeDefined()
    // enable multi mode
    fireEvent.click(screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!)
    await waitFor(() => {
      expect(screen.queryByTestId('mode-advantage')).toBeNull()
    })
  })

  it('disabling multi-toggle clears armed dice and restores quantity-input', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    const checkbox = screen.getByTestId('multi-toggle').querySelector('input[type="checkbox"]')!
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByTestId('die-btn-d6'))
    await waitFor(() => { expect(screen.getByTestId('multi-qty-d6')).toBeDefined() })
    // disable multi
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.queryByTestId('multi-qty-d6')).toBeNull()
      expect(screen.getByTestId('quantity-input')).toBeDefined()
    })
  })
})
