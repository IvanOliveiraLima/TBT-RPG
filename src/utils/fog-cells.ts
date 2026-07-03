import type { GridConfig } from '@/services/campaign-maps'

export const cellKey = (col: number, row: number) => `${col},${row}`

export function pointToCell(px: number, py: number, g: GridConfig): { col: number; row: number } | null {
  if (!g.enabled || !g.size) return null
  return { col: Math.floor((px - g.offsetX) / g.size), row: Math.floor((py - g.offsetY) / g.size) }
}

export function allCells(width: number, height: number, g: GridConfig): string[] {
  if (!g.enabled || !g.size) return []
  const keys: string[] = []
  const startCol = Math.floor((0 - g.offsetX) / g.size)
  const endCol = Math.ceil((width - g.offsetX) / g.size)
  const startRow = Math.floor((0 - g.offsetY) / g.size)
  const endRow = Math.ceil((height - g.offsetY) / g.size)
  for (let c = startCol; c < endCol; c++) {
    for (let r = startRow; r < endRow; r++) {
      keys.push(cellKey(c, r))
    }
  }
  return keys
}
