import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false
let mockSession: { user: { id: string } } | null = null

const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockClient = {
  auth: {
    getSession: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: { session: mockSession } })
    ),
  },
  from: (...args: unknown[]) => mockFrom(...args),
}

// ── helpers ───────────────────────────────────────────────────────────────────

function setupAuth(userId = 'user_001') {
  mockSupabaseConfigured = true
  mockSession = { user: { id: userId } }
  mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } })
}

function resetAuth() {
  mockSupabaseConfigured = false
  mockSession = null
  mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
}

import {
  getMyProfile,
  getProfileById,
  upsertMyProfile,
} from '@/services/user-profile'

// ── getMyProfile ───────────────────────────────────────────────────────────────

describe('getMyProfile', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when supabase is null', async () => {
    resetAuth()
    const result = await getMyProfile()
    expect(result).toBeNull()
  })

  it('returns null when session is null', async () => {
    mockSupabaseConfigured = true
    mockSession = null
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
    const result = await getMyProfile()
    expect(result).toBeNull()
  })

  it('returns null when no profile row exists', async () => {
    setupAuth()
    const eqChain = { maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) }) })

    const result = await getMyProfile()
    expect(result).toBeNull()
  })

  it('returns mapped profile when exists', async () => {
    setupAuth('u1')
    const row = { user_id: 'u1', display_name: 'Alice', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
    const eqChain = { maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) }) })

    const result = await getMyProfile()
    expect(result?.displayName).toBe('Alice')
    expect(result?.userId).toBe('u1')
  })
})

// ── getProfileById ─────────────────────────────────────────────────────────────

describe('getProfileById', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when supabase is null', async () => {
    resetAuth()
    const result = await getProfileById('u1')
    expect(result).toBeNull()
  })

  it('returns null silently on supabase error', async () => {
    setupAuth()
    const eqChain = { maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'forbidden' } }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) }) })

    const result = await getProfileById('u1')
    expect(result).toBeNull()
  })

  it('returns mapped profile when found', async () => {
    setupAuth()
    const row = { user_id: 'u2', display_name: 'Bob', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
    const eqChain = { maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) }) })

    const result = await getProfileById('u2')
    expect(result?.displayName).toBe('Bob')
  })
})

// ── upsertMyProfile ────────────────────────────────────────────────────────────

describe('upsertMyProfile', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws UserProfileServiceError("not_authenticated") when supabase is null', async () => {
    resetAuth()
    await expect(upsertMyProfile('Alice')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws UserProfileServiceError("not_authenticated") when session is null', async () => {
    mockSupabaseConfigured = true
    mockSession = null
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
    await expect(upsertMyProfile('Alice')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws UserProfileServiceError("empty_display_name") for empty string', async () => {
    setupAuth()
    await expect(upsertMyProfile('')).rejects.toMatchObject({ code: 'empty_display_name' })
  })

  it('throws UserProfileServiceError("empty_display_name") for whitespace-only string', async () => {
    setupAuth()
    await expect(upsertMyProfile('   ')).rejects.toMatchObject({ code: 'empty_display_name' })
  })

  it('throws UserProfileServiceError("display_name_too_long") for 51+ chars', async () => {
    setupAuth()
    await expect(upsertMyProfile('a'.repeat(51))).rejects.toMatchObject({ code: 'display_name_too_long' })
  })

  it('allows exactly 50 characters', async () => {
    setupAuth('u1')
    const name = 'a'.repeat(50)
    const row = { user_id: 'u1', display_name: name, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
    const upsertChain = { select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: row, error: null }) }) }
    mockFrom.mockReturnValue({ upsert: vi.fn().mockReturnValue(upsertChain) })

    const result = await upsertMyProfile(name)
    expect(result.displayName).toBe(name)
  })

  it('trims the display name before upsert', async () => {
    setupAuth('u1')
    let capturedUpsert: unknown
    const row = { user_id: 'u1', display_name: 'Alice', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
    const upsertChain = { select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: row, error: null }) }) }
    const upsertFn = vi.fn().mockImplementation((val: unknown) => { capturedUpsert = val; return upsertChain })
    mockFrom.mockReturnValue({ upsert: upsertFn })

    await upsertMyProfile('  Alice  ')
    expect((capturedUpsert as Record<string, unknown>)['display_name']).toBe('Alice')
  })

  it('throws UserProfileServiceError("upsert_failed") on supabase error', async () => {
    setupAuth()
    const upsertChain = { select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }) }) }
    mockFrom.mockReturnValue({ upsert: vi.fn().mockReturnValue(upsertChain) })

    await expect(upsertMyProfile('Alice')).rejects.toMatchObject({ code: 'upsert_failed' })
  })

  it('returns mapped UserProfile on success', async () => {
    setupAuth('u1')
    const row = { user_id: 'u1', display_name: 'Alice', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' }
    const upsertChain = { select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: row, error: null }) }) }
    mockFrom.mockReturnValue({ upsert: vi.fn().mockReturnValue(upsertChain) })

    const result = await upsertMyProfile('Alice')
    expect(result.displayName).toBe('Alice')
    expect(result.userId).toBe('u1')
    expect(typeof result.createdAt).toBe('number')
  })
})
