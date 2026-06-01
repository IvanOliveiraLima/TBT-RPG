import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import { StatusBadge } from '@/components/primitives/StatusBadge'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import type { User, Session } from '@/lib/supabase'

// ── mock auth store ───────────────────────────────────────────────────────────

const mockAuthStore = vi.fn()

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: { loading: boolean; user: User | null; session: Session | null }) => unknown) =>
    mockAuthStore(selector),
}))

function setAuthState(state: { loading: boolean; user: User | null }) {
  mockAuthStore.mockImplementation(
    (sel: (s: { loading: boolean; user: User | null; session: Session | null }) => unknown) =>
      sel({ ...state, session: null }),
  )
}

// ── mock @/services/sync (so useAuthStatus doesn't pull in real sync state) ───

vi.mock('@/services/sync', () => ({
  getSyncStatus:      () => 'idle' as const,
  onSyncStatusChange: () => () => undefined,  // returns no-op unsubscribe
}))

// ── StatusBadge component ─────────────────────────────────────────────────────

describe('StatusBadge', () => {
  it('renders with success variant', () => {
    render(<StatusBadge variant="success">Connected</StatusBadge>)
    expect(screen.getByText('Connected')).toBeDefined()
  })

  it('renders with neutral variant', () => {
    render(<StatusBadge variant="neutral">Sign in</StatusBadge>)
    expect(screen.getByText('Sign in')).toBeDefined()
  })

  it('applies dot indicator via status-badge-dot class', () => {
    const { container } = render(<StatusBadge variant="success">OK</StatusBadge>)
    const dot = container.querySelector('.status-badge-dot')
    expect(dot).not.toBeNull()
  })

  it('dot is aria-hidden (decorative)', () => {
    const { container } = render(<StatusBadge variant="success">OK</StatusBadge>)
    const dot = container.querySelector('.status-badge-dot')
    expect(dot?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders success testid', () => {
    render(<StatusBadge variant="success">OK</StatusBadge>)
    expect(screen.getByTestId('status-badge-success')).toBeDefined()
  })

  it('renders neutral testid', () => {
    render(<StatusBadge variant="neutral">Sign in</StatusBadge>)
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
  })

  it('success badge has success CSS class', () => {
    const { container } = render(<StatusBadge variant="success">OK</StatusBadge>)
    expect((container.firstChild as HTMLElement).classList.contains('status-badge-success')).toBe(true)
  })

  it('neutral badge has neutral CSS class', () => {
    const { container } = render(<StatusBadge variant="neutral">Sign in</StatusBadge>)
    expect((container.firstChild as HTMLElement).classList.contains('status-badge-neutral')).toBe(true)
  })

  it('is not interactive (no cursor pointer, no click handler)', () => {
    const { container } = render(<StatusBadge variant="success">OK</StatusBadge>)
    const el = container.firstChild as HTMLElement
    expect(el.tagName).toBe('SPAN')
    expect(el.onclick).toBeNull()
  })
})

// ── useAuthStatus hook ────────────────────────────────────────────────────────

describe('useAuthStatus', () => {
  beforeEach(() => { mockAuthStore.mockReset() })

  it('returns "loading" when loading is true', () => {
    setAuthState({ loading: true, user: null })
    const { result } = renderHook(() => useAuthStatus())
    expect(result.current).toBe('loading')
  })

  it('returns "unauthenticated" when loading is false and user is null', () => {
    setAuthState({ loading: false, user: null })
    const { result } = renderHook(() => useAuthStatus())
    expect(result.current).toBe('unauthenticated')
  })

  it('returns "authenticated_idle" when loading is false and user exists (sync idle)', () => {
    setAuthState({ loading: false, user: { id: 'u1', email: 'a@b.com' } as User })
    const { result } = renderHook(() => useAuthStatus())
    expect(result.current).toBe('authenticated_idle')
  })
})
