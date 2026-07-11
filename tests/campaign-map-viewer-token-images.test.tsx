/**
 * CampaignMapViewer — token image feature tests.
 *
 * Covers:
 * - Token with imagePath fetches a signed URL and renders with it
 * - Token without imagePath renders without fetching a signed URL
 * - Owner popup shows image upload label and no remove button when no image
 * - Owner popup shows remove-image button when token has imagePath
 * - Upload handler calls uploadTokenImage and updates token state
 * - Remove handler calls removeTokenImage and clears token imagePath
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── Mock react-leaflet ────────────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: () => null,
  SVGOverlay:   () => null,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    dragging: { enable: vi.fn(), disable: vi.fn() },
    getContainer: () => ({
      style: { cursor: '', touchAction: '' },
      setPointerCapture: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    mouseEventToLatLng: () => ({ lat: 0, lng: 0 }),
    invalidateSize: vi.fn(),
    latLngToLayerPoint: () => ({ x: 0, y: 0 }),
    on: vi.fn(),
    off: vi.fn(),
  }),
  useMapEvents: () => null,
}))

// ── Mock leaflet ──────────────────────────────────────────────────────────────

vi.mock('leaflet', () => ({
  default: {
    CRS: { Simple: 'Simple' },
    latLngBounds: (corners: unknown) => ({ corners, isBounds: true }),
    divIcon: (opts: unknown) => ({ ...(opts as object), _isIcon: true }),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── Mock services ─────────────────────────────────────────────────────────────

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: vi.fn().mockResolvedValue('https://example.com/map.png'),
  updateCampaignMapGrid:   vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({}),
  updateMapMarkerLabel: () => Promise.resolve(),
  deleteMapMarker:      () => Promise.resolve(),
}))

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   () => Promise.resolve([]),
  createMapArea:  () => Promise.resolve({ id: 'area-new', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea:  () => Promise.resolve(),
  clearMapAreas:  () => Promise.resolve(),
}))

const mockListMapTokens       = vi.fn()
const mockUploadTokenImage    = vi.fn()
const mockGetTokenImageUrl    = vi.fn()
const mockRemoveTokenImage    = vi.fn()
const mockDeleteMapToken      = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:          (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:         () => Promise.resolve({ id: 'new', mapId: 'map-1', x: 0, y: 0, label: '', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0 }),
  updateMapToken:         () => Promise.resolve(),
  deleteMapToken:         (...args: unknown[]) => mockDeleteMapToken(...args),
  uploadTokenImage:       (...args: unknown[]) => mockUploadTokenImage(...args),
  getTokenImageSignedUrl: (...args: unknown[]) => mockGetTokenImageUrl(...args),
  removeTokenImage:       (...args: unknown[]) => mockRemoveTokenImage(...args),
  setTokenImageFromCharacterPortrait: vi.fn(),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: () => Promise.resolve([]),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchCampaignCharacterImages: () => Promise.resolve({ portraitData: null, symbolData: null }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const TOKEN_NO_IMAGE: CampaignMapToken = {
  id: 'tok-1', mapId: 'map-1', x: 400, y: 300,
  label: 'Goblin', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0,
}

const TOKEN_WITH_IMAGE: CampaignMapToken = {
  id: 'tok-2', mapId: 'map-1', x: 800, y: 600,
  label: 'Dragon', color: '#8B0000', size: 1,
  imagePath: 'camp-1/tokens/tok-2.png', conditions: [], createdAt: 1,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — token image signed URL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteMapToken.mockResolvedValue(undefined)
  })

  it('fetches signed URL for token with imagePath on mount', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_WITH_IMAGE])
    mockGetTokenImageUrl.mockResolvedValue('https://signed.example.com/tok-2.png')
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => expect(mockGetTokenImageUrl).toHaveBeenCalledWith('camp-1/tokens/tok-2.png'))
  })

  it('does NOT fetch signed URL for token without imagePath', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_NO_IMAGE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(mockGetTokenImageUrl).not.toHaveBeenCalled()
  })
})

describe('CampaignMapViewer — token popup image controls (owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteMapToken.mockResolvedValue(undefined)
  })

  it('shows upload label but no remove button when token has no image', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_NO_IMAGE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-popup-${TOKEN_NO_IMAGE.id}`))
    expect(screen.getByTestId(`token-image-upload-label-${TOKEN_NO_IMAGE.id}`)).toBeDefined()
    expect(screen.queryByTestId(`token-image-remove-${TOKEN_NO_IMAGE.id}`)).toBeNull()
  })

  it('shows remove-image button when token has imagePath', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_WITH_IMAGE])
    mockGetTokenImageUrl.mockResolvedValue('https://signed.example.com/tok-2.png')
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-popup-${TOKEN_WITH_IMAGE.id}`))
    expect(screen.getByTestId(`token-image-remove-${TOKEN_WITH_IMAGE.id}`)).toBeDefined()
  })

  it('upload handler calls uploadTokenImage and updates token imagePath in state', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_NO_IMAGE])
    mockUploadTokenImage.mockResolvedValue('camp-1/tokens/tok-1.png')
    mockGetTokenImageUrl.mockResolvedValue('https://signed.example.com/tok-1.png')
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-image-input-${TOKEN_NO_IMAGE.id}`))
    const file = new File(['img'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(screen.getByTestId(`token-image-input-${TOKEN_NO_IMAGE.id}`), {
      target: { files: [file] },
    })
    await waitFor(() =>
      expect(mockUploadTokenImage).toHaveBeenCalledWith('camp-1', TOKEN_NO_IMAGE.id, file),
    )
    // After upload, remove button should appear (token now has imagePath)
    await waitFor(() =>
      expect(screen.queryByTestId(`token-image-remove-${TOKEN_NO_IMAGE.id}`)).not.toBeNull(),
    )
  })

  it('remove handler calls removeTokenImage and hides remove button', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_WITH_IMAGE])
    mockGetTokenImageUrl.mockResolvedValue('https://signed.example.com/tok-2.png')
    mockRemoveTokenImage.mockResolvedValue(undefined)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-image-remove-${TOKEN_WITH_IMAGE.id}`))
    fireEvent.click(screen.getByTestId(`token-image-remove-${TOKEN_WITH_IMAGE.id}`))
    await waitFor(() =>
      expect(mockRemoveTokenImage).toHaveBeenCalledWith(
        TOKEN_WITH_IMAGE.id,
        TOKEN_WITH_IMAGE.imagePath,
      ),
    )
    await waitFor(() =>
      expect(screen.queryByTestId(`token-image-remove-${TOKEN_WITH_IMAGE.id}`)).toBeNull(),
    )
  })
})
