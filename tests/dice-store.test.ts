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
    useDiceStore.setState({ history: [], lastResult: null })
  })

  it('starts with empty history', () => {
    expect(useDiceStore.getState().history).toHaveLength(0)
  })

  it('starts with lastResult null', () => {
    expect(useDiceStore.getState().lastResult).toBeNull()
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

  it('addRoll sets lastResult to the newest entry', () => {
    const r1 = makeResult('r1')
    const r2 = makeResult('r2')
    useDiceStore.getState().addRoll(r1)
    expect(useDiceStore.getState().lastResult?.id).toBe('r1')
    useDiceStore.getState().addRoll(r2)
    expect(useDiceStore.getState().lastResult?.id).toBe('r2')
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

describe('useDiceStore — rollMode', () => {
  beforeEach(() => {
    useDiceStore.setState({ rollMode: 'normal' })
  })

  it('starts as normal', () => {
    expect(useDiceStore.getState().rollMode).toBe('normal')
  })

  it('setRollMode updates rollMode', () => {
    useDiceStore.getState().setRollMode('advantage')
    expect(useDiceStore.getState().rollMode).toBe('advantage')
    useDiceStore.getState().setRollMode('disadvantage')
    expect(useDiceStore.getState().rollMode).toBe('disadvantage')
    useDiceStore.getState().setRollMode('normal')
    expect(useDiceStore.getState().rollMode).toBe('normal')
  })
})

describe('useDiceStore — isOpen', () => {
  beforeEach(() => {
    useDiceStore.setState({ isOpen: false })
  })

  it('starts closed', () => {
    expect(useDiceStore.getState().isOpen).toBe(false)
  })

  it('open() sets isOpen true', () => {
    useDiceStore.getState().open()
    expect(useDiceStore.getState().isOpen).toBe(true)
  })

  it('close() sets isOpen false', () => {
    useDiceStore.setState({ isOpen: true })
    useDiceStore.getState().close()
    expect(useDiceStore.getState().isOpen).toBe(false)
  })

  it('toggle() flips isOpen', () => {
    useDiceStore.getState().toggle()
    expect(useDiceStore.getState().isOpen).toBe(true)
    useDiceStore.getState().toggle()
    expect(useDiceStore.getState().isOpen).toBe(false)
  })
})

describe('useDiceStore — critContext', () => {
  beforeEach(() => {
    useDiceStore.setState({ critContext: null })
  })

  it('starts null', () => {
    expect(useDiceStore.getState().critContext).toBeNull()
  })

  it('setCritContext stores the context', () => {
    useDiceStore.getState().setCritContext({ label: 'Dano: Espada', damage: '1d8+3' })
    expect(useDiceStore.getState().critContext).toEqual({ label: 'Dano: Espada', damage: '1d8+3' })
  })

  it('clearCritContext resets to null', () => {
    useDiceStore.getState().setCritContext({ label: 'Dano: Arco', damage: '1d6' })
    useDiceStore.getState().clearCritContext()
    expect(useDiceStore.getState().critContext).toBeNull()
  })
})
