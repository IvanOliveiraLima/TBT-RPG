/**
 * Test helpers for simulating mobile/desktop viewports in jsdom.
 *
 * jsdom does not implement window.matchMedia, so useIsMobile() falls back to
 * returning false (desktop). Use mockViewport() to override this in tests that
 * exercise mobile-specific rendering paths.
 */

export function mockViewport(kind: 'mobile' | 'desktop', breakpoint = 1024) {
  const matches = kind === 'mobile'
  window.matchMedia = ((query: string) => ({
    matches: query.includes(`max-width: ${breakpoint}px`) ? matches : false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

export function resetViewport() {
  // @ts-expect-error — restores jsdom state (no matchMedia → desktop default)
  delete window.matchMedia
}
