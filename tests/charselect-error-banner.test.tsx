import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import CharSelect from '@/pages/CharSelect'

// ── Mock stores ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/store/characters', () => ({
  useCharactersStore: () => ({
    characters: [], loading: false, error: null,
    fetchCharacters: vi.fn().mockResolvedValue(undefined),
    addCharacter: vi.fn().mockResolvedValue(undefined),
    deleteCharacter: vi.fn().mockResolvedValue(undefined),
    updateCharacter: vi.fn(),
    flushPendingSaves: vi.fn(),
  }),
}))

vi.mock('@/store/campaigns', () => ({
  useCampaignsStore: () => ({
    campaigns: [], loading: false, error: null,
    fetchCampaigns: vi.fn().mockResolvedValue(undefined),
    createCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
  }),
}))

vi.mock('@/services/user-profile', () => ({
  getMyProfile: vi.fn().mockResolvedValue(null),
  upsertMyProfile: vi.fn(),
}))

// Dynamic auth state — overridden per test
let mockAuthState: {
  user: null
  loading: boolean
  signOut: () => void
  authCallbackType: string | null
  authCallbackError: string | null
  passwordResetSuccess: boolean
}

const { mockSetState } = vi.hoisted(() => ({ mockSetState: vi.fn() }))

vi.mock('@/store/auth', () => {
  const store = (selector?: (s: typeof mockAuthState) => unknown) => {
    return selector ? selector(mockAuthState) : mockAuthState
  }
  store.setState = mockSetState
  return { useAuthStore: store }
})

function renderCharSelect() {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <Routes>
          <Route path="*" element={<CharSelect />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CharSelect — authCallbackError banner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAuthState = {
      user: null, loading: false, signOut: vi.fn(),
      authCallbackType: null, authCallbackError: null, passwordResetSuccess: false,
    }
  })

  it('does not show error banner when authCallbackError is null', () => {
    renderCharSelect()
    expect(screen.queryByText('Link expired')).toBeNull()
  })

  it('shows amber banner when authCallbackError is set', async () => {
    mockAuthState.authCallbackError = 'otp_expired'
    renderCharSelect()
    await waitFor(() => expect(screen.getByText('Link expired')).toBeDefined())
    expect(screen.getByText('This recovery link has expired or was already used.')).toBeDefined()
    expect(screen.getByText('Request a new link')).toBeDefined()
  })

  it('action button navigates to /login?mode=forgot', async () => {
    mockAuthState.authCallbackError = 'otp_expired'
    renderCharSelect()
    await waitFor(() => screen.getByText('Request a new link'))
    fireEvent.click(screen.getByText('Request a new link'))
    expect(mockNavigate).toHaveBeenCalledWith('/login?mode=forgot')
  })

  it('clicking banner body dismisses (clears authCallbackError)', async () => {
    mockAuthState.authCallbackError = 'otp_expired'
    renderCharSelect()
    await waitFor(() => screen.getByRole('status'))
    fireEvent.click(screen.getByRole('status'))
    expect(mockSetState).toHaveBeenCalledWith({ authCallbackError: null })
  })

  it('clicking action button does not dismiss (stopPropagation)', async () => {
    mockAuthState.authCallbackError = 'otp_expired'
    renderCharSelect()
    await waitFor(() => screen.getByText('Request a new link'))
    fireEvent.click(screen.getByText('Request a new link'))
    // setState should NOT have been called with authCallbackError: null
    const dismissCall = mockSetState.mock.calls.find(
      (call: [{ authCallbackError?: unknown }]) => call[0].authCallbackError === null
    )
    expect(dismissCall).toBeUndefined()
  })
})

describe('CharSelect — ?mode=forgot deep link', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAuthState = {
      user: null, loading: false, signOut: vi.fn(),
      authCallbackType: null, authCallbackError: null, passwordResetSuccess: false,
    }
  })

  it('navigates to /login?mode=forgot when action is clicked (from error banner)', async () => {
    mockAuthState.authCallbackError = 'otp_expired'
    renderCharSelect()
    await waitFor(() => screen.getByText('Request a new link'))
    fireEvent.click(screen.getByText('Request a new link'))
    expect(mockNavigate).toHaveBeenCalledWith('/login?mode=forgot')
  })
})
