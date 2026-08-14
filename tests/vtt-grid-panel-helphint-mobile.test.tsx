/**
 * VTT — grid panel HelpHint (fields) + mobile parity of realign button
 *
 * Covers:
 * - ? hint next to "GRADE" title in the desktop panel opens grid_fields_help text (EN + PT)
 * - ? hint next to "GRADE" title in the mobile panel opens grid_fields_help text (EN + PT)
 * - Mobile: realign button present when gridEnabled && gridSize && tokens > 0
 * - Mobile: realign button absent when grid disabled or no tokens
 * - Mobile: clicking realign calls updateMapToken per token
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── mobile toggle ─────────────────────────────────────────────────────────────

const mockIsMobile = { value: false }
vi.mock('@/hooks/useIsMobile', () => ({ useIsMobile: () => mockIsMobile.value }))

// ── Leaflet / react-leaflet mocks ─────────────────────────────────────────────

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
  SVGOverlay:   () => null,
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
      <div data-testid="marker" data-lat={position[0]} data-lng={position[1]}>
        {children}
      </div>
    )
  },
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap:       () => mockLeafletMap,
  useMapEvents: () => null,
}))

vi.mock('leaflet', () => ({
  default: {
    CRS:         { Simple: 'Simple' },
    latLngBounds: (corners: unknown) => ({ corners, isBounds: true }),
    divIcon:      (opts: unknown) => ({ ...(opts as object), _isIcon: true }),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: () => Promise.resolve('https://signed.example.com/map.png'),
  updateCampaignMapGrid:   vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({}),
  updateMapMarkerLabel: () => Promise.resolve(),
  deleteMapMarker:      () => Promise.resolve(),
}))

const mockListMapTokens  = vi.fn()
const mockUpdateMapToken = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:                      (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:                     () => Promise.resolve({}),
  updateMapToken:                     (...args: unknown[]) => mockUpdateMapToken(...args),
  deleteMapToken:                     () => Promise.resolve(),
  uploadTokenImage:                   () => Promise.resolve('camp-1/tokens/tok-1.png'),
  uploadTokenImageBlob:               () => Promise.resolve('camp-1/tokens/tok-1.png'),
  getTokenImageSignedUrl:             () => Promise.resolve('https://signed.example.com/token.png'),
  removeTokenImage:                   () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: () => Promise.resolve('camp-1/tokens/tok-1.png'),
}))

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:  () => Promise.resolve([]),
  createMapArea: () => Promise.resolve({ id: 'area-new', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea: () => Promise.resolve(),
  clearMapAreas: () => Promise.resolve(),
}))

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:             () => Promise.resolve([]),
  getTokenPresetImageSignedUrl: () => Promise.resolve('https://signed.example.com/preset.png'),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: () => Promise.resolve([]),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: () => Promise.resolve([]),
  fetchCampaignCharacterImages: () => Promise.resolve({}),
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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP_BASE: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 200, height: 100, createdAt: 0,
  gridEnabled: true, gridSize: 10, gridOffsetX: 0, gridOffsetY: 3, gridColor: '#000',
  published: false,
}

const MAP_NO_GRID: CampaignMap = { ...MAP_BASE, gridEnabled: false }

const TOKEN_A: CampaignMapToken = {
  id: 'tok-a', mapId: 'map-1', x: 50, y: 30,
  label: 'A', color: '#C00', size: 1, imagePath: null, conditions: [], createdAt: 0,
}

const TOKEN_B: CampaignMapToken = {
  id: 'tok-b', mapId: 'map-1', x: 120, y: 55,
  label: 'B', color: '#00C', size: 2, imagePath: null, conditions: [], createdAt: 1,
}

// ── Panel-open helpers ────────────────────────────────────────────────────────

async function openGridPanelDesktop() {
  await waitFor(() => screen.getByTestId('grid-panel-toggle'))
  fireEvent.click(screen.getByTestId('grid-panel-toggle'))
  await waitFor(() => screen.getByTestId('grid-config-panel'))
}

/**
 * On mobile: open Ferramentas bottom-sheet → click Grade → grid config panel appears.
 */
async function openGridPanelMobile() {
  await waitFor(() => screen.getByTestId('tools-menu-toggle'))
  fireEvent.click(screen.getByTestId('tools-menu-toggle'))
  await waitFor(() => screen.getByTestId('tools-grid-btn'))
  fireEvent.click(screen.getByTestId('tools-grid-btn'))
  await waitFor(() => screen.getByTestId('grid-config-panel'))
}

