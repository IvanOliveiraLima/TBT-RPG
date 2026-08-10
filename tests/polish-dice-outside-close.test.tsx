/**
 * Polish — Fix 3: DicePanel closes on mousedown outside
 *
 * Covers:
 * - mousedown outside the panel calls onClose
 * - mousedown inside the panel does NOT call onClose
 * - mousedown on an element with [data-dice-toggle] does NOT call onClose
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { DicePanel } from '@/components/dice/DicePanel'
import { useDiceStore } from '@/store/useDiceStore'

vi.mock('@/domain/dice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/dice')>()
  return { ...actual, roll: vi.fn().mockReturnValue({
    id: 'r1', notation: 'd20', dice: [{ sides: 20, value: 10, kept: true }],
    modifier: 0, total: 10, mode: 'normal' as const, crit: null, at: Date.now(),
  }) }
})

describe('Polish.3 — DicePanel closes on mousedown outside', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null })
  })

  it('mousedown outside the panel calls onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <div data-testid="outside">outside</div>
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('mousedown inside the panel does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(<DicePanel onClose={onClose} />, 'en')
    fireEvent.mouseDown(screen.getByTestId('dice-panel'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('mousedown on the roll button (inside panel) does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(<DicePanel onClose={onClose} />, 'en')
    fireEvent.mouseDown(screen.getByTestId('roll-btn'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('mousedown on an element with [data-dice-toggle] does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <button data-testid="toggle-btn" data-dice-toggle>open</button>
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    fireEvent.mouseDown(screen.getByTestId('toggle-btn'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
