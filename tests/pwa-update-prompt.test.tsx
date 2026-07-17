import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt'

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
})
