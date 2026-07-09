/**
 * TokenPresetsSection — owner CRUD interactions and basic rendering.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { TokenPresetsSection } from '@/components/campaigns/TokenPresetsSection'
import type { CampaignTokenPreset } from '@/services/campaign-token-presets'

// ── Mock campaign-token-presets service ───────────────────────────────────────

const mockList = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockUpload = vi.fn()
const mockGetSignedUrl = vi.fn()
const mockRemoveImage = vi.fn()

vi.mock('@/services/campaign-token-presets', () => ({
  listTokenPresets:            (...args: unknown[]) => mockList(...args),
  createTokenPreset:           (...args: unknown[]) => mockCreate(...args),
  updateTokenPreset:           (...args: unknown[]) => mockUpdate(...args),
  deleteTokenPreset:           (...args: unknown[]) => mockDelete(...args),
  uploadTokenPresetImage:      (...args: unknown[]) => mockUpload(...args),
  getTokenPresetImageSignedUrl:(...args: unknown[]) => mockGetSignedUrl(...args),
  removeTokenPresetImage:      (...args: unknown[]) => mockRemoveImage(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN_ID = 'camp-1'

const PRESET_1: CampaignTokenPreset = {
  id: 'p1', campaignId: CAMPAIGN_ID, label: 'Goblin', color: '#C0392B', size: 1, imagePath: null,
}

const PRESET_2: CampaignTokenPreset = {
  id: 'p2', campaignId: CAMPAIGN_ID, label: 'Orc', color: '#1A5276', size: 2, imagePath: null,
}

function renderSection(isOwner = true, lang: 'en' | 'pt' = 'en') {
  return renderWithI18n(
    <TokenPresetsSection campaignId={CAMPAIGN_ID} isOwner={isOwner} />,
    lang,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TokenPresetsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue([])
  })

  it('renders section container', async () => {
    renderSection()
    await waitFor(() => expect(screen.getByTestId('token-presets-section')).toBeDefined())
  })

  it('shows section title in EN', async () => {
    renderSection(true, 'en')
    await waitFor(() =>
      expect(screen.getByTestId('token-presets-section').textContent).toContain('Ready tokens'),
    )
  })

  it('shows section title in PT', async () => {
    renderSection(true, 'pt')
    await waitFor(() =>
      expect(screen.getByTestId('token-presets-section').textContent).toContain('Tokens prontos'),
    )
  })

  it('shows empty state when no presets', async () => {
    renderSection()
    await waitFor(() => expect(screen.getByTestId('presets-empty-state')).toBeDefined())
  })

  it('shows add button when isOwner', async () => {
    renderSection(true)
    await waitFor(() => expect(screen.getByTestId('presets-add')).toBeDefined())
  })

  it('clicking add calls createTokenPreset with campaignId', async () => {
    mockCreate.mockResolvedValue(PRESET_1)
    renderSection()
    await waitFor(() => screen.getByTestId('presets-add'))
    fireEvent.click(screen.getByTestId('presets-add'))
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    expect(mockCreate.mock.calls[0][0]).toBe(CAMPAIGN_ID)
  })

  it('renders preset rows for each preset', async () => {
    mockList.mockResolvedValue([PRESET_1, PRESET_2])
    renderSection()
    await waitFor(() => expect(screen.getByTestId('preset-row-p1')).toBeDefined())
    expect(screen.getByTestId('preset-row-p2')).toBeDefined()
  })

  it('preset row shows label input with value', async () => {
    mockList.mockResolvedValue([PRESET_1])
    renderSection()
    await waitFor(() => screen.getByTestId('preset-label-p1'))
    const input = screen.getByTestId('preset-label-p1') as HTMLInputElement
    expect(input.value).toBe(PRESET_1.label)
  })

  it('preset row shows color input', async () => {
    mockList.mockResolvedValue([PRESET_1])
    renderSection()
    await waitFor(() => expect(screen.getByTestId('preset-color-p1')).toBeDefined())
  })

  it('preset row shows size select with correct value', async () => {
    mockList.mockResolvedValue([PRESET_1])
    renderSection()
    await waitFor(() => screen.getByTestId('preset-size-p1'))
    const select = screen.getByTestId('preset-size-p1') as HTMLSelectElement
    expect(select.value).toBe(String(PRESET_1.size))
  })

  it('remove first click shows confirm button', async () => {
    mockList.mockResolvedValue([PRESET_1])
    renderSection()
    await waitFor(() => screen.getByTestId('preset-remove-p1'))
    fireEvent.click(screen.getByTestId('preset-remove-p1'))
    expect(screen.getByTestId('preset-remove-confirm-p1')).toBeDefined()
  })

  it('remove second click calls deleteTokenPreset', async () => {
    mockDelete.mockResolvedValue(undefined)
    mockList.mockResolvedValue([PRESET_1])
    renderSection()
    await waitFor(() => screen.getByTestId('preset-remove-p1'))
    fireEvent.click(screen.getByTestId('preset-remove-p1'))
    fireEvent.click(screen.getByTestId('preset-remove-confirm-p1'))
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(PRESET_1))
  })

  it('upload error shown on invalid file type', async () => {
    mockList.mockResolvedValue([PRESET_1])
    renderSection()
    await waitFor(() => screen.getByTestId('preset-image-input-p1'))
    const fileInput = screen.getByTestId('preset-image-input-p1') as HTMLInputElement
    const file = new File([new Uint8Array(10)], 'image.gif', { type: 'image/gif' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() =>
      expect(screen.getByTestId('preset-row-p1').textContent).toContain('PNG'),
    )
    expect(mockUpload).not.toHaveBeenCalled()
  })
})
