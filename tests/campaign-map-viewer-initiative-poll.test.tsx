/**
 * CampaignMapViewer — initiative poll + grace guard tests.
 *
 * Covers:
 *  - Owner is now included in the initiative poll (Correction 1)
 *  - Broadcast mode still skips poll
 *  - Member still polls (regression check)
 *  - Grace guard: poll result suppressed within 4s of a local edit via handleUpdateTracker
 *  - Grace guard: poll result adopted after grace period expires
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'
import type { InitiativeTracker } from '@/domain/initiative'

// ── Mock react-leaflet ────────────────────────────────────────────────────────

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

vi.mock('leaflet', () => ({
  default: {
    CRS:          { Simple: 'Simple' },
    latLngBounds: (corners: unknown) => ({ corners }),
    divIcon:      (opts: unknown) => ({ ...(opts as object), _isIcon: true }),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── Mock services (static returns — no supabase needed) ───────────────────────

const mockGetSignedUrl = vi.fn()

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: (path: string) => mockGetSignedUrl(path),
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
  createMapToken:                     () => Promise.resolve({}),
  updateMapToken:                     () => Promise.resolve(),
  deleteMapToken:                     () => Promise.resolve(),
  uploadTokenImage:                   () => Promise.resolve('path'),
  uploadTokenImageBlob:               () => Promise.resolve('path'),
  getTokenImageSignedUrl:             () => Promise.resolve('https://signed.example.com/tok.png'),
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

// ── Mock campaign-initiative (controlled) ─────────────────────────────────────

const mockGetInitiative  = vi.fn()
const mockSaveInitiative = vi.fn()

vi.mock('@/services/campaign-initiative', () => ({
  getInitiative:      (...args: unknown[]) => mockGetInitiative(...args),
  saveInitiative:     (...args: unknown[]) => mockSaveInitiative(...args),
  registerInitiative: () => Promise.resolve(),
}))

// ── Mock CampaignInitiativePanel — capture tracker + onUpdate ─────────────────

type PanelProps = {
  tracker:  InitiativeTracker
  onUpdate: (t: InitiativeTracker) => void
}

let lastPanelTracker: InitiativeTracker | null = null
let capturedOnUpdate: ((t: InitiativeTracker) => void) | null = null

vi.mock('@/components/campaigns/CampaignInitiativePanel', () => ({
  CampaignInitiativePanel: (props: PanelProps) => {
    lastPanelTracker = props.tracker
    capturedOnUpdate = props.onUpdate
    return <div data-testid="initiative-panel-stub" data-round={String(props.tracker.round)} />
  },
}))

// ── Mock DicePanel / CampaignRollLog ──────────────────────────────────────────

vi.mock('@/components/dice/DicePanel',           () => ({ DicePanel:          () => null }))
vi.mock('@/components/campaigns/CampaignRollLog', () => ({ CampaignRollLog:  () => null }))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
}

const EMPTY_TRACKER: InitiativeTracker = {
  combatants: [], activeCombatantId: null, round: 1, active: false,
}

const REMOTE_TRACKER: InitiativeTracker = {
  combatants:        [{ id: 'c1', name: 'Goblin', initiative: 12 }],
  activeCombatantId: 'c1',
  round:             2,
  active:            true,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Flush the signed-URL microtask so the map body (toolbar, toggle) becomes visible. */
async function flushSignedUrl() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Open the initiative panel by clicking the toolbar toggle. */
async function openInitiativePanel() {
  const btn = screen.getByTestId('initiative-toggle')
  act(() => { fireEvent.click(btn) })
}

// ── Poll call-count tests (no panel interaction needed) ───────────────────────

describe('CampaignMapViewer — initiative poll (Correction 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastPanelTracker  = null
    capturedOnUpdate  = null
    vi.useFakeTimers()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockGetInitiative.mockResolvedValue(EMPTY_TRACKER)
    mockSaveInitiative.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls getInitiative for owner every 5s', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await act(async () => { await Promise.resolve() })
    const before = mockGetInitiative.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(mockGetInitiative.mock.calls.length).toBeGreaterThan(before)
  })

  it('polls getInitiative for member every 5s (existing behavior preserved)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await act(async () => { await Promise.resolve() })
    const before = mockGetInitiative.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(mockGetInitiative.mock.calls.length).toBeGreaterThan(before)
  })

  it('does NOT poll getInitiative in broadcast mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner broadcast />, 'en')
    await act(async () => { await Promise.resolve() })
    const before = mockGetInitiative.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    // broadcast receivers get initiative via BroadcastChannel only, not polling
    expect(mockGetInitiative.mock.calls.length).toBe(before)
  })
})

// ── Grace guard tests (panel must be open to observe tracker prop) ────────────

describe('CampaignMapViewer — initiative poll grace guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastPanelTracker  = null
    capturedOnUpdate  = null
    vi.useFakeTimers()
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    mockGetInitiative.mockResolvedValue(EMPTY_TRACKER)
    mockSaveInitiative.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('owner adopts remote tracker when no recent local edit', async () => {
    mockGetInitiative.mockResolvedValue(REMOTE_TRACKER)
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await flushSignedUrl()
    await openInitiativePanel()

    // Advance past the poll interval — no local edit, so grace guard allows adoption
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    await act(async () => { await Promise.resolve() })

    expect(lastPanelTracker?.round).toBe(REMOTE_TRACKER.round)
  })

  it('grace guard: poll suppressed within 4s of handleUpdateTracker', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await flushSignedUrl()
    await openInitiativePanel()
    expect(capturedOnUpdate).not.toBeNull()

    // Simulate a local edit (triggers lastTrackerEditRef.current = Date.now())
    const LOCAL_TRACKER: InitiativeTracker = {
      combatants: [{ id: 'c9', name: 'Fighter', initiative: 20 }],
      activeCombatantId: 'c9', round: 99, active: true,
    }
    act(() => { capturedOnUpdate!(LOCAL_TRACKER) })

    // Point subsequent polls at a different tracker
    mockGetInitiative.mockResolvedValue({ ...REMOTE_TRACKER, round: 999 })

    // Advance 3s — still within the 4s grace period; poll fires but must NOT clobber
    // (Date.now() - lastTrackerEditRef.current ≈ 0ms < 4000ms with real Date.now + fake timers)
    await act(async () => { await vi.advanceTimersByTimeAsync(3_000) })
    await act(async () => { await Promise.resolve() })

    expect(lastPanelTracker?.round).toBe(99)
  })

  it('grace guard: remote tracker adopted after 4s grace expires', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await flushSignedUrl()
    await openInitiativePanel()
    expect(capturedOnUpdate).not.toBeNull()

    // Record real edit timestamp and advance Date.now() past grace for subsequent polls
    const editTime = Date.now()
    const LOCAL_TRACKER: InitiativeTracker = {
      combatants: [{ id: 'c9', name: 'Fighter', initiative: 20 }],
      activeCombatantId: 'c9', round: 99, active: true,
    }
    act(() => { capturedOnUpdate!(LOCAL_TRACKER) })

    const FRESH_REMOTE: InitiativeTracker = { ...REMOTE_TRACKER, round: 7 }
    mockGetInitiative.mockResolvedValue(FRESH_REMOTE)

    // Make Date.now() return a value past the 4s grace period
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(editTime + 5_000)

    try {
      // Advance 5s — the interval fires, and Date.now() - editTime = 5000 > 4000 → adopted
      await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
      await act(async () => { await Promise.resolve() })

      expect(lastPanelTracker?.round).toBe(7)
    } finally {
      dateSpy.mockRestore()
    }
  })
})
