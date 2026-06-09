import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import CampaignSelect from '@/pages/CampaignSelect'

// ── Mock react-router-dom navigate ───────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock auth store ───────────────────────────────────────────────────────────

let mockUser: { id: string; email: string } | null = null
let mockAuthLoading = false

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector?: (s: { user: typeof mockUser; loading: boolean }) => unknown) => {
    const state = { user: mockUser, loading: mockAuthLoading }
    return selector ? selector(state) : state
  },
}))

// ── Mock user-profile service ─────────────────────────────────────────────────

const mockGetMyProfile = vi.fn()
vi.mock('@/services/user-profile', () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
}))

// ── Mock campaigns store ──────────────────────────────────────────────────────

const mockFetchCampaigns = vi.fn()
const mockCampaigns: unknown[] = []
let mockCampaignsLoading = false

vi.mock('@/store/campaigns', () => ({
  useCampaignsStore: (selector?: (s: { campaigns: unknown[]; loading: boolean; fetchCampaigns: typeof mockFetchCampaigns; createCampaign: () => void; deleteCampaign: () => void; leaveCampaign: () => void }) => unknown) => {
    const state = {
      campaigns: mockCampaigns,
      loading: mockCampaignsLoading,
      fetchCampaigns: mockFetchCampaigns,
      createCampaign: vi.fn(),
      deleteCampaign: vi.fn(),
      leaveCampaign: vi.fn(),
    }
    return selector ? selector(state) : state
  },
}))

// ── Mock JoinCampaignModal ────────────────────────────────────────────────────
vi.mock('@/components/campaigns/JoinCampaignModal', () => ({
  JoinCampaignModal: ({ onJoined, onCancel }: { onJoined: (id: string, status: string) => void; onCancel: () => void }) => (
    <div data-testid="join-campaign-modal-stub">
      <button
        data-testid="join-modal-submit-stub"
        onClick={() => onJoined('joined_camp_01', 'joined')}
      >
        Join
      </button>
      <button data-testid="join-modal-cancel-stub" onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

// ── helpers ───────────────────────────────────────────────────────────────────

function renderPage(lang: 'pt' | 'en' = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CampaignSelect />
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('CampaignSelect — unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUser = null
    mockAuthLoading = false
    mockFetchCampaigns.mockResolvedValue(undefined)
    mockGetMyProfile.mockResolvedValue(null)
    mockCampaigns.length = 0
    mockCampaignsLoading = false
  })

  it('redirects to /login?redirectTo=/campaigns when not authenticated', () => {
    renderPage()
    expect(mockNavigate).toHaveBeenCalledWith('/login?redirectTo=/campaigns')
  })

  it('renders nothing (null) when not authenticated', () => {
    const { container } = renderPage()
    expect(container.firstChild).toBeNull()
  })
})

describe('CampaignSelect — authenticated, no profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUser = { id: 'u1', email: 'test@test.com' }
    mockAuthLoading = false
    mockGetMyProfile.mockResolvedValue(null) // no profile
    mockFetchCampaigns.mockResolvedValue(undefined)
    mockCampaigns.length = 0
    mockCampaignsLoading = false
  })

  it('shows profile setup modal when user has no profile', async () => {
    renderPage('pt')
    await waitFor(() => expect(screen.queryByTestId('profile-setup-modal')).toBeDefined())
  })
})

