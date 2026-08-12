import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import { renderWithI18n } from './helpers/render'
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt'
import { DismissibleBanner } from '@/components/DismissibleBanner'

// Mock the virtual PWA register module — not a real file on disk
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}))

import { useRegisterSW } from 'virtual:pwa-register/react'
const mockUseRegisterSW = vi.mocked(useRegisterSW)

function makeHookReturn(overrides: {
  needRefresh?: boolean
  offlineReady?: boolean
  updateServiceWorker?: ReturnType<typeof vi.fn>
  setNeedRefresh?: ReturnType<typeof vi.fn>
  setOfflineReady?: ReturnType<typeof vi.fn>
} = {}) {
  const updateServiceWorker = overrides.updateServiceWorker ?? vi.fn()
  const setNeedRefresh = overrides.setNeedRefresh ?? vi.fn()
  const setOfflineReady = overrides.setOfflineReady ?? vi.fn()
  return {
    needRefresh:         [overrides.needRefresh ?? false, setNeedRefresh] as [boolean, typeof setNeedRefresh],
    offlineReady:        [overrides.offlineReady ?? false, setOfflineReady] as [boolean, typeof setOfflineReady],
    updateServiceWorker,
  }
}

describe('PwaUpdatePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when neither needRefresh nor offlineReady is true', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn())
    const { container } = renderWithI18n(<PwaUpdatePrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the update banner when needRefresh is true (PT)', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ needRefresh: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'pt')
    expect(screen.getByText('Nova versão disponível')).toBeDefined()
    expect(screen.getByText('Atualizar')).toBeDefined()
  })

  it('renders the update banner when needRefresh is true (EN)', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ needRefresh: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    expect(screen.getByText('New version available')).toBeDefined()
    expect(screen.getByText('Reload')).toBeDefined()
  })

  it('calls updateServiceWorker(true) when Reload button is clicked', () => {
    const updateServiceWorker = vi.fn()
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ needRefresh: true, updateServiceWorker }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    fireEvent.click(screen.getByText('Reload'))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('calls setNeedRefresh(false) when the banner is dismissed', () => {
    const setNeedRefresh = vi.fn()
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ needRefresh: true, setNeedRefresh }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    // DismissibleBanner dismisses on click of the root element
    const banner = screen.getByRole('status')
    fireEvent.click(banner)
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
  })

  it('renders the offline-ready banner when offlineReady is true (PT)', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ offlineReady: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'pt')
    expect(screen.getByText('Pronto para uso offline')).toBeDefined()
  })

  it('renders the offline-ready banner when offlineReady is true (EN)', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ offlineReady: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    expect(screen.getByText('Ready to work offline')).toBeDefined()
  })

  it('prefers needRefresh over offlineReady when both are true', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ needRefresh: true, offlineReady: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    expect(screen.getByText('New version available')).toBeDefined()
    expect(screen.queryByText('Ready to work offline')).toBeNull()
  })

  it('passes onRegisteredSW to useRegisterSW', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn())
    renderWithI18n(<PwaUpdatePrompt />)
    const callArg = mockUseRegisterSW.mock.calls[0]![0] as { onRegisteredSW?: unknown }
    expect(typeof callArg.onRegisteredSW).toBe('function')
  })

  it('container uses top (not bottom) for positioning', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ needRefresh: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    const container = screen.getByTestId('pwa-prompt-container')
    expect(container.style.top).toBeTruthy()
    expect(container.style.bottom).toBe('')
  })

  it('passes solid prop to DismissibleBanner on update (opaque background)', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ needRefresh: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    const banner = screen.getByRole('status')
    // Solid variant uses #1E2A24, not the alpha rgba
    expect(banner.style.background).not.toContain('rgba')
  })

  it('passes solid prop to DismissibleBanner on offline-ready (opaque background)', () => {
    mockUseRegisterSW.mockReturnValue(makeHookReturn({ offlineReady: true }))
    renderWithI18n(<PwaUpdatePrompt />, 'en')
    const banner = screen.getByRole('status')
    expect(banner.style.background).not.toContain('rgba')
  })
})

// ── DismissibleBanner — solid variant ─────────────────────────────────────────

describe('DismissibleBanner — solid variant', () => {
  function renderBanner(solid?: boolean, tone: 'success' | 'error' = 'success') {
    return render(
      <MemoryRouter>
        <I18nProvider>
          <DismissibleBanner
            title="Title"
            message="Message"
            onDismiss={vi.fn()}
            tone={tone}
            autoDismissMs={0}
            solid={solid}
          />
        </I18nProvider>
      </MemoryRouter>
    )
  }

  it('uses opaque background when solid=true (success)', () => {
    renderBanner(true, 'success')
    expect(screen.getByRole('status').style.background).toBe('rgb(30, 42, 36)') // #1E2A24
  })

  it('uses opaque background when solid=true (error)', () => {
    renderBanner(true, 'error')
    expect(screen.getByRole('status').style.background).toBe('rgb(42, 35, 24)') // #2A2318
  })

  it('uses alpha background when solid is omitted (default)', () => {
    renderBanner(undefined)
    expect(screen.getByRole('status').style.background).toContain('rgba')
  })

  it('uses alpha background when solid=false', () => {
    renderBanner(false)
    expect(screen.getByRole('status').style.background).toContain('rgba')
  })
})
