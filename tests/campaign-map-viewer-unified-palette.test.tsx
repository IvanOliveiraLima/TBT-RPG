/**
 * CampaignMapViewer — unified token palette (characters, presets, generic).
 *
 * Verifies:
 * - Characters section visible in palette when linked chars exist
 * - Arming a character shows place-done button
 * - Character already on map → palette item disabled
 * - Map click while character armed → createMapToken with label=name; updateMapToken({ characterId })
 * - Character with portrait → setTokenImageFromCharacterPortrait called
 * - Character token does NOT auto-number (no autoNumberLabel logic)
 * - Generic token → createMapToken at snapped click coords, with auto-numbered generic label
 * - Switching armed item → only the last armed one triggers on click
 * - Mobile: tools-presets-btn opens palette with generic item
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── Capture useMapEvents click handler ────────────────────────────────────────

let capturedClickHandler: ((e: { latlng: { lat: number; lng: number } }) => void) | null = null

// ── Mock matchMedia for mobile tests ─────────────────────────────────────────

let isMobileOverride = false

function mockMatchMedia(mobile: boolean) {
  isMobileOverride = mobile
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: mobile && query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

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
    if (handlers.click !== undefined) capturedClickHandler = handlers.click
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

const mockListMapTokens                   = vi.fn()
const mockCreateMapToken                  = vi.fn()
const mockUpdateMapToken                  = vi.fn()
const mockSetTokenImageFromCharPortrait   = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:               (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:              (...args: unknown[]) => mockCreateMapToken(...args),
  updateMapToken:              (...args: unknown[]) => mockUpdateMapToken(...args),
  deleteMapToken:              () => Promise.resolve(),
  uploadTokenImage:            () => Promise.resolve('camp-1/tokens/tok-1.png'),
  uploadTokenImageBlob:        () => Promise.resolve('camp-1/tokens/tok-1.jpg'),
  getTokenImageSignedUrl:      () => Promise.resolve('https://signed.example.com/token.png'),
  removeTokenImage:            () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: (...args: unknown[]) => mockSetTokenImageFromCharPortrait(...args),
}))

// ── Mock campaign-token-presets service ───────────────────────────────────────

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:              () => Promise.resolve([]),
  getTokenPresetImageSignedUrl:  () => Promise.resolve('https://signed.example.com/preset.jpg'),
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

// ── Mock campaign-map-areas service ──────────────────────────────────────────

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   () => Promise.resolve([]),
  createMapArea:  () => Promise.resolve({ id: 'area-new', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea:  () => Promise.resolve(),
  clearMapAreas:  () => Promise.resolve(),
}))

// ── Mock campaign-view ────────────────────────────────────────────────────────

const mockFetchLinkedCharsDetails = vi.fn()
const mockFetchCampaignCharImages  = vi.fn()

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: (...args: unknown[]) => mockFetchLinkedCharsDetails(...args),
  fetchCampaignCharacterImages: (...args: unknown[]) => mockFetchCampaignCharImages(...args),
}))

// ── Mock realtime ─────────────────────────────────────────────────────────────

vi.mock('@/services/realtime', () => ({
  subscribeCharacterChanges: () => () => {},
}))

// ── Mock campaign-initiative + campaign ───────────────────────────────────────

vi.mock('@/services/campaign-initiative', () => ({
  getInitiative:      () => Promise.resolve({ combatants: [], activeCombatantId: null, round: 1, active: false }),
  saveInitiative:     () => Promise.resolve(),
  registerInitiative: () => Promise.resolve(),
}))

vi.mock('@/services/campaign', () => ({
  getAutoInitiative:    () => Promise.resolve(false),
  updateAutoInitiative: () => Promise.resolve(),
}))

// ── Mock heavy child components ───────────────────────────────────────────────

vi.mock('@/components/dice/DicePanel',            () => ({ DicePanel:          () => null }))
vi.mock('@/components/campaigns/CampaignRollLog', () => ({ CampaignRollLog:    () => null }))
vi.mock('@/components/campaigns/CampaignInitiativePanel', () => ({ CampaignInitiativePanel: () => null }))

// ── Mock @/data/db ────────────────────────────────────────────────────────────

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
  published: false,
}

const CHAR_DETAIL_ROGUE = {
  characterId: 'char-rogue',
  ownerUserId: 'user-1',
  character: { name: 'Sylara', hp: { current: 20, max: 20, temp: 0 }, updatedAt: 0 },
}

const CHAR_DETAIL_WIZARD = {
  characterId: 'char-wizard',
  ownerUserId: 'user-2',
  character: { name: 'Maldrix', hp: { current: 15, max: 15, temp: 0 }, updatedAt: 0 },
}

const TOKEN_BASE: CampaignMapToken = {
  id: 'tok-1', mapId: 'map-1', x: 100, y: 200, label: 'Sylara', color: '#5B3FA8',
  size: 1, imagePath: null, conditions: [], createdAt: 0, characterId: 'char-rogue',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — unified palette: character section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    containerStyle.cursor = ''
    isMobileOverride = false
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapTokens.mockResolvedValue([])
    mockCreateMapToken.mockResolvedValue({ ...TOKEN_BASE, characterId: null })
    mockUpdateMapToken.mockResolvedValue(undefined)
    mockSetTokenImageFromCharPortrait.mockResolvedValue('camp-1/tokens/tok-new.jpg')
    mockFetchLinkedCharsDetails.mockResolvedValue([CHAR_DETAIL_ROGUE, CHAR_DETAIL_WIZARD])
    mockFetchCampaignCharImages.mockResolvedValue({ portraitData: null, symbolData: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('character section shows linked char names in palette', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    expect(screen.getByTestId('palette-char-char-wizard')).toBeDefined()
    expect(screen.getByTestId('palette-char-char-rogue').textContent).toContain('Sylara')
    expect(screen.getByTestId('palette-char-char-wizard').textContent).toContain('Maldrix')
  })

  it('arming a character shows place-done button', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    fireEvent.click(screen.getByTestId('palette-char-char-rogue'))
    expect(screen.getByTestId('preset-place-done')).toBeDefined()
  })

  it('character already on map → palette item disabled', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_BASE]) // TOKEN_BASE.characterId = 'char-rogue'
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    const btn = screen.getByTestId('palette-char-char-rogue') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    // Wizard (not on map) is still enabled
    const wizBtn = screen.getByTestId('palette-char-char-wizard') as HTMLButtonElement
    expect(wizBtn.disabled).toBe(false)
  })

  it('map click while character armed calls createMapToken with label=name', async () => {
    const newToken: CampaignMapToken = { ...TOKEN_BASE, id: 'tok-new', characterId: null }
    mockCreateMapToken.mockResolvedValue(newToken)
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    fireEvent.click(screen.getByTestId('palette-char-char-rogue'))

    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledOnce())
    const [mapId, , , opts] = mockCreateMapToken.mock.calls[0] as [string, number, number, { label: string }]
    expect(mapId).toBe(MAP.id)
    expect(opts.label).toBe('Sylara') // name, not auto-numbered
  })

  it('map click while character armed calls updateMapToken with characterId', async () => {
    const newToken: CampaignMapToken = { ...TOKEN_BASE, id: 'tok-new', characterId: null }
    mockCreateMapToken.mockResolvedValue(newToken)
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    fireEvent.click(screen.getByTestId('palette-char-char-rogue'))

    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockUpdateMapToken).toHaveBeenCalledWith('tok-new', { characterId: 'char-rogue' }))
  })

  it('character with portrait → setTokenImageFromCharacterPortrait called', async () => {
    mockFetchCampaignCharImages.mockResolvedValue({ portraitData: 'data:image/jpeg;base64,abc', symbolData: null })
    const newToken: CampaignMapToken = { ...TOKEN_BASE, id: 'tok-new', characterId: null }
    mockCreateMapToken.mockResolvedValue(newToken)
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    fireEvent.click(screen.getByTestId('palette-char-char-rogue'))

    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockSetTokenImageFromCharPortrait).toHaveBeenCalledOnce())
    const [campaignId, tokenId] = mockSetTokenImageFromCharPortrait.mock.calls[0] as [string, string, string]
    expect(campaignId).toBe(MAP.campaignId)
    expect(tokenId).toBe('tok-new')
  })

  it('character token does NOT auto-number (no "Sylara 1" / "Sylara 2" behaviour)', async () => {
    mockListMapTokens.mockResolvedValue([])
    let seq = 0
    mockCreateMapToken.mockImplementation((_mapId, _x, _y, opts: { label?: string }) => {
      seq++
      return Promise.resolve({ ...TOKEN_BASE, id: `tok-${seq}`, label: opts.label ?? '', characterId: null })
    })
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    fireEvent.click(screen.getByTestId('palette-char-char-rogue'))

    // First click
    await act(async () => { capturedClickHandler?.({ latlng: { lat: 100, lng: 200 } }) })
    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledTimes(1))
    const [, , , opts1] = mockCreateMapToken.mock.calls[0] as [unknown, unknown, unknown, { label: string }]
    expect(opts1.label).toBe('Sylara')
    // No rename call either (auto-numbering renames first when second is placed)
    expect(mockUpdateMapToken).not.toHaveBeenCalledWith('tok-1', { label: 'Sylara 1' })
  })
})

describe('CampaignMapViewer — unified palette: generic token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    containerStyle.cursor = ''
    isMobileOverride = false
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapTokens.mockResolvedValue([])
    mockCreateMapToken.mockResolvedValue({ ...TOKEN_BASE, id: 'tok-gen', characterId: null, label: 'Generic token' })
    mockUpdateMapToken.mockResolvedValue(undefined)
    mockFetchLinkedCharsDetails.mockResolvedValue([])
    mockFetchCampaignCharImages.mockResolvedValue({ portraitData: null, symbolData: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generic item appears in palette', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-generic-item'))
    expect(screen.getByTestId('palette-generic-item').textContent).toContain('Generic token')
  })

  it('generic item shows "Token genérico" in PT', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'pt')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-generic-item'))
    expect(screen.getByTestId('palette-generic-item').textContent).toContain('Token genérico')
  })

  it('map click while generic armed calls createMapToken at click coords (not image center)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-generic-item'))
    fireEvent.click(screen.getByTestId('palette-generic-item'))

    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledOnce())
    const [mapId, x, y] = mockCreateMapToken.mock.calls[0] as [string, number, number, object]
    expect(mapId).toBe(MAP.id)
    // Coords must be from click position, NOT the image center (MAP.width/2, MAP.height/2)
    expect(x).not.toBe(MAP.width / 2)
    expect(y).not.toBe(MAP.height / 2)
  })

  it('map click while generic armed does NOT call updateMapToken with characterId', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))
    await waitFor(() => screen.getByTestId('palette-generic-item'))
    fireEvent.click(screen.getByTestId('palette-generic-item'))

    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledOnce())
    // No characterId should be set for generic tokens
    expect(mockUpdateMapToken).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ characterId: expect.anything() }))
  })
})

describe('CampaignMapViewer — unified palette: switch armed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    containerStyle.cursor = ''
    isMobileOverride = false
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapTokens.mockResolvedValue([])
    mockCreateMapToken.mockResolvedValue({ ...TOKEN_BASE, id: 'tok-new', characterId: null })
    mockUpdateMapToken.mockResolvedValue(undefined)
    mockSetTokenImageFromCharPortrait.mockResolvedValue('camp-1/tokens/tok-new.jpg')
    mockFetchLinkedCharsDetails.mockResolvedValue([CHAR_DETAIL_ROGUE])
    mockFetchCampaignCharImages.mockResolvedValue({ portraitData: null, symbolData: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('arming character then arming generic → map click creates generic token (no characterId)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('preset-palette-toggle'))
    fireEvent.click(screen.getByTestId('preset-palette-toggle'))

    // Arm character first
    await waitFor(() => screen.getByTestId('palette-char-char-rogue'))
    fireEvent.click(screen.getByTestId('palette-char-char-rogue'))
    expect(screen.getByTestId('preset-place-done')).toBeDefined()

    // Switch to generic
    fireEvent.click(screen.getByTestId('palette-generic-item'))

    // Place
    await act(async () => {
      capturedClickHandler?.({ latlng: { lat: 300, lng: 400 } })
    })

    await waitFor(() => expect(mockCreateMapToken).toHaveBeenCalledOnce())
    // Generic token: no characterId update
    expect(mockUpdateMapToken).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ characterId: 'char-rogue' }))
  })
})

describe('CampaignMapViewer — unified palette: mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedClickHandler = null
    containerStyle.cursor = ''
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockListMapTokens.mockResolvedValue([])
    mockFetchLinkedCharsDetails.mockResolvedValue([])
    mockFetchCampaignCharImages.mockResolvedValue({ portraitData: null, symbolData: null })
    mockMatchMedia(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockMatchMedia(false)
  })

  it('mobile: tools-presets-btn opens palette with generic item', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-presets-btn'))
    fireEvent.click(screen.getByTestId('tools-presets-btn'))
    await waitFor(() => screen.getByTestId('palette-generic-item'))
    expect(screen.getByTestId('palette-generic-item').textContent).toContain('Generic token')
  })

  it('mobile: arming generic from palette shows place-done button', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-presets-btn'))
    fireEvent.click(screen.getByTestId('tools-presets-btn'))
    await waitFor(() => screen.getByTestId('palette-generic-item'))
    fireEvent.click(screen.getByTestId('palette-generic-item'))
    await waitFor(() => expect(screen.getByTestId('preset-place-done')).toBeDefined())
  })
})
