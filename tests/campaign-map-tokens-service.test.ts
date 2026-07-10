/**
 * Tests for campaign-map-tokens service — list, create, update, delete.
 * Supabase is mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listMapTokens,
  createMapToken,
  updateMapToken,
  deleteMapToken,
} from '@/services/campaign-map-tokens'
import type { CampaignMapToken, TokenPatch } from '@/services/campaign-map-tokens'

// ── Mock supabase ─────────────────────────────────────────────────────────────

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

const mockStorageRemove = vi.fn()

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
        eq: (_col: string, id: string) => mockUpdate(id, data),
      }),
      delete: () => ({
        eq: (_col: string, id: string) => mockDelete(id),
      }),
    }),
    storage: {
      from: (_bucket: string) => ({
        remove: (paths: unknown) => mockStorageRemove(paths),
      }),
    },
  },
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP_ID = 'map-1'

const DB_ROW = {
  id: 'tok-1',
  map_id: MAP_ID,
  x: 400,
  y: 300,
  label: 'Goblin',
  color: '#C0392B',
  size: 1,
  image_path: null,
  conditions: [],
  created_at: '2026-01-01T00:00:00Z',
}

const EXPECTED_TOKEN: CampaignMapToken = {
  id: 'tok-1',
  mapId: MAP_ID,
  x: 400,
  y: 300,
  label: 'Goblin',
  color: '#C0392B',
  size: 1,
  imagePath: null,
  conditions: [],
  createdAt: new Date('2026-01-01T00:00:00Z').getTime(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('listMapTokens', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped list on success', async () => {
    mockSelect.mockResolvedValue({ data: [DB_ROW], error: null })
    const result = await listMapTokens(MAP_ID)
    expect(result).toEqual([EXPECTED_TOKEN])
  })

  it('returns empty array when supabase returns empty', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    const result = await listMapTokens(MAP_ID)
    expect(result).toEqual([])
  })

  it('throws on error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(listMapTokens(MAP_ID)).rejects.toBeDefined()
  })
})

describe('createMapToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts with default opts and returns token', async () => {
    mockInsert.mockResolvedValue({ data: DB_ROW, error: null })
    const result = await createMapToken(MAP_ID, 400, 300)
    expect(result).toEqual(EXPECTED_TOKEN)
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      map_id: MAP_ID, x: 400, y: 300, label: '', color: '#C0392B', size: 1,
    }))
  })

  it('passes opts (label, color, size) to insert', async () => {
    mockInsert.mockResolvedValue({ data: { ...DB_ROW, label: 'Hero', color: '#0000FF', size: 2 }, error: null })
    await createMapToken(MAP_ID, 100, 200, { label: 'Hero', color: '#0000FF', size: 2 })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Hero', color: '#0000FF', size: 2,
    }))
  })

  it('throws on supabase error', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    await expect(createMapToken(MAP_ID, 0, 0)).rejects.toBeDefined()
  })
})

describe('updateMapToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes only provided patch fields (x, y)', async () => {
    mockUpdate.mockResolvedValue({ error: null })
    const patch: TokenPatch = { x: 500, y: 400 }
    await updateMapToken('tok-1', patch)
    expect(mockUpdate).toHaveBeenCalledWith('tok-1', { x: 500, y: 400 })
  })

  it('passes label, color, size patch', async () => {
    mockUpdate.mockResolvedValue({ error: null })
    const patch: TokenPatch = { label: 'Dragon', color: '#FF0000', size: 3 }
    await updateMapToken('tok-1', patch)
    expect(mockUpdate).toHaveBeenCalledWith('tok-1', { label: 'Dragon', color: '#FF0000', size: 3 })
  })

  it('throws on supabase error', async () => {
    mockUpdate.mockResolvedValue({ error: { message: 'update failed' } })
    await expect(updateMapToken('tok-1', { x: 0 })).rejects.toBeDefined()
  })
})

describe('deleteMapToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes by id (no image)', async () => {
    mockDelete.mockResolvedValue({ error: null })
    await deleteMapToken(EXPECTED_TOKEN)
    expect(mockDelete).toHaveBeenCalledWith('tok-1')
    expect(mockStorageRemove).not.toHaveBeenCalled()
  })

  it('removes storage image before deleting when imagePath is set', async () => {
    mockStorageRemove.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
    const tokenWithImage = { ...EXPECTED_TOKEN, imagePath: 'camp-1/tokens/tok-1.png' }
    await deleteMapToken(tokenWithImage)
    expect(mockStorageRemove).toHaveBeenCalledWith(['camp-1/tokens/tok-1.png'])
    expect(mockDelete).toHaveBeenCalledWith('tok-1')
  })

  it('throws on supabase error', async () => {
    mockDelete.mockResolvedValue({ error: { message: 'delete failed' } })
    await expect(deleteMapToken(EXPECTED_TOKEN)).rejects.toBeDefined()
  })
})
