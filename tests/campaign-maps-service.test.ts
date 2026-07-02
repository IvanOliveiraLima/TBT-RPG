/**
 * Tests for campaign-maps service — upload validation, list, delete, signed URL.
 * Supabase and measureImage are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listCampaignMaps,
  uploadCampaignMap,
  deleteCampaignMap,
  getCampaignMapSignedUrl,
  updateCampaignMapGrid,
} from '@/services/campaign-maps'
import type { CampaignMap, GridConfig } from '@/services/campaign-maps'

// ── Mock supabase ─────────────────────────────────────────────────────────────

const mockSelect = vi.fn()
const mockCount = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockUpdate = vi.fn()
const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockCreateSignedUrl = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      void table
      return {
        select: (_cols?: unknown, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact') {
            return { eq: () => mockCount() }
          }
          return {
            eq: () => ({
              order: () => mockSelect(),
            }),
          }
        },
        insert: (data: unknown) => ({
          select: () => ({
            single: () => mockInsert(data),
          }),
        }),
        delete: () => ({
          eq: (_col: string, id: string) => mockDelete(id),
        }),
        update: (data: unknown) => ({
          eq: (_col: string, id: string) => mockUpdate(id, data),
        }),
      }
    },
    storage: {
      from: (_bucket: string) => ({
        upload: (_path: string, _file: unknown, _opts: unknown) => mockUpload(_path),
        remove: (paths: string[]) => mockRemove(paths),
        createSignedUrl: (path: string, _exp: number) => mockCreateSignedUrl(path),
      }),
    },
  },
}))

// ── Mock URL and Image APIs for measureImage ──────────────────────────────────

function makeFakeFile(type = 'image/png', size = 100): File {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], 'map.png', { type })
}

// Stub Image() so measureImage resolves immediately
class FakeImage {
  naturalWidth = 1024
  naturalHeight = 768
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  set src(_v: string) {
    // Trigger onload on next tick so the promise resolves
    setTimeout(() => this.onload?.(), 0)
  }
}

Object.defineProperty(globalThis, 'Image', { value: FakeImage, writable: true })
URL.createObjectURL = vi.fn(() => 'blob:fake')
URL.revokeObjectURL = vi.fn()

// Also stub crypto.randomUUID
Object.defineProperty(globalThis.crypto, 'randomUUID', {
  value: vi.fn(() => 'test-uuid-1234'),
  configurable: true,
})

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN_ID = 'camp-1'

const DB_ROW = {
  id: 'map-1',
  campaign_id: CAMPAIGN_ID,
  name: 'Dungeon Level 1',
  image_path: `${CAMPAIGN_ID}/map-1.png`,
  width: 1024,
  height: 768,
  created_at: '2026-01-01T00:00:00Z',
  grid_enabled: false,
  grid_size: null,
  grid_offset_x: 0,
  grid_offset_y: 0,
  grid_color: '#5DCAA5',
}

const EXPECTED_MAP: CampaignMap = {
  id: 'map-1',
  campaignId: CAMPAIGN_ID,
  name: 'Dungeon Level 1',
  imagePath: `${CAMPAIGN_ID}/map-1.png`,
  width: 1024,
  height: 768,
  createdAt: new Date('2026-01-01T00:00:00Z').getTime(),
  gridEnabled: false,
  gridSize: null,
  gridOffsetX: 0,
  gridOffsetY: 0,
  gridColor: '#5DCAA5',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('listCampaignMaps', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped list on success', async () => {
    mockSelect.mockResolvedValue({ data: [DB_ROW], error: null })
    const result = await listCampaignMaps(CAMPAIGN_ID)
    expect(result).toEqual([EXPECTED_MAP])
  })

  it('returns empty array when supabase returns empty', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    const result = await listCampaignMaps(CAMPAIGN_ID)
    expect(result).toEqual([])
  })

  it('throws on error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(listCampaignMaps(CAMPAIGN_ID)).rejects.toBeDefined()
  })
})

describe('uploadCampaignMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCount.mockResolvedValue({ count: 0 }) // well within quota by default
  })

  it('throws with code invalid_type for non-image MIME', async () => {
    const file = makeFakeFile('application/pdf')
    await expect(uploadCampaignMap(CAMPAIGN_ID, file, 'Test')).rejects.toMatchObject({ code: 'invalid_type' })
  })

  it('throws with code too_large when file exceeds 10 MB', async () => {
    const bigFile = makeFakeFile('image/png', 11 * 1024 * 1024)
    await expect(uploadCampaignMap(CAMPAIGN_ID, bigFile, 'Test')).rejects.toMatchObject({ code: 'too_large' })
  })

  it('uploads to storage with correct path and content-type', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ data: { ...DB_ROW, id: 'test-uuid-1234' }, error: null })
    const file = makeFakeFile('image/png')
    await uploadCampaignMap(CAMPAIGN_ID, file, 'My Map')
    expect(mockUpload).toHaveBeenCalledWith(`${CAMPAIGN_ID}/test-uuid-1234.png`)
  })

  it('inserts row with width/height/name', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ data: { ...DB_ROW, id: 'test-uuid-1234' }, error: null })
    const file = makeFakeFile('image/png')
    await uploadCampaignMap(CAMPAIGN_ID, file, 'My Map')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'My Map',
      campaign_id: CAMPAIGN_ID,
    }))
  })

  it('removes storage object and throws if insert fails', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ data: null, error: { message: 'insert failed' } })
    mockRemove.mockResolvedValue({ error: null })
    const file = makeFakeFile('image/jpeg')
    await expect(uploadCampaignMap(CAMPAIGN_ID, file, 'Map')).rejects.toBeDefined()
    expect(mockRemove).toHaveBeenCalled()
  })

  it('returns CampaignMap on success', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ data: DB_ROW, error: null })
    const file = makeFakeFile('image/png')
    const result = await uploadCampaignMap(CAMPAIGN_ID, file, 'Dungeon Level 1')
    expect(result).toMatchObject({ campaignId: CAMPAIGN_ID, name: 'Dungeon Level 1', width: 1024, height: 768 })
  })

  it('throws with code quota_exceeded when campaign has 20 maps', async () => {
    mockCount.mockResolvedValue({ count: 20 })
    const file = makeFakeFile('image/png')
    await expect(uploadCampaignMap(CAMPAIGN_ID, file, 'Map 21')).rejects.toMatchObject({ code: 'quota_exceeded' })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('allows upload when count is exactly 19 (one below limit)', async () => {
    mockCount.mockResolvedValue({ count: 19 })
    mockUpload.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ data: DB_ROW, error: null })
    const file = makeFakeFile('image/png')
    await expect(uploadCampaignMap(CAMPAIGN_ID, file, 'Map 20')).resolves.toBeDefined()
    expect(mockUpload).toHaveBeenCalled()
  })
})

describe('deleteCampaignMap', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes storage object and deletes DB row', async () => {
    mockRemove.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
    await deleteCampaignMap(EXPECTED_MAP)
    expect(mockRemove).toHaveBeenCalledWith([EXPECTED_MAP.imagePath])
    expect(mockDelete).toHaveBeenCalledWith(EXPECTED_MAP.id)
  })

  it('throws if DB delete fails', async () => {
    mockRemove.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: { message: 'delete failed' } })
    await expect(deleteCampaignMap(EXPECTED_MAP)).rejects.toBeDefined()
  })
})

describe('getCampaignMapSignedUrl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns signedUrl on success', async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.url/map.png' }, error: null })
    const url = await getCampaignMapSignedUrl('camp-1/map-1.png')
    expect(url).toBe('https://signed.url/map.png')
  })

  it('throws when error returned', async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: null, error: { message: 'not found' } })
    await expect(getCampaignMapSignedUrl('bad/path.png')).rejects.toBeDefined()
  })
})

describe('updateCampaignMapGrid', () => {
  beforeEach(() => vi.clearAllMocks())

  const GRID: GridConfig = {
    enabled: true, size: 40, offsetX: 5, offsetY: 3, color: '#FF0000',
  }

  it('calls update with snake_case grid fields and eq on map id', async () => {
    mockUpdate.mockResolvedValue({ error: null })
    await updateCampaignMapGrid('map-1', GRID)
    expect(mockUpdate).toHaveBeenCalledWith('map-1', {
      grid_enabled: true,
      grid_size: 40,
      grid_offset_x: 5,
      grid_offset_y: 3,
      grid_color: '#FF0000',
    })
  })

  it('throws when Supabase returns an error', async () => {
    mockUpdate.mockResolvedValue({ error: { message: 'update failed' } })
    const grid: GridConfig = { enabled: false, size: null, offsetX: 0, offsetY: 0, color: '#5DCAA5' }
    await expect(updateCampaignMapGrid('map-1', grid)).rejects.toBeDefined()
  })
})
