import { describe, it, expect } from 'vitest'
import { CANONICAL_RACES } from '@/data/canonical/races'
import { CANONICAL_CLASSES } from '@/data/canonical/classes'
import { CANONICAL_BACKGROUNDS } from '@/data/canonical/backgrounds'
import { ALIGNMENTS, normalizeAlignment } from '@/data/canonical/alignments'

describe('Canonical races', () => {
  it('includes PHB core races', () => {
    expect(CANONICAL_RACES).toContain('Human')
    expect(CANONICAL_RACES).toContain('Elf')
    expect(CANONICAL_RACES).toContain('Dwarf')
    expect(CANONICAL_RACES).toContain('Halfling')
    expect(CANONICAL_RACES).toContain('Half-Elf')
    expect(CANONICAL_RACES).toContain('Half-Orc')
    expect(CANONICAL_RACES).toContain('Gnome')
    expect(CANONICAL_RACES).toContain('Tiefling')
    expect(CANONICAL_RACES).toContain('Dragonborn')
  })

  it('includes expanded races', () => {
    expect(CANONICAL_RACES).toContain('Aasimar')
    expect(CANONICAL_RACES).toContain('Tabaxi')
    expect(CANONICAL_RACES).toContain('Genasi (Fire)')
    expect(CANONICAL_RACES).toContain('Wood Elf')
  })

  it('has no duplicate entries', () => {
    const unique = new Set(CANONICAL_RACES)
    expect(unique.size).toBe(CANONICAL_RACES.length)
  })
})

describe('Canonical classes', () => {
  it('includes all 12 PHB core classes', () => {
    const PHB = [
      'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
      'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
      'Warlock', 'Wizard',
    ]
    for (const cls of PHB) {
      expect(CANONICAL_CLASSES).toContain(cls)
    }
  })

  it('includes Artificer', () => {
    expect(CANONICAL_CLASSES).toContain('Artificer')
  })

  it('has no duplicate entries', () => {
    const unique = new Set(CANONICAL_CLASSES)
    expect(unique.size).toBe(CANONICAL_CLASSES.length)
  })
})

describe('Canonical backgrounds', () => {
  it('includes PHB core backgrounds', () => {
    expect(CANONICAL_BACKGROUNDS).toContain('Acolyte')
    expect(CANONICAL_BACKGROUNDS).toContain('Outlander')
    expect(CANONICAL_BACKGROUNDS).toContain('Soldier')
    expect(CANONICAL_BACKGROUNDS).toContain('Noble')
  })

  it('has no duplicate entries', () => {
    const unique = new Set(CANONICAL_BACKGROUNDS)
    expect(unique.size).toBe(CANONICAL_BACKGROUNDS.length)
  })
})

describe('Alignments', () => {
  it('has exactly 9 options', () => {
    expect(ALIGNMENTS).toHaveLength(9)
  })

  it('includes all alignment grid entries', () => {
    expect(ALIGNMENTS).toContain('Lawful Good')
    expect(ALIGNMENTS).toContain('Neutral Good')
    expect(ALIGNMENTS).toContain('Chaotic Good')
    expect(ALIGNMENTS).toContain('Lawful Neutral')
    expect(ALIGNMENTS).toContain('Neutral')
    expect(ALIGNMENTS).toContain('Chaotic Neutral')
    expect(ALIGNMENTS).toContain('Lawful Evil')
    expect(ALIGNMENTS).toContain('Neutral Evil')
    expect(ALIGNMENTS).toContain('Chaotic Evil')
  })
})

describe('normalizeAlignment', () => {
  it('returns canonical value for exact match', () => {
    expect(normalizeAlignment('Lawful Good')).toBe('Lawful Good')
    expect(normalizeAlignment('Chaotic Evil')).toBe('Chaotic Evil')
  })

  it('normalizes case', () => {
    expect(normalizeAlignment('lawful good')).toBe('Lawful Good')
    expect(normalizeAlignment('NEUTRAL EVIL')).toBe('Neutral Evil')
  })

  it('expands common abbreviations', () => {
    expect(normalizeAlignment('LG')).toBe('Lawful Good')
    expect(normalizeAlignment('NG')).toBe('Neutral Good')
    expect(normalizeAlignment('CG')).toBe('Chaotic Good')
    expect(normalizeAlignment('LN')).toBe('Lawful Neutral')
    expect(normalizeAlignment('N')).toBe('Neutral')
    expect(normalizeAlignment('TN')).toBe('Neutral')
    expect(normalizeAlignment('CN')).toBe('Chaotic Neutral')
    expect(normalizeAlignment('LE')).toBe('Lawful Evil')
    expect(normalizeAlignment('NE')).toBe('Neutral Evil')
    expect(normalizeAlignment('CE')).toBe('Chaotic Evil')
  })

  it('preserves unknown strings as free-text', () => {
    expect(normalizeAlignment('Lawful Awesome')).toBe('Lawful Awesome')
    expect(normalizeAlignment('True Neutral')).toBe('True Neutral')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeAlignment('')).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeAlignment('  Lawful Good  ')).toBe('Lawful Good')
  })
})
