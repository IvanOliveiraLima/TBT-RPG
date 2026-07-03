/**
 * CampaignMapViewer — token wiring tests.
 *
 * Verifies:
 * - listMapTokens called on mount
 * - Tokens rendered at correct [y, x] positions (CRS.Simple: lat=y, lng=x)
 * - Owner sees add-token button; member does not
 * - Owner markers are draggable; member markers are not
 * - dragend calls updateMapToken with snapped coords (no grid → pass-through)
 * - Owner popup has label/color/size inputs + save + remove controls
 * - Member popup shows read-only label
 * - Poll 5 s for member, not for owner
 * - snapToGrid unit tests (pure function)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap, GridConfig } from '@/services/campaign-maps'
import { snapToGrid } from '@/utils/snap-to-grid'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── Capture drag handlers ─────────────────────────────────────────────────────

// Key: "lat,lng" string from the marker position, value: the dragend handler
const capturedDragHandlers = new Map<string, (e: unknown) => void>()

// ── Mock react-leaflet ────────────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: () => null,
  SVGOverlay: () => null,
  Marker: ({
    position,
    children,
    draggable,
    eventHandlers,
  }: {
    position: [number, number]
    children?: React.ReactNode
    draggable?: boolean
    eventHandlers?: { dragend?: (e: unknown) => void }
  }) => {
    // Capture dragend handler keyed by position for test assertions
    if (draggable && eventHandlers?.dragend) {
      capturedDragHandlers.set(`${position[0]},${position[1]}`, eventHandlers.dragend)
    }
    return (
      <div
        data-testid="marker"
        data-lat={position[0]}
        data-lng={position[1]}
        data-draggable={draggable ? 'true' : 'false'}
      >
        {children}
      </div>
    )
  },
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
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

// ── Mock campaign-maps service ────────────────────────────────────────────────

const mockGetSignedUrl = vi.fn()

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: (path: string) => mockGetSignedUrl(path),
  updateCampaignMapGrid: vi.fn().mockResolvedValue(undefined),
}))

// ── Mock campaign-map-markers service ─────────────────────────────────────────

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({}),
  updateMapMarkerLabel: () => Promise.resolve(),
  deleteMapMarker:      () => Promise.resolve(),
}))

// ── Mock campaign-map-tokens service ──────────────────────────────────────────

const mockListMapTokens  = vi.fn()
const mockCreateMapToken = vi.fn()
const mockUpdateMapToken = vi.fn()
const mockDeleteMapToken = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:  (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken: (...args: unknown[]) => mockCreateMapToken(...args),
  updateMapToken: (...args: unknown[]) => mockUpdateMapToken(...args),
  deleteMapToken: (...args: unknown[]) => mockDeleteMapToken(...args),
}))

// ── Mock campaign-map-fog service ─────────────────────────────────────────────

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const TOKEN_1: CampaignMapToken = {
  id: 'tok-1', mapId: 'map-1', x: 400, y: 300,
  label: 'Goblin', color: '#C0392B', size: 1, createdAt: 0,
}

const TOKEN_2: CampaignMapToken = {
  id: 'tok-2', mapId: 'map-1', x: 800, y: 600,
  label: '', color: '#2980B9', size: 2, createdAt: 1,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — tokens (member view)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapTokens.mockResolvedValue([TOKEN_1, TOKEN_2])
  })

  it('calls listMapTokens with map.id on mount', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(mockListMapTokens).toHaveBeenCalledWith(MAP.id))
  })

  it('renders token markers at [y, x] positions', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBe(2))
    const els = screen.getAllByTestId('marker')
    expect(els[0].getAttribute('data-lat')).toBe(String(TOKEN_1.y))
    expect(els[0].getAttribute('data-lng')).toBe(String(TOKEN_1.x))
  })

  it('member token markers are NOT draggable', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBe(2))
    screen.getAllByTestId('marker').forEach(el => {
      expect(el.getAttribute('data-draggable')).toBe('false')
    })
  })

  it('does NOT show add token button for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('token-add-btn')).toBeNull()
  })

  it('shows token label in member popup', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId(`token-label-${TOKEN_1.id}`))
    expect(screen.getByTestId(`token-label-${TOKEN_1.id}`).textContent).toBe(TOKEN_1.label)
  })

  it('shows (no label) for member token with empty label', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId(`token-label-${TOKEN_2.id}`))
    expect(screen.getByTestId(`token-label-${TOKEN_2.id}`).textContent).toContain('(no label)')
  })

  it('does NOT show save/remove controls for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId(`token-label-${TOKEN_1.id}`))
    expect(screen.queryByTestId(`token-save-${TOKEN_1.id}`)).toBeNull()
    expect(screen.queryByTestId(`token-remove-${TOKEN_1.id}`)).toBeNull()
  })
})

describe('CampaignMapViewer — tokens (owner view)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapTokens.mockResolvedValue([TOKEN_1])
    mockUpdateMapToken.mockResolvedValue(undefined)
    mockDeleteMapToken.mockResolvedValue(undefined)
  })

  it('shows add token button for owner (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('token-add-btn')).toBeDefined())
    expect(screen.getByTestId('token-add-btn').textContent).toContain('Add token')
  })

  it('shows add token button label in PT', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => expect(screen.getByTestId('token-add-btn').textContent).toContain('Adicionar token'))
  })

  it('clicking add token calls createMapToken at image center and adds to list', async () => {
    const newToken: CampaignMapToken = { ...TOKEN_1, id: 'tok-new' }
    mockCreateMapToken.mockResolvedValue(newToken)
    mockListMapTokens.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('token-add-btn'))
    fireEvent.click(screen.getByTestId('token-add-btn'))
    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledWith(
      MAP.id,
      MAP.width / 2,
      MAP.height / 2,
    ))
    await waitFor(() => expect(screen.getByTestId(`token-popup-${newToken.id}`)).toBeDefined())
  })

  it('owner token markers are draggable', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBeGreaterThan(0))
    const markers = screen.getAllByTestId('marker')
    expect(markers.some(el => el.getAttribute('data-draggable') === 'true')).toBe(true)
  })

  it('shows owner popup with label input, color, size, save and remove', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-popup-${TOKEN_1.id}`))
    expect(screen.getByTestId(`token-label-input-${TOKEN_1.id}`)).toBeDefined()
    expect(screen.getByTestId(`token-color-input-${TOKEN_1.id}`)).toBeDefined()
    expect(screen.getByTestId(`token-size-select-${TOKEN_1.id}`)).toBeDefined()
    expect(screen.getByTestId(`token-save-${TOKEN_1.id}`)).toBeDefined()
    expect(screen.getByTestId(`token-remove-${TOKEN_1.id}`)).toBeDefined()
  })

  it('save button calls updateMapToken with current patch', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-label-input-${TOKEN_1.id}`))
    fireEvent.change(screen.getByTestId(`token-label-input-${TOKEN_1.id}`), { target: { value: 'Dragon' } })
    fireEvent.click(screen.getByTestId(`token-save-${TOKEN_1.id}`))
    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith(
      TOKEN_1.id,
      expect.objectContaining({ label: 'Dragon' }),
    ))
  })

  it('remove button calls deleteMapToken and removes token from DOM', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-remove-${TOKEN_1.id}`))
    fireEvent.click(screen.getByTestId(`token-remove-${TOKEN_1.id}`))
    await waitFor(() => expect(mockDeleteMapToken).toHaveBeenCalledWith(TOKEN_1.id))
    await waitFor(() => expect(screen.queryByTestId(`token-popup-${TOKEN_1.id}`)).toBeNull())
  })

  it('dragend calls updateMapToken with latlng converted to x/y (no grid → pass-through)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBeGreaterThan(0))
    // Handler key: lat=TOKEN_1.y, lng=TOKEN_1.x
    const handler = capturedDragHandlers.get(`${TOKEN_1.y},${TOKEN_1.x}`)
    expect(handler).toBeDefined()
    act(() => {
      handler?.({ target: { getLatLng: () => ({ lat: 350, lng: 450 }) } })
    })
    // Grid disabled → snapToGrid passes through: x=450, y=350
    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith(
      TOKEN_1.id,
      { x: 450, y: 350 },
    ))
  })
})

// ── Token polling ─────────────────────────────────────────────────────────────

describe('CampaignMapViewer — token polling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    vi.useFakeTimers()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapTokens.mockResolvedValue([TOKEN_1])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls listMapTokens every 5 s for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await act(async () => { await Promise.resolve() }) // flush initial fetch
    const callsAfterMount = mockListMapTokens.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(mockListMapTokens.mock.calls.length).toBe(callsAfterMount + 1)
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(mockListMapTokens.mock.calls.length).toBe(callsAfterMount + 2)
  })

  it('does NOT poll tokens for owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await act(async () => { await Promise.resolve() })
    const callsAfterMount = mockListMapTokens.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(mockListMapTokens.mock.calls.length).toBe(callsAfterMount)
  })
})

// ── snapToGrid unit tests ─────────────────────────────────────────────────────

describe('snapToGrid', () => {
  const GRID: GridConfig = { enabled: true, size: 50, offsetX: 0, offsetY: 0, color: '#000' }

  it('returns original coords when grid is disabled', () => {
    expect(snapToGrid(123, 456, 1, { ...GRID, enabled: false })).toEqual({ x: 123, y: 456 })
  })

  it('returns original coords when gridSize is null', () => {
    expect(snapToGrid(123, 456, 1, { ...GRID, size: null })).toEqual({ x: 123, y: 456 })
  })

  it('snaps size-1 token to nearest cell center (no offset)', () => {
    // Cell centers: 25, 75, 125... (size=50, offset=0)
    expect(snapToGrid(30, 30, 1, GRID)).toEqual({ x: 25, y: 25 })
    expect(snapToGrid(70, 70, 1, GRID)).toEqual({ x: 75, y: 75 })
  })

  it('snaps with non-zero offsetX and offsetY', () => {
    const g = { ...GRID, offsetX: 10, offsetY: 20 }
    // Centers with offsetX=10, size=50: 35, 85, 135...
    // cx=30: col=round((30-10)/50-0.5)=round(-0.1)=0 → x=10+0.5*50=35
    expect(snapToGrid(30, 40, 1, g)).toEqual({ x: 35, y: 45 })
  })

  it('snaps size-2 token to 2-cell span center', () => {
    // Span-2 centers: 50, 100, 150... (size=50, offset=0)
    expect(snapToGrid(60, 60, 2, GRID)).toEqual({ x: 50, y: 50 })
    expect(snapToGrid(110, 110, 2, GRID)).toEqual({ x: 100, y: 100 })
  })

  it('snaps size-3 token to 3-cell span center', () => {
    // Span-3 centers: 75, 125... (size=50, offset=0)
    expect(snapToGrid(80, 80, 3, GRID)).toEqual({ x: 75, y: 75 })
  })
})
