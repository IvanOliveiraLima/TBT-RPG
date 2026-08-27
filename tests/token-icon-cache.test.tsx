/**
 * Token icon cache key — regression for the "color ignored when image present" bug.
 *
 * Bug: the cache key was `${imageUrl ?? color}-${d}-${condKey}-${label}`.
 * When imageUrl was set, color was dropped from the key. Two tokens with the
 * same image but different ring colors shared one cache entry → color change
 * looked invisible until the label changed (which IS in the key).
 *
 * Fix: key is now `${imageUrl ?? ''}-${color}-${d}-${condKey}-${label}`.
 * Both image and color are always present in the key, so different colors
 * always produce different icons even when the image is the same.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── Spy on L.divIcon to observe what HTML is produced per token icon ───────────

const divIconSpy = vi.fn((opts: unknown) => ({ ...(opts as object), _isIcon: true }))

vi.mock('leaflet', () => ({
  default: {
    CRS:          { Simple: 'Simple' },
    latLngBounds: (corners: unknown) => ({ corners }),
    divIcon:      (...args: unknown[]) => divIconSpy(...args),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── react-leaflet ─────────────────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer:  ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  ImageOverlay:  () => null,
  SVGOverlay:    () => null,
  Marker:        ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup:         ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({
    dragging: { enable: vi.fn(), disable: vi.fn() },
    getContainer: () => ({
      style: { cursor: '', touchAction: '' },
      setPointerCapture: () => {},
      addEventListener:  () => {},
      removeEventListener: () => {},
    }),
    mouseEventToLatLng:  () => ({ lat: 0, lng: 0 }),
    invalidateSize:      vi.fn(),
    latLngToLayerPoint:  () => ({ x: 0, y: 0 }),
    on:  vi.fn(),
    off: vi.fn(),
  }),
  useMapEvents: () => null,
}))

// ── Services ──────────────────────────────────────────────────────────────────

const mockListMapTokens = vi.fn()

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

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:                      (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:                     () => Promise.resolve({}),
  updateMapToken:                     () => Promise.resolve(),
  deleteMapToken:                     () => Promise.resolve(),
  uploadTokenImage:                   () => Promise.resolve('path'),
  uploadTokenImageBlob:               () => Promise.resolve('path'),
  // Same signed URL for ALL paths — this simulates the bug scenario where
  // two tokens share an image path (same URL) but differ only in color.
  getTokenImageSignedUrl:             () => Promise.resolve('https://signed.example.com/shared-img.png'),
  removeTokenImage:                   () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: () => Promise.resolve('path'),
}))

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:  () => Promise.resolve([]),
  createMapArea: () => Promise.resolve({ id: 'a', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
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
  fetchCampaignCharacterImages: () => Promise.resolve({ portraitData: null, symbolData: null }),
  fetchLinkedCharactersDetails: () => Promise.resolve([]),
}))

vi.mock('@/services/campaign-initiative', () => ({
  getInitiative:      () => Promise.resolve({ combatants: [], activeCombatantId: null, round: 1, active: false }),
  saveInitiative:     () => Promise.resolve(),
  registerInitiative: () => Promise.resolve(),
}))

vi.mock('@/services/campaign', () => ({
  getAutoInitiative:    () => Promise.resolve(false),
  updateAutoInitiative: () => Promise.resolve(),
}))

vi.mock('@/services/realtime', () => ({
  subscribeCharacterChanges: () => () => {},
}))

vi.mock('@/components/dice/DicePanel',            () => ({ DicePanel:          () => null }))
vi.mock('@/components/campaigns/CampaignRollLog', () => ({ CampaignRollLog:  () => null }))
vi.mock('@/components/campaigns/CampaignInitiativePanel', () => ({ CampaignInitiativePanel: () => null }))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
  published: false,
}

// Two tokens: same imagePath (→ same resolved signed URL) but DIFFERENT colors.
// Before the fix the icon cache key used imageUrl when present, dropping color —
// so both tokens shared one cache entry (and one had the wrong ring color).
const TOKEN_RED: CampaignMapToken = {
  id: 'tok-red', mapId: 'map-1', x: 100, y: 100,
  label: 'Dragon', color: '#FF0000', size: 2,
  imagePath: 'camp-1/tokens/dragon.png',
  conditions: [], createdAt: 10, characterId: null, hpMax: null,
}

const TOKEN_BLUE: CampaignMapToken = {
  id: 'tok-blue', mapId: 'map-1', x: 300, y: 300,
  label: 'Dragon', color: '#0000FF', size: 2,
  imagePath: 'camp-1/tokens/dragon.png', // same path → same resolved URL
  conditions: [], createdAt: 11, characterId: null, hpMax: null,
}

// Token without image — verifies no regression in the no-image path.
const TOKEN_NO_IMAGE: CampaignMapToken = {
  id: 'tok-noi', mapId: 'map-1', x: 500, y: 200,
  label: 'Slime', color: '#00AA00', size: 1,
  imagePath: null,
  conditions: [], createdAt: 12, characterId: null, hpMax: null,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('token icon cache key — color must be independent of imageUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    divIconSpy.mockClear()
  })

  it('same image different color → divIcon produces different ring HTML for each token', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_RED, TOKEN_BLUE])
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')

    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBe(2))
    // Wait for signed URL resolution and icon cache hydration
    await waitFor(() => expect(divIconSpy).toHaveBeenCalled())

    const htmlValues: string[] = divIconSpy.mock.calls
      .map(c => (c[0] as { html?: string }).html ?? '')

    // Both colors must appear in the generated icons (different ring border)
    expect(htmlValues.some(h => h.includes('#FF0000'))).toBe(true)
    expect(htmlValues.some(h => h.includes('#0000FF'))).toBe(true)
  })

  it('no-image token: color appears as disc background (no regression)', async () => {
    mockListMapTokens.mockResolvedValue([TOKEN_NO_IMAGE])
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')

    await waitFor(() => expect(screen.getAllByTestId('marker').length).toBe(1))
    await waitFor(() => expect(divIconSpy).toHaveBeenCalled())

    const htmlValues: string[] = divIconSpy.mock.calls
      .map(c => (c[0] as { html?: string }).html ?? '')

    // No-image token uses color as background; it must appear in the icon HTML
    expect(htmlValues.some(h => h.includes('#00AA00'))).toBe(true)
  })
})
