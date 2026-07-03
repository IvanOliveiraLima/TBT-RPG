const DEFAULT_CELL_UNITS = 40 // cell size in image units when no grid is active

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
  const imageDiameter = sizeCells * (cellImageUnits ?? DEFAULT_CELL_UNITS)
  return Math.max(8, imageDiameter * pxPerUnit)
}
