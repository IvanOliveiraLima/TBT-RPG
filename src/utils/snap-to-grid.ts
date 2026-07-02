import type { GridConfig } from '@/services/campaign-maps'

/**
 * Snap the center of a token occupying `tokenSize × tokenSize` cells to the
 * nearest grid-aligned center. Returns coordinates unchanged when grid is
 * disabled or has no size.
 */
export function snapToGrid(
  cx: number,
  cy: number,
  tokenSize: number,
  g: GridConfig,
): { x: number; y: number } {
  if (!g.enabled || !g.size) return { x: cx, y: cy }
  const s = g.size
  const k = tokenSize
  const col = Math.round((cx - g.offsetX) / s - k / 2)
  const row = Math.round((cy - g.offsetY) / s - k / 2)
  return { x: g.offsetX + (col + k / 2) * s, y: g.offsetY + (row + k / 2) * s }
}
