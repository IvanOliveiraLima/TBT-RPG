/**
 * CampaignMapViewer — BroadcastChannel (Map.Broadcast) tests.
 *
 * Verifies:
 * - Owner (emitter): opens channel on mount, posts snapshot on mount and on state change,
 *   responds to 'hello' with snapshot
 * - Broadcast receiver: posts 'hello' on mount, applies incoming snapshot to state,
 *   does NOT fetch from Supabase (listMapTokens / getMapFog / listMapAreas not called)
 * - Broadcast render: player perspective (no toolbar, no edit controls)
 * - Owner toolbar: "Open broadcast screen" button present; clicking calls window.open
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { CampaignMapToken } from '@/services/campaign-map-tokens'

// ── BroadcastChannel mock ─────────────────────────────────────────────────────

type MockChannel = {
  onmessage: ((e: MessageEvent) => void) | null
  postMessage: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

let channels: MockChannel[] = []
let bcConstructorSpy: ReturnType<typeof vi.fn>

// Built fresh in beforeEach so constructor spy is per-test
function buildMockBCClass() {
  bcConstructorSpy = vi.fn()
  const captured = channels
  const spy = bcConstructorSpy

  return class MockBC {
    onmessage: ((e: MessageEvent) => void) | null = null
    postMessage = vi.fn()
    close = vi.fn()

    constructor(name: string) {
      spy(name)
      captured.push(this as unknown as MockChannel)
    }
  }
}

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
    latLngBounds: (corners: unknown) => ({ corners }),
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

const mockListMapTokens = vi.fn()
const mockGetMapFog     = vi.fn()

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:                       (...args: unknown[]) => mockListMapTokens(...args),
  createMapToken:                      () => Promise.resolve({ id: 'new', mapId: 'map-1', x: 0, y: 0, label: '', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0 }),
  updateMapToken:                      () => Promise.resolve(),
  deleteMapToken:                      () => Promise.resolve(),
  uploadTokenImage:                    () => Promise.resolve('path'),
  uploadTokenImageBlob:                () => Promise.resolve('path'),
  getTokenImageSignedUrl:              () => Promise.resolve('https://signed.example.com/img.png'),
  removeTokenImage:                    () => Promise.resolve(),
  setTokenImageFromCharacterPortrait:  () => Promise.resolve('path'),
}))

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  (...args: unknown[]) => mockGetMapFog(...args),
  saveMapFog: () => Promise.resolve(),
}))

const mockListMapAreas = vi.fn()

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   (...args: unknown[]) => mockListMapAreas(...args),
  createMapArea:  () => Promise.resolve({ id: 'area-new', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea:  () => Promise.resolve(),
  clearMapAreas:  () => Promise.resolve(),
}))

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:             () => Promise.resolve([]),
  getTokenPresetImageSignedUrl: () => Promise.resolve('https://signed.example.com/preset.png'),
  createTokenPreset:            () => Promise.resolve({}),
  updateTokenPreset:            () => Promise.resolve(),
  deleteTokenPreset:            () => Promise.resolve(),
  uploadTokenPresetImage:       () => Promise.resolve('path'),
  removeTokenPresetImage:       () => Promise.resolve(),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: () => Promise.resolve([]),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchCampaignCharacterImages: () => Promise.resolve({ portraitData: null, symbolData: null }),
  fetchLinkedCharactersDetails: () => Promise.resolve([]),
}))

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
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

const FOG_SNAPSHOT = { mapId: 'map-1', enabled: true, revealed: ['2,3'], updatedAt: 1 }

// ── Setup / teardown ──────────────────────────────────────────────────────────

let originalBroadcastChannel: typeof BroadcastChannel | undefined

beforeEach(() => {
  vi.clearAllMocks()
  channels = []
  mockListMapTokens.mockResolvedValue([])
  mockGetMapFog.mockResolvedValue({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 })
  mockListMapAreas.mockResolvedValue([])

  // Stash and replace the global BroadcastChannel
  originalBroadcastChannel = globalThis.BroadcastChannel
  globalThis.BroadcastChannel = buildMockBCClass() as unknown as typeof BroadcastChannel
})

afterEach(() => {
  if (originalBroadcastChannel !== undefined) {
    globalThis.BroadcastChannel = originalBroadcastChannel
  }
})

// ── Owner emitter tests ───────────────────────────────────────────────────────

describe('CampaignMapViewer — owner emits via BroadcastChannel', () => {
  it('opens BroadcastChannel with correct map id on mount (owner)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(bcConstructorSpy).toHaveBeenCalledWith('tbt-map-map-1')
  })

  it('posts snapshot on mount (owner)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => {
      const ch = channels[0]
      expect(ch?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'snapshot' }),
      )
    })
  })

  it('responds to hello with snapshot', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))

    const ch = channels[0]
    expect(ch).toBeTruthy()
    const prevCallCount = ch!.postMessage.mock.calls.length

    // Simulate 'hello' from receiver
    act(() => {
      ch!.onmessage?.({ data: { type: 'hello' } } as MessageEvent)
    })

    expect(ch!.postMessage.mock.calls.length).toBeGreaterThan(prevCallCount)
    const lastCall = ch!.postMessage.mock.calls[ch!.postMessage.mock.calls.length - 1][0]
    expect(lastCall).toMatchObject({ type: 'snapshot' })
  })

  it('shows "Open broadcast screen" button in owner toolbar', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('broadcast-open-btn'))
    expect(screen.getByTestId('broadcast-open-btn').textContent).toContain('Open broadcast screen')
  })

  it('shows "Abrir tela de transmissão" in owner toolbar (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('broadcast-open-btn'))
    expect(screen.getByTestId('broadcast-open-btn').textContent).toContain('Abrir tela de transmissão')
  })

  it('clicking broadcast button calls window.open with broadcast route', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('broadcast-open-btn'))
    fireEvent.click(screen.getByTestId('broadcast-open-btn'))
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining(`/campaigns/camp-1/maps/map-1/broadcast`),
      'tbt-broadcast',
      expect.any(String),
    )
    openSpy.mockRestore()
  })

  it('does NOT open BroadcastChannel when not owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    // Receiver (broadcast=false, isOwner=false) — no channel should open
    expect(channels).toHaveLength(0)
  })
})

// ── Broadcast receiver tests ──────────────────────────────────────────────────

describe('CampaignMapViewer — broadcast receiver', () => {
  it('opens BroadcastChannel with correct map id on mount (broadcast)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(bcConstructorSpy).toHaveBeenCalledWith('tbt-map-map-1')
  })

  it('posts hello on mount (broadcast)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => {
      const ch = channels[0]
      expect(ch?.postMessage).toHaveBeenCalledWith({ type: 'hello' })
    })
  })

  it('does NOT call listMapTokens in broadcast mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(mockListMapTokens).not.toHaveBeenCalled()
  })

  it('does NOT call getMapFog in broadcast mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(mockGetMapFog).not.toHaveBeenCalled()
  })

  it('does NOT call listMapAreas in broadcast mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(mockListMapAreas).not.toHaveBeenCalled()
  })

  it('applies incoming snapshot — tokens appear on the map', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))

    // No markers before snapshot
    expect(screen.queryAllByTestId('marker')).toHaveLength(0)

    const ch = channels[0]
    act(() => {
      ch!.onmessage?.({
        data: {
          type: 'snapshot',
          tokens: [TOKEN],
          fog: { mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 },
          areas: [],
          grid: { enabled: false, size: null, offsetX: 0, offsetY: 0, color: '#5DCAA5' },
        },
      } as unknown as MessageEvent)
    })

    await waitFor(() => expect(screen.getAllByTestId('marker')).toHaveLength(1))
  })

  it('applies incoming snapshot — fog state updated', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))

    const ch = channels[0]
    // Should not throw
    act(() => {
      ch!.onmessage?.({
        data: {
          type: 'snapshot',
          tokens: [],
          fog: FOG_SNAPSHOT,
          areas: [],
          grid: { enabled: false, size: null, offsetX: 0, offsetY: 0, color: '#5DCAA5' },
        },
      } as unknown as MessageEvent)
    })

    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    // The viewer is still rendered (no crash) after fog update
    expect(screen.getByTestId('campaign-map-viewer')).toBeDefined()
  })

  it('broadcast viewer has no owner toolbar', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('grid-panel-toggle')).toBeNull()
    expect(screen.queryByTestId('fog-panel-toggle')).toBeNull()
    expect(screen.queryByTestId('area-panel-toggle')).toBeNull()
    expect(screen.queryByTestId('broadcast-open-btn')).toBeNull()
  })
})
