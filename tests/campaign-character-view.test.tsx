/**
 * Tests for CampaignCharacterView page and ForceReadOnly context.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import CampaignCharacterView from '@/pages/CampaignCharacterView'
import {
  useIsForceReadOnly,
  ForceReadOnlyContext,
} from '@/contexts/CampaignViewContext'
import type { Character } from '@/domain/character'
import type { CampaignCharacter } from '@/domain/campaign'
import React from 'react'

// ── Mock store ────────────────────────────────────────────────────────────────

const mockLoadCharacter = vi.fn()
const mockStartPolling = vi.fn()
const mockClear = vi.fn()

interface MockStoreState {
  character: Partial<Character> | null
  loading: boolean
  error: string | null
  lastFetchedAt: number | null
  loadCharacter: typeof mockLoadCharacter
  startPolling: typeof mockStartPolling
  clear: typeof mockClear
}

let mockStoreState: MockStoreState = {
  character: null,
  loading: false,
  error: null,
  lastFetchedAt: null,
  loadCharacter: mockLoadCharacter,
  startPolling: mockStartPolling,
  clear: mockClear,
}

vi.mock('@/store/campaign-view', () => ({
  useCampaignViewStore: (selector: (s: MockStoreState) => unknown) =>
    selector(mockStoreState),
}))

// ── Mock campaign-characters service ──────────────────────────────────────────

const mockListCampaignCharacters = vi.fn()

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: (...args: unknown[]) => mockListCampaignCharacters(...args),
  unlinkCharacterFromCampaign: vi.fn(),
  CampaignCharacterServiceError: class extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── Mock tab components ───────────────────────────────────────────────────────

vi.mock('@/components/sheet/tabs/StatusTab', () => ({
  StatusTab: () => <div data-testid="status-tab-stub">StatusTab</div>,
}))
vi.mock('@/components/sheet/tabs/CombatTab', () => ({
  CombatTab: () => <div data-testid="combat-tab-stub">CombatTab</div>,
}))
vi.mock('@/components/sheet/tabs/SpellsTab', () => ({
  SpellsTab: () => <div data-testid="spells-tab-stub">SpellsTab</div>,
}))
vi.mock('@/components/sheet/tabs/InventoryTab', () => ({
  InventoryTab: () => <div data-testid="inventory-tab-stub">InventoryTab</div>,
}))
vi.mock('@/components/sheet/tabs/LoreTab', () => ({
  LoreTab: () => <div data-testid="lore-tab-stub">LoreTab</div>,
}))

// ── Mock react-router-dom navigate ────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeChar(id = 'char1'): Partial<Character> {
  return { id, name: 'Aragorn', updatedAt: 1000, images: {}, classes: [], race: 'Human' }
}

const LINKED_CHARS: CampaignCharacter[] = [
  { characterId: 'char1', characterName: 'Aragorn', characterSummary: 'Human — Ranger 5', userId: 'u1', campaignId: 'c1', addedAt: 0 },
  { characterId: 'char2', characterName: 'Legolas', characterSummary: null, userId: 'u2', campaignId: 'c1', addedAt: 1 },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function renderView(charId = 'char1') {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter initialEntries={[`/campaigns/c1/characters/${charId}`]}>
      <I18nProvider>
        <Routes>
          <Route path="/campaigns/:id/characters/:charId" element={<CampaignCharacterView />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Tests — loading state ─────────────────────────────────────────────────────

describe('CampaignCharacterView — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockListCampaignCharacters.mockResolvedValue([])
    mockLoadCharacter.mockResolvedValue(undefined)
    mockStartPolling.mockReturnValue(undefined)
    mockClear.mockReturnValue(undefined)
  })

  it('shows loading indicator when loading and no character', () => {
    mockStoreState = { ...mockStoreState, character: null, loading: true, error: null }
    renderView()
    expect(screen.getByTestId('campaign-view-loading')).toBeDefined()
  })

  it('does not show loading when character is already present', () => {
    mockStoreState = { ...mockStoreState, character: makeChar(), loading: true, error: null }
    renderView()
    expect(screen.queryByTestId('campaign-view-loading')).toBeNull()
  })
})

// ── Tests — error states ──────────────────────────────────────────────────────

describe('CampaignCharacterView — error states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockListCampaignCharacters.mockResolvedValue([])
    mockLoadCharacter.mockResolvedValue(undefined)
    mockStartPolling.mockReturnValue(undefined)
    mockClear.mockReturnValue(undefined)
  })

  it('shows char_not_found state', () => {
    mockStoreState = { ...mockStoreState, character: null, loading: false, error: 'char_not_found' }
    renderView()
    expect(screen.getByTestId('campaign-view-not-found')).toBeDefined()
  })

  it('shows generic error state with back button', () => {
    mockStoreState = { ...mockStoreState, character: null, loading: false, error: 'fetch_failed' }
    renderView()
    expect(screen.getByTestId('campaign-view-error')).toBeDefined()
    expect(screen.getByTestId('campaign-view-back-btn')).toBeDefined()
  })

  it('clicking back button in error state navigates to campaign', async () => {
    mockStoreState = { ...mockStoreState, character: null, loading: false, error: 'fetch_failed' }
    renderView()
    await userEvent.click(screen.getByTestId('campaign-view-back-btn'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/c1')
  })
})

// ── Tests — character loaded ──────────────────────────────────────────────────

describe('CampaignCharacterView — character loaded', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockStoreState = { ...mockStoreState, character: makeChar(), loading: false, error: null, lastFetchedAt: 1000 }
    mockListCampaignCharacters.mockResolvedValue(LINKED_CHARS)
    mockLoadCharacter.mockResolvedValue(undefined)
    mockStartPolling.mockReturnValue(undefined)
    mockClear.mockReturnValue(undefined)
  })

  it('renders status tab by default', () => {
    renderView()
    expect(screen.getAllByTestId('status-tab-stub').length).toBeGreaterThanOrEqual(1)
  })

  it('renders tab bar with all 5 tabs', () => {
    renderView()
    // Each tab appears in both mobile and desktop markup
    expect(screen.getAllByTestId(/^campaign-view-tab-/).length).toBeGreaterThanOrEqual(5)
  })

  it('calls loadCharacter on mount', async () => {
    renderView()
    await waitFor(() => expect(mockLoadCharacter).toHaveBeenCalledWith('c1', 'char1'))
  })

  it('calls startPolling on mount', async () => {
    renderView()
    await waitFor(() => expect(mockStartPolling).toHaveBeenCalledWith('c1', 'char1'))
  })

  it('renders linked chars in desktop sidebar', async () => {
    renderView()
    await waitFor(() => expect(screen.getByTestId('campaign-view-char-list')).toBeDefined())
    expect(screen.getAllByTestId('char-nav-char1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('char-nav-char2').length).toBeGreaterThanOrEqual(1)
  })

  it('current char has aria-current=page in sidebar', async () => {
    renderView('char1')
    await waitFor(() => screen.getByTestId('campaign-view-char-list'))
    const btns = screen.getAllByTestId('char-nav-char1')
    const activeBtn = btns.find(b => b.getAttribute('aria-current') === 'page')
    expect(activeBtn).toBeDefined()
  })

  it('clicking sidebar char navigates to that char view', async () => {
    renderView('char1')
    await waitFor(() => screen.getByTestId('campaign-view-char-list'))
    const navBtns = screen.getAllByTestId('char-nav-char2')
    await userEvent.click(navBtns[0]!)
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/c1/characters/char2')
  })

  it('shows master badge', () => {
    renderView()
    expect(screen.getAllByTestId('campaign-view-master-badge').length).toBeGreaterThanOrEqual(1)
  })
})

// ── Tests — lifecycle ─────────────────────────────────────────────────────────

describe('CampaignCharacterView — lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockStoreState = { ...mockStoreState, character: makeChar(), loading: false, error: null }
    mockListCampaignCharacters.mockResolvedValue([])
    mockLoadCharacter.mockResolvedValue(undefined)
    mockStartPolling.mockReturnValue(undefined)
    mockClear.mockReturnValue(undefined)
  })

  it('calls clear on unmount', () => {
    const { unmount } = renderView()
    unmount()
    expect(mockClear).toHaveBeenCalled()
  })
})

// ── ForceReadOnly context ─────────────────────────────────────────────────────

describe('useIsForceReadOnly', () => {
  it('returns false when not wrapped in provider', () => {
    const { result } = renderHook(() => useIsForceReadOnly())
    expect(result.current).toBe(false)
  })

  it('returns true when wrapped in ForceReadOnlyContext.Provider with value={true}', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ForceReadOnlyContext.Provider, { value: true }, children)
    const { result } = renderHook(() => useIsForceReadOnly(), { wrapper })
    expect(result.current).toBe(true)
  })
})
