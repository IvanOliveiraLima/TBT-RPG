/**
 * Tests for src/domain/area-geometry — hitTestArea, translateArea, coneBase.
 * Pure functions: no mocks needed.
 */
import { describe, it, expect } from 'vitest'
import { hitTestArea, translateArea, coneBase, areaHandles, resizeArea, hitTestHandle } from '@/domain/area-geometry'
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

// ── areaHandles ───────────────────────────────────────────────────────────────

describe('areaHandles — circle', () => {
  const area = makeArea({ shape: 'circle', x: 100, y: 200, radius: 50 })

  it('returns one handle of kind "radius" at (x+r, y)', () => {
    const handles = areaHandles(area)
    expect(handles).toHaveLength(1)
    expect(handles[0].kind).toBe('radius')
    expect(handles[0].x).toBe(150)
    expect(handles[0].y).toBe(200)
  })
})

describe('areaHandles — square', () => {
  const area = makeArea({ shape: 'square', x: 200, y: 200, radius: 60 })

  it('returns one handle of kind "corner" at (x+r, y+r)', () => {
    const handles = areaHandles(area)
    expect(handles).toHaveLength(1)
    expect(handles[0].kind).toBe('corner')
    expect(handles[0].x).toBe(260)
    expect(handles[0].y).toBe(260)
  })
})

describe('areaHandles — line', () => {
  const area = makeArea({ shape: 'line', x: 10, y: 20, x2: 110, y2: 80, radius: 100 })

  it('returns p1 at the start and p2 at the end', () => {
    const handles = areaHandles(area)
    expect(handles).toHaveLength(2)
    expect(handles.find(h => h.kind === 'p1')).toMatchObject({ x: 10, y: 20 })
    expect(handles.find(h => h.kind === 'p2')).toMatchObject({ x: 110, y: 80 })
  })
})

describe('areaHandles — cone', () => {
  const area = makeArea({ shape: 'cone', x: 0, y: 0, x2: 0, y2: 100, radius: 100 })

  it('returns origin at apex and tip at the tip point', () => {
    const handles = areaHandles(area)
    expect(handles).toHaveLength(2)
    expect(handles.find(h => h.kind === 'origin')).toMatchObject({ x: 0, y: 0 })
    expect(handles.find(h => h.kind === 'tip')).toMatchObject({ x: 0, y: 100 })
  })
})

// ── resizeArea ────────────────────────────────────────────────────────────────

describe('resizeArea — radius (circle)', () => {
  const area = makeArea({ shape: 'circle', x: 100, y: 100, radius: 50 })

  it('radius = distance from centre to dragged point', () => {
    const patch = resizeArea(area, 'radius', 100, 170)  // directly below centre, dist=70
    expect(patch.radius).toBeCloseTo(70)
  })

  it('clamps to minimum 2', () => {
    const patch = resizeArea(area, 'radius', 100, 100)  // same as centre → dist=0
    expect(patch.radius).toBe(2)
  })
})

describe('resizeArea — corner (square)', () => {
  const area = makeArea({ shape: 'square', x: 200, y: 200, radius: 60 })

  it('radius = max(|dx|, |dy|)', () => {
    const patch = resizeArea(area, 'corner', 280, 240)  // dx=80, dy=40 → max=80
    expect(patch.radius).toBe(80)
  })

  it('clamps to minimum 2', () => {
    const patch = resizeArea(area, 'corner', 200, 200)  // same as centre → 0
    expect(patch.radius).toBe(2)
  })
})

describe('resizeArea — p1 (line start)', () => {
  // line from (0,0) to (100,0)
  const area = makeArea({ shape: 'line', x: 0, y: 0, x2: 100, y2: 0, radius: 100 })

  it('moves start point and recalculates radius as distance between endpoints', () => {
    const patch = resizeArea(area, 'p1', 20, 0)
    expect(patch.x).toBe(20)
    expect(patch.y).toBe(0)
    expect(patch.radius).toBeCloseTo(80)  // dist from (20,0) to (100,0)
  })
})

