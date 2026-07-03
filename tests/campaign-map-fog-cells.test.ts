import { describe, it, expect } from 'vitest'
import { cellKey, pointToCell, allCells } from '@/utils/fog-cells'
import type { GridConfig } from '@/services/campaign-maps'

const G_OFF: GridConfig = { enabled: false, size: 40, offsetX: 0, offsetY: 0, color: '#fff' }
const G_ON:  GridConfig = { enabled: true,  size: 40, offsetX: 0, offsetY: 0, color: '#fff' }
const G_OFFSET: GridConfig = { enabled: true, size: 40, offsetX: 5, offsetY: 3, color: '#fff' }

describe('cellKey', () => {
  it('formats col,row as string', () => expect(cellKey(3, 5)).toBe('3,5'))
  it('handles negative col', () => expect(cellKey(-1, 0)).toBe('-1,0'))
})

describe('pointToCell', () => {
  it('returns null when grid disabled', () => expect(pointToCell(100, 200, G_OFF)).toBeNull())
  it('returns null when size is null', () => {
    const g: GridConfig = { enabled: true, size: null, offsetX: 0, offsetY: 0, color: '#fff' }
    expect(pointToCell(100, 200, g)).toBeNull()
  })
  it('returns col=2 row=5 for px=100 py=200 size=40 no offset', () => {
    expect(pointToCell(100, 200, G_ON)).toEqual({ col: 2, row: 5 })
  })
  it('floor-divides (pixel 0 → col 0)', () => {
    expect(pointToCell(0, 0, G_ON)).toEqual({ col: 0, row: 0 })
  })
  it('pixel at exact cell boundary goes to next cell', () => {
    // px=40 → col = floor(40/40) = 1
    expect(pointToCell(40, 0, G_ON)).toEqual({ col: 1, row: 0 })
  })
  it('respects offsetX and offsetY', () => {
    // px=45, offsetX=5 → floor((45-5)/40) = floor(1) = 1
    expect(pointToCell(45, 43, G_OFFSET)).toEqual({ col: 1, row: 1 })
  })
  it('returns negative col for pixel left of offset', () => {
    // px=3, offsetX=5 → floor((3-5)/40) = floor(-0.05) = -1
    // py=0, offsetY=3 → floor((0-3)/40) = floor(-0.075) = -1
    expect(pointToCell(3, 0, G_OFFSET)).toEqual({ col: -1, row: -1 })
  })
})

describe('allCells', () => {
  it('returns empty array when grid disabled', () => {
    expect(allCells(800, 600, G_OFF)).toHaveLength(0)
  })
  it('returns empty array when size is null', () => {
    const g: GridConfig = { enabled: true, size: null, offsetX: 0, offsetY: 0, color: '#fff' }
    expect(allCells(800, 600, g)).toHaveLength(0)
  })
  it('returns correct count for simple 80x40 map with 40px cells', () => {
    // 2 cols (0,1) × 1 row (0) = 2 cells
    expect(allCells(80, 40, G_ON)).toHaveLength(2)
  })
  it('includes all expected keys for 80x80 map', () => {
    const cells = allCells(80, 80, G_ON)
    expect(cells).toContain('0,0')
    expect(cells).toContain('1,0')
    expect(cells).toContain('0,1')
    expect(cells).toContain('1,1')
    expect(cells).toHaveLength(4)
  })
  it('handles offset: includes negative cols when offsetX > 0', () => {
    // width=80, offsetX=5, size=40
    // startCol = floor((0-5)/40) = floor(-0.125) = -1
    // endCol   = ceil((80-5)/40) = ceil(1.875) = 2
    // 3 cols: -1,0,1 × ... rows
    const cells = allCells(80, 40, G_OFFSET)
    expect(cells.some(k => k.startsWith('-1,'))).toBe(true)
  })
  it('all returned keys are unique', () => {
    const cells = allCells(200, 200, G_ON)
    expect(new Set(cells).size).toBe(cells.length)
  })
})
