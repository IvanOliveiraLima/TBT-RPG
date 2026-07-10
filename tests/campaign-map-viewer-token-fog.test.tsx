/**
 * CampaignMapViewer — token visibility under fog of war.
 *
 * Covers:
 * - Player does NOT see token in unrevealed cell (fog on)
 * - Player DOES see token when its cell is revealed (fog on)
 * - Owner always sees all tokens regardless of fog
 * - Fog disabled → all tokens visible to player
 * - Flip invariant: token at bottom (high y) uses map.height-tok.y, not tok.y raw
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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

const mockListMapTokens = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:          (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:         () => Promise.resolve({}),
  updateMapToken:         () => Promise.resolve(),
  deleteMapToken:         () => Promise.resolve(),
  uploadTokenImage:       () => Promise.resolve('camp-1/tokens/tok-a.png'),
  getTokenImageSignedUrl: () => Promise.resolve('https://signed.example.com/token.png'),
  removeTokenImage:       () => Promise.resolve(),
}))

const mockGetMapFog = vi.fn()

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  (...args: unknown[]) => mockGetMapFog(...args),
  saveMapFog: () => Promise.resolve(),
}))

// ── Mock campaign-map-areas service ──────────────────────────────────────────

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   () => Promise.resolve([]),
  createMapArea:  () => Promise.resolve({ id: 'area-new', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea:  () => Promise.resolve(),
  clearMapAreas:  () => Promise.resolve(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Grid: size=50, no offset. map.height=1024.
// Token A: x=100, y=300 → flip: 1024-300=724 → col=floor(100/50)=2, row=floor(724/50)=14 → "2,14"
// Token B: x=100, y=900 → flip: 1024-900=124 → col=2, row=floor(124/50)=2  → "2,2"
//   (wrong raw-y cell would be: row=floor(900/50)=18 → "2,18")

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: true, gridSize: 50, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const TOKEN_A: CampaignMapToken = {
  id: 'tok-a', mapId: 'map-1', x: 100, y: 300,
  label: 'Goblin', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0,
}

// Token at the bottom of the map (high y value)
const TOKEN_B: CampaignMapToken = {
  id: 'tok-b', mapId: 'map-1', x: 100, y: 900,
  label: 'Dragon', color: '#8B0000', size: 1, imagePath: null, conditions: [], createdAt: 1,
}

const FOG_OFF    = { mapId: 'map-1', enabled: false, revealed: [],      updatedAt: 0 }
const FOG_EMPTY  = { mapId: 'map-1', enabled: true,  revealed: [],      updatedAt: 1 }
const FOG_A_ONLY = { mapId: 'map-1', enabled: true,  revealed: ['2,14'], updatedAt: 2 }
const FOG_B_ONLY = { mapId: 'map-1', enabled: true,  revealed: ['2,2'],  updatedAt: 3 }
const FOG_ALL    = { mapId: 'map-1', enabled: true,  revealed: ['2,14', '2,2'], updatedAt: 4 }

// Wrong cell for B (raw tok.y without flip: floor(900/50)=18)
const FOG_B_WRONG_CELL = { mapId: 'map-1', enabled: true, revealed: ['2,18'], updatedAt: 5 }

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokenVisible(id: string) {
  return screen.queryByTestId(`token-popup-${id}`) !== null
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — token visibility under fog (player)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListMapTokens.mockResolvedValue([TOKEN_A])
    mockGetMapFog.mockResolvedValue(FOG_EMPTY)
  })

  it('player does NOT see token in unrevealed cell when fog is enabled', async () => {
    mockGetMapFog.mockResolvedValue(FOG_EMPTY) // cell "2,14" not revealed
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(tokenVisible('tok-a')).toBe(false)
  })

  it('player DOES see token when its cell is revealed', async () => {
    mockGetMapFog.mockResolvedValue(FOG_A_ONLY) // "2,14" revealed
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    await waitFor(() => expect(tokenVisible('tok-a')).toBe(true))
  })

  it('player sees nothing when fog is on and no cells are revealed', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_A, TOKEN_B])
    mockGetMapFog.mockResolvedValue(FOG_EMPTY)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(tokenVisible('tok-a')).toBe(false)
    expect(tokenVisible('tok-b')).toBe(false)
  })

  it('player sees all tokens when fog is disabled', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_A, TOKEN_B])
    mockGetMapFog.mockResolvedValue(FOG_OFF)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    await waitFor(() => {
      expect(tokenVisible('tok-a')).toBe(true)
      expect(tokenVisible('tok-b')).toBe(true)
    })
  })

  it('revealing one cell shows only the token in that cell', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_A, TOKEN_B])
    mockGetMapFog.mockResolvedValue(FOG_A_ONLY) // only "2,14"
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    await waitFor(() => expect(tokenVisible('tok-a')).toBe(true))
    expect(tokenVisible('tok-b')).toBe(false)
  })
})

describe('CampaignMapViewer — token visibility under fog (owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListMapTokens.mockResolvedValue([TOKEN_A, TOKEN_B])
    mockGetMapFog.mockResolvedValue(FOG_EMPTY) // fog on, nothing revealed
  })

  it('owner sees all tokens even when fog is on and no cells are revealed', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    await waitFor(() => {
      expect(tokenVisible('tok-a')).toBe(true)
      expect(tokenVisible('tok-b')).toBe(true)
    })
  })

  it('owner sees all tokens when fog is fully on', async () => {
    mockGetMapFog.mockResolvedValue(FOG_ALL)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    await waitFor(() => {
      expect(tokenVisible('tok-a')).toBe(true)
      expect(tokenVisible('tok-b')).toBe(true)
    })
  })
})

describe('CampaignMapViewer — token-fog Y-flip invariant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListMapTokens.mockResolvedValue([TOKEN_B]) // bottom token: x=100, y=900
  })

  it('bottom token appears when its correctly-flipped cell ("2,2") is revealed', async () => {
    mockGetMapFog.mockResolvedValue(FOG_B_ONLY) // "2,2" — correct flip
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    await waitFor(() => expect(tokenVisible('tok-b')).toBe(true))
  })

  it('bottom token stays hidden when only the wrong (raw-y) cell "2,18" is revealed', async () => {
    mockGetMapFog.mockResolvedValue(FOG_B_WRONG_CELL) // "2,18" — raw tok.y without flip
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalled())
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(tokenVisible('tok-b')).toBe(false)
  })
})
