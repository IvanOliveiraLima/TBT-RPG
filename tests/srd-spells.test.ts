import { describe, it, expect } from 'vitest'
import {
  srdSchoolToApp,
  srdSpellToAppFields,
  searchSpells,
  type SrdSpell,
} from '@/data/srd-spells'
import srdData from '@/data/srd-spells.json'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSpell(overrides: Partial<SrdSpell> = {}): SrdSpell {
  return {
    slug: 'fireball',
    name: 'Fireball',
    level: 3,
    school: 'evocation',
    castingTime: '1 action',
    range: '150 feet',
    components: 'V, S, M',
    material: 'a ball of bat guano and sulfur',
    duration: 'Instantaneous',
    concentration: false,
    ritual: false,
    description: 'A bright streak flashes from you…',
    higherLevel: 'The damage increases by 1d6 for each spell slot level above 3.',
    classes: ['Sorcerer', 'Wizard'],
    edition: '2024',
    ...overrides,
  }
}

// ─── srdSchoolToApp ───────────────────────────────────────────────────────────

describe('srdSchoolToApp', () => {
  it('maps known schools (lowercase)', () => {
    expect(srdSchoolToApp('evocation')).toBe('evocation')
    expect(srdSchoolToApp('necromancy')).toBe('necromancy')
    expect(srdSchoolToApp('transmutation')).toBe('transmutation')
    expect(srdSchoolToApp('abjuration')).toBe('abjuration')
    expect(srdSchoolToApp('conjuration')).toBe('conjuration')
    expect(srdSchoolToApp('divination')).toBe('divination')
    expect(srdSchoolToApp('enchantment')).toBe('enchantment')
    expect(srdSchoolToApp('illusion')).toBe('illusion')
  })

  it('maps Title Case school names', () => {
    expect(srdSchoolToApp('Evocation')).toBe('evocation')
    expect(srdSchoolToApp('Necromancy')).toBe('necromancy')
  })

  it('trims whitespace', () => {
    expect(srdSchoolToApp('  evocation  ')).toBe('evocation')
  })

  it('falls back to abjuration for unknown values', () => {
    expect(srdSchoolToApp('weird')).toBe('abjuration')
    expect(srdSchoolToApp('')).toBe('abjuration')
    expect(srdSchoolToApp('universal')).toBe('abjuration')
  })
})

// ─── srdSpellToAppFields ──────────────────────────────────────────────────────

describe('srdSpellToAppFields', () => {
  it('maps name, level, school, castingTime, range', () => {
    const s = makeSpell()
    const result = srdSpellToAppFields(s)

    expect(result.name).toBe('Fireball')
    expect(result.level).toBe(3)
    expect(result.school).toBe('evocation')
    expect(result.castingTime).toBe('1 action')
    expect(result.range).toBe('150 feet')
  })

  it('includes description in output', () => {
    const s = makeSpell({ description: 'A bright streak.' })
    const result = srdSpellToAppFields(s)
    expect(result.description).toContain('A bright streak.')
  })

  it('appends higher level text when present', () => {
    const s = makeSpell({ higherLevel: 'Damage increases.' })
    const result = srdSpellToAppFields(s)
    expect(result.description).toContain('Em níveis superiores: Damage increases.')
  })

  it('does NOT add higher level section when empty', () => {
    const s = makeSpell({ higherLevel: '' })
    const result = srdSpellToAppFields(s)
    expect(result.description).not.toContain('Em níveis superiores')
  })

  it('includes components and material in meta', () => {
    const s = makeSpell({ components: 'V, S, M', material: 'bat guano' })
    const result = srdSpellToAppFields(s)
    expect(result.description).toContain('Componentes: V, S, M (bat guano)')
  })

  it('includes components without material when material is empty', () => {
    const s = makeSpell({ components: 'V, S', material: '' })
    const result = srdSpellToAppFields(s)
    expect(result.description).toContain('Componentes: V, S')
    expect(result.description).not.toContain('()')
  })

  it('includes duration in meta', () => {
    const s = makeSpell({ duration: 'Instantaneous', concentration: false })
    const result = srdSpellToAppFields(s)
    expect(result.description).toContain('Duração: Instantaneous')
    expect(result.description).not.toContain('Concentração')
  })

  it('marks concentration in duration line', () => {
    const s = makeSpell({ duration: '1 minute', concentration: true })
    const result = srdSpellToAppFields(s)
    expect(result.description).toContain('Duração: 1 minute (Concentração)')
  })

  it('adds Ritual to meta when ritual is true', () => {
    const s = makeSpell({ ritual: true })
    const result = srdSpellToAppFields(s)
    expect(result.description).toContain('Ritual')
  })

  it('does NOT add Ritual when ritual is false', () => {
    const s = makeSpell({ ritual: false })
    const result = srdSpellToAppFields(s)
    expect(result.description).not.toContain('Ritual')
  })

  it('does not include id or prepared in result', () => {
    const s = makeSpell()
    const result = srdSpellToAppFields(s)
    expect('id' in result).toBe(false)
    expect('prepared' in result).toBe(false)
  })
})

