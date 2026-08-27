/**
 * CampaignMapViewer — linked character HP: realtime + polling (F2a).
 *
 * Covers:
 *  - subscribeCharacterChanges is called for owner (not broadcast, not member)
 *  - Realtime event with a linked char id triggers one refetch after the 300 ms debounce
 *  - Realtime event with a non-linked id does NOT trigger a refetch
 *  - Polling fallback: 10 s interval when realtime is inactive (default)
 *  - Polling fallback: 30 s interval when realtime becomes active
 *  - Neither subscription nor polling fires in broadcast mode
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

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

vi.mock('leaflet', () => ({
  default: {
    CRS:          { Simple: 'Simple' },
    latLngBounds: (corners: unknown) => ({ corners }),
    divIcon:      (opts: unknown) => ({ ...(opts as object), _isIcon: true }),
  },
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── Services (static stubs) ───────────────────────────────────────────────────

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
  listCampaignCharacters: () => Promise.resolve([{ characterId: 'char-1', userId: 'u1' }]),
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

vi.mock('@/components/dice/DicePanel',            () => ({ DicePanel:          () => null }))
vi.mock('@/components/campaigns/CampaignRollLog', () => ({ CampaignRollLog:  () => null }))
vi.mock('@/components/campaigns/CampaignInitiativePanel', () => ({ CampaignInitiativePanel: () => null }))

// ── campaign-view (controlled) ────────────────────────────────────────────────

const mockFetchLinkedCharactersDetails = vi.fn()
vi.mock('@/services/campaign-view', () => ({
  fetchCampaignCharacterImages:   () => Promise.resolve({ portraitData: null, symbolData: null }),
  fetchLinkedCharactersDetails: (...args: unknown[]) => mockFetchLinkedCharactersDetails(...args),
}))

// ── Realtime (controllable) ───────────────────────────────────────────────────

type ChangeCb = (id: string) => void
type StatusCb = (status: string) => void

let capturedOnChange: ChangeCb | null = null
let capturedOnStatus: StatusCb | null = null
const mockCleanup = vi.fn()
const mockSubscribeCharacterChanges = vi.fn((onChange: ChangeCb, onStatus: StatusCb) => {
  capturedOnChange = onChange
  capturedOnStatus = onStatus
  onStatus('inactive')
  return mockCleanup
})

vi.mock('@/services/realtime', () => ({
  subscribeCharacterChanges: (onChange: ChangeCb, onStatus: StatusCb) =>
    mockSubscribeCharacterChanges(onChange, onStatus),
}))

// ── Fixture ───────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1', campaignId: 'camp-1', name: 'Dungeon',
  imagePath: 'camp-1/map-1.png', width: 2048, height: 1024, createdAt: 0,
  gridEnabled: false, gridSize: null, gridOffsetX: 0, gridOffsetY: 0, gridColor: '#5DCAA5',
  published: false,
}

const DETAIL_STUB = {
  characterId: 'char-1',
  ownerUserId: 'u1',
  ownerDisplayName: 'Alice',
  character: {
    id: 'char-1', name: 'Aragorn', race: '', background: '', alignment: '',
    classes: [], experience: 0, age: '', height: '', weight: '',
    eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hp: { current: 28, max: 40, temp: 0 },
    hitDice: [], deathSaves: { successes: 0, failures: 0 },
    ac: 14, initiative: 2, speed: 30, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks: [], inventory: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features: [], backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '', mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [], spellSlots: {},
    spellcastingAbility: '', spellcastingClass: '',
    images: {}, createdAt: 0, updatedAt: 0,
  },
  portraitData: null,
  symbolData: null,
}

function resetMocks() {
  capturedOnChange = null
  capturedOnStatus = null
  mockCleanup.mockReset()
  mockSubscribeCharacterChanges.mockClear()
  mockFetchLinkedCharactersDetails.mockReset().mockResolvedValue([DETAIL_STUB])
}

// ── Tests — subscription lifecycle ───────────────────────────────────────────

describe('CampaignMapViewer — linked HP subscription lifecycle', () => {
  beforeEach(() => { resetMocks() })

  it('subscribes to character changes on mount (owner, not broadcast)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('camp-1'))
    expect(mockSubscribeCharacterChanges).toHaveBeenCalledTimes(1)
  })

  it('does NOT subscribe in broadcast mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster broadcast />, 'en')
    await act(async () => { await Promise.resolve() })
    expect(mockSubscribeCharacterChanges).not.toHaveBeenCalled()
  })

  it('does NOT subscribe for member (isMaster=false)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster={false} />, 'en')
    await act(async () => { await Promise.resolve() })
    expect(mockSubscribeCharacterChanges).not.toHaveBeenCalled()
  })

  it('calls cleanup on unmount', async () => {
    const { unmount } = renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('camp-1'))
    unmount()
    expect(mockCleanup).toHaveBeenCalled()
  })
})

// ── Tests — event filtering ───────────────────────────────────────────────────

describe('CampaignMapViewer — linked HP event filtering', () => {
  beforeEach(() => { resetMocks() })

  it('realtime event with linked char id triggers a refetch after 300 ms debounce', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('camp-1'))
    const callsBefore = mockFetchLinkedCharactersDetails.mock.calls.length

    act(() => { capturedOnChange?.('char-1') })
    // Debounce not fired yet
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore)

    await act(async () => { await new Promise(r => setTimeout(r, 350)) })
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore + 1)
  })

  it('3 rapid events with the same linked id produce exactly 1 refetch (coalescing)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('camp-1'))
    const callsBefore = mockFetchLinkedCharactersDetails.mock.calls.length

    act(() => {
      capturedOnChange?.('char-1')
      capturedOnChange?.('char-1')
      capturedOnChange?.('char-1')
    })
    await act(async () => { await new Promise(r => setTimeout(r, 400)) })
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore + 1)
  })

  it('realtime event with non-linked id does NOT trigger a refetch', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('camp-1'))
    const callsBefore = mockFetchLinkedCharactersDetails.mock.calls.length

    act(() => { capturedOnChange?.('other-char-99') })
    await act(async () => { await new Promise(r => setTimeout(r, 400)) })
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore)
  })
})

// ── Tests — polling fallback intervals ───────────────────────────────────────

describe('CampaignMapViewer — linked HP polling fallback', () => {
  beforeEach(() => { resetMocks() })
  afterEach(() => { vi.useRealTimers() })

  it('uses 10 s polling when realtime is inactive (default)', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
      await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('camp-1'))
      const call = spy.mock.calls.find(([, delay]) => delay === 10_000)
      expect(call).toBeDefined()
    } finally {
      spy.mockRestore()
    }
  })

  it('switches to 30 s polling when realtime becomes active', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      renderWithI18n(<CampaignMapViewer map={MAP} isMaster />, 'en')
      await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('camp-1'))

      act(() => { capturedOnStatus?.('active') })
      await waitFor(() => {
        expect(spy.mock.calls.some(([, delay]) => delay === 30_000)).toBe(true)
      })
    } finally {
      spy.mockRestore()
    }
  })

  it('no polling for member (isMaster=false)', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      renderWithI18n(<CampaignMapViewer map={MAP} isMaster={false} />, 'en')
      await act(async () => { await Promise.resolve() })
      const call10 = spy.mock.calls.find(([, delay]) => delay === 10_000)
      const call30 = spy.mock.calls.find(([, delay]) => delay === 30_000)
      expect(call10).toBeUndefined()
      expect(call30).toBeUndefined()
    } finally {
      spy.mockRestore()
    }
  })
})
