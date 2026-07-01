/**
 * Tests for campaign-map-markers service — list, create, update label, delete.
 * Supabase is mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listMapMarkers,
  createMapMarker,
  updateMapMarkerLabel,
  deleteMapMarker,
} from '@/services/campaign-map-markers'
import type { CampaignMapMarker } from '@/services/campaign-map-markers'

// ── Mock supabase ─────────────────────────────────────────────────────────────

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => mockSelect(),
        }),
      }),
      insert: (data: unknown) => ({
        select: () => ({
          single: () => mockInsert(data),
        }),
      }),
      update: (data: unknown) => ({
        eq: (_col: string, _id: string) => mockUpdate(data),
      }),
      delete: () => ({
        eq: (_col: string, id: string) => mockDelete(id),
      }),
    }),
  },
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP_ID = 'map-1'
const MARKER_ID = 'mk-1'

const DB_ROW = {
  id: MARKER_ID,
  map_id: MAP_ID,
  x: 400,
  y: 300,
  label: 'Boss Chamber',
  created_at: '2026-01-01T00:00:00Z',
}

const EXPECTED_MARKER: CampaignMapMarker = {
  id: MARKER_ID,
  mapId: MAP_ID,
  x: 400,
  y: 300,
  label: 'Boss Chamber',
  createdAt: new Date('2026-01-01T00:00:00Z').getTime(),
}

// ── listMapMarkers ─────────────────────────────────────────────────────────────

describe('listMapMarkers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped list on success', async () => {
    mockSelect.mockResolvedValue({ data: [DB_ROW], error: null })
    const result = await listMapMarkers(MAP_ID)
    expect(result).toEqual([EXPECTED_MARKER])
  })

  it('returns empty array when supabase returns empty', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    const result = await listMapMarkers(MAP_ID)
    expect(result).toEqual([])
  })

  it('throws on error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(listMapMarkers(MAP_ID)).rejects.toBeDefined()
  })
})

// ── createMapMarker ────────────────────────────────────────────────────────────

describe('createMapMarker', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped marker on success', async () => {
    mockInsert.mockResolvedValue({ data: DB_ROW, error: null })
    const result = await createMapMarker(MAP_ID, 400, 300, 'Boss Chamber')
    expect(result).toEqual(EXPECTED_MARKER)
  })

  it('inserts row with correct map_id, x, y, label', async () => {
    mockInsert.mockResolvedValue({ data: DB_ROW, error: null })
    await createMapMarker(MAP_ID, 400, 300, 'Boss Chamber')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      map_id: MAP_ID,
      x: 400,
      y: 300,
      label: 'Boss Chamber',
    }))
  })

  it('throws on insert error', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    await expect(createMapMarker(MAP_ID, 0, 0, '')).rejects.toBeDefined()
  })
})

// ── updateMapMarkerLabel ───────────────────────────────────────────────────────

describe('updateMapMarkerLabel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls update with the new label', async () => {
    mockUpdate.mockResolvedValue({ error: null })
    await updateMapMarkerLabel(MARKER_ID, 'New Name')
    expect(mockUpdate).toHaveBeenCalledWith({ label: 'New Name' })
  })

  it('throws on update error', async () => {
    mockUpdate.mockResolvedValue({ error: { message: 'update failed' } })
    await expect(updateMapMarkerLabel(MARKER_ID, 'New Name')).rejects.toBeDefined()
  })
})

// ── deleteMapMarker ────────────────────────────────────────────────────────────

describe('deleteMapMarker', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls delete with the marker id', async () => {
    mockDelete.mockResolvedValue({ error: null })
    await deleteMapMarker(MARKER_ID)
    expect(mockDelete).toHaveBeenCalledWith(MARKER_ID)
  })

  it('throws on delete error', async () => {
    mockDelete.mockResolvedValue({ error: { message: 'delete failed' } })
    await expect(deleteMapMarker(MARKER_ID)).rejects.toBeDefined()
  })
})
