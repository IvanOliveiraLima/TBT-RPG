/**
 * Tests for the "Minhas Campanhas" section added to CharSelect.
 * Covers: auth states, campaign list, empty state, create button flows.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import CharSelect from '@/pages/CharSelect'
import type { Campaign } from '@/domain/campaign'

// ── Mock navigate ─────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock characters store (not under test here) ───────────────────────────────
vi.mock('@/store/characters', () => ({
  useCharactersStore: () => ({
    characters: [],
    loading: false,
    error: null,
    fetchCharacters: vi.fn().mockResolvedValue(undefined),
    addCharacter: vi.fn().mockResolvedValue(undefined),
    deleteCharacter: vi.fn().mockResolvedValue(undefined),
    updateCharacter: vi.fn(),
    flushPendingSaves: vi.fn(),
  }),
}))

// ── Mock auth store (selector-aware) ─────────────────────────────────────────
let mockUser: { id: string; email?: string } | null = null

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector?: (s: { user: { id: string; email?: string } | null; loading: boolean; signOut: () => void }) => unknown) => {
    const state = { user: mockUser, loading: false, signOut: vi.fn() }
    return selector ? selector(state) : state
  },
}))

// ── Mock campaigns store (selector-aware) ─────────────────────────────────────
let mockCampaigns: Campaign[] = []
let mockCampaignsLoading = false
const mockFetchCampaigns = vi.fn().mockResolvedValue(undefined)
const mockCreateCampaign = vi.fn()

vi.mock('@/store/campaigns', () => ({
  useCampaignsStore: (selector?: (s: {
    campaigns: Campaign[]
    loading: boolean
    error: string | null
    fetchCampaigns: () => Promise<void>
    createCampaign: (input: { name: string; description?: string }) => Promise<Campaign>
    deleteCampaign: (id: string) => Promise<void>
  }) => unknown) => {
    const state = {
      campaigns: mockCampaigns,
      loading: mockCampaignsLoading,
      error: null,
      fetchCampaigns: mockFetchCampaigns,
      createCampaign: mockCreateCampaign,
      deleteCampaign: vi.fn().mockResolvedValue(undefined),
    }
    return selector ? selector(state) : state
  },
}))

// ── Mock user-profile service ─────────────────────────────────────────────────
const mockGetMyProfile = vi.fn()

vi.mock('@/services/user-profile', () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
  upsertMyProfile: vi.fn(),
}))

// ── Mock campaign modals ──────────────────────────────────────────────────────
const mockProfileSetupOnComplete = vi.fn()
const mockCreateCampaignOnCreated = vi.fn()

vi.mock('@/components/campaigns/ProfileSetupModal', () => ({
  ProfileSetupModal: ({ onComplete, onCancel }: { onComplete: () => void; onCancel: () => void }) => {
    mockProfileSetupOnComplete.mockImplementation(onComplete)
    return (
      <div data-testid="profile-setup-modal">
        <button data-testid="profile-setup-complete" onClick={onComplete}>Complete</button>
        <button data-testid="profile-setup-cancel" onClick={onCancel}>Cancel</button>
      </div>
    )
  },
}))

vi.mock('@/components/campaigns/CreateCampaignModal', () => ({
  CreateCampaignModal: ({ onCreated, onCancel }: { onCreated: (c: Campaign) => void; onCancel: () => void }) => {
    mockCreateCampaignOnCreated.mockImplementation(onCreated)
    return (
      <div data-testid="create-campaign-modal">
        <button
          data-testid="create-campaign-submit-stub"
          onClick={() => onCreated({ id: 'camp_01', name: 'Test Campaign', description: null, ownerId: 'u1', createdAt: 0, updatedAt: 0 })}
        >
          Create
        </button>
        <button data-testid="create-campaign-cancel-stub" onClick={onCancel}>Cancel</button>
      </div>
    )
  },
}))

// ── Mock AI modal (not under test) ────────────────────────────────────────────
vi.mock('@/components/AIGenerationModal', () => ({
  AIGenerationModal: ({ onClose }: { onClose: () => void; onCharacterGenerated: (c: unknown) => void }) => (
    <div data-testid="ai-modal">
      <button data-testid="ai-modal-close" onClick={onClose}>Close</button>
    </div>
  ),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
function render(lang: 'pt' | 'en' = 'pt') {
  return renderWithI18n(<CharSelect />, lang)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CharSelect — campaigns section — unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    mockCampaigns = []
    mockCampaignsLoading = false
    mockGetMyProfile.mockResolvedValue(null)
    localStorage.clear()
  })

  it('shows PT section title "Minhas Campanhas"', () => {
    render('pt')
    expect(screen.getByText('Minhas Campanhas')).toBeDefined()
  })

  it('shows EN section title "My Campaigns"', () => {
    render('en')
    expect(screen.getByText('My Campaigns')).toBeDefined()
  })

  it('shows PT login prompt when not authenticated', () => {
    render('pt')
    expect(screen.getByText('Entre para criar e gerenciar campanhas.')).toBeDefined()
  })

  it('shows EN login prompt when not authenticated', () => {
    render('en')
    expect(screen.getByText('Sign in to create and manage campaigns.')).toBeDefined()
  })

  it('does not show empty state when unauthenticated (only login prompt)', () => {
    render('pt')
    expect(screen.queryByTestId('campaigns-empty-charselect')).toBeNull()
  })

  it('does not call fetchCampaigns when user is not logged in', () => {
    render('pt')
    expect(mockFetchCampaigns).not.toHaveBeenCalled()
  })

  it('shows "+ Criar Campanha" button', () => {
    render('pt')
    expect(screen.getByTestId('charselect-create-campaign-btn')).toBeDefined()
  })

  it('"+ Criar Campanha" redirects to /login?redirectTo=/campaigns when not authenticated', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('charselect-create-campaign-btn'))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login?redirectTo=/campaigns'))
  })
})

describe('CharSelect — campaigns section — authenticated, no campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 'u1', email: 'a@b.com' }
    mockCampaigns = []
    mockCampaignsLoading = false
    mockGetMyProfile.mockResolvedValue({ userId: 'u1', displayName: 'Alice', createdAt: 0, updatedAt: 0 })
    localStorage.clear()
  })

  it('calls fetchCampaigns on mount when user is logged in', () => {
    render('pt')
    expect(mockFetchCampaigns).toHaveBeenCalledOnce()
  })

  it('shows PT empty state', () => {
    render('pt')
    expect(screen.getByText('Nenhuma campanha ainda. Crie a sua primeira!')).toBeDefined()
  })

  it('shows EN empty state', () => {
    render('en')
    expect(screen.getByText('No campaigns yet. Create your first one!')).toBeDefined()
  })

  it('does not show login prompt when authenticated', () => {
    render('pt')
    expect(screen.queryByTestId('campaigns-login-prompt')).toBeNull()
  })

  it('does not show campaign list', () => {
    render('pt')
    expect(screen.queryByTestId('compact-campaign-list')).toBeNull()
  })

  it('"+ Criar Campanha" opens create modal when profile exists', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('charselect-create-campaign-btn'))
    await waitFor(() => expect(screen.getByTestId('create-campaign-modal')).toBeDefined())
    expect(screen.queryByTestId('profile-setup-modal')).toBeNull()
  })

  it('"+ Criar Campanha" opens profile setup when no profile', async () => {
    mockGetMyProfile.mockResolvedValue(null)
    render('pt')
    fireEvent.click(screen.getByTestId('charselect-create-campaign-btn'))
    await waitFor(() => expect(screen.getByTestId('profile-setup-modal')).toBeDefined())
    expect(screen.queryByTestId('create-campaign-modal')).toBeNull()
  })

  it('profile setup completion opens create modal automatically', async () => {
    mockGetMyProfile.mockResolvedValue(null)
    render('pt')
    fireEvent.click(screen.getByTestId('charselect-create-campaign-btn'))
    await waitFor(() => expect(screen.getByTestId('profile-setup-modal')).toBeDefined())
    // Complete profile setup
    fireEvent.click(screen.getByTestId('profile-setup-complete'))
    await waitFor(() => expect(screen.getByTestId('create-campaign-modal')).toBeDefined())
  })

  it('cancelling create modal closes it', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('charselect-create-campaign-btn'))
    await waitFor(() => expect(screen.getByTestId('create-campaign-modal')).toBeDefined())
    fireEvent.click(screen.getByTestId('create-campaign-cancel-stub'))
    expect(screen.queryByTestId('create-campaign-modal')).toBeNull()
  })

  it('successful create navigates to /campaigns/{id}', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('charselect-create-campaign-btn'))
    await waitFor(() => expect(screen.getByTestId('create-campaign-modal')).toBeDefined())
    fireEvent.click(screen.getByTestId('create-campaign-submit-stub'))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns/camp_01'))
  })
})

describe('CharSelect — campaigns section — authenticated, with campaigns', () => {
  const CAMP_A: Campaign = { id: 'ca1', name: 'Mines of Moria', description: 'A dangerous dungeon', ownerId: 'u1', createdAt: 0, updatedAt: 0 }
  const CAMP_B: Campaign = { id: 'ca2', name: 'Icewind Dale', description: null, ownerId: 'u2', createdAt: 0, updatedAt: 0 }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 'u1', email: 'a@b.com' }
    mockCampaigns = [CAMP_A, CAMP_B]
    mockCampaignsLoading = false
    mockGetMyProfile.mockResolvedValue({ userId: 'u1', displayName: 'Alice', createdAt: 0, updatedAt: 0 })
    localStorage.clear()
  })

  it('renders the compact campaign list', () => {
    render('pt')
    expect(screen.getByTestId('compact-campaign-list')).toBeDefined()
  })

  it('renders a card for each campaign', () => {
    render('pt')
    expect(screen.getByTestId('compact-campaign-card-ca1')).toBeDefined()
    expect(screen.getByTestId('compact-campaign-card-ca2')).toBeDefined()
  })

  it('shows campaign names', () => {
    render('pt')
    expect(screen.getByText('Mines of Moria')).toBeDefined()
    expect(screen.getByText('Icewind Dale')).toBeDefined()
  })

  it('shows description when present', () => {
    render('pt')
    expect(screen.getByText('A dangerous dungeon')).toBeDefined()
  })

  it('does not show empty state', () => {
    render('pt')
    expect(screen.queryByTestId('campaigns-empty-charselect')).toBeNull()
  })

  it('clicking a campaign card navigates to /campaigns/{id}', () => {
    render('pt')
    fireEvent.click(screen.getByTestId('compact-campaign-card-ca1'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/ca1')
  })

  it('campaign card has accessible aria-label with campaign name', () => {
    render('pt')
    const card = screen.getByTestId('compact-campaign-card-ca1')
    expect(card.getAttribute('aria-label')).toContain('Moria')
  })

  it('shows "+ Criar Campanha" button alongside campaign list', () => {
    render('pt')
    expect(screen.getByTestId('charselect-create-campaign-btn')).toBeDefined()
  })
})

describe('CharSelect — campaigns section — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 'u1' }
    mockCampaigns = []
    mockCampaignsLoading = true
    mockGetMyProfile.mockResolvedValue(null)
    localStorage.clear()
  })

  it('does not show empty state while loading', () => {
    render('pt')
    expect(screen.queryByTestId('campaigns-empty-charselect')).toBeNull()
  })

  it('does not show campaign list while loading', () => {
    render('pt')
    expect(screen.queryByTestId('compact-campaign-list')).toBeNull()
  })
})
