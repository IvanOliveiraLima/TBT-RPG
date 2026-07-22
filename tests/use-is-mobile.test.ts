/**
 * useIsMobile hook tests
 *
 * Covers:
 * - Returns false when matchMedia is unavailable (SSR/jsdom guard)
 * - Returns false when viewport is wider than breakpoint
 * - Returns true when viewport is narrower or equal to breakpoint
 * - Updates when the matchMedia change event fires
 * - Cleans up the listener on unmount
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ── matchMedia mock helpers ───────────────────────────────────────────────────

type MQListener = (e: { matches: boolean }) => void
const mqListeners: MQListener[] = []

function buildMockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation(() => ({
    get matches() { return matches },
    addEventListener: vi.fn((_ev: string, fn: MQListener) => { mqListeners.push(fn) }),
    removeEventListener: vi.fn((_ev: string, fn: MQListener) => {
      const i = mqListeners.indexOf(fn)
      if (i !== -1) mqListeners.splice(i, 1)
    }),
  }))
}

afterEach(() => {
  mqListeners.length = 0
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useIsMobile — no matchMedia (jsdom)', () => {
  it('returns false when window.matchMedia is not a function', () => {
    const original = window.matchMedia
    // @ts-expect-error intentional
    window.matchMedia = undefined
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
    window.matchMedia = original
  })
})

describe('useIsMobile — desktop (width > breakpoint)', () => {
  it('returns false when viewport is wider than breakpoint', () => {
    window.matchMedia = buildMockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile(640))
    expect(result.current).toBe(false)
  })
})

describe('useIsMobile — mobile (width ≤ breakpoint)', () => {
  it('returns true when viewport is narrower than breakpoint', () => {
    window.matchMedia = buildMockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile(640))
    expect(result.current).toBe(true)
  })
})

describe('useIsMobile — reactive update on resize', () => {
  it('updates to true when matchMedia fires a change event (desktop→mobile)', () => {
    window.matchMedia = buildMockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile(640))
    expect(result.current).toBe(false)

    // Simulate the breakpoint being crossed
    act(() => {
      mqListeners.forEach(fn => fn({ matches: true }))
    })
    expect(result.current).toBe(true)
  })

  it('updates to false when matchMedia fires a change event (mobile→desktop)', () => {
    window.matchMedia = buildMockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile(640))
    expect(result.current).toBe(true)

    act(() => {
      mqListeners.forEach(fn => fn({ matches: false }))
    })
    expect(result.current).toBe(false)
  })
})

describe('useIsMobile — cleanup', () => {
  it('removes the listener on unmount', () => {
    const removeSpy = vi.fn()
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn((_ev: string, fn: MQListener) => { mqListeners.push(fn) }),
      removeEventListener: removeSpy,
    }))

    const { unmount } = renderHook(() => useIsMobile(640))
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
