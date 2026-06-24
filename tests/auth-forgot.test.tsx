import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import Login from '@/pages/Login'

// ── Mock auth store ───────────────────────────────────────────────────────────

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockRequestPasswordReset = vi.fn()

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: {
    signIn: typeof mockSignIn
    signUp: typeof mockSignUp
    requestPasswordReset: typeof mockRequestPasswordReset
    authCallbackType: null
    passwordResetSuccess: boolean
  }) => unknown) => {
    const state = {
      signIn: mockSignIn,
      signUp: mockSignUp,
      requestPasswordReset: mockRequestPasswordReset,
      authCallbackType: null,
      passwordResetSuccess: false,
    }
    return selector ? selector(state) : state
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin() {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <I18nProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Login — forgot password mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockRequestPasswordReset.mockResolvedValue({ status: 'sent' })
  })

  it('shows forgot password link in signin mode', () => {
    renderLogin()
    expect(screen.getByTestId('forgot-password-link')).toBeDefined()
  })

  it('switches to forgot mode when link is clicked', async () => {
    renderLogin()
    fireEvent.click(screen.getByTestId('forgot-password-link'))
    await waitFor(() => expect(screen.getByText('Reset password')).toBeDefined())
    // password field hidden in forgot mode
    expect(screen.queryByTestId('login-password-input')).toBeNull()
  })

  it('shows validation error for invalid email', async () => {
    renderLogin()
    fireEvent.click(screen.getByTestId('forgot-password-link'))
    fireEvent.click(screen.getByTestId('login-submit-btn'))
    await waitFor(() => expect(screen.getByTestId('login-error')).toBeDefined())
  })

  it('shows neutral sent screen for valid email (anti-enumeration)', async () => {
    renderLogin()
    fireEvent.click(screen.getByTestId('forgot-password-link'))
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByTestId('login-submit-btn'))
    await waitFor(() => expect(screen.getByTestId('forgot-sent-screen')).toBeDefined())
    expect(screen.getByText('Check your email')).toBeDefined()
  })

  it('shows same sent screen even on request error (anti-enumeration)', async () => {
    mockRequestPasswordReset.mockResolvedValue({ status: 'error', code: 'reset_request_failed' })
    renderLogin()
    fireEvent.click(screen.getByTestId('forgot-password-link'))
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByTestId('login-submit-btn'))
    await waitFor(() => expect(screen.getByTestId('forgot-sent-screen')).toBeDefined())
  })

  it('back link from forgot mode returns to signin', async () => {
    renderLogin()
    fireEvent.click(screen.getByTestId('forgot-password-link'))
    await waitFor(() => expect(screen.getByTestId('forgot-back-link')).toBeDefined())
    fireEvent.click(screen.getByTestId('forgot-back-link'))
    await waitFor(() => expect(screen.getByTestId('login-password-input')).toBeDefined())
  })

  it('back button on sent screen returns to signin', async () => {
    renderLogin()
    fireEvent.click(screen.getByTestId('forgot-password-link'))
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByTestId('login-submit-btn'))
    await waitFor(() => expect(screen.getByTestId('forgot-back-to-signin-btn')).toBeDefined())
    fireEvent.click(screen.getByTestId('forgot-back-to-signin-btn'))
    await waitFor(() => expect(screen.getByTestId('login-password-input')).toBeDefined())
  })
})
