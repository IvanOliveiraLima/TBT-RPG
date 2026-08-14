/**
 * VTT — snap token Y in image space (fix + realignTokens)
 *
 * Covers:
 * - dragend snaps in image space: when height - 2*offsetY is not divisible by
 *   gridSize the two coordinate systems diverge; the fix produces a token that
 *   sits on a cell centre in image space, the bug would not.
 * - Token 2×2 dragend: centre falls on the intersection in image space.
 * - realignTokens button calls updateMapToken for each token with image-space
 *   snapped coords.
 * - realign button hidden when grid is disabled or no tokens present.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── Capture drag handlers ─────────────────────────────────────────────────────

const capturedDragHandlers = new Map<string, (e: unknown) => void>()
const capturedZoomHandlers: Array<() => void> = []

const mockLeafletMap = {
  dragging: { enable: vi.fn(), disable: vi.fn() },
  getContainer: () => ({
    style: { cursor: '' as string, touchAction: '' as string },
    setPointerCapture: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  mouseEventToLatLng: () => ({ lat: 50, lng: 50 }),
  invalidateSize: vi.fn(),
  latLngToLayerPoint: vi.fn(([_lat, lng]: [number, number]) => ({ x: lng, y: 0 })),
  on: vi.fn((event: string, handler: () => void) => {
    if (event === 'zoomend') capturedZoomHandlers.push(handler)
  }),
  off: vi.fn(),
}

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
    if (draggable && eventHandlers?.dragend) {
      capturedDragHandlers.set(`${position[0]},${position[1]}`, eventHandlers.dragend)
    }
    return (
      <div
        data-testid="marker"
        data-lat={position[0]}
        data-lng={position[1]}
      >
        {children}
      </div>
    )
  },
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => mockLeafletMap,
  useMapEvents: () => null,
}))

vi.mock('leaflet', () => ({
  default: {
    CRS: { Simple: 'Simple' },
    latLngBounds: (corners: unknown) => ({ corners, isBounds: true }),
    divIcon: (opts: unknown) => ({ ...(opts as object), _isIcon: true }),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: () => Promise.resolve('https://signed.example.com/map.png'),
  updateCampaignMapGrid: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({}),
  updateMapMarkerLabel: () => Promise.resolve(),
  deleteMapMarker:      () => Promise.resolve(),
}))

const mockListMapTokens  = vi.fn()
const mockCreateMapToken = vi.fn()
const mockUpdateMapToken = vi.fn()
const mockDeleteMapToken = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:                 (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:                (...args: unknown[]) => mockCreateMapToken(...args),
  updateMapToken:                (...args: unknown[]) => mockUpdateMapToken(...args),
  deleteMapToken:                (...args: unknown[]) => mockDeleteMapToken(...args),
  uploadTokenImage:              () => Promise.resolve('camp-1/tokens/tok-1.png'),
  uploadTokenImageBlob:          () => Promise.resolve('camp-1/tokens/tok-1.png'),
  getTokenImageSignedUrl:        () => Promise.resolve('https://signed.example.com/token.png'),
  removeTokenImage:              () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: () => Promise.resolve('camp-1/tokens/tok-1.png'),
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

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:             () => Promise.resolve([]),
  getTokenPresetImageSignedUrl: () => Promise.resolve('https://signed.example.com/preset.png'),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: () => Promise.resolve([]),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails:  () => Promise.resolve([]),
  fetchCampaignCharacterImages:  () => Promise.resolve({}),
}))

vi.mock('@/services/campaign-initiative', () => ({
  getInitiative:  () => Promise.resolve({ combatants: [], currentIndex: 0, round: 1 }),
  saveInitiative: () => Promise.resolve(),
}))

vi.mock('@/services/campaign', () => ({
  getAutoInitiative:    () => Promise.resolve(false),
  updateAutoInitiative: () => Promise.resolve(),
}))

vi.mock('@/store/useDiceStore', () => ({
  useDiceStore: (sel: (s: unknown) => unknown) => sel({
    isOpen: false, toggle: vi.fn(), close: vi.fn(), open: vi.fn(),
    history: [], lastResult: null, critContext: null,
    rollMode: 'normal', setRollMode: vi.fn(), addRoll: vi.fn(), clear: vi.fn(),
    clearCritContext: vi.fn(), setCampaignContext: vi.fn(), clearCampaignContext: vi.fn(),
  }),
}))

vi.mock('@/hooks/useIsMobile', () => ({ useIsMobile: () => false }))

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * height=100, size=10, offsetY=3 → (height - 2*offsetY) = 94, not divisible by 10.
 * This ensures the Leaflet lat space and the image space do NOT coincide for most
 * y values, making the bug detectable.
 */
const MAP_BASE: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 200, height: 100, createdAt: 0,
  gridEnabled: true, gridSize: 10, gridOffsetX: 0, gridOffsetY: 3, gridColor: '#000',
  published: false,
}

/** No-grid variant to test that the realign button is hidden */
const MAP_NO_GRID: CampaignMap = { ...MAP_BASE, gridEnabled: false }

const TOKEN_A: CampaignMapToken = {
  id: 'tok-a', mapId: 'map-1', x: 50, y: 30,
  label: 'A', color: '#C00', size: 1, imagePath: null, conditions: [], createdAt: 0,
}

