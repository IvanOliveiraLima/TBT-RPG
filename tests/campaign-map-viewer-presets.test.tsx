/**
 * CampaignMapViewer — preset palette tests.
 *
 * Verifies:
 * - Preset palette toggle visible to owner, hidden from member
 * - Opening the palette renders preset list or empty state
 * - Clicking a preset arms it (highlighted); clicking again disarms
 * - "Concluir" button disarms the armed preset
 * - Single map click while armed calls createMapToken with preset fields + snapToGrid
 * - Multi-place: stays armed after first place (coloca vários seguidos)
 * - Preset with image: uploadTokenImageBlob called for the placed token
 * - Single map click without an armed preset does NOT call createMapToken
 * - Dblclick while armed does NOT create a pending marker
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignTokenPreset } from '@/services/campaign-token-presets'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── Capture useMapEvents click/dblclick handlers ──────────────────────────────

let capturedClickHandler: ((e: { latlng: { lat: number; lng: number } }) => void) | null = null
let capturedDblClickHandler: ((e: { latlng: { lat: number; lng: number } }) => void) | null = null

// ── Stable Leaflet map stub ───────────────────────────────────────────────────

const containerStyle: { cursor: string; touchAction: string } = { cursor: '', touchAction: '' }

const mockLeafletMap = {
  dragging: { enable: vi.fn(), disable: vi.fn() },
  getContainer: () => ({
    style: containerStyle,
    setPointerCapture: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  mouseEventToLatLng: () => ({ lat: 500, lng: 500 }),
  invalidateSize: vi.fn(),
  latLngToLayerPoint: vi.fn(([_lat, lng]: [number, number]) => ({ x: lng, y: 0 })),
  on: vi.fn(),
  off: vi.fn(),
}

// ── Mock react-leaflet ────────────────────────────────────────────────────────

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
  }: {
    position: [number, number]
    children?: React.ReactNode
    draggable?: boolean
  }) => (
    <div
      data-testid="marker"
      data-lat={position[0]}
      data-lng={position[1]}
      data-draggable={draggable ? 'true' : 'false'}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => mockLeafletMap,
  useMapEvents: (handlers: {
    click?:    (e: { latlng: { lat: number; lng: number } }) => void
    dblclick?: (e: { latlng: { lat: number; lng: number } }) => void
  }) => {
    if (handlers.click    !== undefined) capturedClickHandler    = handlers.click
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
  updateCampaignMapGrid:   vi.fn().mockResolvedValue(undefined),
}))

// ── Mock campaign-map-markers service ─────────────────────────────────────────

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({}),
  updateMapMarkerLabel: () => Promise.resolve(),
  deleteMapMarker:      () => Promise.resolve(),
}))

// ── Mock campaign-map-tokens service ──────────────────────────────────────────

const mockCreateMapToken    = vi.fn()
const mockUploadTokenImageBlob = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:               () => Promise.resolve([]),
  createMapToken:              (...args: unknown[]) => mockCreateMapToken(...args),
  updateMapToken:              () => Promise.resolve(),
  deleteMapToken:              () => Promise.resolve(),
  uploadTokenImage:            () => Promise.resolve('camp-1/tokens/tok-1.png'),
  uploadTokenImageBlob:        (...args: unknown[]) => mockUploadTokenImageBlob(...args),
  getTokenImageSignedUrl:      () => Promise.resolve('https://signed.example.com/token.png'),
  removeTokenImage:            () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: () => Promise.resolve('camp-1/tokens/tok-1.jpg'),
}))

// ── Mock campaign-token-presets service ───────────────────────────────────────

const mockListTokenPresets           = vi.fn()
const mockGetTokenPresetSignedUrl    = vi.fn()

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:              (...args: unknown[]) => mockListTokenPresets(...args),
  getTokenPresetImageSignedUrl:  (...args: unknown[]) => mockGetTokenPresetSignedUrl(...args),
  createTokenPreset:             () => Promise.resolve({}),
  updateTokenPreset:             () => Promise.resolve(),
  deleteTokenPreset:             () => Promise.resolve(),
  uploadTokenPresetImage:        () => Promise.resolve('camp-1/presets/p-1.png'),
  removeTokenPresetImage:        () => Promise.resolve(),
}))

// ── Mock campaign-map-fog service ─────────────────────────────────────────────

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

// ── Mock @/data/db (needed transitively) ─────────────────────────────────────

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

// ── Mock global fetch (for preset image copy) ─────────────────────────────────

const mockFetchBlob = new Blob(['imgdata'], { type: 'image/jpeg' })
const mockFetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockFetchBlob) })

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const PRESET_NO_IMG: CampaignTokenPreset = {
  id: 'p-1', campaignId: 'camp-1', label: 'Goblin', color: '#C0392B', size: 2, imagePath: null,
}

const PRESET_WITH_IMG: CampaignTokenPreset = {
  id: 'p-2', campaignId: 'camp-1', label: 'Knight', color: '#2980B9', size: 1, imagePath: 'camp-1/presets/p-2.jpg',
}

const CREATED_TOKEN: CampaignMapToken = {
  id: 'tok-new', mapId: 'map-1', x: 100, y: 200, label: 'Goblin', color: '#C0392B', size: 2, imagePath: null, createdAt: 0,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — preset palette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler    = null
    capturedDblClickHandler = null
    containerStyle.cursor   = ''
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListTokenPresets.mockResolvedValue([])
    mockCreateMapToken.mockResolvedValue(CREATED_TOKEN)
    mockUploadTokenImageBlob.mockResolvedValue('camp-1/tokens/tok-new.jpg')
    mockGetTokenPresetSignedUrl.mockResolvedValue('https://signed.example.com/preset.jpg')
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Visibility ───────────────────────────────────────────────────────────────

  it('member: preset palette toggle is NOT visible', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('preset-palette-toggle')).toBeNull()
  })

  it('owner: preset palette toggle IS visible', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
  })

  it('owner: listTokenPresets is called with campaignId on mount', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(mockListTokenPresets).toHaveBeenCalledWith(MAP.campaignId))
  })

  // ── Opening the palette ───────────────────────────────────────────────────────

  it('clicking toggle opens the palette panel', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    expect(screen.getByTestId('preset-palette-panel')).toBeDefined()
  })

  it('palette shows empty state when no presets', async () => {
    mockListTokenPresets.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('preset-palette-empty'))
  })

  it('palette lists presets when available', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG, PRESET_WITH_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    expect(screen.getByTestId(`preset-palette-item-${PRESET_WITH_IMG.id}`)).toBeDefined()
  })

  // ── Arm / disarm ─────────────────────────────────────────────────────────────

  it('clicking a preset item arms it', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    // When armed, the "Concluir" / "Done" button appears
    expect(screen.getByTestId('preset-place-done')).toBeDefined()
  })

  it('clicking an armed preset item disarms it', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    expect(screen.getByTestId('preset-place-done')).toBeDefined()
    // Click again to disarm
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    expect(screen.queryByTestId('preset-place-done')).toBeNull()
  })

  it('"Done"/"Concluir" button disarms the preset', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId('preset-place-done'))
    expect(screen.queryByTestId('preset-place-done')).toBeNull()
  })

  // ── Cursor ───────────────────────────────────────────────────────────────────

  it('cursor becomes crosshair when a preset is armed', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    expect(containerStyle.cursor).toBe('crosshair')
  })

  // ── Placement ────────────────────────────────────────────────────────────────

  it('single map click while armed calls createMapToken with preset fields', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))

    // Fire the captured single-click handler
    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledOnce())
    const [mapId, x, y, opts] = mockCreateMapToken.mock.calls[0] as [string, number, number, object]
    expect(mapId).toBe(MAP.id)
    expect(typeof x).toBe('number')
    expect(typeof y).toBe('number')
    expect(opts).toMatchObject({ label: PRESET_NO_IMG.label, color: PRESET_NO_IMG.color, size: PRESET_NO_IMG.size })
  })

  it('multi-place: preset stays armed after placing (coloca vários seguidos)', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))

    // Place first token
    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })
    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledTimes(1))

    // "Done" button still visible (still armed)
    expect(screen.getByTestId('preset-place-done')).toBeDefined()

    // Place second token
    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 600, lng: 700 } })
    })
    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledTimes(2))
  })

  it('preset with image: uploadTokenImageBlob called for the placed token', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_WITH_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_WITH_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_WITH_IMG.id}`))

    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockUploadTokenImageBlob).toHaveBeenCalledOnce())
    const [campaignId, tokenId] = mockUploadTokenImageBlob.mock.calls[0] as [string, string, Blob]
    expect(campaignId).toBe(MAP.campaignId)
    expect(tokenId).toBe(CREATED_TOKEN.id)
  })

  it('single map click without armed preset does NOT call createMapToken', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    // Do NOT arm any preset — just fire click
    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })
    expect(mockCreateMapToken).not.toHaveBeenCalled()
  })

  it('dblclick while armed does NOT open a pending marker dialog', async () => {
    mockListTokenPresets.mockResolvedValue([PRESET_NO_IMG])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))
    fireEvent.click(screen.getByTestId(`preset-palette-item-${PRESET_NO_IMG.id}`))

    // Fire dblclick — should be suppressed while armed
    await act(async () => {
      capturedDblClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })
    // Pending marker UI should NOT appear
    expect(screen.queryByTestId('pending-cancel-btn')).toBeNull()
    expect(screen.queryByTestId('pending-add-btn')).toBeNull()
  })

  // ── PT i18n ───────────────────────────────────────────────────────────────────

  it('palette panel shows PT label "Tokens prontos"', async () => {
    mockListTokenPresets.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('preset-palette-panel'))
    expect(screen.getAllByText('Tokens prontos').length).toBeGreaterThanOrEqual(1)
  })

  it('palette panel shows EN label "Ready tokens"', async () => {
    mockListTokenPresets.mockResolvedValue([])
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('preset-palette-panel'))
    expect(screen.getAllByText('Ready tokens').length).toBeGreaterThanOrEqual(1)
  })
})
