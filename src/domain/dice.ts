/**
 * Dice engine — pure domain, no side effects.
 *
 * Features:
 *  - Fair RNG via crypto.getRandomValues + rejection sampling (no modulo bias)
 *  - Notation parser: NdM, dM, NdM+K, NdM-K
 *  - Advantage/disadvantage (d20 only): rolls 2d20, keeps highest/lowest
 *  - Crit detection: natural 20 → 'hit', natural 1 → 'miss' (single kept d20)
 *  - Serialisable RollResult (ready for Dice.2/Dice.3 reuse)
 */

export interface DieRoll {
  sides: number
  value: number
  /** false = discarded by advantage/disadvantage */
  kept: boolean
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface RollResult {
  id: string
  notation: string
  label?: string
  dice: DieRoll[]
  modifier: number
  total: number
  mode: RollMode
  crit: 'hit' | 'miss' | null
  at: number
}

// ── RNG ──────────────────────────────────────────────────────────────────────

/** Injecteable RNG type. Default: crypto.getRandomValues. */
export type RngFn = (sides: number) => number

/**
 * Returns a fair integer in [1, sides] using rejection sampling
 * so there is zero modulo bias.
 */
export function rollDie(sides: number, rng: RngFn = defaultRng): number {
  return rng(sides)
}

function defaultRng(sides: number): number {
  if (sides < 1) throw new RangeError(`sides must be ≥ 1, got ${sides}`)
  // Find the largest multiple of `sides` that fits in a Uint32:
  // threshold = floor(2^32 / sides) * sides
  const threshold = Math.floor(4294967296 / sides) * sides
  const buf = new Uint32Array(1)
  while (true) {
    crypto.getRandomValues(buf)
    const v = buf[0]
    if (v !== undefined && v < threshold) return (v % sides) + 1
    // Reject and retry — expected retries < 1 for any standard die.
  }
}

// ── Parser ────────────────────────────────────────────────────────────────────

export interface ParsedNotation {
  count: number
  sides: number
  modifier: number
}

/**
 * Parses NdM, dM, NdM+K, NdM-K (case-insensitive).
 * Returns null for invalid input.
 */
export function parseNotation(s: string): ParsedNotation | null {
  const m = s.trim().match(/^(\d+)?[dD](\d+)([+-]\d+)?$/)
  if (!m) return null
  const count = m[1] !== undefined ? parseInt(m[1], 10) : 1
  const sides = parseInt(m[2] ?? '', 10)
  const modifier = m[3] !== undefined ? parseInt(m[3], 10) : 0
  if (count < 1 || sides < 1) return null
  return { count, sides, modifier }
}

// ── Roll ──────────────────────────────────────────────────────────────────────

let _seq = 0

function makeId(): string {
  return `roll_${Date.now()}_${++_seq}`
}

export interface RollOptions {
  mode?: RollMode
  label?: string
  rng?: RngFn
}

/**
 * Rolls `notation` and returns a serialisable RollResult.
 *
 * Advantage/disadvantage only applies to d20:
 *   - rolls 2 × d20, keeps the highest (adv) or lowest (dis)
 *   - discarded die appears in `dice` with `kept: false`
 *   - for any other die, mode is silently treated as 'normal'
 *
 * Crit: if exactly one d20 is kept, natural 20 → 'hit', natural 1 → 'miss'.
 */
export function roll(notation: string, opts: RollOptions = {}): RollResult {
  const { mode = 'normal', label, rng = defaultRng } = opts
  const parsed = parseNotation(notation)
  if (!parsed) throw new Error(`Invalid notation: "${notation}"`)

  const { count, sides, modifier } = parsed

  const dice: DieRoll[] = []

  if (sides === 20 && mode !== 'normal') {
    // Advantage / disadvantage: roll exactly 2 × d20, keep 1
    const v1 = rollDie(20, rng)
    const v2 = rollDie(20, rng)
    const keepFirst = mode === 'advantage' ? v1 >= v2 : v1 <= v2
    dice.push({ sides: 20, value: v1, kept: keepFirst })
    dice.push({ sides: 20, value: v2, kept: !keepFirst })
    // If count > 1, roll additional dice normally (no adv/dis on extras)
    for (let i = 1; i < count; i++) {
      dice.push({ sides, value: rollDie(sides, rng), kept: true })
    }
  } else {
    for (let i = 0; i < count; i++) {
      dice.push({ sides, value: rollDie(sides, rng), kept: true })
    }
  }

  const keptTotal = dice.filter(d => d.kept).reduce((acc, d) => acc + d.value, 0)
  const total = keptTotal + modifier

  // Crit: only meaningful when exactly one d20 die is kept
  const keptD20 = dice.filter(d => d.sides === 20 && d.kept)
  let crit: RollResult['crit'] = null
  if (keptD20.length === 1) {
    const d20 = keptD20[0]
    if (d20 !== undefined) {
      if (d20.value === 20) crit = 'hit'
      else if (d20.value === 1) crit = 'miss'
    }
  }

  const result: RollResult = {
    id: makeId(),
    notation,
    dice,
    modifier,
    total,
    mode: sides === 20 ? mode : 'normal',
    crit,
    at: Date.now(),
  }
  if (label !== undefined) result.label = label
  return result
}

// ── Critical hit helper ───────────────────────────────────────────────────────

/**
 * Doubles the dice count for critical hits (5e rule): "2d6+3" → "4d6+3".
 * Modifier is unchanged. Returns original notation if it cannot be parsed.
 */
export function doubleDiceCount(notation: string): string {
  const parsed = parseNotation(notation)
  if (!parsed) return notation
  const { count, sides, modifier } = parsed
  const doubled = `${count * 2}d${sides}`
  if (modifier === 0) return doubled
  return `${doubled}${modifier >= 0 ? `+${modifier}` : `${modifier}`}`
}
