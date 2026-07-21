import { useState, useEffect } from 'react'

/**
 * Returns true when the viewport width is ≤ breakpoint px.
 * Updates in real-time on window resize via matchMedia change event.
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
      : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [breakpoint])

  return isMobile
}
