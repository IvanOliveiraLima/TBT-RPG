import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import Login from '@/pages/Login'

// ── Mock auth store ───────────────────────────────────────────────────────────

const mockSignIn = vi.fn()

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ signIn: mockSignIn }),
}))

// ── Mock useNavigate ──────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── helpers ───────────────────────────────────────────────────────────────────

function renderLogin(search = '') {
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

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Login — redirectTo param', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockSignIn.mockResolvedValue(undefined)
  })

  it('navigates to "/" by default when no redirectTo param', async () => {
    const { container } = renderLogin()
    fireEvent.change(container.querySelector('input[type="email"]') as HTMLInputElement, { target: { value: 'a@b.com' } })
    fireEvent.change(container.querySelector('input[type="password"]') as HTMLInputElement, { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('navigates to redirectTo path after sign in', async () => {
    const { container } = renderLogin('?redirectTo=/campaigns')
    fireEvent.change(container.querySelector('input[type="email"]') as HTMLInputElement, { target: { value: 'a@b.com' } })
    fireEvent.change(container.querySelector('input[type="password"]') as HTMLInputElement, { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns'))
  })

  it('does not navigate when sign in fails', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    const { container } = renderLogin('?redirectTo=/campaigns')
    fireEvent.change(container.querySelector('input[type="email"]') as HTMLInputElement, { target: { value: 'a@b.com' } })
    fireEvent.change(container.querySelector('input[type="password"]') as HTMLInputElement, { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeDefined())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
