import type { CampaignMapArea } from '@/services/campaign-map-areas'

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function pointInTriangle(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): boolean {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

/** Cone base points (same geometry as the render). */
export function coneBase(area: CampaignMapArea): { b1: [number, number]; b2: [number, number] } | null {
  const x2 = area.x2 ?? area.x, y2 = area.y2 ?? area.y
  const dx = x2 - area.x, dy = y2 - area.y
  const L = Math.hypot(dx, dy)
  if (L === 0) return null
  const ux = dx / L, uy = dy / L
  const nx = -uy, ny = ux
  const half = L / 2
  return { b1: [x2 + nx * half, y2 + ny * half], b2: [x2 - nx * half, y2 - ny * half] }
}

/** True if (px,py) in map coords is inside the area. `lineWidth` = rendered stroke width in viewBox units. */
export function hitTestArea(area: CampaignMapArea, px: number, py: number, opts: { lineWidth: number }): boolean {
  switch (area.shape) {
    case 'circle':
      return (px - area.x) ** 2 + (py - area.y) ** 2 <= area.radius ** 2
    case 'square':
      return Math.abs(px - area.x) <= area.radius && Math.abs(py - area.y) <= area.radius
    case 'line':
      return distToSegment(px, py, area.x, area.y, area.x2 ?? area.x, area.y2 ?? area.y) <= opts.lineWidth / 2 + 4
    case 'cone': {
      const base = coneBase(area)
      if (!base) return false
      return pointInTriangle(px, py, area.x, area.y, base.b1[0], base.b1[1], base.b2[0], base.b2[1])
    }
    default:
      return false
  }
}

/** Translates all anchor coords by (dx, dy) — moves both endpoints for line/cone. */
export function translateArea(
  area: CampaignMapArea,
  dx: number,
  dy: number,
): { x: number; y: number; x2: number | null; y2: number | null } {
  return {
    x: area.x + dx,
    y: area.y + dy,
    x2: area.x2 == null ? null : area.x2 + dx,
    y2: area.y2 == null ? null : area.y2 + dy,
  }
}

export type AreaHandleKind = 'radius' | 'corner' | 'p1' | 'p2' | 'origin' | 'tip'
export interface AreaHandle { kind: AreaHandleKind; x: number; y: number }

/** Positions of resize handles for the given area (map coords). */
export function areaHandles(area: CampaignMapArea): AreaHandle[] {
  switch (area.shape) {
    case 'circle': return [{ kind: 'radius', x: area.x + area.radius, y: area.y }]
    case 'square': return [{ kind: 'corner', x: area.x + area.radius, y: area.y + area.radius }]
    case 'line':   return [{ kind: 'p1', x: area.x, y: area.y }, { kind: 'p2', x: area.x2 ?? area.x, y: area.y2 ?? area.y }]
    case 'cone':   return [{ kind: 'origin', x: area.x, y: area.y }, { kind: 'tip', x: area.x2 ?? area.x, y: area.y2 ?? area.y }]
    default:       return []
  }
}

/** Coord patch produced by dragging handle `kind` to (px, py). radius is recalculated for line/cone. */
export function resizeArea(
  area: CampaignMapArea,
  kind: AreaHandleKind,
  px: number,
  py: number,
): { x?: number; y?: number; radius?: number; x2?: number; y2?: number } {
  const min = 2
  switch (kind) {
    case 'radius': return { radius: Math.max(min, Math.hypot(px - area.x, py - area.y)) }
    case 'corner': return { radius: Math.max(min, Math.abs(px - area.x), Math.abs(py - area.y)) }
    case 'p1': {
      const x2 = area.x2 ?? area.x, y2 = area.y2 ?? area.y
      return { x: px, y: py, radius: Math.hypot(x2 - px, y2 - py) }
    }
    case 'p2':     return { x2: px, y2: py, radius: Math.hypot(px - area.x, py - area.y) }
    case 'origin': {
      const x2 = area.x2 ?? area.x, y2 = area.y2 ?? area.y
      return { x: px, y: py, radius: Math.hypot(x2 - px, y2 - py) }
    }
    case 'tip':    return { x2: px, y2: py, radius: Math.hypot(px - area.x, py - area.y) }
    default:       return {}
  }
}
