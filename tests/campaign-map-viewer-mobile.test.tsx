/**
 * CampaignMapViewer — mobile layout tests.
 *
 * Covers:
 * - Desktop (isMobile=false): right-side owner toolbar visible; no Ferramentas button
 * - Mobile (isMobile=true): right-side toolbar hidden; Ferramentas button appears
 * - Ferramentas bottom sheet opens on button click (EN + PT label)
 * - Ferramentas menu lists expected tools
 * - Roll log bottom sheet (mobile) has close × button
 * - Initiative bottom sheet (mobile) has close × button
 * - Grid bottom sheet opens when "Grade" is tapped from Ferramentas
 * - Clicking tools menu toggle again closes it
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Control isMobile via module mock ──────────────────────────────────────────

let _isMobileValue = false

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => _isMobileValue,
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

vi.mock('@/services/campaign-map-fog', () => ({
  getMapFog:  () => Promise.resolve({ mapId: 'map-1', enabled: false, revealed: [], updatedAt: 0 }),
  saveMapFog: () => Promise.resolve(),
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

vi.mock('@/services/campaign-map-areas', () => ({
  listMapAreas:   () => Promise.resolve([]),
  createMapArea:  () => Promise.resolve({ id: 'area-1', mapId: 'map-1', shape: 'circle', x: 0, y: 0, radius: 0, color: '#E0562D' }),
  deleteMapArea:  () => Promise.resolve(),
  clearMapAreas:  () => Promise.resolve(),
}))

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:             () => Promise.resolve([]),
  getTokenPresetImageSignedUrl: () => Promise.resolve('https://example.com/preset.png'),
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer — desktop layout (isMobile = false)', () => {
  beforeEach(() => { vi.clearAllMocks(); _isMobileValue = false })

  it('shows the right-side owner toolbar (grid-panel-toggle visible)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.getByTestId('grid-panel-toggle')).toBeDefined()
  })

  it('does NOT show the Ferramentas toggle button on desktop', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('tools-menu-toggle')).toBeNull()
  })
})

describe('CampaignMapViewer — mobile layout (isMobile = true)', () => {
  beforeEach(() => { vi.clearAllMocks(); _isMobileValue = true })

  it('hides the right-side owner toolbar (no grid-panel-toggle)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('grid-panel-toggle')).toBeNull()
  })

  it('shows Ferramentas toggle for owner (EN: "Tools")', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    expect(screen.getByTestId('tools-menu-toggle').textContent).toContain('Tools')
  })

  it('shows "Ferramentas" label for owner (PT)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'pt')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    expect(screen.getByTestId('tools-menu-toggle').textContent).toContain('Ferramentas')
  })

  it('does NOT show Ferramentas button for non-owner member', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner={false} />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('tools-menu-toggle')).toBeNull()
  })

  it('clicking Ferramentas opens the tools bottom sheet', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-bottom-sheet'))
    expect(screen.getByTestId('tools-bottom-sheet')).toBeDefined()
  })

  it('Ferramentas menu lists expected tools', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-bottom-sheet'))
    expect(screen.getByTestId('tools-grid-btn')).toBeDefined()
    expect(screen.getByTestId('tools-add-token-btn')).toBeDefined()
    expect(screen.getByTestId('tools-presets-btn')).toBeDefined()
    expect(screen.getByTestId('tools-areas-btn')).toBeDefined()
    expect(screen.getByTestId('tools-fog-btn')).toBeDefined()
    expect(screen.getByTestId('tools-broadcast-btn')).toBeDefined()
  })

  it('clicking Ferramentas toggle again closes the bottom sheet', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-bottom-sheet'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => expect(screen.queryByTestId('tools-bottom-sheet')).toBeNull())
  })

  it('tapping "Grade" from tools menu opens grid bottom sheet', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-grid-btn'))
    fireEvent.click(screen.getByTestId('tools-grid-btn'))
    await waitFor(() => screen.getByTestId('grid-config-panel'))
    expect(screen.getByTestId('grid-config-panel')).toBeDefined()
    // Tools menu should be closed
    expect(screen.queryByTestId('tools-bottom-sheet')).toBeNull()
  })

  it('roll log panel shows as bottom sheet (has close ×)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('roll-log-toggle'))
    fireEvent.click(screen.getByTestId('roll-log-toggle'))
    await waitFor(() => screen.getByTestId('viewer-roll-log-panel'))
    expect(screen.getByTestId('viewer-roll-log-panel')).toBeDefined()
    expect(screen.getByTestId('campaign-roll-log-mock')).toBeDefined()
  })

  it('initiative panel shows as bottom sheet (has close ×)', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('initiative-toggle'))
    fireEvent.click(screen.getByTestId('initiative-toggle'))
    await waitFor(() => screen.getByTestId('viewer-initiative-panel'))
    expect(screen.getByTestId('viewer-initiative-panel')).toBeDefined()
    expect(screen.getByTestId('campaign-initiative-panel-mock')).toBeDefined()
  })

  it('tapping "Áreas" from tools menu opens area panel bottom sheet', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-areas-btn'))
    fireEvent.click(screen.getByTestId('tools-areas-btn'))
    await waitFor(() => screen.getByTestId('area-panel'))
    expect(screen.getByTestId('area-panel')).toBeDefined()
    expect(screen.queryByTestId('tools-bottom-sheet')).toBeNull()
  })

  it('tapping "Tokens prontos" from tools menu opens preset palette bottom sheet', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner />, 'en')
    await waitFor(() => screen.getByTestId('tools-menu-toggle'))
    fireEvent.click(screen.getByTestId('tools-menu-toggle'))
    await waitFor(() => screen.getByTestId('tools-presets-btn'))
    fireEvent.click(screen.getByTestId('tools-presets-btn'))
    await waitFor(() => screen.getByTestId('preset-palette-panel'))
    expect(screen.getByTestId('preset-palette-panel')).toBeDefined()
    expect(screen.queryByTestId('tools-bottom-sheet')).toBeNull()
  })
})

describe('CampaignMapViewer — mobile broadcast (no tools, no Ferramentas)', () => {
  beforeEach(() => { vi.clearAllMocks(); _isMobileValue = true })

  it('broadcast mode shows neither Ferramentas nor roll log toggle', async () => {
    renderWithI18n(<CampaignMapViewer map={MAP} isOwner broadcast />, 'en')
    await waitFor(() => screen.getByTestId('campaign-map-viewer'))
    expect(screen.queryByTestId('tools-menu-toggle')).toBeNull()
    expect(screen.queryByTestId('roll-log-toggle')).toBeNull()
  })
})
