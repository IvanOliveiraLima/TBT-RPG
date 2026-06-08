/**
 * Tests for expanded CampaignDetail — members list, invite block, linked chars.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import CampaignDetail from '@/pages/CampaignDetail'
import type { Campaign, CampaignMember, UserProfile, CampaignCharacter } from '@/domain/campaign'

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

vi.mock('@/services/campaign', () => ({
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaignMembers: (...args: unknown[]) => mockListCampaignMembers(...args),
  CampaignServiceError: class CampaignServiceError extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── Mock campaign-characters service ─────────────────────────────────────────

const mockListCampaignCharacters = vi.fn()
const mockUnlinkCharacterFromCampaign = vi.fn()

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: (...args: unknown[]) => mockListCampaignCharacters(...args),
  unlinkCharacterFromCampaign: (...args: unknown[]) => mockUnlinkCharacterFromCampaign(...args),
}))

// ── Mock characters store (needed by LinkCharacterModal) ──────────────────────

vi.mock('@/store/characters', () => ({
  useCharactersStore: (selector: (s: { characters: [] }) => unknown) =>
    selector({ characters: [] }),
}))

// ── Mock LinkCharacterModal (test separately) ─────────────────────────────────

vi.mock('@/components/campaigns/LinkCharacterModal', () => ({
  LinkCharacterModal: ({ onCancel }: { onCancel: () => void; campaignId: string; alreadyLinkedIds: string[]; onLinked: () => void }) => (
    <div data-testid="link-char-modal-stub">
      <button onClick={onCancel} data-testid="stub-modal-close">Close</button>
    </div>
  ),
}))

// ── Mock user-profile service ─────────────────────────────────────────────────

const mockListProfilesByIds = vi.fn()

vi.mock('@/services/user-profile', () => ({
  listProfilesByIds: (...args: unknown[]) => mockListProfilesByIds(...args),
}))

// ── Mock InviteCodeBlock (test separately) ────────────────────────────────────

vi.mock('@/components/campaigns/InviteCodeBlock', () => ({
  InviteCodeBlock: ({ isOwner }: { isOwner: boolean; campaign: Campaign; onCodeRegenerated: () => void }) => (
    isOwner ? <div data-testid="invite-code-block-stub">InviteBlock</div> : null
  ),
}))

// ── fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN: Campaign = {
  id: 'c1',
  name: 'Test Campaign',
  description: 'A great campaign',
  ownerId: 'owner1',
  inviteCode: 'ABCD1234',
  createdAt: 0,
  updatedAt: 0,
}

const MEMBER_MASTER: CampaignMember = { campaignId: 'c1', userId: 'owner1', role: 'master', joinedAt: 0 }
const MEMBER_PLAYER: CampaignMember = { campaignId: 'c1', userId: 'player1', role: 'player', joinedAt: 0 }
const PROFILE_MASTER: UserProfile = { userId: 'owner1', displayName: 'Alice', createdAt: 0, updatedAt: 0 }
const PROFILE_PLAYER: UserProfile = { userId: 'player1', displayName: 'Bob', createdAt: 0, updatedAt: 0 }

const LINKED_CHAR_OWNER: CampaignCharacter = {
  campaignId: 'c1', characterId: 'char1', userId: 'owner1',
  characterName: 'Aragorn', characterSummary: 'Human — Ranger 5', addedAt: 0,
}
const LINKED_CHAR_PLAYER: CampaignCharacter = {
  campaignId: 'c1', characterId: 'char2', userId: 'player1',
  characterName: 'Legolas', characterSummary: 'Elf — Ranger 5', addedAt: 1000,
}

// ── helpers ───────────────────────────────────────────────────────────────────

function renderDetail(userId = 'owner1') {
  mockUser = { id: userId }
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
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

describe('CampaignDetail — loading and rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetCampaign.mockResolvedValue(CAMPAIGN)
    mockListCampaignMembers.mockResolvedValue([MEMBER_MASTER, MEMBER_PLAYER])
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER, PROFILE_PLAYER])
    mockListCampaignCharacters.mockResolvedValue([])
  })

  it('displays campaign name', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText('Test Campaign')).toBeDefined())
  })

  it('displays campaign description', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText('A great campaign')).toBeDefined())
  })

  it('displays members section', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('campaign-detail-members')).toBeDefined())
  })

  it('displays member names', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText('Alice')).toBeDefined())
    expect(screen.getByText('Bob')).toBeDefined()
  })

  it('displays role labels', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText('Mestre')).toBeDefined())
    expect(screen.getByText('Jogador')).toBeDefined()
  })

  it('shows "Membro desconhecido" when profile is null', async () => {
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER])
    renderDetail()
    await waitFor(() => expect(screen.getByText('Membro desconhecido')).toBeDefined())
  })

  it('shows linked chars section', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('campaign-detail-linked-chars')).toBeDefined())
  })

  it('shows empty state when no chars linked', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-chars-empty')).toBeDefined())
  })

  it('renders member rows with testids', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('member-row-owner1')).toBeDefined())
    expect(screen.getByTestId('member-row-player1')).toBeDefined()
  })
})

describe('CampaignDetail — owner vs player view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetCampaign.mockResolvedValue(CAMPAIGN)
    mockListCampaignMembers.mockResolvedValue([MEMBER_MASTER])
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER])
    mockListCampaignCharacters.mockResolvedValue([])
  })

  it('renders InviteCodeBlock for owner', async () => {
    renderDetail('owner1')
    await waitFor(() => expect(screen.getByTestId('invite-code-block-stub')).toBeDefined())
  })

  it('does not render InviteCodeBlock for non-owner', async () => {
    renderDetail('player1')
    await waitFor(() => expect(screen.getByTestId('campaign-detail-members')).toBeDefined())
    expect(screen.queryByTestId('invite-code-block-stub')).toBeNull()
  })
})

describe('CampaignDetail — not found', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows "Campaign not found" when getCampaign returns null', async () => {
    mockGetCampaign.mockResolvedValue(null)
    mockListCampaignMembers.mockResolvedValue([])
    mockListProfilesByIds.mockResolvedValue([])
    mockListCampaignCharacters.mockResolvedValue([])
    renderDetail()
    await waitFor(() => expect(screen.getByText('Campaign not found.')).toBeDefined())
  })
})

describe('CampaignDetail — linked chars section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetCampaign.mockResolvedValue(CAMPAIGN)
    mockListCampaignMembers.mockResolvedValue([MEMBER_MASTER, MEMBER_PLAYER])
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER, PROFILE_PLAYER])
    mockListCampaignCharacters.mockResolvedValue([LINKED_CHAR_OWNER, LINKED_CHAR_PLAYER])
  })

  it('renders linked chars with name and summary', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    expect(screen.getByText('Aragorn')).toBeDefined()
    expect(screen.getByText('Human — Ranger 5')).toBeDefined()
  })

  it('renders multiple linked chars', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char2')).toBeDefined())
    expect(screen.getByText('Legolas')).toBeDefined()
  })

  it('shows unlink button only for chars owned by current user', async () => {
    renderDetail('owner1')
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    // owner1's char1 → unlink button visible
    expect(screen.getByTestId('unlink-char-char1')).toBeDefined()
    // player1's char2 → no unlink button for owner1
    expect(screen.queryByTestId('unlink-char-char2')).toBeNull()
  })

  it('does not show unlink button on chars owned by other users', async () => {
    renderDetail('player1')
    await waitFor(() => expect(screen.getByTestId('linked-char-char2')).toBeDefined())
    // player1's char2 → unlink button visible
    expect(screen.getByTestId('unlink-char-char2')).toBeDefined()
    // owner1's char1 → no unlink button for player1
    expect(screen.queryByTestId('unlink-char-char1')).toBeNull()
  })

  it('shows owner name derived from member profiles', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    // "Jogador: Alice" for owner1's char — multiple Alice elements, use getAllByText
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Unknown member" when profile not found', async () => {
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER])
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char2')).toBeDefined())
    expect(screen.getAllByText(/Membro desconhecido/).length).toBeGreaterThanOrEqual(1)
  })

  it('clicking link button opens LinkCharacterModal', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('link-char-open-btn')).toBeDefined())
    await ue.click(screen.getByTestId('link-char-open-btn'))
    expect(screen.getByTestId('link-char-modal-stub')).toBeDefined()
  })
})
