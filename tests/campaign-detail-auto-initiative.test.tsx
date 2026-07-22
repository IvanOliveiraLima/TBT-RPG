/**
 * CampaignDetail — auto-initiative toggle tests
 *
 * Covers:
 *  - toggle renders for owner with correct initial state (false / true)
 *  - toggle does NOT render for non-owner (player)
 *  - toggling calls updateAutoInitiative with the new value
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import CampaignDetail from '@/pages/CampaignDetail'
import type { Campaign, CampaignMember, UserProfile } from '@/domain/campaign'

// ── Mock react-router-dom ─────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock auth store ───────────────────────────────────────────────────────────

let mockUser: { id: string } | null = null

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector?: (s: { user: { id: string } | null; loading: boolean }) => unknown) => {
    const state = { user: mockUser, loading: false }
    return selector ? selector(state) : state
  },
}))

// ── Mock campaign service ─────────────────────────────────────────────────────

const mockGetCampaign = vi.fn()
const mockListCampaignMembers = vi.fn()
const mockUpdateAutoInitiative = vi.fn()

vi.mock('@/services/campaign', () => ({
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaignMembers: (...args: unknown[]) => mockListCampaignMembers(...args),
  updateAutoInitiative: (...args: unknown[]) => mockUpdateAutoInitiative(...args),
  removeMember: vi.fn().mockResolvedValue(undefined),
  CampaignServiceError: class CampaignServiceError extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── Mock other services ───────────────────────────────────────────────────────

const mockListProfilesByIds = vi.fn()

vi.mock('@/services/user-profile', () => ({
  listProfilesByIds: (...args: unknown[]) => mockListProfilesByIds(...args),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: vi.fn().mockResolvedValue([]),
  unlinkCharacterFromCampaign: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/store/characters', () => ({
  useCharactersStore: (selector: (s: { characters: [] }) => unknown) =>
    selector({ characters: [] }),
}))

// ── Mock heavy sub-components ─────────────────────────────────────────────────

vi.mock('@/components/campaigns/InviteCodeBlock', () => ({ InviteCodeBlock: () => null }))
vi.mock('@/components/campaigns/LinkedCharCard', () => ({ LinkedCharCard: () => null }))
vi.mock('@/components/campaigns/LinkCharacterModal', () => ({ LinkCharacterModal: () => null }))
vi.mock('@/components/campaigns/ConfirmDeleteCampaignModal', () => ({ ConfirmDeleteCampaignModal: () => null }))
vi.mock('@/components/campaigns/ConfirmLeaveCampaignModal', () => ({ ConfirmLeaveCampaignModal: () => null }))
vi.mock('@/components/campaigns/EditDisplayNameModal', () => ({ EditDisplayNameModal: () => null }))
vi.mock('@/components/campaigns/ConfirmRemoveMemberModal', () => ({ ConfirmRemoveMemberModal: () => null }))
vi.mock('@/components/campaigns/CampaignMapsSection', () => ({ CampaignMapsSection: () => null }))
vi.mock('@/components/campaigns/TokenPresetsSection', () => ({ TokenPresetsSection: () => null }))
vi.mock('@/components/campaigns/CampaignRollLog', () => ({ CampaignRollLog: () => null }))
vi.mock('@/components/campaigns/MemberRowMenu', () => ({ MemberRowMenu: () => null }))
vi.mock('@/components/dice/DicePanel', () => ({ DicePanel: () => null }))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const OWNER_ID = 'owner1'
const PLAYER_ID = 'player1'

const CAMPAIGN_AUTO_OFF: Campaign = {
  id: 'c1', name: 'Test Campaign', description: null,
  ownerId: OWNER_ID, inviteCode: 'ABCD1234',
  autoInitiative: false, createdAt: 0, updatedAt: 0,
}

const CAMPAIGN_AUTO_ON: Campaign = { ...CAMPAIGN_AUTO_OFF, autoInitiative: true }

const MEMBER_MASTER: CampaignMember = { campaignId: 'c1', userId: OWNER_ID, role: 'master', joinedAt: 0 }
const MEMBER_PLAYER: CampaignMember = { campaignId: 'c1', userId: PLAYER_ID, role: 'player', joinedAt: 0 }
const PROFILE_MASTER: UserProfile = { userId: OWNER_ID, displayName: 'Alice', createdAt: 0, updatedAt: 0 }
const PROFILE_PLAYER: UserProfile = { userId: PLAYER_ID, displayName: 'Bob', createdAt: 0, updatedAt: 0 }

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderDetail(userId = OWNER_ID) {
  mockUser = { id: userId }
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter initialEntries={['/campaigns/c1']}>
      <I18nProvider>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignDetail — auto-initiative toggle visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockListCampaignMembers.mockResolvedValue([MEMBER_MASTER, MEMBER_PLAYER])
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER, PROFILE_PLAYER])
    mockUpdateAutoInitiative.mockResolvedValue(undefined)
  })

  it('renders the toggle for the owner when auto_initiative is false', async () => {
    mockGetCampaign.mockResolvedValue(CAMPAIGN_AUTO_OFF)
    renderDetail(OWNER_ID)

    await waitFor(() => {
      const toggle = screen.getByTestId('auto-initiative-toggle') as HTMLInputElement
      expect(toggle).toBeDefined()
      expect(toggle.checked).toBe(false)
    })
  })

  it('renders the toggle checked for the owner when auto_initiative is true', async () => {
    mockGetCampaign.mockResolvedValue(CAMPAIGN_AUTO_ON)
    renderDetail(OWNER_ID)

    await waitFor(() => {
      const toggle = screen.getByTestId('auto-initiative-toggle') as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })
  })

  it('does NOT render the toggle for a player (non-owner)', async () => {
    mockGetCampaign.mockResolvedValue(CAMPAIGN_AUTO_OFF)
    renderDetail(PLAYER_ID)

    await waitFor(() => {
      expect(screen.getByText('Test Campaign')).toBeDefined()
    })

    expect(screen.queryByTestId('auto-initiative-toggle')).toBeNull()
  })
})

describe('CampaignDetail — auto-initiative toggle interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockListCampaignMembers.mockResolvedValue([MEMBER_MASTER])
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER])
    mockUpdateAutoInitiative.mockResolvedValue(undefined)
  })

  it('calls updateAutoInitiative(id, true) when toggled on', async () => {
    mockGetCampaign.mockResolvedValue(CAMPAIGN_AUTO_OFF)
    renderDetail(OWNER_ID)

    await waitFor(() => {
      expect(screen.getByTestId('auto-initiative-toggle')).toBeDefined()
    })

    fireEvent.click(screen.getByTestId('auto-initiative-toggle'))

    await waitFor(() => {
      expect(mockUpdateAutoInitiative).toHaveBeenCalledWith('c1', true)
    })
  })

  it('calls updateAutoInitiative(id, false) when toggled off', async () => {
    mockGetCampaign.mockResolvedValue(CAMPAIGN_AUTO_ON)
    renderDetail(OWNER_ID)

    await waitFor(() => {
      const toggle = screen.getByTestId('auto-initiative-toggle') as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })

    fireEvent.click(screen.getByTestId('auto-initiative-toggle'))

    await waitFor(() => {
      expect(mockUpdateAutoInitiative).toHaveBeenCalledWith('c1', false)
    })
  })
})
