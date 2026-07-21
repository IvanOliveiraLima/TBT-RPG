/**
 * CampaignMapViewer — Dice.3b: roll log panel + GM dice tray tests.
 *
 * Verifies:
 * - Roll log toggle visible to all members (not broadcast) — EN/PT
 * - Roll log panel renders CampaignRollLog with correct campaignId + isOwner
 * - Roll log absent in broadcast mode
 * - GM dice FAB visible when isOwner && !broadcast — EN/PT
 * - GM dice FAB opens/closes DicePanel
 * - GM dice FAB absent for members and in broadcast
 * - Campaign context set as { campaignTargets: [campaignId], actorName: 'GM'/'Mestre' } on mount for owner (!broadcast)
 * - Campaign context cleared on unmount
 * - Members do not receive campaign context
 * - Broadcast mode: no context set even for owner
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Mock useDiceStore ─────────────────────────────────────────────────────────

const mockSetCampaignContext  = vi.fn()
const mockClearCampaignContext = vi.fn()

vi.mock('@/store/useDiceStore', () => ({
  useDiceStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isOpen:               false,
      toggle:               vi.fn(),
      close:                vi.fn(),
      open:                 vi.fn(),
      rollMode:             'normal',
      setRollMode:          vi.fn(),
      setCampaignContext:   mockSetCampaignContext,
      clearCampaignContext: mockClearCampaignContext,
    }),
}))

// ── Mock CampaignRollLog ──────────────────────────────────────────────────────

vi.mock('@/components/campaigns/CampaignRollLog', () => ({
  CampaignRollLog: ({ campaignId, isOwner }: { campaignId: string; isOwner: boolean }) => (
    <div
      data-testid="campaign-roll-log-mock"
      data-campaign-id={campaignId}
      data-is-owner={String(isOwner)}
    />
  ),
}))

// ── Mock DicePanel ────────────────────────────────────────────────────────────

vi.mock('@/components/dice/DicePanel', () => ({
  DicePanel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="dice-panel-mock">
      <button type="button" data-testid="dice-panel-close" onClick={onClose}>close</button>
    </div>
  ),
}))

// ── Mock react-leaflet ────────────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: () => null,
  SVGOverlay:   () => null,
  Marker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Popup:  ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
  createMapToken:                     () => Promise.resolve({}),
  updateMapToken:                     () => Promise.resolve(),
  deleteMapToken:                     () => Promise.resolve(),
  uploadTokenImage:                   () => Promise.resolve('path'),
  uploadTokenImageBlob:               () => Promise.resolve('path'),
  getTokenImageSignedUrl:             () => Promise.resolve('https://example.com/img.png'),
  removeTokenImage:                   () => Promise.resolve(),
  setTokenImageFromCharacterPortrait: () => Promise.resolve('path'),
}))

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
}))

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:  () => Promise.resolve([]),
  createMapArea: () => Promise.resolve({}),
  deleteMapArea: () => Promise.resolve(),
  clearMapAreas: () => Promise.resolve(),
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

// ── Roll log panel tests ──────────────────────────────────────────────────────

describe('CampaignMapViewer — roll log panel', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows roll log toggle for member (EN: "Rolls")', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    expect(screen.getByTestId('roll-log-toggle').textContent).toContain('Rolls')
  })

  it('shows roll log toggle for member (PT: "Rolagens")', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'pt')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    expect(screen.getByTestId('roll-log-toggle').textContent).toContain('Rolagens')
  })

  it('shows roll log toggle for owner too', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
  })

  it('CampaignRollLog is not mounted until toggle is clicked', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    expect(screen.queryByTestId('campaign-roll-log-mock')).toBeNull()
  })

  it('opens CampaignRollLog with correct campaignId when toggled', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    fireEvent.click(screen.getByTestId('roll-log-toggle'))
    const log = screen.getByTestId('campaign-roll-log-mock')
    expect(log).toBeDefined()
    expect(log.getAttribute('data-campaign-id')).toBe('camp-1')
  })

  it('passes isOwner=false to CampaignRollLog for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    fireEvent.click(screen.getByTestId('roll-log-toggle'))
    expect(screen.getByTestId('campaign-roll-log-mock').getAttribute('data-is-owner')).toBe('false')
  })

  it('passes isOwner=true to CampaignRollLog for owner', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    fireEvent.click(screen.getByTestId('roll-log-toggle'))
    expect(screen.getByTestId('campaign-roll-log-mock').getAttribute('data-is-owner')).toBe('true')
  })

  it('closes the log when toggle is clicked again', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    fireEvent.click(screen.getByTestId('roll-log-toggle'))
    expect(screen.getByTestId('campaign-roll-log-mock')).toBeDefined()
    fireEvent.click(screen.getByTestId('roll-log-toggle'))
    expect(screen.queryByTestId('campaign-roll-log-mock')).toBeNull()
  })

  it('hides roll log toggle in broadcast mode', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} broadcast />, 'en')
    await waitFor(() => expect(screen.getByTestId('campaign-map-viewer')).toBeDefined())
    expect(screen.queryByTestId('roll-log-toggle')).toBeNull()
  })
})

// ── GM dice tray tests ────────────────────────────────────────────────────────

describe('CampaignMapViewer — GM dice tray', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows dice FAB for owner (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
  })

  it('shows dice FAB for owner (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
  })

  it('does not show dice FAB for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    expect(screen.queryByTestId('viewer-dice-fab')).toBeNull()
  })

  it('does not show dice FAB in broadcast mode (owner)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner broadcast />, 'en')
    await waitFor(() => expect(screen.getByTestId('campaign-map-viewer')).toBeDefined())
    expect(screen.queryByTestId('viewer-dice-fab')).toBeNull()
  })

  it('DicePanel is not open by default', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
    expect(screen.queryByTestId('dice-panel-mock')).toBeNull()
  })

  it('opens DicePanel when FAB is clicked', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
    fireEvent.click(screen.getByTestId('viewer-dice-fab'))
    expect(screen.getByTestId('dice-panel-mock')).toBeDefined()
  })

  it('closes DicePanel via onClose callback', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
    fireEvent.click(screen.getByTestId('viewer-dice-fab'))
    expect(screen.getByTestId('dice-panel-mock')).toBeDefined()
    fireEvent.click(screen.getByTestId('dice-panel-close'))
    expect(screen.queryByTestId('dice-panel-mock')).toBeNull()
  })

  it('toggles DicePanel closed when FAB is clicked again', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
    fireEvent.click(screen.getByTestId('viewer-dice-fab'))
    expect(screen.getByTestId('dice-panel-mock')).toBeDefined()
    fireEvent.click(screen.getByTestId('viewer-dice-fab'))
    expect(screen.queryByTestId('dice-panel-mock')).toBeNull()
  })
})

// ── GM campaign context tests ─────────────────────────────────────────────────
// Context ownership moved to CampaignDetail (Dice.3b+polish). The viewer no
// longer sets or clears campaign context — it relies on the page having already
// set it. All cases must result in zero calls to setCampaignContext.

describe('CampaignMapViewer — GM campaign context (viewer does NOT own it)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does NOT set campaign context for owner (EN)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
    expect(mockSetCampaignContext).not.toHaveBeenCalled()
  })

  it('does NOT set campaign context for owner (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
    expect(mockSetCampaignContext).not.toHaveBeenCalled()
  })

  it('does NOT clear campaign context on unmount', async () => {
    const { unmount } = renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => expect(screen.getByTestId('viewer-dice-fab')).toBeDefined())
    unmount()
    expect(mockClearCampaignContext).not.toHaveBeenCalled()
  })

  it('does not set campaign context for member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('roll-log-toggle')).toBeDefined())
    expect(mockSetCampaignContext).not.toHaveBeenCalled()
  })

  it('does not set campaign context in broadcast mode (even for owner)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner broadcast />, 'en')
    await waitFor(() => expect(screen.getByTestId('campaign-map-viewer')).toBeDefined())
    expect(mockSetCampaignContext).not.toHaveBeenCalled()
  })
})
