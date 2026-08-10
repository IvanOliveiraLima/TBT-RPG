import { describe, it, expect } from 'vitest'
import { tokenDiameterPx } from '@/utils/token-size'

describe('tokenDiameterPx', () => {
  it('returns 90 % of footprint for a normal cell (1×1, 40 units, ×1)', () => {
    // cellPx = 40, footprint = 40, d = 36
    expect(tokenDiameterPx(1, null, 1)).toBe(36)
  })

  it('returns 90 % for 2×2 (50 units, ×2)', () => {
    // cellPx = 100, footprint = 200, d = 180
    expect(tokenDiameterPx(2, 50, 2)).toBe(180)
  })

  it('uses DEFAULT_CELL_UNITS (40) when cellImageUnits is null — 90 % of footprint', () => {
    // cellPx = 40×2 = 80, footprint = 400, d = 360
    expect(tokenDiameterPx(5, null, 2)).toBe(360)
  })

  it('non-null grid cell takes priority over default', () => {
    // cellPx = 60, footprint = 60, d = 54
    expect(tokenDiameterPx(1, 60, 1)).toBe(54)
  })

  it('size 3 × 32 units × 1.5 scale = 90 % of 144 = 129.6', () => {
    expect(tokenDiameterPx(3, 32, 1.5)).toBe(129.6)
  })

  it('tiny cell — floor is capped at footprint, token never exceeds its cell', () => {
    // footprint = 1×40×0.001 = 0.04 px; d = 0.036; floor = min(8, 0.04) = 0.04
    const result = tokenDiameterPx(1, 40, 0.001)
    const footprint = 1 * 40 * 0.001
    expect(result).toBeLessThanOrEqual(footprint)
  })

  it('when footprint is just below MIN_TOKEN_PX the floor equals footprint', () => {
    // footprint = 1×40×0.1 = 4 px < 8; floor = min(8, 4) = 4; d = 3.6; max(4, 3.6) = 4
    expect(tokenDiameterPx(1, 40, 0.1)).toBe(4)
  })

  it('2×2 scales proportionally relative to 1×1 (same pxPerUnit)', () => {
    const one = tokenDiameterPx(1, 32, 2)
    const two = tokenDiameterPx(2, 32, 2)
    expect(two).toBeCloseTo(one * 2, 5)
  })
})
