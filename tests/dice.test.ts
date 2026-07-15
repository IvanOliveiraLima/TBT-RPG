/**
 * Dice engine tests — src/domain/dice.ts
 *
 * Covers:
 *  - parseNotation: NdM, dM, NdM+K, NdM-K, invalid
 *  - rollDie: value in [1, sides]
 *  - roll: normal, advantage (keeps highest), disadvantage (keeps lowest)
 *  - crit: nat 20 → 'hit', nat 1 → 'miss', otherwise null
 *  - total = kept + modifier
 *  - mode is normalised to 'normal' for non-d20
 */
import { describe, it, expect } from 'vitest'
import { parseNotation, rollDie, roll } from '@/domain/dice'
import type { RngFn } from '@/domain/dice'

// Deterministic RNG: returns values from a pre-set sequence (cycling)
function seqRng(values: number[]): RngFn {
  let i = 0
  return (_sides: number) => {
    const v = values[i % values.length]
    i++
    return v
  }
}

// ── parseNotation ─────────────────────────────────────────────────────────────

describe('parseNotation', () => {
  it('parses dM (implied count=1, mod=0)', () => {
    expect(parseNotation('d6')).toEqual({ count: 1, sides: 6, modifier: 0 })
  })

  it('parses NdM', () => {
    expect(parseNotation('3d8')).toEqual({ count: 3, sides: 8, modifier: 0 })
  })

  it('parses NdM+K', () => {
    expect(parseNotation('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 })
  })

  it('parses NdM-K', () => {
    expect(parseNotation('1d4-1')).toEqual({ count: 1, sides: 4, modifier: -1 })
  })

  it('is case-insensitive (D uppercase)', () => {
    expect(parseNotation('2D10+5')).toEqual({ count: 2, sides: 10, modifier: 5 })
  })

  it('trims whitespace', () => {
    expect(parseNotation('  d20  ')).toEqual({ count: 1, sides: 20, modifier: 0 })
  })

  it('returns null for empty string', () => {
    expect(parseNotation('')).toBeNull()
  })

  it('returns null for invalid input', () => {
    expect(parseNotation('abc')).toBeNull()
    expect(parseNotation('2+3')).toBeNull()
    expect(parseNotation('d0')).toBeNull()
  })
})

// ── rollDie ───────────────────────────────────────────────────────────────────

describe('rollDie', () => {
  it('returns 1 when rng returns minimum', () => {
    expect(rollDie(6, seqRng([1]))).toBe(1)
  })

  it('returns sides when rng returns maximum', () => {
    expect(rollDie(6, seqRng([6]))).toBe(6)
  })

  it('injected rng is called with sides argument', () => {
    const calls: number[] = []
    const rng: RngFn = (sides) => { calls.push(sides); return 1 }
    rollDie(12, rng)
    expect(calls).toEqual([12])
  })
})

// ── roll — normal ─────────────────────────────────────────────────────────────

describe('roll — normal', () => {
  it('total = sum of dice + modifier', () => {
    // 2d6+3 with seq [4,5] → total = 4+5+3 = 12
    const r = roll('2d6+3', { rng: seqRng([4, 5]) })
    expect(r.total).toBe(12)
    expect(r.dice).toHaveLength(2)
    expect(r.dice.every(d => d.kept)).toBe(true)
    expect(r.modifier).toBe(3)
  })

  it('all dice have kept=true in normal mode', () => {
    const r = roll('3d4', { rng: seqRng([1, 2, 3]) })
    expect(r.dice.every(d => d.kept)).toBe(true)
  })

  it('crit is null for non-d20', () => {
    const r = roll('d6', { rng: seqRng([6]) })
    expect(r.crit).toBeNull()
  })

  it('mode is normalised to normal for non-d20 even if advantage passed', () => {
    const r = roll('d6', { mode: 'advantage', rng: seqRng([3]) })
    expect(r.mode).toBe('normal')
    expect(r.dice).toHaveLength(1) // no extra die
  })

  it('notation and at are set', () => {
    const r = roll('d20', { rng: seqRng([15]) })
    expect(r.notation).toBe('d20')
    expect(r.at).toBeGreaterThan(0)
  })

  it('label is passed through', () => {
    const r = roll('d20', { label: 'Attack', rng: seqRng([10]) })
    expect(r.label).toBe('Attack')
  })
})

// ── roll — advantage ──────────────────────────────────────────────────────────

describe('roll — advantage', () => {
  it('keeps the highest of two d20 values', () => {
    // seq: first die = 8, second die = 15; advantage keeps 15
    const r = roll('d20', { mode: 'advantage', rng: seqRng([8, 15]) })
    expect(r.total).toBe(15)
    const kept = r.dice.filter(d => d.kept)
    const discarded = r.dice.filter(d => !d.kept)
    expect(kept).toHaveLength(1)
    expect(kept[0].value).toBe(15)
    expect(discarded).toHaveLength(1)
    expect(discarded[0].value).toBe(8)
  })

  it('when dice are equal, one is kept and one is discarded', () => {
    const r = roll('d20', { mode: 'advantage', rng: seqRng([12, 12]) })
    expect(r.dice).toHaveLength(2)
    expect(r.dice.filter(d => d.kept)).toHaveLength(1)
    expect(r.dice.filter(d => !d.kept)).toHaveLength(1)
    expect(r.total).toBe(12)
  })

  it('mode is advantage in result', () => {
    const r = roll('d20', { mode: 'advantage', rng: seqRng([10, 5]) })
    expect(r.mode).toBe('advantage')
  })
})

// ── roll — disadvantage ───────────────────────────────────────────────────────

describe('roll — disadvantage', () => {
  it('keeps the lowest of two d20 values', () => {
    // seq: first die = 18, second die = 3; disadvantage keeps 3
    const r = roll('d20', { mode: 'disadvantage', rng: seqRng([18, 3]) })
    expect(r.total).toBe(3)
    const kept = r.dice.filter(d => d.kept)
    const discarded = r.dice.filter(d => !d.kept)
    expect(kept).toHaveLength(1)
    expect(kept[0].value).toBe(3)
    expect(discarded).toHaveLength(1)
    expect(discarded[0].value).toBe(18)
  })

  it('mode is disadvantage in result', () => {
    const r = roll('d20', { mode: 'disadvantage', rng: seqRng([10, 5]) })
    expect(r.mode).toBe('disadvantage')
  })
})

// ── roll — crit detection ─────────────────────────────────────────────────────

describe('roll — crit', () => {
  it('crit=hit on natural 20', () => {
    const r = roll('d20', { rng: seqRng([20]) })
    expect(r.crit).toBe('hit')
  })

  it('crit=miss on natural 1', () => {
    const r = roll('d20', { rng: seqRng([1]) })
    expect(r.crit).toBe('miss')
  })

  it('crit=null for other values', () => {
    const r = roll('d20', { rng: seqRng([10]) })
    expect(r.crit).toBeNull()
  })

  it('crit=hit on nat 20 with advantage (kept die is 20)', () => {
    // first=20, second=15 → keeps 20
    const r = roll('d20', { mode: 'advantage', rng: seqRng([20, 15]) })
    expect(r.crit).toBe('hit')
  })

  it('crit=null when nat 20 is the discarded die in disadvantage', () => {
    // first=20, second=5 → disadvantage keeps 5
    const r = roll('d20', { mode: 'disadvantage', rng: seqRng([20, 5]) })
    expect(r.crit).toBeNull()
    expect(r.total).toBe(5)
  })
})

// ── roll — multiple d20 ───────────────────────────────────────────────────────

describe('roll — multiple d20 (no crit logic)', () => {
  it('crit is null for 2d20 in normal mode (multiple kept d20)', () => {
    // Two kept d20s → crit not triggered (ambiguous)
    const r = roll('2d20', { rng: seqRng([20, 5]) })
    expect(r.crit).toBeNull()
  })
})

// ── roll — throws on invalid notation ────────────────────────────────────────

describe('roll — invalid notation', () => {
  it('throws on invalid notation', () => {
    expect(() => roll('invalid')).toThrow('Invalid notation')
  })
})

// ── id uniqueness ─────────────────────────────────────────────────────────────

describe('roll — id', () => {
  it('generates unique ids', () => {
    const ids = Array.from({ length: 5 }, () => roll('d6', { rng: seqRng([1]) }).id)
    expect(new Set(ids).size).toBe(5)
  })
})
