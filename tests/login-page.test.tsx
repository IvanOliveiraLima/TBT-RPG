import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import Login from '@/pages/Login'

// ── Mock react-router-dom ─────────────────────────────────────────────────────

const mockNavigate = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  }
})

// ── Mock auth store ───────────────────────────────────────────────────────────

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: { signIn: typeof mockSignIn; signUp: typeof mockSignUp }) => unknown) => {
    const state = { signIn: mockSignIn, signUp: mockSignUp }
    return selector ? selector(state) : state
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLogin(lang: 'pt' | 'en' = 'pt') {
  return renderWithI18n(<Login />, lang)
}

function emailInput() { return screen.getByTestId('login-email-input') }
function passwordInput() { return screen.getByTestId('login-password-input') }
function submitBtn() { return screen.getByTestId('login-submit-btn') }
function toggleBtn() { return screen.getByTestId('login-toggle-mode-btn') }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Login page — initial mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('renders signin mode by default (no ?mode param)', () => {
    renderLogin('pt')
    expect(screen.queryByTestId('login-password-confirm-input')).toBeNull()
    expect(screen.getByText('Entrar na conta')).toBeDefined()
  })

  it('renders signup mode when ?mode=signup in URL', () => {
    mockSearchParams = new URLSearchParams('mode=signup')
    renderLogin('pt')
    expect(screen.getByTestId('login-password-confirm-input')).toBeDefined()
    expect(screen.getByText('Crie sua conta')).toBeDefined()
  })

  it('signin mode does not show confirm password field', () => {
    renderLogin()
    expect(screen.queryByTestId('login-password-confirm-input')).toBeNull()
  })

  it('signup mode shows confirm password field', () => {
    mockSearchParams = new URLSearchParams('mode=signup')
    renderLogin()
    expect(screen.getByTestId('login-password-confirm-input')).toBeDefined()
  })
})

describe('Login page — toggle between modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('toggle from signin shows signup mode', () => {
    renderLogin('pt')
    expect(screen.queryByTestId('login-password-confirm-input')).toBeNull()
    fireEvent.click(toggleBtn())
    expect(screen.getByTestId('login-password-confirm-input')).toBeDefined()
  })

  it('toggle from signup returns to signin mode', () => {
    mockSearchParams = new URLSearchParams('mode=signup')
    renderLogin('pt')
    expect(screen.getByTestId('login-password-confirm-input')).toBeDefined()
    fireEvent.click(toggleBtn())
    expect(screen.queryByTestId('login-password-confirm-input')).toBeNull()
  })

  it('toggle preserves email but resets password and error', async () => {
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'mypassword' } })
    // trigger error by submitting with wrong creds
    mockSignIn.mockRejectedValueOnce(new Error('invalid'))
    fireEvent.click(submitBtn())
    await waitFor(() => expect(screen.getByTestId('login-error')).toBeDefined())
    // toggle mode
    fireEvent.click(toggleBtn())
    // email preserved
    expect((emailInput() as HTMLInputElement).value).toBe('user@test.com')
    // password reset
    expect((passwordInput() as HTMLInputElement).value).toBe('')
    // error cleared
    expect(screen.queryByTestId('login-error')).toBeNull()
  })
})

describe('Login page — signin flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('calls signIn with email and password on submit', async () => {
    mockSignIn.mockResolvedValueOnce(undefined)
    renderLogin()
    fireEvent.change(emailInput(), { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'pass123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'pass123'))
  })

  it('navigates to / by default after successful signin', async () => {
    mockSignIn.mockResolvedValueOnce(undefined)
    renderLogin()
    fireEvent.change(emailInput(), { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'pass123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('navigates to redirectTo after successful signin', async () => {
    mockSearchParams = new URLSearchParams('redirectTo=/campaigns')
    mockSignIn.mockResolvedValueOnce(undefined)
    renderLogin()
    fireEvent.change(emailInput(), { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'pass123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns'))
  })

  it('shows invalid_credentials error when signIn throws', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('invalid'))
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'wrongpass' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const err = screen.getByTestId('login-error')
      expect(err.textContent).toContain('E-mail ou senha inválidos')
    })
  })
})

