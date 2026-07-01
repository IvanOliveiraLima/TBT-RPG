/**
 * CampaignMapViewer — tests that verify wiring:
 * - Shows loading state while fetching signed URL
 * - Passes correct url and bounds to ImageOverlay once URL arrives
 * - Shows error state on failure
 *
 * react-leaflet is mocked (jsdom can't run Leaflet canvas).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Mock react-leaflet ────────────────────────────────────────────────────────

const capturedImageOverlayProps: { url?: string; bounds?: unknown }[] = []

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: (props: { url: string; bounds: unknown }) => {
    capturedImageOverlayProps.push({ url: props.url, bounds: props.bounds })
    return <div data-testid="image-overlay" data-url={props.url} />
  },
  Marker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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

// ── Mock CSS import ───────────────────────────────────────────────────────────

vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── Mock campaign-maps service ────────────────────────────────────────────────

const mockGetSignedUrl = vi.fn()

vi.mock('@/services/campaign-maps', () => ({
  getCampaignMapSignedUrl: (path: string) => mockGetSignedUrl(path),
}))

// ── Mock campaign-map-markers service (component now fetches markers) ─────────

vi.mock('@/services/campaign-map-markers', () => ({
  listMapMarkers:       () => Promise.resolve([]),
  createMapMarker:      () => Promise.resolve({}),
  updateMapMarkerLabel: () => Promise.resolve(),
  deleteMapMarker:      () => Promise.resolve(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MAP: CampaignMap = {
  id: 'map-1',
  campaignId: 'camp-1',
  name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png',
  width: 2048,
  height: 1024,
  createdAt: 0,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedImageOverlayProps.length = 0
  })

  it('shows loading state while fetching signed URL', async () => {
    // Never resolves — stays in loading state
    mockGetSignedUrl.mockReturnValue(new Promise(() => undefined))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    expect(screen.getByTestId('campaign-map-viewer-loading')).toBeDefined()
  })

  it('shows loading text in PT', async () => {
    mockGetSignedUrl.mockReturnValue(new Promise(() => undefined))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'pt')
    expect(screen.getByTestId('campaign-map-viewer-loading').textContent).toContain('Carregando mapa')
  })

  it('renders MapContainer and ImageOverlay after URL resolves', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('map-container')).toBeDefined())
    expect(screen.getByTestId('image-overlay')).toBeDefined()
  })

  it('passes signed URL to ImageOverlay', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(capturedImageOverlayProps.length).toBeGreaterThan(0))
    expect(capturedImageOverlayProps[0].url).toBe('https://signed.example.com/map.png')
  })

  it('calls getCampaignMapSignedUrl with the imagePath', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/map.png')
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(mockGetSignedUrl).toHaveBeenCalledWith(MAP.imagePath))
  })

  it('shows error state when getCampaignMapSignedUrl rejects', async () => {
    mockGetSignedUrl.mockRejectedValue(new Error('network error'))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    await waitFor(() => expect(screen.getByTestId('campaign-map-viewer-error')).toBeDefined())
  })

  it('does not show the viewer section before URL resolves', async () => {
    mockGetSignedUrl.mockReturnValue(new Promise(() => undefined))
    renderWithI18n(<CampaignMapViewer map={MAP} />, 'en')
    expect(screen.queryByTestId('campaign-map-viewer')).toBeNull()
  })
})
