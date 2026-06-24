import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, render } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import ResetPassword from '@/pages/ResetPassword'

// ── Mock auth store ───────────────────────────────────────────────────────────

const { mockUpdatePassword, mockSignOut, mockSetState } = vi.hoisted(() => ({
  mockUpdatePassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockSetState: vi.fn(),
}))

vi.mock('@/store/auth', () => {
  const store = (selector: (s: {
    updatePassword: typeof mockUpdatePassword
    signOut: typeof mockSignOut
  }) => unknown) => {
    const state = { updatePassword: mockUpdatePassword, signOut: mockSignOut }
    return selector ? selector(state) : state
  }
  store.setState = mockSetState
  return { useAuthStore: store }
})

function renderReset() {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <I18nProvider>
      <ResetPassword />
    </I18nProvider>
  )
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ResetPassword page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders title and two password inputs', () => {
    renderReset()
    expect(screen.getByText('Set a new password')).toBeDefined()
    expect(screen.getByTestId('reset-new-password-input')).toBeDefined()
    expect(screen.getByTestId('reset-confirm-password-input')).toBeDefined()
  })

  it('shows error when password is too short', async () => {
    renderReset()
    fireEvent.change(screen.getByTestId('reset-new-password-input'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByTestId('reset-confirm-password-input'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByTestId('reset-submit-btn'))
    await waitFor(() => expect(screen.getByTestId('reset-error')).toBeDefined())
    expect(screen.getByText('Password must be at least 6 characters.')).toBeDefined()
  })

  it('shows error when passwords do not match', async () => {
    renderReset()
    fireEvent.change(screen.getByTestId('reset-new-password-input'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('reset-confirm-password-input'), { target: { value: 'different123' } })
    fireEvent.click(screen.getByTestId('reset-submit-btn'))
    await waitFor(() => expect(screen.getByTestId('reset-error')).toBeDefined())
    expect(screen.getByText('Passwords do not match.')).toBeDefined()
  })

  it('calls updatePassword with valid passwords', async () => {
    mockUpdatePassword.mockResolvedValue({ status: 'updated' })
    renderReset()
    fireEvent.change(screen.getByTestId('reset-new-password-input'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByTestId('reset-confirm-password-input'), { target: { value: 'newpassword123' } })
    fireEvent.click(screen.getByTestId('reset-submit-btn'))
    await waitFor(() => expect(mockUpdatePassword).toHaveBeenCalledWith('newpassword123'))
  })

  it('shows error from store on updatePassword failure', async () => {
    mockUpdatePassword.mockResolvedValue({ status: 'error', code: 'update_password_failed' })
    renderReset()
    fireEvent.change(screen.getByTestId('reset-new-password-input'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByTestId('reset-confirm-password-input'), { target: { value: 'newpassword123' } })
    fireEvent.click(screen.getByTestId('reset-submit-btn'))
    await waitFor(() => expect(screen.getByTestId('reset-error')).toBeDefined())
    expect(screen.getByText("Couldn't update the password. Try again.")).toBeDefined()
  })

  it('sign out button calls signOut and clears authCallbackType', async () => {
    mockSignOut.mockResolvedValue(undefined)
    renderReset()
    fireEvent.click(screen.getByTestId('reset-signout-btn'))
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
    expect(mockSetState).toHaveBeenCalledWith({ authCallbackType: null })
  })
})
