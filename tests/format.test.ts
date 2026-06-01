import { describe, it, expect } from 'vitest'
import { formatWeight, totalInventoryWeight } from '@/utils/format'

describe('formatWeight', () => {
  it('formats integer weight without decimal', () => {
    expect(formatWeight(10)).toBe('10 lb')
  })

  it('formats decimal weight with 1 decimal place', () => {
    expect(formatWeight(2.5)).toBe('2.5 lb')
  })

  it('formats zero as "0 lb"', () => {
    expect(formatWeight(0)).toBe('0 lb')
  })

  it('rounds to 1 decimal place', () => {
    expect(formatWeight(2.55)).toBe('2.6 lb')
  })

  it('does not show trailing zero for integers', () => {
    expect(formatWeight(15)).toBe('15 lb')
  })
})

describe('totalInventoryWeight', () => {
  it('sums weight × quantity for all items', () => {
    const items = [
      { weight: 2.5, quantity: 1 },
      { weight: 1,   quantity: 3 },
    ]
    expect(totalInventoryWeight(items)).toBeCloseTo(5.5)
  })

  it('returns 0 for empty list', () => {
    expect(totalInventoryWeight([])).toBe(0)
  })

  it('handles single item with quantity 1', () => {
    expect(totalInventoryWeight([{ weight: 59, quantity: 1 }])).toBe(59)
  })
})
