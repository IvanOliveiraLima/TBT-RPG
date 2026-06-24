import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock supabase ─────────────────────────────────────────────────────────────

let mockSupabaseConfigured = true

const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } })
const mockOnAuthStateChange = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    if (!mockSupabaseConfigured) return null
    return {
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        updateUser: mockUpdateUser,
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
      },
    }
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

const { useAuthStore } = await import('@/store/auth')

function getStore() {
  return useAuthStore.getState()
}

// ── requestPasswordReset ──────────────────────────────────────────────────────

describe('Auth store — requestPasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseConfigured = true
    useAuthStore.setState({ authCallbackType: null, passwordResetSuccess: false })
  })

  it('returns sent on success', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    const result = await getStore().requestPasswordReset('user@example.com')
    expect(result).toEqual({ status: 'sent' })
  })

  it('normalizes email (trim + lowercase) before calling supabase', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    await getStore().requestPasswordReset('  USER@Example.COM  ')
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({ redirectTo: expect.any(String) })
    )
  })

  it('passes redirectTo derived from origin + BASE_URL', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    await getStore().requestPasswordReset('user@example.com')
    const [, opts] = mockResetPasswordForEmail.mock.calls[0]
    expect(opts.redirectTo).toBe(`${window.location.origin}${import.meta.env.BASE_URL}`)
  })

  it('returns error reset_request_failed on supabase error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'some error' } })
    const result = await getStore().requestPasswordReset('user@example.com')
    expect(result).toEqual({ status: 'error', code: 'reset_request_failed' })
  })

  it('returns not_configured when supabase client is null', async () => {
    mockSupabaseConfigured = false
    const result = await getStore().requestPasswordReset('user@example.com')
    expect(result).toEqual({ status: 'error', code: 'not_configured' })
  })
})

// ── updatePassword ────────────────────────────────────────────────────────────

describe('Auth store — updatePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseConfigured = true
    useAuthStore.setState({ authCallbackType: 'recovery', passwordResetSuccess: false })
  })

  it('returns updated on success, clears authCallbackType, sets passwordResetSuccess', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    const result = await getStore().updatePassword('newpassword123')
    expect(result).toEqual({ status: 'updated' })
    expect(useAuthStore.getState().authCallbackType).toBeNull()
    expect(useAuthStore.getState().passwordResetSuccess).toBe(true)
  })

  it('returns password_too_weak for weak password error', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Password should be at least 6 characters' } })
    const result = await getStore().updatePassword('abc')
    expect(result).toEqual({ status: 'error', code: 'password_too_weak' })
    expect(useAuthStore.getState().passwordResetSuccess).toBe(false)
  })

  it('returns update_password_failed for other errors', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Unknown error' } })
    const result = await getStore().updatePassword('newpassword123')
    expect(result).toEqual({ status: 'error', code: 'update_password_failed' })
  })

  it('returns not_configured when supabase client is null', async () => {
    mockSupabaseConfigured = false
    const result = await getStore().updatePassword('newpassword123')
    expect(result).toEqual({ status: 'error', code: 'not_configured' })
  })

  it('does not mutate state on error', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'fail' } })
    await getStore().updatePassword('newpassword123')
    expect(useAuthStore.getState().authCallbackType).toBe('recovery')
    expect(useAuthStore.getState().passwordResetSuccess).toBe(false)
  })
})