// ─── searchSpells ─────────────────────────────────────────────────────────────

const FIXTURE_LIST: SrdSpell[] = [
  makeSpell({ name: 'Fireball', level: 3, school: 'evocation' }),
  makeSpell({ slug: 'fire-bolt', name: 'Fire Bolt', level: 0, school: 'evocation' }),
  makeSpell({ slug: 'bless', name: 'Bless', level: 1, school: 'enchantment' }),
  makeSpell({ slug: 'acid-arrow', name: 'Acid Arrow', level: 2, school: 'evocation' }),
  makeSpell({ slug: 'detect-magic', name: 'Detect Magic', level: 1, school: 'divination' }),
  makeSpell({ slug: 'wall-of-fire', name: 'Wall of Fire', level: 4, school: 'evocation' }),
]

describe('searchSpells', () => {
  it('returns all when query is empty (up to limit)', () => {
    const results = searchSpells(FIXTURE_LIST, '')
    expect(results.length).toBe(FIXTURE_LIST.length)
  })

  it('matches by name substring case-insensitively', () => {
    const results = searchSpells(FIXTURE_LIST, 'fire')
    const names = results.map(s => s.name)
    expect(names).toContain('Fireball')
    expect(names).toContain('Fire Bolt')
    expect(names).toContain('Wall of Fire')
    expect(names).not.toContain('Bless')
  })

  it('returns prefix matches before substring matches', () => {
    const results = searchSpells(FIXTURE_LIST, 'fire')
    const firstTwo = results.slice(0, 2).map(s => s.name)
    // "Fireball" and "Fire Bolt" start with "fire" — must appear before "Wall of Fire"
    expect(firstTwo).toContain('Fireball')
    expect(firstTwo).toContain('Fire Bolt')
    const wallIdx = results.findIndex(s => s.name === 'Wall of Fire')
    expect(wallIdx).toBeGreaterThan(1)
  })

  it('filters by level', () => {
    const results = searchSpells(FIXTURE_LIST, '', { level: 1 })
    expect(results.every(s => s.level === 1)).toBe(true)
    expect(results.map(s => s.name)).toContain('Bless')
    expect(results.map(s => s.name)).not.toContain('Fireball')
  })

  it('filters by school', () => {
    const results = searchSpells(FIXTURE_LIST, '', { school: 'evocation' })
    expect(results.every(s => s.school === 'evocation')).toBe(true)
    expect(results.map(s => s.name)).not.toContain('Bless')
  })

  it('combines query with level filter', () => {
    const results = searchSpells(FIXTURE_LIST, 'fire', { level: 0 })
    expect(results.length).toBe(1)
    expect(results[0]!.name).toBe('Fire Bolt')
  })

  it('respects 50-result limit', () => {
    const large: SrdSpell[] = Array.from({ length: 100 }, (_, i) =>
      makeSpell({ slug: `spell-${i}`, name: `Fireball ${i}` }),
    )
    const results = searchSpells(large, 'fireball')
    expect(results.length).toBeLessThanOrEqual(50)
  })

  it('returns empty array for query with no match', () => {
    const results = searchSpells(FIXTURE_LIST, 'zzznomatch')
    expect(results).toHaveLength(0)
  })
})

// ─── JSON integrity guards (smoke tests on the committed data) ────────────────

interface SrdSpellsJson {
  _meta: { totalCount: number }
  spells: SrdSpell[]
}

describe('srd-spells.json integrity', () => {
  const { spells } = srdData as unknown as SrdSpellsJson

  it('has more than 300 spells', () => {
    expect(spells.length).toBeGreaterThan(300)
  })

  it('has unique names', () => {
    const names = spells.map(s => s.name.trim().toLowerCase())
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('every spell has a non-empty description', () => {
    const empty = spells.filter(s => !s.description.trim())
    expect(empty.map(s => s.name)).toEqual([])
  })

  it('no castingTime contains a hyphen', () => {
    const withHyphen = spells.filter(s => s.castingTime.includes('-'))
    expect(withHyphen.map(s => `${s.name}: "${s.castingTime}"`)).toEqual([])
  })

  it('no castingTime has a digit immediately followed by a letter', () => {
    const malformed = spells.filter(s => /\d[a-zA-Z]/.test(s.castingTime))
    expect(malformed.map(s => `${s.name}: "${s.castingTime}"`)).toEqual([])
  })

  it('Fireball castingTime is readable', () => {
    const fireball = spells.find(s => s.name === 'Fireball')
    expect(fireball).toBeDefined()
    expect(fireball!.castingTime).toBe('action')
  })
})
