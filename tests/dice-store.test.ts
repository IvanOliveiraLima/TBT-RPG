/**
 * useDiceStore tests
 *
 * Covers:
 *  - addRoll prepends to history
 *  - history is capped at 20 entries
 *  - clear() resets history to []
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useDiceStore } from '@/store/useDiceStore'
import type { RollResult } from '@/domain/dice'

function makeResult(id: string, total: number = 10): RollResult {
  return {
    id,
    notation: 'd20',
    dice: [{ sides: 20, value: total, kept: true }],
    modifier: 0,
    total,
    mode: 'normal',
    crit: null,
    at: Date.now(),
  }
}

describe('useDiceStore', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [] })
  })

  it('starts with empty history', () => {
    expect(useDiceStore.getState().history).toHaveLength(0)
  })

  it('addRoll prepends (most recent first)', () => {
    const r1 = makeResult('r1')
    const r2 = makeResult('r2')
    useDiceStore.getState().addRoll(r1)
    useDiceStore.getState().addRoll(r2)
    const { history } = useDiceStore.getState()
    expect(history[0].id).toBe('r2')
    expect(history[1].id).toBe('r1')
  })

  it('caps history at 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      useDiceStore.getState().addRoll(makeResult(`r${i}`))
    }
    expect(useDiceStore.getState().history).toHaveLength(20)
    // Most recent is last added (r24)
    expect(useDiceStore.getState().history[0].id).toBe('r24')
  })

  it('clear() empties history', () => {
    useDiceStore.getState().addRoll(makeResult('r1'))
    useDiceStore.getState().addRoll(makeResult('r2'))
    useDiceStore.getState().clear()
    expect(useDiceStore.getState().history).toHaveLength(0)
  })
})
