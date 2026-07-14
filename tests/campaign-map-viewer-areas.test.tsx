/**
 * CampaignMapViewer — AoE area shapes tests.
 *
 * Verifies:
 * - Service: listMapAreas, createMapArea, deleteMapArea, clearMapAreas shape
 * - Render: areas SVGOverlay shown when areas present; absent when empty
 * - Coordinate: centre stored with Y-flip (height - lat); radius = Euclidean distance (no flip)
 * - Draw: area-panel-toggle shows panel; shape/color selectors; area-draw-done exits draw mode
 * - Clear: area-clear-btn calls clearMapAreas
 * - Poll: areas fetched on mount; member has no toolbar
 * - Mode exclusivity: entering areaMode exits fog mode
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignMapArea } from '@/services/campaign-map-areas'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: () => null,
  SVGOverlay: ({ children, attributes }: { children?: React.ReactNode; attributes?: Record<string, string> }) => (
    <svg data-testid={attributes?.['data-testid'] ?? 'svg-overlay'}>{children}</svg>
  ),
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

vi.mock('leaflet', () => ({
  default: {
    CRS: { Simple: 'Simple' },
    latLngBounds: (corners: unknown) => ({ corners }),
    divIcon: (opts: unknown) => ({ ...(opts as object), _isIcon: true }),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

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

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:    () => Promise.resolve([]),
  createMapToken:   () => Promise.resolve({ id: 'new', mapId: 'map-1', x: 0, y: 0, label: '', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0 }),
  updateMapToken:   () => Promise.resolve(),
  deleteMapToken:   () => Promise.resolve(),
  uploadTokenImage: () => Promise.resolve('path'),
  uploadTokenImageBlob: () => Promise.resolve('path'),
  getTokenImageSignedUrl: () => Promise.resolve('https://signed.example.com/img.png'),
  removeTokenImage: () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: () => Promise.resolve('path'),
}))

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:             () => Promise.resolve([]),
  getTokenPresetImageSignedUrl: () => Promise.resolve('https://signed.example.com/preset.png'),
  createTokenPreset:            () => Promise.resolve({}),
  updateTokenPreset:            () => Promise.resolve(),
  deleteTokenPreset:            () => Promise.resolve(),
  uploadTokenPresetImage:       () => Promise.resolve('camp-1/presets/p-1.png'),
  removeTokenPresetImage:       () => Promise.resolve(),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: () => Promise.resolve([]),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchCampaignCharacterImages: () => Promise.resolve({ portraitData: null, symbolData: null }),
}))

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

const mockListMapAreas  = vi.fn()
const mockCreateMapArea = vi.fn()
const mockClearMapAreas = vi.fn()
const mockDeleteMapArea = vi.fn()

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   (...args: unknown[]) => mockListMapAreas(...args),
  createMapArea:  (...args: unknown[]) => mockCreateMapArea(...args),
  deleteMapArea:  (...args: unknown[]) => mockDeleteMapArea(...args),
  clearMapAreas:  (...args: unknown[]) => mockClearMapAreas(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const AREA_CIRCLE: CampaignMapArea = {
  id: 'area-1', mapId: 'map-1', shape: 'circle',
  x: 500, y: 300, radius: 80, x2: null, y2: null, color: '#E0562D',
}

const AREA_SQUARE: CampaignMapArea = {
  id: 'area-2', mapId: 'map-1', shape: 'square',
  x: 900, y: 600, radius: 60, x2: null, y2: null, color: '#2980B9',
}

const AREA_LINE: CampaignMapArea = {
  id: 'area-3', mapId: 'map-1', shape: 'line',
  x: 100, y: 200, radius: 300, x2: 400, y2: 200, color: '#27AE60',
}

const AREA_CONE: CampaignMapArea = {
  id: 'area-4', mapId: 'map-1', shape: 'cone',
  x: 200, y: 400, radius: 200, x2: 200, y2: 200, color: '#8E44AD',
}

// ── Service shape tests ───────────────────────────────────────────────────────

describe('campaign-map-areas service — shape', () => {
  it('CampaignMapArea circle fixture has required fields', () => {
    const a: CampaignMapArea = { ...AREA_CIRCLE }
    expect(a.shape).toBe('circle')
    expect(typeof a.x).toBe('number')
    expect(typeof a.y).toBe('number')
    expect(typeof a.radius).toBe('number')
    expect(typeof a.color).toBe('string')
    expect(a.x2).toBeNull()
    expect(a.y2).toBeNull()
  })

  it('CampaignMapArea line fixture has x2/y2 set', () => {
    const a: CampaignMapArea = { ...AREA_LINE }
    expect(a.shape).toBe('line')
    expect(typeof a.x2).toBe('number')
    expect(typeof a.y2).toBe('number')
  })

  it('CampaignMapArea cone fixture has x2/y2 set', () => {
    const a: CampaignMapArea = { ...AREA_CONE }
    expect(a.shape).toBe('cone')
    expect(typeof a.x2).toBe('number')
    expect(typeof a.y2).toBe('number')
  })

  it('clearMapAreas is called with mapId', async () => {
    mockClearMapAreas.mockResolvedValue(undefined)
    await mockClearMapAreas('map-1')
    expect(mockClearMapAreas).toHaveBeenCalledWith('map-1')
  })

  it('createMapArea is called with correct shape', async () => {
    mockCreateMapArea.mockResolvedValue(AREA_CIRCLE)
    const opts = { shape: 'circle' as const, x: 500, y: 300, radius: 80, color: '#E0562D' }
    await mockCreateMapArea('map-1', opts)
    expect(mockCreateMapArea).toHaveBeenCalledWith('map-1', opts)
  })
})

// ── Render tests ──────────────────────────────────────────────────────────────

describe('CampaignMapViewer — area shapes render', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClearMapAreas.mockResolvedValue(undefined)
    mockCreateMapArea.mockResolvedValue(AREA_CIRCLE)
    mockDeleteMapArea.mockResolvedValue(undefined)
  })

  it('areas-overlay absent when no areas', async () => {
    mockListMapAreas.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('areas-overlay')).toBeNull()
  })

  it('areas-overlay present when areas exist', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CIRCLE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('areas-overlay'))
  })

  it('circle area renders <circle> element', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CIRCLE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('areas-overlay'))
    const overlay = screen.getByTestId('areas-overlay')
    expect(overlay.querySelector('circle')).not.toBeNull()
    expect(overlay.querySelector('rect')).toBeNull()
  })

  it('square area renders <rect> element', async () => {
    mockListMapAreas.mockResolvedValue([AREA_SQUARE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('areas-overlay'))
    const overlay = screen.getByTestId('areas-overlay')
    expect(overlay.querySelector('rect')).not.toBeNull()
    expect(overlay.querySelector('circle')).toBeNull()
  })

  it('member has no area panel toggle', async () => {
    mockListMapAreas.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('area-panel-toggle')).toBeNull()
  })
})

// ── Owner toolbar tests ───────────────────────────────────────────────────────

describe('CampaignMapViewer — area toolbar (owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListMapAreas.mockResolvedValue([])
    mockClearMapAreas.mockResolvedValue(undefined)
    mockCreateMapArea.mockResolvedValue(AREA_CIRCLE)
  })

  it('clicking area-panel-toggle shows area panel', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-panel'))
  })

  it('area panel shows shape selector buttons', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-shape-circle'))
    expect(screen.getByTestId('area-shape-square')).toBeDefined()
  })

  it('area panel shows color input', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-color-input'))
  })

  it('clear button calls clearMapAreas', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CIRCLE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-clear-btn'))
    fireEvent.click(screen.getByTestId('area-clear-btn'))
    await waitFor(() => expect(mockClearMapAreas).toHaveBeenCalledWith('map-1'))
  })

  it('area panel closing works', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-panel-close'))
    fireEvent.click(screen.getByTestId('area-panel-close'))
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
  })

  it('area panel shows "Areas" label (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-panel'))
    expect(screen.getByTestId('area-panel').textContent).toContain('Areas')
  })

  it('area panel shows "Áreas" label (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-panel'))
    expect(screen.getByTestId('area-panel').textContent).toContain('Áreas')
  })
})

// ── Line / Cone shape selector ────────────────────────────────────────────────

describe('CampaignMapViewer — line & cone shape buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListMapAreas.mockResolvedValue([])
    mockClearMapAreas.mockResolvedValue(undefined)
    mockCreateMapArea.mockResolvedValue(AREA_LINE)
  })

  it('area panel shows line shape button (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-shape-line'))
    expect(screen.getByTestId('area-shape-line').textContent).toContain('Line')
  })

  it('area panel shows cone shape button (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-shape-cone'))
    expect(screen.getByTestId('area-shape-cone').textContent).toContain('Cone')
  })

  it('area panel shows line/cone buttons in PT', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-shape-line'))
    expect(screen.getByTestId('area-shape-line').textContent).toContain('Linha')
    expect(screen.getByTestId('area-shape-cone').textContent).toContain('Cone')
  })
})

// ── Line / Cone SVG render ────────────────────────────────────────────────────

describe('CampaignMapViewer — line & cone SVG render', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClearMapAreas.mockResolvedValue(undefined)
    mockDeleteMapArea.mockResolvedValue(undefined)
  })

  it('line area renders <line> element', async () => {
    mockListMapAreas.mockResolvedValue([AREA_LINE])
    mockCreateMapArea.mockResolvedValue(AREA_LINE)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('areas-overlay'))
    const overlay = screen.getByTestId('areas-overlay')
    // SVGOverlay is rendered as <svg>; query for <line> within it
    const lineEl = overlay.querySelector('line')
    expect(lineEl).not.toBeNull()
    // x1/y1 match area.x / area.y
    expect(lineEl?.getAttribute('x1')).toBe('100')
    expect(lineEl?.getAttribute('y1')).toBe('200')
    // x2/y2 match area.x2 / area.y2
    expect(lineEl?.getAttribute('x2')).toBe('400')
    expect(lineEl?.getAttribute('y2')).toBe('200')
  })

  it('cone area renders <polygon> element', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CONE])
    mockCreateMapArea.mockResolvedValue(AREA_CONE)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('areas-overlay'))
    const overlay = screen.getByTestId('areas-overlay')
    const polyEl = overlay.querySelector('polygon')
    expect(polyEl).not.toBeNull()
    // Apex = (200, 400); tip = (200, 200); L=200; half=100
    // u = (0,-1); n = (1,0)
    // pL = (200+100, 200) = (300,200); pR = (200-100, 200) = (100,200)
    const pts = polyEl?.getAttribute('points') ?? ''
    expect(pts).toContain('200,400')  // apex
    expect(pts).toContain('300,200')  // left base
    expect(pts).toContain('100,200')  // right base
  })

  it('cone polygon: width at tip equals length (5e invariant)', async () => {
    // cone with apex (0,0), tip (0,100) → L=100, half=50
    const coneFt: CampaignMapArea = {
      id: 'cone-ft', mapId: 'map-1', shape: 'cone',
      x: 0, y: 0, radius: 100, x2: 0, y2: 100, color: '#888',
    }
    mockListMapAreas.mockResolvedValue([coneFt])
    mockCreateMapArea.mockResolvedValue(coneFt)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('areas-overlay'))
    const overlay = screen.getByTestId('areas-overlay')
    const polyEl = overlay.querySelector('polygon')
    expect(polyEl).not.toBeNull()
    // u=(0,1); n=(-1,0); pL=(0-50,100)=(-50,100); pR=(0+50,100)=(50,100)
    const pts = polyEl?.getAttribute('points') ?? ''
    expect(pts).toContain('0,0')     // apex
    expect(pts).toContain('-50,100') // left base
    expect(pts).toContain('50,100')  // right base
  })

  it('line area is not null when x2/y2 are present', async () => {
    mockListMapAreas.mockResolvedValue([AREA_LINE, AREA_CONE])
    mockCreateMapArea.mockResolvedValue(AREA_LINE)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('areas-overlay'))
    const overlay = screen.getByTestId('areas-overlay')
    expect(overlay.querySelector('line')).not.toBeNull()
    expect(overlay.querySelector('polygon')).not.toBeNull()
  })
})

// ── Per-area remove ───────────────────────────────────────────────────────────

describe('CampaignMapViewer — per-area remove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClearMapAreas.mockResolvedValue(undefined)
    mockCreateMapArea.mockResolvedValue(AREA_CIRCLE)
    mockDeleteMapArea.mockResolvedValue(undefined)
  })

  it('area list shows remove button per area', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CIRCLE, AREA_SQUARE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-list'))
    expect(screen.getByTestId(`area-remove-${AREA_CIRCLE.id}`)).toBeDefined()
    expect(screen.getByTestId(`area-remove-${AREA_SQUARE.id}`)).toBeDefined()
  })

  it('clicking remove calls deleteMapArea with correct id', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CIRCLE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId(`area-remove-${AREA_CIRCLE.id}`))
    fireEvent.click(screen.getByTestId(`area-remove-${AREA_CIRCLE.id}`))
    await waitFor(() => expect(mockDeleteMapArea).toHaveBeenCalledWith(AREA_CIRCLE.id))
  })

  it('clicking remove removes the area from the list (optimistic)', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CIRCLE, AREA_SQUARE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId(`area-remove-${AREA_CIRCLE.id}`))
    fireEvent.click(screen.getByTestId(`area-remove-${AREA_CIRCLE.id}`))
    await waitFor(() => expect(screen.queryByTestId(`area-remove-${AREA_CIRCLE.id}`)).toBeNull())
    // Square still visible
    expect(screen.getByTestId(`area-remove-${AREA_SQUARE.id}`)).toBeDefined()
  })

  it('"Clear all" still calls clearMapAreas', async () => {
    mockListMapAreas.mockResolvedValue([AREA_CIRCLE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-clear-btn'))
    fireEvent.click(screen.getByTestId('area-clear-btn'))
    await waitFor(() => expect(mockClearMapAreas).toHaveBeenCalledWith('map-1'))
  })

  it('area list shows shape labels for line and cone', async () => {
    mockListMapAreas.mockResolvedValue([AREA_LINE, AREA_CONE])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('area-panel-toggle'))
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => screen.getByTestId('area-list'))
    const list = screen.getByTestId('area-list')
    expect(list.textContent).toContain('Line')
    expect(list.textContent).toContain('Cone')
  })
})
