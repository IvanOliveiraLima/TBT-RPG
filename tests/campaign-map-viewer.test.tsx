/**
 * CampaignMapViewer — tests that verify wiring:
 * - Shows loading state while fetching signed URL
 * - Passes correct url and bounds to ImageOverlay once URL arrives
 * - Shows error state on failure
 *
 * react-leaflet is mocked (jsdom can't run Leaflet canvas).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Mock react-leaflet ────────────────────────────────────────────────────────

const capturedImageOverlayProps: { url?: string; bounds?: unknown }[] = []
const capturedSVGOverlayProps: { bounds?: unknown; attributes?: Record<string, string> }[] = []

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: (props: { url: string; bounds: unknown }) => {
    capturedImageOverlayProps.push({ url: props.url, bounds: props.bounds })
    return <div data-testid="image-overlay" data-url={props.url} />
  },
  SVGOverlay: (props: { children?: React.ReactNode; bounds: unknown; attributes?: Record<string, string> }) => {
    capturedSVGOverlayProps.push({ bounds: props.bounds, attributes: props.attributes })
    return <svg data-testid="svg-overlay">{props.children}</svg>
  },
  Marker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({
    dragging: { enable: () => undefined, disable: () => undefined },
    getContainer: () => ({
      style: { cursor: '' as string, touchAction: '' as string },
      setPointerCapture: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    mouseEventToLatLng: () => ({ lat: 500, lng: 500 }),
    invalidateSize: () => {},
    latLngToLayerPoint: ([_lat, lng]: [number, number]) => ({ x: lng, y: 0 }),
    on: () => {},
    off: () => {},
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

// ── Mock CSS import ───────────────────────────────────────────────────────────

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── Mock campaign-maps service ────────────────────────────────────────────────

const mockGetSignedUrl = vi.fn()
const mockUpdateCampaignMapGrid = vi.fn()

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: (path: string) => mockGetSignedUrl(path),
  updateCampaignMapGrid: (...args: unknown[]) => mockUpdateCampaignMapGrid(...args),
}))

// ── Mock campaign-map-markers service (component now fetches markers) ─────────

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({}),
  updateMapMarkerLabel: () => Promise.resolve(),
  deleteMapMarker:      () => Promise.resolve(),
}))

// ── Mock campaign-map-tokens service ──────────────────────────────────────────

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:  () => Promise.resolve([]),
  createMapToken: () => Promise.resolve({}),
  updateMapToken: () => Promise.resolve(),
  deleteMapToken: () => Promise.resolve(),
}))

// ── Mock campaign-map-fog service ─────────────────────────────────────────────

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1',
  campaignId: 'camp-1',
  name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png',
  width: 2048,
  height: 1024,
  createdAt: 0,
  gridEnabled: false,
  gridSize: null,
  gridOffsetX: 0,
  gridOffsetY: 0,
  gridColor: '#5DCAA5',
}

const MAP_WITH_GRID: CampaignMap = {
  ...MAP,
  gridEnabled: true,
  gridSize: 40,
  gridOffsetX: 5,
  gridOffsetY: 3,
  gridColor: '#FF0000',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedImageOverlayProps.length = 0
    capturedSVGOverlayProps.length = 0
  })

  it('shows loading state while fetching signed URL', async () => {
    // Never resolves — stays in loading state
    mockGetSignedUrl.mockReturnValue(new Promise(() => undefined))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    expect(screen.getByTestId('campaign-map-viewer-loading')).toBeDefined()
  })

  it('shows loading text in PT', async () => {
    mockGetSignedUrl.mockReturnValue(new Promise(() => undefined))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'pt')
    expect(screen.getByTestId('campaign-map-viewer-loading').textContent).toContain('Carregando mapa')
  })

  it('renders MapContainer and ImageOverlay after URL resolves', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('map-container')).toBeDefined())
    expect(screen.getByTestId('image-overlay')).toBeDefined()
  })

  it('passes signed URL to ImageOverlay', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(capturedImageOverlayProps.length).toBeGreaterThan(0))
    expect(capturedImageOverlayProps[0].url).toBe('https://signed.example.com/map.png')
  })

  it('calls getCampaignMapSignedUrl with the imagePath', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(mockGetSignedUrl).toHaveBeenCalledWith(MAP.imagePath))
  })

  it('shows error state when getCampaignMapSignedUrl rejects', async () => {
    mockGetSignedUrl.mockRejectedValue(new Error('network error'))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('campaign-map-viewer-error')).toBeDefined())
  })

  it('does not show the viewer section before URL resolves', async () => {
    mockGetSignedUrl.mockReturnValue(new Promise(() => undefined))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    expect(screen.queryByTestId('campaign-map-viewer')).toBeNull()
  })
})

describe('CampaignMapViewer — grid overlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSVGOverlayProps.length = 0
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
  })

  it('renders SVGOverlay when gridEnabled and gridSize is set', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} />, 'en')
    await waitFor(() => expect(screen.queryByTestId('svg-overlay')).not.toBeNull())
  })

  it('does NOT render SVGOverlay when gridEnabled is false', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('map-container')).toBeDefined())
    expect(screen.queryByTestId('svg-overlay')).toBeNull()
  })

  it('does NOT render SVGOverlay when gridEnabled but gridSize is null', async () => {
    const mapEnabled = { ...MAP, gridEnabled: true, gridSize: null }
    renderWithI18n(<CampaignMapViewer map={mapEnabled} />, 'en')
    await waitFor(() => expect(screen.getByTestId('map-container')).toBeDefined())
    expect(screen.queryByTestId('svg-overlay')).toBeNull()
  })

  it('SVGOverlay receives viewBox matching map dimensions', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} />, 'en')
    await waitFor(() => expect(capturedSVGOverlayProps.length).toBeGreaterThan(0))
    expect(capturedSVGOverlayProps[0].attributes?.viewBox).toBe(`0 0 ${MAP_WITH_GRID.width} ${MAP_WITH_GRID.height}`)
  })
})

describe('CampaignMapViewer — grid config panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockUpdateCampaignMapGrid.mockResolvedValue(undefined)
  })

  it('shows collapsed toggle button for owner (not full panel)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('grid-panel-toggle')).toBeDefined())
    expect(screen.queryByTestId('grid-config-panel')).toBeNull()
  })

  it('toggle button label contains grid title (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('grid-panel-toggle').textContent).toContain('Grid'))
  })

  it('toggle button label contains grid title (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => expect(screen.getByTestId('grid-panel-toggle').textContent).toContain('Grade'))
  })

  it('clicking toggle button opens the config panel (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('grid-panel-toggle').click())
    await waitFor(() => expect(screen.getByTestId('grid-config-panel')).toBeDefined())
    expect(screen.getByTestId('grid-config-panel').textContent).toContain('Grid')
  })

  it('clicking toggle button opens the config panel (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('grid-panel-toggle').click())
    await waitFor(() => expect(screen.getByTestId('grid-config-panel')).toBeDefined())
    expect(screen.getByTestId('grid-config-panel').textContent).toContain('Grade')
  })

  it('collapse button (×) hides the panel', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('grid-panel-toggle').click())
    await waitFor(() => expect(screen.getByTestId('grid-collapse-btn')).toBeDefined())
    screen.getByTestId('grid-collapse-btn').click()
    await waitFor(() => expect(screen.queryByTestId('grid-config-panel')).toBeNull())
    expect(screen.getByTestId('grid-panel-toggle')).toBeDefined()
  })

  it('does NOT show toggle or panel for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(screen.getByTestId('campaign-map-viewer')).toBeDefined())
    expect(screen.queryByTestId('grid-panel-toggle')).toBeNull()
    expect(screen.queryByTestId('grid-config-panel')).toBeNull()
  })

  it('save grid button calls updateCampaignMapGrid and collapses panel', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('grid-panel-toggle').click())
    await waitFor(() => expect(screen.getByTestId('grid-save-btn')).toBeDefined())
    screen.getByTestId('grid-save-btn').click()
    await waitFor(() => expect(mockUpdateCampaignMapGrid).toHaveBeenCalledWith(
      MAP_WITH_GRID.id,
      expect.objectContaining({ enabled: true, size: 40, color: '#FF0000' }),
    ))
    await waitFor(() => expect(screen.queryByTestId('grid-config-panel')).toBeNull())
  })

  it('calls onGridSaved callback with mapId and current grid after save', async () => {
    const onGridSaved = vi.fn()
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner onGridSaved={onGridSaved} />, 'en')
    await waitFor(() => screen.getByTestId('grid-panel-toggle').click())
    await waitFor(() => expect(screen.getByTestId('grid-save-btn')).toBeDefined())
    screen.getByTestId('grid-save-btn').click()
    await waitFor(() => expect(onGridSaved).toHaveBeenCalledWith(
      MAP_WITH_GRID.id,
      expect.objectContaining({ enabled: true, size: 40, offsetX: 5, offsetY: 3, color: '#FF0000' }),
    ))
  })

  it('does NOT call onGridSaved when updateCampaignMapGrid fails', async () => {
    mockUpdateCampaignMapGrid.mockRejectedValue(new Error('network'))
    const onGridSaved = vi.fn()
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner onGridSaved={onGridSaved} />, 'en')
    await waitFor(() => screen.getByTestId('grid-panel-toggle').click())
    await waitFor(() => expect(screen.getByTestId('grid-save-btn')).toBeDefined())
    screen.getByTestId('grid-save-btn').click()
    await waitFor(() => expect(mockUpdateCampaignMapGrid).toHaveBeenCalled())
    expect(onGridSaved).not.toHaveBeenCalled()
  })
})

describe('CampaignMapViewer — InvalidateOnChange (expand)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without error when expanded=true', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} expanded />, 'en')
    await waitFor(() => expect(screen.getByTestId('map-container')).toBeDefined())
    expect(screen.getByTestId('campaign-map-viewer')).toBeDefined()
  })

  it('renders without error when expanded=false (default)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} expanded={false} />, 'en')
    await waitFor(() => expect(screen.getByTestId('map-container')).toBeDefined())
    expect(screen.getByTestId('campaign-map-viewer')).toBeDefined()
  })

})