describe('resizeArea — p2 (line end)', () => {
  const area = makeArea({ shape: 'line', x: 0, y: 0, x2: 100, y2: 0, radius: 100 })

  it('moves end point and recalculates radius', () => {
    const patch = resizeArea(area, 'p2', 150, 0)
    expect(patch.x2).toBe(150)
    expect(patch.y2).toBe(0)
    expect(patch.radius).toBeCloseTo(150)  // dist from (0,0) to (150,0)
  })
})

describe('resizeArea — origin (cone apex)', () => {
  const area = makeArea({ shape: 'cone', x: 0, y: 0, x2: 0, y2: 100, radius: 100 })

  it('moves apex and recalculates radius', () => {
    const patch = resizeArea(area, 'origin', 0, 20)
    expect(patch.x).toBe(0)
    expect(patch.y).toBe(20)
    expect(patch.radius).toBeCloseTo(80)  // dist from (0,20) to (0,100)
  })
})

// ── hitTestHandle ─────────────────────────────────────────────────────────────

describe('hitTestHandle — circle (radius handle)', () => {
  // circle at (100,100), radius 50 → handle at (150,100)
  const area = makeArea({ shape: 'circle', x: 100, y: 100, radius: 50 })

  it('returns "radius" when pointer is within hitR of the handle', () => {
    expect(hitTestHandle(area, 150, 100, 10)).toBe('radius')
  })

  it('returns "radius" at the exact handle position', () => {
    expect(hitTestHandle(area, 150, 100, 5)).toBe('radius')
  })

  it('returns null when pointer is outside hitR', () => {
    expect(hitTestHandle(area, 162, 100, 10)).toBeNull()
  })
})

describe('hitTestHandle — square (corner handle)', () => {
  // square at (200,200), radius 60 → handle at (260,260)
  const area = makeArea({ shape: 'square', x: 200, y: 200, radius: 60 })

  it('returns "corner" when within hitR of the corner handle', () => {
    expect(hitTestHandle(area, 260, 260, 10)).toBe('corner')
  })

  it('returns null when outside hitR', () => {
    expect(hitTestHandle(area, 272, 260, 10)).toBeNull()
  })
})

describe('hitTestHandle — line (p1 and p2 handles)', () => {
  // line from (10,20) to (110,80)
  const area = makeArea({ shape: 'line', x: 10, y: 20, x2: 110, y2: 80, radius: 100 })

  it('returns "p1" when within hitR of the start point', () => {
    expect(hitTestHandle(area, 10, 20, 8)).toBe('p1')
  })

  it('returns "p2" when within hitR of the end point', () => {
    expect(hitTestHandle(area, 110, 80, 8)).toBe('p2')
  })

  it('returns null when not near either handle', () => {
    expect(hitTestHandle(area, 60, 50, 8)).toBeNull()
  })
})

describe('hitTestHandle — cone (origin and tip handles)', () => {
  // cone apex (0,0), tip (0,100)
  const area = makeArea({ shape: 'cone', x: 0, y: 0, x2: 0, y2: 100, radius: 100 })

  it('returns "origin" when within hitR of the apex', () => {
    expect(hitTestHandle(area, 0, 0, 8)).toBe('origin')
  })

  it('returns "tip" when within hitR of the tip', () => {
    expect(hitTestHandle(area, 0, 100, 8)).toBe('tip')
  })

  it('returns null when not near any handle', () => {
    expect(hitTestHandle(area, 50, 50, 8)).toBeNull()
  })
})

describe('resizeArea — tip (cone tip)', () => {
  const area = makeArea({ shape: 'cone', x: 0, y: 0, x2: 0, y2: 100, radius: 100 })

  it('moves tip and recalculates radius', () => {
    const patch = resizeArea(area, 'tip', 0, 200)
    expect(patch.x2).toBe(0)
    expect(patch.y2).toBe(200)
    expect(patch.radius).toBeCloseTo(200)  // dist from (0,0) to (0,200)
  })
})
