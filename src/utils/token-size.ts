const DEFAULT_CELL_UNITS = 40 // cell size in image units when no grid is active

/** Fraction of the cell the token occupies — leaves breathing room for grid lines. */
const TOKEN_FILL_RATIO = 0.9
/** Legibility floor in px — never applied above the cell's own footprint. */
const MIN_TOKEN_PX = 8

/**
 * Diameter of a token in screen px, proportional to the grid cell at the current zoom.
 *
 * @param sizeCells      token size in cells (1–5)
 * @param cellImageUnits cell size in image units (localGrid.size); null when grid is off
 * @param pxPerUnit      screen px per 1 image unit at the current zoom level
 */
export function tokenDiameterPx(
  sizeCells: number,
  cellImageUnits: number | null,
  pxPerUnit: number,
): number {
  const cellPx = (cellImageUnits ?? DEFAULT_CELL_UNITS) * pxPerUnit
  const footprint = sizeCells * cellPx
  const d = footprint * TOKEN_FILL_RATIO
  // The floor never exceeds the footprint (otherwise the token would overlap grid lines)
  return Math.max(Math.min(MIN_TOKEN_PX, footprint), d)
}
