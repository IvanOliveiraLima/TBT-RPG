import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock supabase ─────────────────────────────────────────────────────────────

let mockSupabaseConfigured = true

const mockSignUp = vi.fn()
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } })
const mockOnAuthStateChange = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    if (!mockSupabaseConfigured) return null
    return {
      auth: {
        signUp: mockSignUp,
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
      },
    }
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// ── Import store after mock ────────────────────────────────────────────────────

const { useAuthStore } = await import('@/store/auth')

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSignUp() {
  return useAuthStore.getState().signUp
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Auth store — signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseConfigured = true
  })

  it('returns email_confirmation_required when Supabase returns no session', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: { id: 'u1' } }, error: null })
    const result = await getSignUp()('test@example.com', 'password123')
    expect(result.status).toBe('email_confirmation_required')
  })

  it('returns signed_in when Supabase returns session immediately', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com' }
    const mockSession = { access_token: 'tok', user: mockUser }
    mockSignUp.mockResolvedValue({ data: { session: mockSession, user: mockUser }, error: null })
    const result = await getSignUp()('test@example.com', 'password123')
    expect(result.status).toBe('signed_in')
  })

  it('sets user in store when signed_in immediately', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com' }
    const mockSession = { access_token: 'tok', user: mockUser }
    mockSignUp.mockResolvedValue({ data: { session: mockSession, user: mockUser }, error: null })
    await getSignUp()('test@example.com', 'password123')
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('normalizes email (trim + lowercase) before sending to Supabase', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: null })
    await getSignUp()('  TEST@Example.COM  ', 'password123')
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('returns not_configured when supabase client is null', async () => {
    mockSupabaseConfigured = false
    const result = await getSignUp()('test@example.com', 'password123')
    expect(result).toEqual({ status: 'error', code: 'not_configured' })
  })

  it('returns email_already_registered for "already registered" error message', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'User already registered' } })
    const result = await getSignUp()('test@example.com', 'password123')
    expect(result).toEqual({ status: 'error', code: 'email_already_registered' })
  })

  it('returns email_already_registered for "already exists" error message', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'User already exists' } })
    const result = await getSignUp()('test@example.com', 'password123')
    expect(result).toEqual({ status: 'error', code: 'email_already_registered' })
  })

  it('returns password_too_weak for "Password should be" error message', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'Password should be at least 6 characters' } })
    const result = await getSignUp()('test@example.com', 'abc')
    expect(result).toEqual({ status: 'error', code: 'password_too_weak' })
  })

  it('returns invalid_email for "invalid email" error message', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'invalid email' } })
    const result = await getSignUp()('not-an-email', 'password123')
    expect(result).toEqual({ status: 'error', code: 'invalid_email' })
  })

  it('returns invalid_email for "Invalid email" (capital) error message', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'Invalid email format' } })
    const result = await getSignUp()('not-an-email', 'password123')
    expect(result).toEqual({ status: 'error', code: 'invalid_email' })
  })

  it('returns signup_failed for unknown errors', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'Some random server error' } })
    const result = await getSignUp()('test@example.com', 'password123')
    expect(result).toEqual({ status: 'error', code: 'signup_failed' })
  })
})
