/**
 * CampaignMapViewer — fog of war tests.
 *
 * Covers:
 * - Fog overlay renders when fog.enabled (owner dimmed, member opaque)
 * - Fog overlay hidden when not enabled
 * - Fog panel toggle in owner toolbar (disabled when no grid)
 * - Fog edit mode: reveal/hide all, toggle enable, Concluir
 * - Map click routes to fog paint (not marker) in fogMode
 * - Member 5s polling for fog; owner does not poll
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Capture useMapEvents handlers ─────────────────────────────────────────────

type FakeLatLng = { lat: number; lng: number }
let capturedClickHandler:     ((e: { latlng: FakeLatLng }) => void) | null = null
let capturedMousedownHandler: ((e: { latlng: FakeLatLng }) => void) | null = null
let capturedMouseupHandler:   (() => void) | null = null

// ── Mock react-leaflet ────────────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: () => null,
  SVGOverlay: (props: { children?: React.ReactNode; bounds: unknown; attributes?: Record<string, string> }) => (
    <svg data-testid={props.attributes?.['data-testid'] ?? 'svg-overlay'}>
      {props.children}
    </svg>
  ),
  Marker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({
    dragging: { enable: () => undefined, disable: () => undefined },
    getContainer: () => ({ style: { cursor: '' } }),
  }),
  useMapEvents: (handlers: {
    click?:     (e: { latlng: FakeLatLng }) => void
    mousedown?: (e: { latlng: FakeLatLng }) => void
    mousemove?: (e: { latlng: FakeLatLng }) => void
    mouseup?:   () => void
  }) => {
    if (handlers.click     !== undefined) capturedClickHandler     = handlers.click
    if (handlers.mousedown !== undefined) capturedMousedownHandler = handlers.mousedown
    if (handlers.mouseup   !== undefined) capturedMouseupHandler   = handlers.mouseup
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

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({ id: 'mk-new', mapId: 'map-1', x: 0, y: 0, label: '', createdAt: 0 }),
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

const mockGetMapFog  = vi.fn()
const mockSaveMapFog = vi.fn()

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  (...args: unknown[]) => mockGetMapFog(...args),
  saveMapFog: (...args: unknown[]) => mockSaveMapFog(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const MAP_WITH_GRID: CampaignMap = {
  ...MAP,
  gridEnabled: true, gridSize: 40, gridOffsetX: 0, gridOffsetY: 0,
}

const FOG_OFF = { mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }
const FOG_ON  = { mapId: 'map-1', enabled: true,  revealed: ['0,0', '1,0'], updatedAt: 1 }

// ── Tests: fog overlay ────────────────────────────────────────────────────────

describe('CampaignMapViewer — fog overlay (member view)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    capturedMousedownHandler = null
    capturedMouseupHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockSaveMapFog.mockResolvedValue(undefined)
  })

  it('does NOT render fog overlay when fog is disabled', async () => {
    mockGetMapFog.mockResolvedValue(FOG_OFF)
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} />, 'en')
    await waitFor(() => screen.getByTestId('map-container'))
    expect(screen.queryByTestId('fog-overlay')).toBeNull()
  })

  it('renders fog overlay when fog.enabled', async () => {
    mockGetMapFog.mockResolvedValue(FOG_ON)
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} />, 'en')
    await waitFor(() => expect(screen.queryByTestId('fog-overlay')).not.toBeNull())
  })

  it('fog overlay has a dark rect (member → opaque fill-opacity)', async () => {
    mockGetMapFog.mockResolvedValue(FOG_ON)
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} />, 'en')
    await waitFor(() => expect(screen.queryByTestId('fog-overlay')).not.toBeNull())
    const overlay = screen.getByTestId('fog-overlay')
    const rect = overlay.querySelector('rect[mask]')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('fill-opacity')).toBe('1')
  })

  it('revealed cells render as black rects inside the fog mask', async () => {
    mockGetMapFog.mockResolvedValue(FOG_ON)
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} />, 'en')
    await waitFor(() => expect(screen.queryByTestId('fog-overlay')).not.toBeNull())
    const overlay = screen.getByTestId('fog-overlay')
    const maskRects = overlay.querySelectorAll('mask rect')
    // FOG_ON.revealed has 2 cells: '0,0' and '1,0'; mask also has the white bg rect
    expect(maskRects.length).toBe(3) // 1 white bg + 2 black revealed
  })
})

describe('CampaignMapViewer — fog overlay (owner view)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    capturedMousedownHandler = null
    capturedMouseupHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockSaveMapFog.mockResolvedValue(undefined)
    mockGetMapFog.mockResolvedValue(FOG_ON)
  })

  it('fog overlay for owner has dimmed fill-opacity (0.5)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => expect(screen.queryByTestId('fog-overlay')).not.toBeNull())
    const overlay = screen.getByTestId('fog-overlay')
    const rect = overlay.querySelector('rect[mask]')
    expect(rect?.getAttribute('fill-opacity')).toBe('0.5')
  })
})

// ── Tests: fog panel toggle ───────────────────────────────────────────────────

describe('CampaignMapViewer — fog panel toggle (owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    capturedMousedownHandler = null
    capturedMouseupHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockGetMapFog.mockResolvedValue(FOG_OFF)
    mockSaveMapFog.mockResolvedValue(undefined)
  })

  it('shows fog toggle button for owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => expect(screen.queryByTestId('fog-panel-toggle')).not.toBeNull())
  })

  it('fog toggle button label contains fog title (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('fog-panel-toggle').textContent).toContain('Fog'))
  })

  it('fog toggle button label contains fog title (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'pt')
    await waitFor(() => expect(screen.getByTestId('fog-panel-toggle').textContent).toContain('Névoa'))
  })

  it('fog toggle button is disabled when grid is not enabled', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.queryByTestId('fog-panel-toggle')).not.toBeNull())
    const btn = screen.getByTestId('fog-panel-toggle') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('fog toggle button is enabled when grid is enabled', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => expect(screen.queryByTestId('fog-panel-toggle')).not.toBeNull())
    const btn = screen.getByTestId('fog-panel-toggle') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('does NOT show fog toggle for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('fog-panel-toggle')).toBeNull()
  })

  it('clicking fog toggle opens the fog panel', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => expect(screen.queryByTestId('fog-config-panel')).not.toBeNull())
  })

  it('fog panel contains enable fog toggle', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-enable-toggle'))
  })

  it('fog panel contains reveal/hide brush buttons', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-brush-reveal'))
    expect(screen.getByTestId('fog-brush-hide')).toBeDefined()
  })

  it('fog panel contains reveal-all and hide-all buttons', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-reveal-all'))
    expect(screen.getByTestId('fog-hide-all')).toBeDefined()
  })

  it('"Concluir" button closes fog panel and restores toggle button', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-done-btn'))
    fireEvent.click(screen.getByTestId('fog-done-btn'))
    await waitFor(() => expect(screen.queryByTestId('fog-config-panel')).toBeNull())
    expect(screen.getByTestId('fog-panel-toggle')).toBeDefined()
  })
})

// ── Tests: fog panel actions ──────────────────────────────────────────────────

describe('CampaignMapViewer — fog panel actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    capturedMousedownHandler = null
    capturedMouseupHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockGetMapFog.mockResolvedValue(FOG_OFF)
    mockSaveMapFog.mockResolvedValue(undefined)
  })

  it('toggling fog-enable-toggle calls saveMapFog', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-enable-toggle'))
    fireEvent.click(screen.getByTestId('fog-enable-toggle'))
    await waitFor(() => expect(mockSaveMapFog).toHaveBeenCalledWith(
      MAP_WITH_GRID.id,
      expect.objectContaining({ enabled: true }),
    ))
  })

  it('"Revelar tudo" calls saveMapFog with allCells', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-reveal-all'))
    fireEvent.click(screen.getByTestId('fog-reveal-all'))
    await waitFor(() => expect(mockSaveMapFog).toHaveBeenCalledWith(
      MAP_WITH_GRID.id,
      expect.objectContaining({ revealed: expect.arrayContaining(['0,0']) }),
    ))
  })

  it('"Ocultar tudo" calls saveMapFog with empty revealed', async () => {
    mockGetMapFog.mockResolvedValue(FOG_ON)
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-hide-all'))
    fireEvent.click(screen.getByTestId('fog-hide-all'))
    await waitFor(() => expect(mockSaveMapFog).toHaveBeenCalledWith(
      MAP_WITH_GRID.id,
      expect.objectContaining({ revealed: [] }),
    ))
  })
})

// ── Tests: fog mode routing (mousedown paint → mouseup commit) ────────────────

describe('CampaignMapViewer — fog mode routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    capturedMousedownHandler = null
    capturedMouseupHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockGetMapFog.mockResolvedValue(FOG_OFF)
    mockSaveMapFog.mockResolvedValue(undefined)
  })

  it('in fogMode, mousedown+mouseup calls saveMapFog once', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    // Enter fog mode
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-config-panel'))
    // FogInteraction should have registered mousedown/mouseup handlers
    expect(capturedMousedownHandler).not.toBeNull()
    expect(capturedMouseupHandler).not.toBeNull()
    // Simulate drag: mousedown (paint) → mouseup (commit)
    act(() => { capturedMousedownHandler!({ latlng: { lat: 100, lng: 200 } }) })
    act(() => { capturedMouseupHandler!() })
    await waitFor(() => expect(mockSaveMapFog).toHaveBeenCalledTimes(1))
  })

  it('in fogMode, map click does NOT add a marker', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    // Enter fog mode
    fireEvent.click(screen.getByTestId('fog-panel-toggle'))
    await waitFor(() => screen.getByTestId('fog-config-panel'))
    // Fire click — should be ignored (returns early in fogMode)
    expect(capturedClickHandler).not.toBeNull()
    act(() => { capturedClickHandler!({ latlng: { lat: 100, lng: 200 } }) })
    await new Promise(r => setTimeout(r, 50))
    // No pending marker should appear
    expect(screen.queryByTestId('pending-marker')).toBeNull()
  })

  it('outside fogMode, mousedown does NOT call saveMapFog', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    // NOT entering fog mode
    expect(capturedMousedownHandler).not.toBeNull()
    act(() => { capturedMousedownHandler!({ latlng: { lat: 100, lng: 200 } }) })
    act(() => { capturedMouseupHandler!() })
    await new Promise(r => setTimeout(r, 50))
    expect(mockSaveMapFog).not.toHaveBeenCalled()
  })

  it('outside fogMode, map click adds a pending marker (not fog)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('fog-panel-toggle'))
    // Click without fog mode → should add pending marker
    expect(capturedClickHandler).not.toBeNull()
    act(() => { capturedClickHandler!({ latlng: { lat: 100, lng: 200 } }) })
    await waitFor(() => expect(screen.queryByTestId('pending-marker')).not.toBeNull())
    expect(mockSaveMapFog).not.toHaveBeenCalled()
  })
})

// ── Tests: fog polling ────────────────────────────────────────────────────────

describe('CampaignMapViewer — fog polling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    capturedMousedownHandler = null
    capturedMouseupHandler = null
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockGetMapFog.mockResolvedValue(FOG_OFF)
    mockSaveMapFog.mockResolvedValue(undefined)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('member polls getMapFog every 5 s', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner={false} />, 'en')
    // Initial fetch
    await act(async () => { await Promise.resolve() })
    const initialCalls = mockGetMapFog.mock.calls.length
    // Advance 5 s → triggers interval
    await act(async () => { vi.advanceTimersByTime(5_000) })
    expect(mockGetMapFog.mock.calls.length).toBeGreaterThan(initialCalls)
  })

  it('owner does NOT poll getMapFog', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_WITH_GRID} isOwner />, 'en')
    await act(async () => { await Promise.resolve() })
    const callsAfterMount = mockGetMapFog.mock.calls.length
    await act(async () => { vi.advanceTimersByTime(10_000) })
    expect(mockGetMapFog.mock.calls.length).toBe(callsAfterMount)
  })
})
