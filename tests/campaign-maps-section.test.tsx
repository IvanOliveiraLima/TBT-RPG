/**
 * CampaignMapsSection — owner vs member permissions and basic interactions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignMapsSection } from '@/components/campaigns/CampaignMapsSection'
import type { CampaignMap } from '@/services/campaign-maps'

// ── Mock campaign-maps service ────────────────────────────────────────────────

const mockListCampaignMaps = vi.fn()
const mockUploadCampaignMap = vi.fn()
const mockDeleteCampaignMap = vi.fn()

vi.mock('@/services/campaign-maps', () => ({
  listCampaignMaps:      (...args: unknown[]) => mockListCampaignMaps(...args),
  uploadCampaignMap:     (...args: unknown[]) => mockUploadCampaignMap(...args),
  deleteCampaignMap:     (...args: unknown[]) => mockDeleteCampaignMap(...args),
  getCampaignMapSignedUrl: vi.fn(),
}))

// ── Mock CampaignMapViewer (Leaflet doesn't work in jsdom) ────────────────────

vi.mock('@/components/campaigns/CampaignMapViewer', () => ({
  CampaignMapViewer: ({ map }: { map: CampaignMap }) => (
    <div data-testid="map-viewer-stub" data-map-id={map.id}>{map.name}</div>
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN_ID = 'camp-1'

const MAP_1: CampaignMap = {
  id: 'map-1', campaignId: CAMPAIGN_ID, name: 'Dungeon Level 1',
  imagePath: 'camp-1/map-1.png', width: 1024, height: 768, createdAt: 0,
}

const MAP_2: CampaignMap = {
  id: 'map-2', campaignId: CAMPAIGN_ID, name: 'World Map',
  imagePath: 'camp-1/map-2.png', width: 2048, height: 1024, createdAt: 1,
}

function renderSection(isOwner = false) {
  return renderWithI18n(
    <CampaignMapsSection campaignId={CAMPAIGN_ID} isOwner={isOwner} />,
    'en',
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignMapsSection — structure', () => {
  beforeEach(() => { vi.clearAllMocks(); mockListCampaignMaps.mockResolvedValue([]) })

  it('renders the section container', async () => {
    renderSection()
    await waitFor(() => expect(screen.getByTestId('campaign-detail-maps')).toBeDefined())
  })

  it('shows section title with count (EN)', async () => {
    renderSection()
    await waitFor(() => expect(screen.getByTestId('campaign-detail-maps').textContent).toContain('Maps (0)'))
  })

  it('shows section title in PT', async () => {
    renderWithI18n(<CampaignMapsSection campaignId={CAMPAIGN_ID} isOwner={false} />, 'pt')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-maps').textContent).toContain('Mapas (0)'))
  })

  it('shows empty state when no maps', async () => {
    renderSection()
    await waitFor(() => expect(screen.getByTestId('maps-empty-state')).toBeDefined())
  })
})

describe('CampaignMapsSection — member (non-owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListCampaignMaps.mockResolvedValue([MAP_1, MAP_2])
  })

  it('does NOT show add map controls', async () => {
    renderSection(false)
    await waitFor(() => expect(screen.queryByTestId('add-map-label')).toBeNull())
  })

  it('does NOT show remove buttons', async () => {
    renderSection(false)
    await waitFor(() => expect(screen.queryByTestId(`remove-map-${MAP_1.id}`)).toBeNull())
  })

  it('shows map rows for all maps', async () => {
    renderSection(false)
    await waitFor(() => expect(screen.getByTestId(`map-row-${MAP_1.id}`)).toBeDefined())
    expect(screen.getByTestId(`map-row-${MAP_2.id}`)).toBeDefined()
  })

  it('clicking a map opens the viewer modal', async () => {
    renderSection(false)
    await waitFor(() => screen.getByTestId(`open-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId(`open-map-${MAP_1.id}`))
    expect(screen.getByTestId('map-viewer-modal')).toBeDefined()
    expect(screen.getByTestId('map-viewer-stub')).toBeDefined()
  })

  it('viewer modal shows correct map', async () => {
    renderSection(false)
    await waitFor(() => screen.getByTestId(`open-map-${MAP_2.id}`))
    fireEvent.click(screen.getByTestId(`open-map-${MAP_2.id}`))
    expect(screen.getByTestId('map-viewer-stub').getAttribute('data-map-id')).toBe(MAP_2.id)
  })

  it('close button dismisses the viewer modal', async () => {
    renderSection(false)
    await waitFor(() => screen.getByTestId(`open-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId(`open-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId('close-map-viewer'))
    expect(screen.queryByTestId('map-viewer-modal')).toBeNull()
  })
})

describe('CampaignMapsSection — owner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListCampaignMaps.mockResolvedValue([MAP_1])
  })

  it('shows add map controls', async () => {
    renderSection(true)
    await waitFor(() => expect(screen.getByTestId('add-map-label')).toBeDefined())
  })

  it('shows remove button for each map', async () => {
    renderSection(true)
    await waitFor(() => expect(screen.getByTestId(`remove-map-${MAP_1.id}`)).toBeDefined())
  })

  it('clicking remove shows inline confirm controls', async () => {
    renderSection(true)
    await waitFor(() => screen.getByTestId(`remove-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId(`remove-map-${MAP_1.id}`))
    expect(screen.getByTestId(`confirm-remove-map-${MAP_1.id}`)).toBeDefined()
    expect(screen.getByTestId(`cancel-remove-map-${MAP_1.id}`)).toBeDefined()
  })

  it('cancel remove hides confirm controls', async () => {
    renderSection(true)
    await waitFor(() => screen.getByTestId(`remove-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId(`remove-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId(`cancel-remove-map-${MAP_1.id}`))
    expect(screen.queryByTestId(`confirm-remove-map-${MAP_1.id}`)).toBeNull()
  })

  it('confirming remove calls deleteCampaignMap and removes row', async () => {
    mockDeleteCampaignMap.mockResolvedValue(undefined)
    renderSection(true)
    await waitFor(() => screen.getByTestId(`remove-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId(`remove-map-${MAP_1.id}`))
    fireEvent.click(screen.getByTestId(`confirm-remove-map-${MAP_1.id}`))
    await waitFor(() => expect(mockDeleteCampaignMap).toHaveBeenCalledWith(MAP_1))
    await waitFor(() => expect(screen.queryByTestId(`map-row-${MAP_1.id}`)).toBeNull())
  })

  it('shows count updated after upload', async () => {
    mockListCampaignMaps.mockResolvedValue([])
    mockUploadCampaignMap.mockResolvedValue(MAP_1)
    renderSection(true)
    await waitFor(() => screen.getByTestId('campaign-detail-maps'))
    // Simulate file input change through the file input element
    const fileInput = screen.getByTestId('map-file-input') as HTMLInputElement
    const file = new File([new Uint8Array(10)], 'map.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() => expect(mockUploadCampaignMap).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId(`map-row-${MAP_1.id}`)).toBeDefined())
  })

  it('shows upload error for invalid file type', async () => {
    renderSection(true)
    await waitFor(() => screen.getByTestId('add-map-label'))
    const fileInput = screen.getByTestId('map-file-input') as HTMLInputElement
    const file = new File([new Uint8Array(10)], 'map.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByTestId('map-upload-error')).toBeDefined())
    expect(mockUploadCampaignMap).not.toHaveBeenCalled()
  })
})
