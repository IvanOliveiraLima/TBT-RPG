/**
 * Tests that the Login form submits on Enter key press.
 * Separate file to use its own mock setup for requestPasswordReset.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import Login from '@/pages/Login'

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

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockRequestPasswordReset = vi.fn()

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: {
    signIn: typeof mockSignIn
    signUp: typeof mockSignUp
    requestPasswordReset: typeof mockRequestPasswordReset
  }) => unknown) => {
    const state = { signIn: mockSignIn, signUp: mockSignUp, requestPasswordReset: mockRequestPasswordReset }
    return selector ? selector(state) : state
  },
}))

describe('Login — Enter key submits form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockSignIn.mockResolvedValue(undefined)
    mockSignUp.mockResolvedValue({ status: 'signed_in' })
    mockRequestPasswordReset.mockResolvedValue({ status: 'sent' })
  })

  it('pressing Enter in email field triggers signin', async () => {
    renderWithI18n(<Login />, 'pt')
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByTestId('login-email-input').closest('form')!)
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'secret'))
  })

  it('pressing Enter in password field triggers signin', async () => {
    renderWithI18n(<Login />, 'pt')
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByTestId('login-password-input').closest('form')!)
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'secret'))
  })

  it('submit button has type="submit"', () => {
    renderWithI18n(<Login />, 'pt')
    expect((screen.getByTestId('login-submit-btn') as HTMLButtonElement).type).toBe('submit')
  })

  it('forgot-password-link has type="button" (does not submit form)', () => {
    renderWithI18n(<Login />, 'pt')
    expect((screen.getByTestId('forgot-password-link') as HTMLButtonElement).type).toBe('button')
  })

  it('login-toggle-mode-btn has type="button" (does not submit form)', () => {
    renderWithI18n(<Login />, 'pt')
    expect((screen.getByTestId('login-toggle-mode-btn') as HTMLButtonElement).type).toBe('button')
  })

  it('login-back-btn has type="button" (does not submit form)', () => {
    renderWithI18n(<Login />, 'pt')
    expect((screen.getByTestId('login-back-btn') as HTMLButtonElement).type).toBe('button')
  })

  it('Enter in forgot mode triggers requestPasswordReset', async () => {
    mockSearchParams = new URLSearchParams('mode=forgot')
    renderWithI18n(<Login />, 'pt')
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@test.com' } })
    fireEvent.submit(screen.getByTestId('login-email-input').closest('form')!)
    await waitFor(() => expect(mockRequestPasswordReset).toHaveBeenCalledWith('user@test.com'))
  })
})