describe('Login page — signup client-side validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('mode=signup')
  })

  it('shows invalid_email_format error for non-email input (PT)', async () => {
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'notanemail' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const err = screen.getByTestId('login-error')
      expect(err.textContent).toContain('e-mail válido')
    })
  })

  it('shows password_too_short error for password < 6 chars', async () => {
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: '123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: '123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const err = screen.getByTestId('login-error')
      expect(err.textContent).toContain('ao menos 6 caracteres')
    })
  })

  it('shows passwords_do_not_match error when confirm differs', async () => {
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'different' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const err = screen.getByTestId('login-error')
      expect(err.textContent).toContain('senhas não coincidem')
    })
  })

  it('submit button not disabled before submitting (shows errors on click)', () => {
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'invalid' } })
    fireEvent.change(passwordInput(), { target: { value: '123' } })
    expect((submitBtn() as HTMLButtonElement).disabled).toBe(false)
  })

  it('submit button enabled when all validation passes', () => {
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    expect((submitBtn() as HTMLButtonElement).disabled).toBe(false)
  })
})

describe('Login page — signup server flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('mode=signup')
  })

  it('shows awaiting_confirmation screen after successful signup', async () => {
    mockSignUp.mockResolvedValueOnce({ status: 'email_confirmation_required' })
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => expect(screen.getByTestId('signup-confirmation-screen')).toBeDefined())
  })

  it('confirmation screen includes the submitted email', async () => {
    mockSignUp.mockResolvedValueOnce({ status: 'email_confirmation_required' })
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'archer@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const screen2 = document.querySelector('[data-testid="signup-confirmation-screen"]')
      expect(screen2?.textContent).toContain('archer@test.com')
    })
  })

  it('navigates to redirectTo when signed_in immediately', async () => {
    mockSearchParams = new URLSearchParams('mode=signup&redirectTo=/campaigns')
    mockSignUp.mockResolvedValueOnce({ status: 'signed_in' })
    renderLogin()
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns'))
  })

  it('shows email_already_registered error from server', async () => {
    mockSignUp.mockResolvedValueOnce({ status: 'error', code: 'email_already_registered' })
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'existing@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const err = screen.getByTestId('login-error')
      expect(err.textContent).toContain('já está cadastrado')
    })
  })

  it('shows signup_failed error for generic server error', async () => {
    mockSignUp.mockResolvedValueOnce({ status: 'error', code: 'signup_failed' })
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const err = screen.getByTestId('login-error')
      expect(err.textContent).toContain('Não foi possível criar a conta')
    })
  })
})

describe('Login page — awaiting confirmation screen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('mode=signup')
  })

  it('back to signin button returns to signin form', async () => {
    mockSignUp.mockResolvedValueOnce({ status: 'email_confirmation_required' })
    renderLogin('pt')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => screen.getByTestId('back-to-signin-btn'))
    fireEvent.click(screen.getByTestId('back-to-signin-btn'))
    // back to signin form — confirm field gone
    expect(screen.queryByTestId('login-password-confirm-input')).toBeNull()
    expect(screen.queryByTestId('login-email-input')).toBeDefined()
  })

  it('hint about spam folder is shown (EN)', async () => {
    mockSearchParams = new URLSearchParams('mode=signup')
    mockSignUp.mockResolvedValueOnce({ status: 'email_confirmation_required' })
    renderLogin('en')
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => {
      const screen2 = document.querySelector('[data-testid="signup-confirmation-screen"]')
      expect(screen2?.textContent).toContain('spam')
    })
  })
})

describe('Login page — ?mode=signup&redirectTo combination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens in signup mode with redirectTo preserved for signed_in', async () => {
    mockSearchParams = new URLSearchParams('mode=signup&redirectTo=/campaigns')
    mockSignUp.mockResolvedValueOnce({ status: 'signed_in' })
    renderLogin()
    // Confirm signup mode
    expect(screen.getByTestId('login-password-confirm-input')).toBeDefined()
    fireEvent.change(emailInput(), { target: { value: 'user@test.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('login-password-confirm-input'), { target: { value: 'password123' } })
    fireEvent.click(submitBtn())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns'))
  })
})

describe('CharSelect — create account button navigation', () => {
  // Covered in char-select.test.tsx by checking navigate('/login?mode=signup')
  // This test verifies only the URL format using the Login component itself
  it('Login page reads ?mode=signup and starts in signup mode', () => {
    mockSearchParams = new URLSearchParams('mode=signup')
    renderLogin('pt')
    expect(screen.getByTestId('login-password-confirm-input')).toBeDefined()
    expect(screen.getByText('Crie sua conta')).toBeDefined()
  })
})
