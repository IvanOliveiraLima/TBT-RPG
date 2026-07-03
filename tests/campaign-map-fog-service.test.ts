import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMapFog, saveMapFog } from '@/services/campaign-map-fog'

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockMaybeSingle = vi.fn()
const mockEq          = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect      = vi.fn(() => ({ eq: mockEq }))
const mockUpsert      = vi.fn()
const mockFrom        = vi.fn((table: string) => {
  if (table === 'campaign_map_fog') {
    return { select: mockSelect, upsert: mockUpsert }
  }
  throw new Error(`unexpected table: ${table}`)
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (t: string) => mockFrom(t) },
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RAW_ROW = {
  map_id: 'map-1',
  enabled: true,
  revealed: ['0,0', '1,0'],
  updated_at: '2026-01-01T00:00:00.000Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getMapFog', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns default fog when no row exists (maybeSingle returns null)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const fog = await getMapFog('map-1')
    expect(fog.mapId).toBe('map-1')
    expect(fog.enabled).toBe(false)
    expect(fog.revealed).toEqual([])
    expect(fog.updatedAt).toBe(0)
  })

  it('maps row fields correctly', async () => {
    mockMaybeSingle.mockResolvedValue({ data: RAW_ROW, error: null })
    const fog = await getMapFog('map-1')
    expect(fog.mapId).toBe('map-1')
    expect(fog.enabled).toBe(true)
    expect(fog.revealed).toEqual(['0,0', '1,0'])
    expect(fog.updatedAt).toBe(new Date('2026-01-01T00:00:00.000Z').getTime())
  })

  it('throws when supabase returns an error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'db error' } })
    await expect(getMapFog('map-1')).rejects.toMatchObject({ message: 'db error' })
  })

  it('calls .select("*").eq("map_id", mapId).maybeSingle()', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    await getMapFog('map-x')
    expect(mockFrom).toHaveBeenCalledWith('campaign_map_fog')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('map_id', 'map-x')
    expect(mockMaybeSingle).toHaveBeenCalled()
  })
})

describe('saveMapFog', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls upsert with correct fields', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    await saveMapFog('map-1', { enabled: true, revealed: ['2,3'] })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        map_id: 'map-1',
        enabled: true,
        revealed: ['2,3'],
      }),
      { onConflict: 'map_id' },
    )
  })

  it('throws when supabase returns an error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'upsert failed' } })
    await expect(saveMapFog('map-1', { enabled: false, revealed: [] })).rejects.toMatchObject({ message: 'upsert failed' })
  })

  it('upsert includes updated_at timestamp', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    await saveMapFog('map-1', { enabled: true, revealed: [] })
    const call = mockUpsert.mock.calls[0][0] as Record<string, unknown>
    expect(typeof call['updated_at']).toBe('string')
  })
})
