/**
 * Tests for src/domain/area-geometry — hitTestArea, translateArea, coneBase.
 * Pure functions: no mocks needed.
 */
import { describe, it, expect } from 'vitest'
import { hitTestArea, translateArea, coneBase } from '@/domain/area-geometry'
import type { CampaignMapArea } from '@/services/campaign-map-areas'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeArea(overrides: Partial<CampaignMapArea>): CampaignMapArea {
  return {
    id: 'a1', mapId: 'm1', shape: 'circle',
    x: 0, y: 0, radius: 10, x2: null, y2: null, color: '#F00',
    ...overrides,
  }
}

// ── hitTestArea — circle ──────────────────────────────────────────────────────

describe('hitTestArea — circle', () => {
  const area = makeArea({ shape: 'circle', x: 100, y: 100, radius: 50 })

  it('centre is inside', () => {
    expect(hitTestArea(area, 100, 100, { lineWidth: 5 })).toBe(true)
  })

  it('point on boundary is inside', () => {
    expect(hitTestArea(area, 150, 100, { lineWidth: 5 })).toBe(true)
  })

  it('point just outside is not inside', () => {
    expect(hitTestArea(area, 151, 100, { lineWidth: 5 })).toBe(false)
  })

  it('point far away is not inside', () => {
    expect(hitTestArea(area, 0, 0, { lineWidth: 5 })).toBe(false)
  })
})

// ── hitTestArea — square ──────────────────────────────────────────────────────

describe('hitTestArea — square', () => {
  // square centred at (200,200), radius=60 → spans x:[140,260], y:[140,260]
  const area = makeArea({ shape: 'square', x: 200, y: 200, radius: 60 })

  it('centre is inside', () => {
    expect(hitTestArea(area, 200, 200, { lineWidth: 5 })).toBe(true)
  })

  it('corner on boundary is inside', () => {
    expect(hitTestArea(area, 260, 260, { lineWidth: 5 })).toBe(true)
  })

  it('point one unit outside corner is not inside', () => {
    expect(hitTestArea(area, 261, 260, { lineWidth: 5 })).toBe(false)
  })
})

// ── hitTestArea — line ────────────────────────────────────────────────────────

describe('hitTestArea — line', () => {
  // horizontal line from (0,0) to (100,0)
  const area = makeArea({ shape: 'line', x: 0, y: 0, x2: 100, y2: 0, radius: 100 })

  it('point on the segment (midpoint) is inside with lineWidth 10', () => {
    expect(hitTestArea(area, 50, 0, { lineWidth: 10 })).toBe(true)
  })

  it('point within tolerance of segment endpoint is inside', () => {
    expect(hitTestArea(area, 0, 3, { lineWidth: 10 })).toBe(true)  // dist=3 ≤ 5+4=9
  })

  it('point far from segment is not inside', () => {
    expect(hitTestArea(area, 50, 50, { lineWidth: 10 })).toBe(false)  // dist=50 > 9
  })
})

// ── hitTestArea — cone ────────────────────────────────────────────────────────

describe('hitTestArea — cone', () => {
  // apex=(0,0), tip=(0,100) → L=100, half=50
  // base points: b1=(50,100), b2=(-50,100)
  const area = makeArea({ shape: 'cone', x: 0, y: 0, x2: 0, y2: 100, radius: 100 })

  it('point inside the triangle is inside', () => {
    expect(hitTestArea(area, 0, 50, { lineWidth: 5 })).toBe(true)
  })

  it('point at the apex is inside', () => {
    expect(hitTestArea(area, 0, 0, { lineWidth: 5 })).toBe(true)
  })

  it('point behind the apex (negative y) is not inside', () => {
    expect(hitTestArea(area, 0, -10, { lineWidth: 5 })).toBe(false)
  })

  it('point outside the triangle laterally is not inside', () => {
    expect(hitTestArea(area, 60, 50, { lineWidth: 5 })).toBe(false)
  })
})

describe('coneBase — degenerate (x2==x, y2==y)', () => {
  it('returns null when apex and tip are the same point', () => {
    const area = makeArea({ shape: 'cone', x: 10, y: 10, x2: 10, y2: 10 })
    expect(coneBase(area)).toBeNull()
  })

  it('returns null when x2/y2 are null (fallback to same point)', () => {
    const area = makeArea({ shape: 'cone', x: 10, y: 10, x2: null, y2: null })
    expect(coneBase(area)).toBeNull()
  })
})

// ── translateArea ─────────────────────────────────────────────────────────────

describe('translateArea — circle/square (x2/y2 null)', () => {
  const area = makeArea({ shape: 'circle', x: 10, y: 20, x2: null, y2: null })

  it('translates x and y', () => {
    const result = translateArea(area, 5, -3)
    expect(result.x).toBe(15)
    expect(result.y).toBe(17)
  })

  it('keeps x2/y2 as null', () => {
    const result = translateArea(area, 5, -3)
    expect(result.x2).toBeNull()
    expect(result.y2).toBeNull()
  })
})

describe('translateArea — line/cone (x2/y2 set)', () => {
  const area = makeArea({ shape: 'line', x: 0, y: 0, x2: 100, y2: 50 })

  it('translates both endpoints', () => {
    const result = translateArea(area, 10, 20)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.x2).toBe(110)
    expect(result.y2).toBe(70)
  })
})
