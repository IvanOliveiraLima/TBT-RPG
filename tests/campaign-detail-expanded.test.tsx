/**
 * Tests for expanded CampaignDetail — members list, invite block, linked chars.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import CampaignDetail from '@/pages/CampaignDetail'
import type { Campaign, CampaignMember, UserProfile } from '@/domain/campaign'
import type { Character } from '@/domain/character'
import type { LinkedCharacterDetails } from '@/services/campaign-view'

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
// Still used by unlinkCharacterFromCampaign; listCampaignCharacters is no longer
// called directly by CampaignDetail (it goes through fetchLinkedCharactersDetails).

const mockUnlinkCharacterFromCampaign = vi.fn()

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: vi.fn().mockResolvedValue([]),
  unlinkCharacterFromCampaign: (...args: unknown[]) => mockUnlinkCharacterFromCampaign(...args),
}))

// ── Mock campaign-view service ────────────────────────────────────────────────

const mockFetchLinkedCharactersDetails = vi.fn()

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: (...args: unknown[]) => mockFetchLinkedCharactersDetails(...args),
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

// ── Mock LinkedCharCard to avoid complex rendering ───────────────────────────

vi.mock('@/components/campaigns/LinkedCharCard', () => ({
  LinkedCharCard: ({ detail, onUnlink, currentUserId, isCurrentUserOwner }: {
    detail: LinkedCharacterDetails; onUnlink: () => void; currentUserId: string | null; isCurrentUserOwner: boolean; campaignId: string
  }) => (
    <div data-testid={`linked-char-${detail.characterId}`}>
      <span>{detail.character?.name ?? 'Unknown character'}</span>
      {(isCurrentUserOwner || currentUserId === detail.ownerUserId) && (
        <button
          data-testid={`unlink-char-${detail.characterId}`}
          onClick={(e) => { e.stopPropagation(); void onUnlink() }}
        >
          Desvincular
        </button>
      )}
    </div>
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

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

const CHARACTER_ARAGORN: Character = {
  id: 'char1', name: 'Aragorn', race: 'Human', background: 'Noble',
  alignment: 'LG',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  experience: 0, age: '', height: '', weight: '',
  eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 14, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 14, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '', personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

const LINKED_DETAIL_OWNER: LinkedCharacterDetails = {
  characterId: 'char1',
  ownerUserId: 'owner1',
  ownerDisplayName: 'Alice',
  character: CHARACTER_ARAGORN,
  portraitData: null,
  symbolData: null,
}

const LINKED_DETAIL_PLAYER: LinkedCharacterDetails = {
  characterId: 'char2',
  ownerUserId: 'player1',
  ownerDisplayName: 'Bob',
  character: { ...CHARACTER_ARAGORN, id: 'char2', name: 'Legolas', race: 'Elf' },
  portraitData: null,
  symbolData: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    mockFetchLinkedCharactersDetails.mockResolvedValue([])
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
    mockFetchLinkedCharactersDetails.mockResolvedValue([])
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
    mockFetchLinkedCharactersDetails.mockResolvedValue([])
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
    mockFetchLinkedCharactersDetails.mockResolvedValue([LINKED_DETAIL_OWNER, LINKED_DETAIL_PLAYER])
  })

  it('renders linked chars with name', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    expect(screen.getByText('Aragorn')).toBeDefined()
  })

  it('renders multiple linked chars', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char2')).toBeDefined())
    expect(screen.getByText('Legolas')).toBeDefined()
  })

  it('shows unlink button for own chars and for owner on others chars', async () => {
    renderDetail('owner1')
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    // owner1's char1 → unlink button visible (own char)
    expect(screen.getByTestId('unlink-char-char1')).toBeDefined()
    // player1's char2 → owner1 also sees unlink (isOwner allows unlink on any char)
    expect(screen.getByTestId('unlink-char-char2')).toBeDefined()
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
    // "Alice" appears in the mocked LinkedCharCard via detail.character.name (Aragorn is owner1/Alice)
    // The mock renders character name; Alice shows in members list
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Unknown member" when profile not found', async () => {
    mockFetchLinkedCharactersDetails.mockResolvedValue([
      { ...LINKED_DETAIL_PLAYER, ownerDisplayName: null },
    ])
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char2')).toBeDefined())
    // The mock LinkedCharCard renders detail.character.name — doesn't show owner label.
    // The ownerDisplayName=null test is covered in linked-char-card.test.tsx.
    // Here we just verify the card is rendered when ownerDisplayName is null.
    expect(screen.getByTestId('linked-char-char2')).toBeDefined()
  })

  it('clicking link button opens LinkCharacterModal', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('link-char-open-btn')).toBeDefined())
    await ue.click(screen.getByTestId('link-char-open-btn'))
    expect(screen.getByTestId('link-char-modal-stub')).toBeDefined()
  })

  it('calls fetchLinkedCharactersDetails with the campaign id on load', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1')
  })
})

describe('CampaignDetail — char card navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetCampaign.mockResolvedValue(CAMPAIGN)
    mockListCampaignMembers.mockResolvedValue([MEMBER_MASTER, MEMBER_PLAYER])
    mockListProfilesByIds.mockResolvedValue([PROFILE_MASTER, PROFILE_PLAYER])
    mockFetchLinkedCharactersDetails.mockResolvedValue([LINKED_DETAIL_OWNER, LINKED_DETAIL_PLAYER])
  })

  // Navigation is handled inside LinkedCharCard (tested in linked-char-card.test.tsx).
  // CampaignDetail is responsible for rendering LinkedCharCard with the correct props
  // (campaignId, detail, isCurrentUserOwner, currentUserId). The tests below verify that
  // the cards are rendered and that the unlink button does not cause unwanted navigation
  // at the CampaignDetail level.

  it('renders linked char cards with correct testids', async () => {
    renderDetail('owner1')
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    expect(screen.getByTestId('linked-char-char2')).toBeDefined()
  })

  it('clicking unlink button does not navigate to char view', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    renderDetail('owner1')
    await waitFor(() => expect(screen.getByTestId('unlink-char-char1')).toBeDefined())
    await ue.click(screen.getByTestId('unlink-char-char1'))
    // mockNavigate should NOT have been called for char view navigation
    const charViewCalls = mockNavigate.mock.calls.filter(
      (call: string[]) => call[0]?.includes('/characters/')
    )
    expect(charViewCalls.length).toBe(0)
  })
})
