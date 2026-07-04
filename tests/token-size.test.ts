import { describe, it, expect } from 'vitest'
import { tokenDiameterPx } from '@/utils/token-size'

describe('tokenDiameterPx', () => {
  it('returns sizeCells × cellImageUnits × pxPerUnit', () => {
    expect(tokenDiameterPx(2, 50, 2)).toBe(200)
  })

  it('uses DEFAULT_CELL_UNITS (40) when cellImageUnits is null', () => {
    expect(tokenDiameterPx(1, null, 1)).toBe(40)
  })

  it('floors at 8px for very small zoom-out', () => {
    expect(tokenDiameterPx(1, 40, 0.001)).toBe(8)
  })

  it('size 3 × 32 units × 1.5 scale = 144', () => {
    expect(tokenDiameterPx(3, 32, 1.5)).toBe(144)
  })

  it('size 5 cells × default 40 units × pxPerUnit 2 = 400', () => {
    expect(tokenDiameterPx(5, null, 2)).toBe(400)
  })

  it('non-null grid cell takes priority over default', () => {
    // 1 cell × 60 units × 1 scale = 60 (not 40)
    expect(tokenDiameterPx(1, 60, 1)).toBe(60)
  })
})
