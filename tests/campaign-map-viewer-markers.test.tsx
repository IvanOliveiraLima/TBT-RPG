/**
 * CampaignMapViewer — marker wiring tests.
 *
 * Verifies:
 * - listMapMarkers called on mount
 * - Markers rendered at correct [y, x] positions (CRS.Simple: lat=y, lng=x)
 * - Member sees labels but NOT add/rename/remove controls
 * - Owner sees add hint, rename and remove controls
 * - Click-to-add flow (pending marker UI, confirm, cancel)
 * - Rename flow (input, save calls service, cancel)
 * - Remove calls service and removes from DOM
 *
 * react-leaflet and leaflet are mocked (jsdom can't run Leaflet canvas).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Capture useMapEvents dblclick handler ─────────────────────────────────────

let capturedDblClickHandler: ((e: { latlng: { lat: number; lng: number } }) => void) | null = null

// ── Mock react-leaflet ────────────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: () => null,
  SVGOverlay: () => null,
  Marker: ({ position, children }: { position: [number, number]; children?: React.ReactNode }) => (
    <div data-testid="marker" data-lat={position[0]} data-lng={position[1]}>{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
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
  useMapEvents: (handlers: { dblclick?: (e: { latlng: { lat: number; lng: number } }) => void }) => {
    if (handlers.dblclick !== undefined) capturedDblClickHandler = handlers.dblclick
    return null
  },
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

// ── Mock campaign-maps service ────────────────────────────────────────────────

const mockGetSignedUrl = vi.fn()

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: (path: string) => mockGetSignedUrl(path),
  updateCampaignMapGrid: vi.fn().mockResolvedValue(undefined),
}))

// ── Mock campaign-map-markers service ─────────────────────────────────────────

const mockListMapMarkers = vi.fn()
const mockCreateMapMarker = vi.fn()
const mockUpdateMapMarkerLabel = vi.fn()
const mockDeleteMapMarker = vi.fn()

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       (...args: unknown[]) => mockListMapMarkers(...args),
  createMapMarker:      (...args: unknown[]) => mockCreateMapMarker(...args),
  updateMapMarkerLabel: (...args: unknown[]) => mockUpdateMapMarkerLabel(...args),
  deleteMapMarker:      (...args: unknown[]) => mockDeleteMapMarker(...args),
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

// ── Mock campaign-map-areas service ──────────────────────────────────────────

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   () => Promise.resolve([]),
  createMapArea:  () => Promise.resolve({ id: 'area-new', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea:  () => Promise.resolve(),
  clearMapAreas:  () => Promise.resolve(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const MARKER_1 = { id: 'mk-1', mapId: 'map-1', x: 400, y: 300, label: 'Boss Chamber', createdAt: 0 }
const MARKER_2 = { id: 'mk-2', mapId: 'map-1', x: 100, y: 200, label: '',             createdAt: 1 }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — markers (member view)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDblClickHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapMarkers.mockResolvedValue([MARKER_1, MARKER_2])
  })

  it('calls listMapMarkers with map.id', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(mockListMapMarkers).toHaveBeenCalledWith(MAP.id))
  })

  it('renders a marker element for each entry', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBe(2))
  })

  it('positions markers as [y, x] for CRS.Simple', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBe(2))
    const els = screen.getAllByTestId('marker')
    expect(els[0].getAttribute('data-lat')).toBe(String(MARKER_1.y))
    expect(els[0].getAttribute('data-lng')).toBe(String(MARKER_1.x))
  })

  it('shows marker label in popup', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => screen.getByTestId(`marker-label-${MARKER_1.id}`))
    expect(screen.getByTestId(`marker-label-${MARKER_1.id}`).textContent).toBe(MARKER_1.label)
  })

  it('shows (no label) for marker with empty label', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => screen.getByTestId(`marker-label-${MARKER_2.id}`))
    expect(screen.getByTestId(`marker-label-${MARKER_2.id}`).textContent).toContain('(no label)')
  })

  it('(no label) text shows in PT', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'pt')
    await waitFor(() => screen.getByTestId(`marker-label-${MARKER_2.id}`))
    expect(screen.getByTestId(`marker-label-${MARKER_2.id}`).textContent).toContain('(sem rótulo)')
  })

  it('does NOT show rename/remove buttons for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId(`marker-label-${MARKER_1.id}`))
    expect(screen.queryByTestId(`marker-rename-${MARKER_1.id}`)).toBeNull()
    expect(screen.queryByTestId(`marker-remove-${MARKER_1.id}`)).toBeNull()
  })

  it('does NOT show add hint for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('marker-add-hint')).toBeNull()
  })

  it('does NOT install dblclick handler for member (no MapClickHandler)', async () => {
    capturedDblClickHandler = null
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(capturedDblClickHandler).toBeNull()
  })
})

describe('CampaignMapViewer — markers (owner view)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDblClickHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapMarkers.mockResolvedValue([MARKER_1])
  })

  it('shows add hint for owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('marker-add-hint'))
  })

  it('add hint text in PT', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('marker-add-hint'))
    expect(screen.getByTestId('marker-add-hint').textContent).toContain('Clique duas vezes no mapa')
  })

  it('shows rename and remove buttons for owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    expect(screen.getByTestId(`marker-remove-${MARKER_1.id}`)).toBeDefined()
  })

  it('clicking rename opens label input', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    fireEvent.click(screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    expect(screen.getByTestId(`marker-label-input-${MARKER_1.id}`)).toBeDefined()
  })

  it('label input pre-fills with current label', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    fireEvent.click(screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    expect((screen.getByTestId(`marker-label-input-${MARKER_1.id}`) as HTMLInputElement).value).toBe(MARKER_1.label)
  })

  it('save rename calls updateMapMarkerLabel and updates label', async () => {
    mockUpdateMapMarkerLabel.mockResolvedValue(undefined)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    fireEvent.click(screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    fireEvent.change(screen.getByTestId(`marker-label-input-${MARKER_1.id}`), { target: { value: 'New Name' } })
    fireEvent.click(screen.getByTestId(`marker-save-btn-${MARKER_1.id}`))
    await waitFor(() => expect(mockUpdateMapMarkerLabel).toHaveBeenCalledWith(MARKER_1.id, 'New Name'))
    await waitFor(() => expect(screen.getByTestId(`marker-label-${MARKER_1.id}`).textContent).toBe('New Name'))
  })

  it('cancel rename hides the input and restores view', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    fireEvent.click(screen.getByTestId(`marker-rename-${MARKER_1.id}`))
    fireEvent.click(screen.getByTestId(`marker-cancel-rename-${MARKER_1.id}`))
    expect(screen.queryByTestId(`marker-label-input-${MARKER_1.id}`)).toBeNull()
    expect(screen.getByTestId(`marker-label-${MARKER_1.id}`)).toBeDefined()
  })

  it('remove calls deleteMapMarker and removes marker from DOM', async () => {
    mockDeleteMapMarker.mockResolvedValue(undefined)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`marker-remove-${MARKER_1.id}`))
    fireEvent.click(screen.getByTestId(`marker-remove-${MARKER_1.id}`))
    await waitFor(() => expect(mockDeleteMapMarker).toHaveBeenCalledWith(MARKER_1.id))
    await waitFor(() => expect(screen.queryByTestId(`marker-label-${MARKER_1.id}`)).toBeNull())
  })

  it('map click shows pending marker UI for owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    act(() => { capturedDblClickHandler?.({ latlng: { lat: 300, lng: 400 } }) })
    await waitFor(() => screen.getByTestId('pending-marker'))
    expect(screen.getByTestId('pending-label-input')).toBeDefined()
    expect(screen.getByTestId('pending-add-btn')).toBeDefined()
    expect(screen.getByTestId('pending-cancel-btn')).toBeDefined()
  })

  it('cancel pending marker removes the pending UI', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    act(() => { capturedDblClickHandler?.({ latlng: { lat: 300, lng: 400 } }) })
    await waitFor(() => screen.getByTestId('pending-cancel-btn'))
    fireEvent.click(screen.getByTestId('pending-cancel-btn'))
    expect(screen.queryByTestId('pending-marker')).toBeNull()
  })

  it('add marker calls createMapMarker with x=lng y=lat and adds to list', async () => {
    const newMarker = { id: 'mk-new', mapId: 'map-1', x: 400, y: 300, label: 'New Spot', createdAt: 2 }
    mockCreateMapMarker.mockResolvedValue(newMarker)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    act(() => { capturedDblClickHandler?.({ latlng: { lat: 300, lng: 400 } }) })
    await waitFor(() => screen.getByTestId('pending-label-input'))
    fireEvent.change(screen.getByTestId('pending-label-input'), { target: { value: 'New Spot' } })
    fireEvent.click(screen.getByTestId('pending-add-btn'))
    await waitFor(() => expect(mockCreateMapMarker).toHaveBeenCalledWith(MAP.id, 400, 300, 'New Spot'))
    await waitFor(() => expect(screen.queryByTestId('pending-marker')).toBeNull())
    await waitFor(() => expect(screen.getByTestId('marker-label-mk-new')).toBeDefined())
  })

  it('pending marker position uses [lat, lng] = [y, x]', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    act(() => { capturedDblClickHandler?.({ latlng: { lat: 300, lng: 400 } }) })
    await waitFor(() => screen.getByTestId('pending-marker'))
    // Find the pending marker element (last marker rendered)
    const markerEls = screen.getAllByTestId('marker')
    const pendingEl = markerEls[markerEls.length - 1]
    expect(pendingEl.getAttribute('data-lat')).toBe('300')
    expect(pendingEl.getAttribute('data-lng')).toBe('400')
  })
})

// ── Polling ───────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — marker polling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDblClickHandler = null
    vi.useFakeTimers()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapMarkers.mockResolvedValue([MARKER_1])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls listMapMarkers every 15s for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await act(async () => { await Promise.resolve() }) // flush initial fetch
    const callsAfterMount = mockListMapMarkers.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(mockListMapMarkers.mock.calls.length).toBe(callsAfterMount + 1)
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(mockListMapMarkers.mock.calls.length).toBe(callsAfterMount + 2)
  })

  it('does NOT poll markers for owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await act(async () => { await Promise.resolve() })
    const callsAfterMount = mockListMapMarkers.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(mockListMapMarkers.mock.calls.length).toBe(callsAfterMount)
  })
})
