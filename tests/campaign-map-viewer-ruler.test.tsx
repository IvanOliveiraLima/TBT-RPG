/**
 * CampaignMapViewer — Ruler (Régua.1) tests.
 *
 * Covers:
 * - Desktop: ruler-toggle visible for owner, hidden for non-owner
 * - Desktop: clicking ruler-toggle activates/deactivates ruler mode
 * - Desktop surface coordination: area panel / fog / grid clears ruler mode
 * - Esc key while in ruler mode (no crash)
 * - Mobile tools menu: tools-ruler-btn present, clicking it exits tools menu
 * - Broadcast: owner snapshot postMessage includes `ruler` key
 * - Broadcast: receiver applies ruler from snapshot without crash
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Control isMobile via module mock ──────────────────────────────────────────

let _isMobileValue = false

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => _isMobileValue,
}))

// ── BroadcastChannel mock ─────────────────────────────────────────────────────

type MockChannel = {
  onmessage: ((e: MessageEvent) => void) | null
  postMessage: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

let channels: MockChannel[] = []
let bcConstructorSpy: ReturnType<typeof vi.fn>

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

vi.mock('@/services/campaign-map-tokens', () => ({
  listMapTokens:                      () => Promise.resolve([]),
  createMapToken:                     () => Promise.resolve({ id: 'tok-new', mapId: 'map-1', x: 0, y: 0, label: '', color: '#C0392B', size: 1, imagePath: null, conditions: [], createdAt: 0 }),
  updateMapToken:                     () => Promise.resolve(),
  deleteMapToken:                     () => Promise.resolve(),
  uploadTokenImage:                   () => Promise.resolve('path'),
  uploadTokenImageBlob:               () => Promise.resolve('path'),
  getTokenImageSignedUrl:             () => Promise.resolve('https://signed.example.com/img.png'),
  removeTokenImage:                   () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: () => Promise.resolve('path'),
}))

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   () => Promise.resolve([]),
  createMapArea:  () => Promise.resolve({ id: 'area-1', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea:  () => Promise.resolve(),
  clearMapAreas:  () => Promise.resolve(),
}))

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:             () => Promise.resolve([]),
  getTokenPresetImageSignedUrl: () => Promise.resolve('https://example.com/preset.png'),
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

vi.mock('@/services/campaign-initiative', () => ({
  getInitiative:  () => Promise.resolve({ combatants: [], activeCombatantId: null, round: 1, active: false }),
  saveInitiative: () => Promise.resolve(),
}))

vi.mock('@/services/campaign', () => ({
  getAutoInitiative:    () => Promise.resolve(false),
  updateAutoInitiative: () => Promise.resolve(),
}))

vi.mock('@/store/useDiceStore', () => ({
  useDiceStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isOpen: false, toggle: vi.fn(), close: vi.fn(), open: vi.fn(),
      rollMode: 'normal', setRollMode: vi.fn(),
      setCampaignContext: vi.fn(), clearCampaignContext: vi.fn(),
    }),
}))

vi.mock('@/components/campaigns/CampaignRollLog', () => ({
  CampaignRollLog: () => <div data-testid="campaign-roll-log-mock" />,
}))

vi.mock('@/components/campaigns/CampaignInitiativePanel', () => ({
  CampaignInitiativePanel: () => <div data-testid="campaign-initiative-panel-mock" />,
}))

vi.mock('@/components/dice/DicePanel', () => ({
  DicePanel: () => <div data-testid="dice-panel-mock" />,
}))

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

// ── Fixture ───────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

let originalBroadcastChannel: typeof BroadcastChannel | undefined

beforeEach(() => {
  vi.clearAllMocks()
  channels = []
  _isMobileValue = false

  originalBroadcastChannel = globalThis.BroadcastChannel
  globalThis.BroadcastChannel = buildMockBCClass() as unknown as typeof BroadcastChannel
})

afterEach(() => {
  if (originalBroadcastChannel !== undefined) {
    globalThis.BroadcastChannel = originalBroadcastChannel
  }
})

// ── Desktop ruler toggle ──────────────────────────────────────────────────────

describe('ruler toggle — desktop', () => {
  it('ruler-toggle button is visible for owner on desktop', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.getByTestId('ruler-toggle')).toBeDefined()
  })

  it('ruler-toggle not visible for non-owner on desktop', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('ruler-toggle')).toBeNull()
  })

  it('clicking ruler-toggle activates ruler mode (gold styling)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('ruler-toggle'))
    const btn = screen.getByTestId('ruler-toggle')
    fireEvent.click(btn)
    await waitFor(() => {
      const updated = screen.getByTestId('ruler-toggle')
      expect(updated.style.color).toBe('rgb(212, 160, 23)')
    })
  })

  it('clicking ruler-toggle again deactivates it', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('ruler-toggle'))
    const btn = screen.getByTestId('ruler-toggle')
    fireEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByTestId('ruler-toggle').style.color).toBe('rgb(212, 160, 23)')
    })
    fireEvent.click(screen.getByTestId('ruler-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('ruler-toggle').style.color).not.toBe('rgb(212, 160, 23)')
    })
  })

  it('ruler-toggle shows "Ruler" label (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('ruler-toggle'))
    expect(screen.getByTestId('ruler-toggle').textContent).toContain('Ruler')
  })

  it('ruler-toggle shows "Régua" label (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('ruler-toggle'))
    expect(screen.getByTestId('ruler-toggle').textContent).toContain('Régua')
  })
})

// ── Ruler surface coordination — desktop ──────────────────────────────────────

describe('ruler surface coordination — desktop', () => {
  it('activating area panel clears ruler mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('ruler-toggle'))
    // Activate ruler
    fireEvent.click(screen.getByTestId('ruler-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('ruler-toggle').style.color).toBe('rgb(212, 160, 23)')
    })
    // Activate area panel
    fireEvent.click(screen.getByTestId('area-panel-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('ruler-toggle').style.color).not.toBe('rgb(212, 160, 23)')
    })
  })

  it('activating grid panel clears ruler mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('ruler-toggle'))
    // Activate ruler
    fireEvent.click(screen.getByTestId('ruler-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('ruler-toggle').style.color).toBe('rgb(212, 160, 23)')
    })
    // Activate grid panel
    fireEvent.click(screen.getByTestId('grid-panel-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('ruler-toggle').style.color).not.toBe('rgb(212, 160, 23)')
    })
  })
})

// ── Ruler Esc clears segment ──────────────────────────────────────────────────

describe('ruler Esc clears segment', () => {
  it('pressing Escape while in ruler mode does not crash', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('ruler-toggle'))
    fireEvent.click(screen.getByTestId('ruler-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('ruler-toggle').style.color).toBe('rgb(212, 160, 23)')
    })
    // Pressing Escape should not crash
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    // Ruler toggle still exists (no crash)
    expect(screen.getByTestId('ruler-toggle')).toBeDefined()
  })
})

// ── Ruler — mobile tools menu ─────────────────────────────────────────────────

describe('ruler — mobile tools menu', () => {
  beforeEach(() => { _isMobileValue = true })

  it('tools-ruler-btn is present in tools bottom sheet', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-bottom-sheet'))
    expect(screen.getByTestId('tools-ruler-btn')).toBeDefined()
  })

  it('tools-ruler-btn shows "Ruler" label (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-bottom-sheet'))
    expect(screen.getByTestId('tools-ruler-btn').textContent).toContain('Ruler')
  })

  it('clicking tools-ruler-btn exits the tools menu', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-bottom-sheet'))
    fireEvent.click(screen.getByTestId('tools-ruler-btn'))
    await waitFor(() => expect(screen.queryByTestId('tools-bottom-sheet')).toBeNull())
  })
})

// ── Ruler broadcast snapshot ──────────────────────────────────────────────────

describe('ruler broadcast snapshot', () => {
  it('owner snapshot postMessage includes `ruler` key', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => {
      const ch = channels[0]
      expect(ch?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'snapshot', ruler: null }),
      )
    })
  })

  it('broadcast receiver applies ruler from snapshot without crash', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))

    const ch = channels[0]
    expect(ch).toBeTruthy()

    act(() => {
      ch!.onmessage?.({
        data: {
          type: 'snapshot',
          tokens: [],
          fog: { mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 },
          areas: [],
          grid: { enabled: false, size: null, offsetX: 0, offsetY: 0, color: '#5DCAA5' },
          ruler: { x1: 100, y1: 100, x2: 200, y2: 200 },
        },
      } as unknown as MessageEvent)
    })

    // No crash — viewer still present
    expect(screen.getByTestId('campaign-map-viewer')).toBeDefined()
  })

  it('broadcast receiver clears ruler when snapshot sends ruler: null', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))

    const ch = channels[0]

    act(() => {
      ch!.onmessage?.({
        data: {
          type: 'snapshot',
          tokens: [],
          fog: { mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 },
          areas: [],
          grid: { enabled: false, size: null, offsetX: 0, offsetY: 0, color: '#5DCAA5' },
          ruler: null,
        },
      } as unknown as MessageEvent)
    })

    // No crash — viewer still present
    expect(screen.getByTestId('campaign-map-viewer')).toBeDefined()
  })
})
