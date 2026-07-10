/**
 * CampaignMapViewer — token portrait from linked character tests.
 *
 * Covers:
 * - Owner sees "Use character portrait" button in token popup
 * - Clicking it opens the picker and calls listCampaignCharacters
 * - Characters with portrait are enabled; without portrait are disabled
 * - Selecting a character with portrait calls setTokenImageFromCharacterPortrait
 * - After successful pick, the picker closes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
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

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

// Declare vi.fn() mocks before vi.mock() factories — closures capture by reference,
// so the inner arrow functions work correctly even though vi.mock is hoisted.
const mockListMapTokens                      = vi.fn()
const mockSetTokenImageFromCharacterPortrait = vi.fn()
const mockListCampaignCharacters             = vi.fn()
const mockFetchCampaignCharacterImages       = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:                          (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:                         () => Promise.resolve({ id: 'new', mapId: 'map-1', x: 0, y: 0, label: '', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0 }),
  updateMapToken:                         () => Promise.resolve(),
  deleteMapToken:                         () => Promise.resolve(),
  uploadTokenImage:                       () => Promise.resolve('path'),
  getTokenImageSignedUrl:                 () => Promise.resolve('https://signed.example.com/img.png'),
  removeTokenImage:                       () => Promise.resolve(),
  setTokenImageFromCharacterPortrait:     (...args: unknown[]) => mockSetTokenImageFromCharacterPortrait(...args),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: (...args: unknown[]) => mockListCampaignCharacters(...args),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchCampaignCharacterImages: (...args: unknown[]) => mockFetchCampaignCharacterImages(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const TOKEN: CampaignMapToken = {
  id: 'tok-1', mapId: 'map-1', x: 400, y: 300,
  label: 'Goblin', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0,
}

const CHAR_WITH_PORTRAIT = {
  campaignId: 'camp-1', characterId: 'char-1', userId: 'user-1',
  characterName: 'Aragorn', characterSummary: null, addedAt: 0,
}

const CHAR_WITHOUT_PORTRAIT = {
  campaignId: 'camp-1', characterId: 'char-2', userId: 'user-2',
  characterName: 'No-Portrait Guy', characterSummary: null, addedAt: 1,
}

const PORTRAIT_DATA_URL = 'data:image/png;base64,abc123'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — token portrait picker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListMapTokens.mockResolvedValue([TOKEN])
    mockListCampaignCharacters.mockResolvedValue([CHAR_WITH_PORTRAIT, CHAR_WITHOUT_PORTRAIT])
    mockFetchCampaignCharacterImages.mockImplementation(
      ({ characterId }: { userId: string; characterId: string }) =>
        Promise.resolve({
          portraitData: characterId === 'char-1' ? PORTRAIT_DATA_URL : null,
          symbolData: null,
        }),
    )
    mockSetTokenImageFromCharacterPortrait.mockResolvedValue('camp-1/tokens/tok-1.png')
  })

  it('shows "Use character portrait" button in owner token popup (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-popup-${TOKEN.id}`))
    expect(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`).textContent).toContain('Use character portrait')
  })

  it('shows "Usar retrato de personagem" in owner token popup (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId(`token-popup-${TOKEN.id}`))
    expect(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`).textContent).toContain('Usar retrato de personagem')
  })

  it('does NOT show portrait pick button for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId(`token-portrait-pick-${TOKEN.id}`)).toBeNull()
  })

  it('clicking picker button opens picker and calls listCampaignCharacters', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    fireEvent.click(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    await waitFor(() => expect(mockListCampaignCharacters).toHaveBeenCalledWith('camp-1'))
  })

  it('picker shows character with portrait as enabled', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    fireEvent.click(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    await waitFor(() => screen.getByTestId(`portrait-char-${CHAR_WITH_PORTRAIT.characterId}`))
    const btn = screen.getByTestId(`portrait-char-${CHAR_WITH_PORTRAIT.characterId}`) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('picker shows character without portrait as disabled', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    fireEvent.click(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    await waitFor(() => screen.getByTestId(`portrait-char-${CHAR_WITHOUT_PORTRAIT.characterId}`))
    const btn = screen.getByTestId(`portrait-char-${CHAR_WITHOUT_PORTRAIT.characterId}`) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('no-portrait character shows "(No portrait)" label (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    fireEvent.click(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    await waitFor(() => screen.getByTestId(`portrait-char-no-portrait-${CHAR_WITHOUT_PORTRAIT.characterId}`))
    expect(screen.getByTestId(`portrait-char-no-portrait-${CHAR_WITHOUT_PORTRAIT.characterId}`).textContent).toContain('No portrait')
  })

  it('no-portrait character shows "(Sem retrato)" label (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    fireEvent.click(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    await waitFor(() => screen.getByTestId(`portrait-char-no-portrait-${CHAR_WITHOUT_PORTRAIT.characterId}`))
    expect(screen.getByTestId(`portrait-char-no-portrait-${CHAR_WITHOUT_PORTRAIT.characterId}`).textContent).toContain('Sem retrato')
  })

  it('selecting a character calls setTokenImageFromCharacterPortrait with correct args', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    fireEvent.click(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    await waitFor(() => screen.getByTestId(`portrait-char-${CHAR_WITH_PORTRAIT.characterId}`))
    fireEvent.click(screen.getByTestId(`portrait-char-${CHAR_WITH_PORTRAIT.characterId}`))
    await waitFor(() =>
      expect(mockSetTokenImageFromCharacterPortrait).toHaveBeenCalledWith(
        'camp-1', TOKEN.id, PORTRAIT_DATA_URL,
      ),
    )
  })

  it('picker closes after successful portrait pick', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    fireEvent.click(screen.getByTestId(`token-portrait-pick-${TOKEN.id}`))
    await waitFor(() => screen.getByTestId(`portrait-char-${CHAR_WITH_PORTRAIT.characterId}`))
    fireEvent.click(screen.getByTestId(`portrait-char-${CHAR_WITH_PORTRAIT.characterId}`))
    await waitFor(() =>
      expect(screen.queryByTestId(`token-portrait-picker-${TOKEN.id}`)).toBeNull(),
    )
  })
})
