/**
 * Tests for campaign-map-areas service — updateMapArea.
 * Supabase is mocked; chain: .update(row).eq('id', id).select().single()
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateMapArea } from '@/services/campaign-map-areas'
import type { CampaignMapArea } from '@/services/campaign-map-areas'

// ── Mock supabase ─────────────────────────────────────────────────────────────

const mockUpdate = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (_table: string) => ({
      update: (data: unknown) => ({
        eq: (_col: string, _id: string) => ({
          select: () => ({ single: () => mockUpdate(data) }),
        }),
      }),
    }),
  },
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const AREA_ID = 'ar-1'
const MAP_ID = 'map-1'

const DB_ROW = {
  id: AREA_ID,
  map_id: MAP_ID,
  shape: 'circle',
  x: 120,
  y: 80,
  radius: 40,
  x2: null,
  y2: null,
  color: '#FF0000',
}

const EXPECTED_AREA: CampaignMapArea = {
  id: AREA_ID,
  mapId: MAP_ID,
  shape: 'circle',
  x: 120,
  y: 80,
  radius: 40,
  x2: null,
  y2: null,
  color: '#FF0000',
}

// ── updateMapArea ─────────────────────────────────────────────────────────────

describe('updateMapArea', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps fields and returns the updated area', async () => {
    mockUpdate.mockResolvedValue({ data: DB_ROW, error: null })
    const result = await updateMapArea(AREA_ID, { x: 120, y: 80, radius: 40 })
    expect(result).toEqual(EXPECTED_AREA)
  })

  it('sends only x, y, radius when only those are passed', async () => {
    mockUpdate.mockResolvedValue({ data: DB_ROW, error: null })
    await updateMapArea(AREA_ID, { x: 120, y: 80, radius: 40 })
    expect(mockUpdate).toHaveBeenCalledWith({ x: 120, y: 80, radius: 40 })
  })

  it('includes x2, y2 and color when passed', async () => {
    mockUpdate.mockResolvedValue({ data: { ...DB_ROW, shape: 'line', x2: 200, y2: 160, color: '#00FF00' }, error: null })
    await updateMapArea(AREA_ID, { x: 120, y: 80, radius: 40, x2: 200, y2: 160, color: '#00FF00' })
    expect(mockUpdate).toHaveBeenCalledWith({ x: 120, y: 80, radius: 40, x2: 200, y2: 160, color: '#00FF00' })
  })

  it('omits undefined keys — only color sent when only color is passed', async () => {
    mockUpdate.mockResolvedValue({ data: { ...DB_ROW, color: '#0000FF' }, error: null })
    await updateMapArea(AREA_ID, { color: '#0000FF' })
    expect(mockUpdate).toHaveBeenCalledWith({ color: '#0000FF' })
    const call = mockUpdate.mock.calls[0][0] as Record<string, unknown>
    expect('x' in call).toBe(false)
    expect('y' in call).toBe(false)
    expect('radius' in call).toBe(false)
    expect('x2' in call).toBe(false)
    expect('y2' in call).toBe(false)
  })

  it('allows x2/y2 to be explicitly set to null', async () => {
    mockUpdate.mockResolvedValue({ data: DB_ROW, error: null })
    await updateMapArea(AREA_ID, { x2: null, y2: null })
    expect(mockUpdate).toHaveBeenCalledWith({ x2: null, y2: null })
  })

  it('propagates error from supabase', async () => {
    mockUpdate.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(updateMapArea(AREA_ID, { x: 0 })).rejects.toBeDefined()
  })
})