// ── Desktop HelpHint (grid_fields_help) ──────────────────────────────────────

describe('VTT — grid panel HelpHint (fields) — desktop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    capturedZoomHandlers.length = 0
    mockIsMobile.value = false
    mockListMapTokens.mockResolvedValue([TOKEN_A])
    mockUpdateMapToken.mockResolvedValue(undefined)
  })

  it('? trigger appears next to the GRADE title (desktop)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelDesktop()
    expect(screen.getAllByTestId('help-hint-trigger').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking the title ? opens grid_fields_help tooltip (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelDesktop()
    const triggers = screen.getAllByTestId('help-hint-trigger')
    act(() => { fireEvent.click(triggers[0]) })
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Cell size sets'),
    )
  })

  it('clicking the title ? opens grid_fields_help tooltip (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'pt')
    await openGridPanelDesktop()
    const triggers = screen.getAllByTestId('help-hint-trigger')
    act(() => { fireEvent.click(triggers[0]) })
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Tamanho da célula'),
    )
  })
})

// ── Mobile HelpHint (grid_fields_help) ───────────────────────────────────────

describe('VTT — grid panel HelpHint (fields) — mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    capturedZoomHandlers.length = 0
    mockIsMobile.value = true
    mockListMapTokens.mockResolvedValue([TOKEN_A])
    mockUpdateMapToken.mockResolvedValue(undefined)
  })

  it('? trigger appears next to the GRADE title (mobile)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelMobile()
    expect(screen.getAllByTestId('help-hint-trigger').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking the title ? opens grid_fields_help tooltip (EN, mobile)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelMobile()
    const triggers = screen.getAllByTestId('help-hint-trigger')
    act(() => { fireEvent.click(triggers[0]) })
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Cell size sets'),
    )
  })

  it('clicking the title ? opens grid_fields_help tooltip (PT, mobile)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'pt')
    await openGridPanelMobile()
    const triggers = screen.getAllByTestId('help-hint-trigger')
    act(() => { fireEvent.click(triggers[0]) })
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Tamanho da célula'),
    )
  })
})

// ── Mobile realign-tokens-btn parity ─────────────────────────────────────────

describe('VTT — mobile realign-tokens-btn parity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDragHandlers.clear()
    capturedZoomHandlers.length = 0
    mockIsMobile.value = true
    mockListMapTokens.mockResolvedValue([TOKEN_A, TOKEN_B])
    mockUpdateMapToken.mockResolvedValue(undefined)
  })

  it('realign button visible on mobile when grid enabled + tokens present (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelMobile()
    await waitFor(() => screen.getByTestId('realign-tokens-btn'))
    expect(screen.getByTestId('realign-tokens-btn').textContent).toContain('Align tokens to grid')
  })

  it('realign button visible on mobile when grid enabled + tokens present (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'pt')
    await openGridPanelMobile()
    await waitFor(() => screen.getByTestId('realign-tokens-btn'))
    expect(screen.getByTestId('realign-tokens-btn').textContent).toContain('Alinhar tokens à grade')
  })

  it('clicking mobile realign calls updateMapToken for TOKEN_A with snapped coords', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelMobile()
    await waitFor(() => screen.getByTestId('realign-tokens-btn'))
    fireEvent.click(screen.getByTestId('realign-tokens-btn'))
    await waitFor(() =>
      expect(mockUpdateMapToken).toHaveBeenCalledWith(
        TOKEN_A.id,
        expect.objectContaining({ x: 55, y: 32 }),
      ),
    )
  })

  it('clicking mobile realign calls updateMapToken for TOKEN_B', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelMobile()
    await waitFor(() => screen.getByTestId('realign-tokens-btn'))
    fireEvent.click(screen.getByTestId('realign-tokens-btn'))
    await waitFor(() =>
      expect(mockUpdateMapToken).toHaveBeenCalledWith(
        TOKEN_B.id,
        expect.objectContaining({}),
      ),
    )
  })

  it('realign button hidden on mobile when grid is disabled', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_A])
    renderWithI18n(<CampaignMapViewer map={MAP_NO_GRID} isMaster />, 'en')
    await openGridPanelMobile()
    expect(screen.queryByTestId('realign-tokens-btn')).toBeNull()
  })

  it('realign button hidden on mobile when no tokens', async () => {
    mockListMapTokens.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP_BASE} isMaster />, 'en')
    await openGridPanelMobile()
    expect(screen.queryByTestId('realign-tokens-btn')).toBeNull()
  })
})
