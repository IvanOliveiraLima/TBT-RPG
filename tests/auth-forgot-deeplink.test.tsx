import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import Login from '@/pages/Login'

// ── Mock auth store ───────────────────────────────────────────────────────────

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: {
    signIn: () => void
    signUp: () => void
    requestPasswordReset: () => void
    authCallbackType: null
    passwordResetSuccess: boolean
  }) => unknown) => {
    const state = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      requestPasswordReset: vi.fn(),
      authCallbackType: null,
      passwordResetSuccess: false,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

function renderLogin(search: string) {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter initialEntries={[`/login${search}`]}>
      <I18nProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Login — ?mode=forgot deep link', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('opens directly in forgot mode when ?mode=forgot', () => {
    renderLogin('?mode=forgot')
    expect(screen.getByText('Reset password')).toBeDefined()
    // password input should not be present in forgot mode
    expect(screen.queryByTestId('login-password-input')).toBeNull()
  })

  it('opens in signin mode when no mode param', () => {
    renderLogin('')
    expect(screen.queryByText('Reset password')).toBeNull()
    expect(screen.getByTestId('login-password-input')).toBeDefined()
  })

  it('opens in signup mode when ?mode=signup', () => {
    renderLogin('?mode=signup')
    expect(screen.getByText('Create your account')).toBeDefined()
    expect(screen.getByTestId('login-password-confirm-input')).toBeDefined()
  })
})
