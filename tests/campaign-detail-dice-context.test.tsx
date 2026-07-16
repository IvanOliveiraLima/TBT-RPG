/**
 * CampaignDetail — Dice context ownership + GM FAB tests (Camp.polish).
 *
 * Verifies:
 * - Owner: setCampaignContext called on mount (EN: "GM" / PT: "Mestre")
 * - Owner: clearCampaignContext called on unmount
 * - Non-owner: setCampaignContext never called
 * - Owner: dice FAB visible (data-testid="campaign-detail-dice-fab")
 * - Non-owner: dice FAB absent
 * - FAB opens DicePanel; close callback hides it
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import React from 'react'
import CampaignDetail from '@/pages/CampaignDetail'

// ── Mock useDiceStore ─────────────────────────────────────────────────────────

const mockSetCampaignContext   = vi.fn()
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

// ── Mock DicePanel ────────────────────────────────────────────────────────────

vi.mock('@/components/dice/DicePanel', () => ({
  DicePanel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="dice-panel-mock">
      <button type="button" data-testid="dice-panel-close" onClick={onClose}>close</button>
    </div>
  ),
}))

// ── Mock navigate ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock auth store ───────────────────────────────────────────────────────────

// Owner by default; overridden per describe block as needed
let mockUserId = 'u-owner'

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: { user: { id: string; email: string } | null; loading: boolean }) => unknown) =>
    selector({ user: { id: mockUserId, email: 'owner@test.com' }, loading: false }),
}))

// ── Mock campaign service ─────────────────────────────────────────────────────

const mockGetCampaign = vi.fn()
const mockListCampaignMembers = vi.fn()

vi.mock('@/services/campaign', () => ({
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaignMembers: (...args: unknown[]) => mockListCampaignMembers(...args),
  removeMember: vi.fn(),
  CampaignServiceError: class extends Error {
    constructor(public code: string) { super(code) }
  },
}))

vi.mock('@/services/user-profile', () => ({
  upsertMyProfile: vi.fn(),
  getMyProfile: vi.fn(),
  listProfilesByIds: vi.fn().mockResolvedValue([]),
  UserProfileServiceError: class extends Error {
    constructor(public code: string) { super(code) }
  },
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: vi.fn().mockResolvedValue([]),
  unlinkCharacterFromCampaign: vi.fn(),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: vi.fn().mockResolvedValue([]),
  fetchCampaignCharacterImages: vi.fn().mockResolvedValue({ portraitData: null, symbolData: null }),
}))

// ── Stub heavy sub-components ─────────────────────────────────────────────────

vi.mock('@/components/campaigns/InviteCodeBlock', () => ({
  InviteCodeBlock: () => <div data-testid="invite-code-stub" />,
}))

vi.mock('@/components/campaigns/LinkCharacterModal', () => ({
  LinkCharacterModal: () => <div data-testid="link-char-modal-stub" />,
}))

vi.mock('@/components/campaigns/ConfirmDeleteCampaignModal', () => ({
  ConfirmDeleteCampaignModal: () => <div data-testid="confirm-delete-stub" />,
}))

vi.mock('@/components/campaigns/ConfirmLeaveCampaignModal', () => ({
  ConfirmLeaveCampaignModal: () => <div data-testid="confirm-leave-stub" />,
}))

vi.mock('@/components/campaigns/CampaignMapsSection', () => ({
  CampaignMapsSection: () => <div data-testid="maps-section-stub" />,
}))

vi.mock('@/components/campaigns/TokenPresetsSection', () => ({
  TokenPresetsSection: () => <div data-testid="token-presets-stub" />,
}))

vi.mock('@/components/campaigns/CampaignRollLog', () => ({
  CampaignRollLog: () => <div data-testid="campaign-roll-log-stub" />,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN_OWNER = {
  id: 'camp-1', name: 'Test Campaign', description: null,
  ownerId: 'u-owner', inviteCode: 'ABCD1234', createdAt: 1000, updatedAt: 2000,
}

function renderDetail(lang: 'en' | 'pt' = 'en') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter initialEntries={['/campaigns/camp-1']}>
      <I18nProvider>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Campaign context ownership — owner ────────────────────────────────────────

describe('CampaignDetail — GM campaign context (owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUserId = 'u-owner'
    mockGetCampaign.mockResolvedValue(CAMPAIGN_OWNER)
    mockListCampaignMembers.mockResolvedValue([])
  })

  it('sets campaign context on mount for owner (EN: actorName="GM")', async () => {
    renderDetail('en')
    await waitFor(() => {
      expect(mockSetCampaignContext).toHaveBeenCalledWith({
        campaignTargets: ['camp-1'],
        actorName: 'GM',
      })
    })
  })

  it('sets campaign context on mount for owner (PT: actorName="Mestre")', async () => {
    renderDetail('pt')
    await waitFor(() => {
      expect(mockSetCampaignContext).toHaveBeenCalledWith({
        campaignTargets: ['camp-1'],
        actorName: 'Mestre',
      })
    })
  })

  it('clears campaign context on unmount', async () => {
    const { unmount } = renderDetail('en')
    await waitFor(() => expect(mockSetCampaignContext).toHaveBeenCalled())
    unmount()
    expect(mockClearCampaignContext).toHaveBeenCalled()
  })
})

// ── Campaign context — non-owner ──────────────────────────────────────────────

describe('CampaignDetail — GM campaign context (non-owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUserId = 'u-player'
    mockGetCampaign.mockResolvedValue(CAMPAIGN_OWNER)
    mockListCampaignMembers.mockResolvedValue([])
  })

  it('does NOT set campaign context for non-owner', async () => {
    renderDetail('en')
    // Wait for the page to finish loading (members section renders)
    await waitFor(() => expect(screen.getByTestId('campaign-detail-members')).toBeDefined())
    expect(mockSetCampaignContext).not.toHaveBeenCalled()
  })
})

// ── GM dice FAB — owner ───────────────────────────────────────────────────────

describe('CampaignDetail — GM dice FAB (owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUserId = 'u-owner'
    mockGetCampaign.mockResolvedValue(CAMPAIGN_OWNER)
    mockListCampaignMembers.mockResolvedValue([])
  })

  it('shows dice FAB for owner', async () => {
    renderDetail('en')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-dice-fab')).toBeDefined())
  })

  it('DicePanel not open by default', async () => {
    renderDetail('en')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-dice-fab')).toBeDefined())
    expect(screen.queryByTestId('dice-panel-mock')).toBeNull()
  })

  it('opens DicePanel when FAB is clicked', async () => {
    renderDetail('en')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-dice-fab')).toBeDefined())
    fireEvent.click(screen.getByTestId('campaign-detail-dice-fab'))
    expect(screen.getByTestId('dice-panel-mock')).toBeDefined()
  })

  it('closes DicePanel via onClose callback', async () => {
    renderDetail('en')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-dice-fab')).toBeDefined())
    fireEvent.click(screen.getByTestId('campaign-detail-dice-fab'))
    expect(screen.getByTestId('dice-panel-mock')).toBeDefined()
    fireEvent.click(screen.getByTestId('dice-panel-close'))
    expect(screen.queryByTestId('dice-panel-mock')).toBeNull()
  })

  it('toggles DicePanel closed when FAB is clicked again', async () => {
    renderDetail('en')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-dice-fab')).toBeDefined())
    fireEvent.click(screen.getByTestId('campaign-detail-dice-fab'))
    expect(screen.getByTestId('dice-panel-mock')).toBeDefined()
    fireEvent.click(screen.getByTestId('campaign-detail-dice-fab'))
    expect(screen.queryByTestId('dice-panel-mock')).toBeNull()
  })
})

// ── GM dice FAB — non-owner ───────────────────────────────────────────────────

describe('CampaignDetail — GM dice FAB (non-owner)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUserId = 'u-player'
    mockGetCampaign.mockResolvedValue(CAMPAIGN_OWNER)
    mockListCampaignMembers.mockResolvedValue([])
  })

  it('does not show dice FAB for non-owner', async () => {
    renderDetail('en')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-members')).toBeDefined())
    expect(screen.queryByTestId('campaign-detail-dice-fab')).toBeNull()
  })
})
