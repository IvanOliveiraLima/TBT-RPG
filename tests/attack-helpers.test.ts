import { describe, it, expect } from 'vitest'
import { inferAttackKind, parseBonusString } from '@/data/adapter'
import { formatAttackBonus, formatAttackSummary } from '@/domain/derived'
import type { Attack } from '@/domain/character'

/* ── inferAttackKind ───────────────────────────────────────────────────────── */

describe('inferAttackKind', () => {
  it('returns spell for "DC 14" toHit string', () => {
    expect(inferAttackKind('DC 14', 'str')).toBe('spell')
  })

  it('returns spell for lowercase "dc 12" toHit string', () => {
    expect(inferAttackKind('dc 12', 'dex')).toBe('spell')
  })

  it('returns spell for INT ability', () => {
    expect(inferAttackKind('+5', 'int')).toBe('spell')
  })

  it('returns spell for WIS ability', () => {
    expect(inferAttackKind('+4', 'wis')).toBe('spell')
  })

  it('returns spell for CHA ability', () => {
    expect(inferAttackKind('+3', 'cha')).toBe('spell')
  })

  it('returns ranged for DEX ability with normal toHit', () => {
    expect(inferAttackKind('+5', 'dex')).toBe('ranged')
  })

  it('returns melee for STR ability', () => {
    expect(inferAttackKind('+4', 'str')).toBe('melee')
  })

  it('returns melee for CON ability', () => {
    expect(inferAttackKind('+2', 'con')).toBe('melee')
  })

  it('returns melee for empty ability', () => {
    expect(inferAttackKind('+0', '')).toBe('melee')
  })

  it('returns melee for empty toHit and STR', () => {
    expect(inferAttackKind('', 'str')).toBe('melee')
  })

  it('DC check takes precedence over stat', () => {
    // Even with str stat, DC prefix → spell
    expect(inferAttackKind('DC 15', 'str')).toBe('spell')
  })
})

/* ── parseBonusString ──────────────────────────────────────────────────────── */

describe('parseBonusString', () => {
  it('parses "+5" → 5', () => {
    expect(parseBonusString('+5')).toBe(5)
  })

  it('parses "+0" → 0', () => {
    expect(parseBonusString('+0')).toBe(0)
  })

  it('parses "-2" → -2', () => {
    expect(parseBonusString('-2')).toBe(-2)
  })

  it('parses "5" (no plus sign) → 5', () => {
    expect(parseBonusString('5')).toBe(5)
  })

  it('parses "DC 14" → 0', () => {
    expect(parseBonusString('DC 14')).toBe(0)
  })

  it('parses "dc 12" (lowercase) → 0', () => {
    expect(parseBonusString('dc 12')).toBe(0)
  })

  it('parses empty string → 0', () => {
    expect(parseBonusString('')).toBe(0)
  })

  it('parses null → 0', () => {
    expect(parseBonusString(null)).toBe(0)
  })

  it('parses undefined → 0', () => {
    expect(parseBonusString(undefined)).toBe(0)
  })

  it('parses "  +3  " with whitespace → 3', () => {
    expect(parseBonusString('  +3  ')).toBe(3)
  })
})

/* ── formatAttackBonus ────────────────────────────────────────────────────── */

describe('formatAttackBonus', () => {
  it('formats 0 as "+0"', () => {
    expect(formatAttackBonus(0)).toBe('+0')
  })

  it('formats positive 5 as "+5"', () => {
    expect(formatAttackBonus(5)).toBe('+5')
  })

  it('formats negative -2 as "-2"', () => {
    expect(formatAttackBonus(-2)).toBe('-2')
  })

  it('formats large bonus +15 as "+15"', () => {
    expect(formatAttackBonus(15)).toBe('+15')
  })
})

/* ── formatAttackSummary ──────────────────────────────────────────────────── */

function makeAttack(overrides: Partial<Attack> = {}): Attack {
  return {
    id: 'x',
    name: 'Test',
    kind: 'melee',
    ability: 'str',
    attackBonus: 0,
    damage: '',
    damageType: '',
    range: '',
    properties: '',
    notes: '',
    ...overrides,
  }
}

describe('formatAttackSummary', () => {
  it('formats with all fields', () => {
    const attack = makeAttack({ damage: '1d8+3', damageType: 'Slashing', range: '5 ft' })
    expect(formatAttackSummary(attack, 'STR')).toBe('STR · 1d8+3 Slashing · 5 ft')
  })

  it('omits empty ability', () => {
    const attack = makeAttack({ damage: '1d6', damageType: 'Fire', range: '120 ft' })
    expect(formatAttackSummary(attack, '')).toBe('1d6 Fire · 120 ft')
  })

  it('omits empty damage', () => {
    const attack = makeAttack({ damage: '', damageType: '', range: '5 ft' })
    expect(formatAttackSummary(attack, 'STR')).toBe('STR · 5 ft')
  })

  it('omits empty range', () => {
    const attack = makeAttack({ damage: '2d6', damageType: 'Cold', range: '' })
    expect(formatAttackSummary(attack, 'INT')).toBe('INT · 2d6 Cold')
  })

  it('omits damageType when empty but includes damage', () => {
    const attack = makeAttack({ damage: '1d4', damageType: '', range: '' })
    expect(formatAttackSummary(attack, 'DEX')).toBe('DEX · 1d4')
  })

  it('returns empty string when all fields empty', () => {
    const attack = makeAttack({ damage: '', damageType: '', range: '' })
    expect(formatAttackSummary(attack, '')).toBe('')
  })
})
