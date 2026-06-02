import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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
  useCampaignsStore: (selector?: (s: { campaigns: unknown[]; loading: boolean; fetchCampaigns: typeof mockFetchCampaigns; createCampaign: () => void; deleteCampaign: () => void }) => unknown) => {
    const state = {
      campaigns: mockCampaigns,
      loading: mockCampaignsLoading,
      fetchCampaigns: mockFetchCampaigns,
      createCampaign: vi.fn(),
      deleteCampaign: vi.fn(),
    }
    return selector ? selector(state) : state
  },
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
      { id: 'c1', name: 'Campaign A', description: null, ownerId: 'u1', createdAt: 1000, updatedAt: 2000 },
      { id: 'c2', name: 'Campaign B', description: 'A desc', ownerId: 'other', createdAt: 1000, updatedAt: 1500 }
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