const TOKEN_B: CampaignMapToken = {
  id: 'tok-b', mapId: 'map-1', x: 120, y: 55,
  label: 'B', color: '#00C', size: 2, imagePath: null, conditions: [], createdAt: 1,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VTT — snapTokenPos: dragend snaps in image space', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    capturedZoomHandlers.length = 0
    mockListMapTokens.mockResolvedValue([TOKEN_A])
    mockUpdateMapToken.mockResolvedValue(undefined)
    mockCreateMapToken.mockResolvedValue(TOKEN_A)
    mockDeleteMapToken.mockResolvedValue(undefined)
  })

  it('1×1 token: dragend stores y that is a cell centre in image space', async () => {
    /**
     * Scenario: height=100, size=10, offsetY=3, lat=30, lng=55
     *
     * image_y = 100 - 30 = 70
     * row = floor((70 - 3) / 10) = floor(6.7) = 6
     * snapped_img_y = 3 + (6 + 0.5) * 10 = 3 + 65 = 68
     * stored_y = 100 - 68 = 32
     *
     * Cell centres in image space: 8, 18, 28, 38, 48, 58, 68, 78 → 68 ✓
     * stored_y = 32 means Leaflet lat = 32 → image_y = 100 - 32 = 68 ✓
     *
     * With the bug (snapToGrid on lat directly):
     * row = floor((30 - 3) / 10) = floor(2.7) = 2
     * stored_y_bug = 3 + 2.5 * 10 = 28  (image_y = 72, NOT a cell centre)
     */
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBeGreaterThan(0))

    const handler = capturedDragHandlers.get(`${TOKEN_A.y},${TOKEN_A.x}`)
    expect(handler).toBeDefined()

    act(() => {
      handler?.({ target: { getLatLng: () => ({ lat: 30, lng: 55 }) } })
    })

    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith(
      TOKEN_A.id,
      expect.objectContaining({ y: 32 }),
    ))
  })

  it('1×1 token: snapped x is correct (X axis has no flip)', async () => {
    // lng=55, offsetX=0, size=10: col=floor(55/10)=5, x_snap=5.5*10=55
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await waitFor(() => screen.getAllByTestId('marker').length > 0)

    const handler = capturedDragHandlers.get(`${TOKEN_A.y},${TOKEN_A.x}`)
    act(() => { handler?.({ target: { getLatLng: () => ({ lat: 30, lng: 55 }) } }) })

    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith(
      TOKEN_A.id,
      expect.objectContaining({ x: 55 }),
    ))
  })

  it('2×2 token: dragend places centre on grid intersection in image space', async () => {
    /**
     * 2×2 token, lat=28, lng=110
     *
     * image_y = 100 - 28 = 72
     * k=2: row = round((72-3)/10 - 1) = round(6.9 - 1) = round(5.9) = 6
     * snapped_img_y = 3 + (6 + 1) * 10 = 3 + 70 = 73
     * stored_y = 100 - 73 = 27
     *
     * x: col = round((110 - 0)/10 - 1) = round(11 - 1) = 10
     * snapped_x = 0 + (10 + 1) * 10 = 110
     */
    mockListMapTokens.mockResolvedValue([TOKEN_B])
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await waitFor(() => screen.getAllByTestId('marker').length > 0)

    const handler = capturedDragHandlers.get(`${TOKEN_B.y},${TOKEN_B.x}`)
    expect(handler).toBeDefined()

    act(() => { handler?.({ target: { getLatLng: () => ({ lat: 28, lng: 110 }) } }) })

    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith(
      TOKEN_B.id,
      expect.objectContaining({ y: 27, x: 110 }),
    ))
  })
})

describe('VTT — realignTokens action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    mockListMapTokens.mockResolvedValue([TOKEN_A, TOKEN_B])
    mockUpdateMapToken.mockResolvedValue(undefined)
    mockCreateMapToken.mockResolvedValue(TOKEN_A)
    mockDeleteMapToken.mockResolvedValue(undefined)
  })

  async function openGridPanel() {
    await waitFor(() => screen.getByTestId('grid-panel-toggle'))
    fireEvent.click(screen.getByTestId('grid-panel-toggle'))
    await waitFor(() => screen.getByTestId('grid-config-panel'))
  }

  it('realign button calls updateMapToken for each token with snapped coords (EN)', async () => {
    /**
     * TOKEN_A (x=50, y=30):
     *   snapTokenPos(50, 30, 1) → snapToGrid(50, 70, 1, grid)
     *   x: col=floor(50/10)=5 → 55; y_img: row=floor(6.7)=6 → 68; stored_y=32
     */
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanel()
    await waitFor(() => screen.getByTestId('realign-tokens-btn'))
    expect(screen.getByTestId('realign-tokens-btn').textContent).toContain('Align tokens to grid')

    fireEvent.click(screen.getByTestId('realign-tokens-btn'))

    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith(
      TOKEN_A.id,
      expect.objectContaining({ x: 55, y: 32 }),
    ))
    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith(
      TOKEN_B.id,
      expect.objectContaining({}),
    ))
  })

  it('realign button label in PT', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'pt')
    await openGridPanel()
    await waitFor(() => screen.getByTestId('realign-tokens-btn'))
    expect(screen.getByTestId('realign-tokens-btn').textContent).toContain('Alinhar tokens à grade')
  })

  it('realign button is hidden when grid is disabled', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_A])
    renderWithI18n(<CampaignMapViewer map={MAP_NO_GRID} isMaster />, 'en')
    await openGridPanel()
    expect(screen.queryByTestId('realign-tokens-btn')).toBeNull()
  })

  it('realign button is hidden when tokens list is empty', async () => {
    mockListMapTokens.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanel()
    expect(screen.queryByTestId('realign-tokens-btn')).toBeNull()
  })
})
