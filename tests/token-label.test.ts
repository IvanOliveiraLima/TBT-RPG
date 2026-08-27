/**
 * Unit tests for src/utils/token-label.ts — shortenTokenLabel
 */
import { describe, it, expect } from 'vitest'
import { shortenTokenLabel } from '@/utils/token-label'

describe('shortenTokenLabel', () => {
  it('("Goblin 3", 4) → "Gob 3"', () => {
    expect(shortenTokenLabel('Goblin 3', 4)).toBe('Gob 3')
  })

  it('("Kem-Ra", 4) → "Kem-"', () => {
    expect(shortenTokenLabel('Kem-Ra', 4)).toBe('Kem-')
  })

  it('("Goblin 12", 4) keeps the two-digit number visible', () => {
    // room = max(1, 4-1) = 3 → "Gob 12"
    expect(shortenTokenLabel('Goblin 12', 4)).toBe('Gob 12')
  })

  it('("Goblin", 4) — no number, behaves as slice', () => {
    expect(shortenTokenLabel('Goblin', 4)).toBe('Gobl')
  })

  it('("Skeleton Warrior 2", 7) — longer label with image chip', () => {
    // room = max(1, 7-1) = 6 → "Skelet 2"
    expect(shortenTokenLabel('Skeleton Warrior 2', 7)).toBe('Skelet 2')
  })

  it('("Goblin 3", 7) — fits entirely with room to spare', () => {
    expect(shortenTokenLabel('Goblin 3', 7)).toBe('Goblin 3')
  })

  it('number fills most of the space — base still gets max(1, max-1) chars', () => {
    // room = max(1, 4-1) = 3 → "Gob 999"
    expect(shortenTokenLabel('Goblin 999', 4)).toBe('Gob 999')
  })

  it('base always gets at least 1 char (max=1 edge case)', () => {
    // room = max(1, 1-1) = 1
    expect(shortenTokenLabel('Goblin 3', 1)).toBe('G 3')
  })

  it('single char label no number → returned as-is (slice(0,4))', () => {
    expect(shortenTokenLabel('X', 4)).toBe('X')
  })

  it('empty string → empty string', () => {
    expect(shortenTokenLabel('', 4)).toBe('')
  })

  it('trailing whitespace is trimmed before analysis', () => {
    expect(shortenTokenLabel('Goblin 3  ', 4)).toBe('Gob 3')
  })
})