describe('CampaignSelect — authenticated, with profile, no campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUser = { id: 'u1', email: 'test@test.com' }
    mockAuthLoading = false
    mockGetMyProfile.mockResolvedValue({ userId: 'u1', displayName: 'Alice', createdAt: 0, updatedAt: 0 })
    mockFetchCampaigns.mockResolvedValue(undefined)
    mockCampaigns.length = 0
    mockCampaignsLoading = false
  })

  it('shows PT page title "Minhas Campanhas"', async () => {
    renderPage('pt')
    await waitFor(() => expect(screen.getByText('Minhas Campanhas')).toBeDefined())
  })

  it('shows EN page title "My Campaigns"', async () => {
    renderPage('en')
    await waitFor(() => expect(screen.getByText('My Campaigns')).toBeDefined())
  })

  it('shows create button', async () => {
    renderPage('pt')
    await waitFor(() => expect(screen.getByTestId('create-campaign-btn')).toBeDefined())
  })

  it('shows PT empty state message', async () => {
    renderPage('pt')
    await waitFor(() => expect(screen.getByTestId('campaigns-empty')).toBeDefined())
    expect(screen.getByText('Nenhuma campanha ainda. Crie a sua primeira!')).toBeDefined()
  })

  it('shows EN empty state message', async () => {
    renderPage('en')
    await waitFor(() => expect(screen.getByTestId('campaigns-empty')).toBeDefined())
    expect(screen.getByText("No campaigns yet. Create your first one!")).toBeDefined()
  })

  it('calls fetchCampaigns on mount', async () => {
    renderPage()
    await waitFor(() => expect(mockFetchCampaigns).toHaveBeenCalled())
  })
})

describe('CampaignSelect — with campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUser = { id: 'u1', email: 'test@test.com' }
    mockAuthLoading = false
    mockGetMyProfile.mockResolvedValue({ userId: 'u1', displayName: 'Alice', createdAt: 0, updatedAt: 0 })
    mockFetchCampaigns.mockResolvedValue(undefined)
    mockCampaigns.length = 0
    mockCampaigns.push(
      { id: 'c1', name: 'Campaign A', description: null, ownerId: 'u1', inviteCode: 'ABCD1234', createdAt: 1000, updatedAt: 2000 },
      { id: 'c2', name: 'Campaign B', description: 'A desc', ownerId: 'other', inviteCode: 'EFGH5678', createdAt: 1000, updatedAt: 1500 }
    )
    mockCampaignsLoading = false
  })

  it('renders campaign list', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('campaign-list')).toBeDefined())
    expect(screen.getByTestId('campaign-card-c1')).toBeDefined()
    expect(screen.getByTestId('campaign-card-c2')).toBeDefined()
  })

  it('shows campaign names in cards', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Campaign A')).toBeDefined())
    expect(screen.getByText('Campaign B')).toBeDefined()
  })

  it('does not show empty state when campaigns exist', async () => {
    renderPage()
    await waitFor(() => expect(screen.queryByTestId('campaigns-empty')).toBeNull())
  })
})

describe('CampaignSelect — join with code button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUser = { id: 'u1', email: 'test@test.com' }
    mockAuthLoading = false
    mockGetMyProfile.mockResolvedValue({ userId: 'u1', displayName: 'Alice', createdAt: 0, updatedAt: 0 })
    mockFetchCampaigns.mockResolvedValue(undefined)
    mockCampaigns.length = 0
    mockCampaignsLoading = false
  })

  it('shows "Entrar com código" button (PT)', async () => {
    renderPage('pt')
    await waitFor(() => expect(screen.getByTestId('join-campaign-btn')).toBeDefined())
  })

  it('shows "Join with code" button (EN)', async () => {
    renderPage('en')
    await waitFor(() => expect(screen.getByText('Join with code')).toBeDefined())
  })

  it('clicking join button opens JoinCampaignModal', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('join-campaign-btn')).toBeDefined())
    fireEvent.click(screen.getByTestId('join-campaign-btn'))
    expect(screen.getByTestId('join-campaign-modal-stub')).toBeDefined()
  })

  it('successful join navigates to campaign detail', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('join-campaign-btn')).toBeDefined())
    fireEvent.click(screen.getByTestId('join-campaign-btn'))
    fireEvent.click(screen.getByTestId('join-modal-submit-stub'))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns/joined_camp_01'))
  })

  it('cancelling join modal closes it', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('join-campaign-btn')).toBeDefined())
    fireEvent.click(screen.getByTestId('join-campaign-btn'))
    fireEvent.click(screen.getByTestId('join-modal-cancel-stub'))
    expect(screen.queryByTestId('join-campaign-modal-stub')).toBeNull()
  })
})
