/**
 * Tests for CampaignDesktopShell, CampaignMobileShell.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import React from 'react'
import type { TabKey } from '@/components/sheet/types'
import { CampaignDesktopShell } from '@/components/sheet/CampaignDesktopShell'
import { CampaignMobileShell } from '@/components/sheet/CampaignMobileShell'
import type { Character } from '@/domain/character'
import type { CampaignCharacter } from '@/domain/campaign'

// ── Mock react-router-dom navigate ────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock useCharacterLocked (used by tab components and others) ───────────────

vi.mock('@/hooks/useCharacterLocked', () => ({
  useCharacterLocked: () => false,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CHAR: Partial<Character> = {
  id: 'char1',
  name: 'Aragorn',
  race: 'Human',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  updatedAt: 1000,
  images: {},
}

const LINKED_CHARS: CampaignCharacter[] = [
  { characterId: 'char1', characterName: 'Aragorn', characterSummary: 'Human — Ranger 5', userId: 'u1', campaignId: 'c1', addedAt: 0 },
  { characterId: 'char2', characterName: 'Legolas', characterSummary: 'Elf — Ranger 5', userId: 'u2', campaignId: 'c1', addedAt: 1 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderDesktopOpts {
  activeTab?: TabKey
  activeCharId?: string
}

function renderDesktop({ activeTab = 'status', activeCharId = 'char1' }: RenderDesktopOpts = {}) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CampaignDesktopShell
          character={CHAR as Character}
          campaignId="c1"
          activeCharId={activeCharId}
          linkedChars={LINKED_CHARS}
          activeTab={activeTab}
          onTabChange={vi.fn()}
        >
          <div data-testid="children-stub">content</div>
        </CampaignDesktopShell>
      </I18nProvider>
    </MemoryRouter>
  )
}

interface RenderMobileOpts {
  activeTab?: TabKey
  activeCharId?: string
}

function renderMobile({ activeTab = 'status', activeCharId = 'char1' }: RenderMobileOpts = {}) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CampaignMobileShell
          character={CHAR as Character}
          campaignId="c1"
          activeCharId={activeCharId}
          linkedChars={LINKED_CHARS}
          activeTab={activeTab}
          onTabChange={vi.fn()}
        >
          <div data-testid="children-stub">content</div>
        </CampaignMobileShell>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── CampaignDesktopShell ──────────────────────────────────────────────────────

describe('CampaignDesktopShell', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders sidebar with linked chars section', () => {
    renderDesktop()
    expect(screen.getByTestId('campaign-view-char-list')).toBeDefined()
    expect(screen.getByTestId('char-nav-char1')).toBeDefined()
    expect(screen.getByTestId('char-nav-char2')).toBeDefined()
  })

  it('renders linked char names and summaries', () => {
    renderDesktop()
    expect(screen.getAllByText('Aragorn').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Legolas')).toBeDefined()
    expect(screen.getByText('Human — Ranger 5')).toBeDefined()
  })

  it('marks active char with aria-current=page', () => {
    renderDesktop({ activeCharId: 'char1' })
    const btn = screen.getByTestId('char-nav-char1')
    expect(btn.getAttribute('aria-current')).toBe('page')
  })

  it('does not mark inactive char with aria-current', () => {
    renderDesktop({ activeCharId: 'char1' })
    const btn = screen.getByTestId('char-nav-char2')
    expect(btn.getAttribute('aria-current')).toBeNull()
  })

  it('renders sidebar pages section with 5 tab items', () => {
    renderDesktop()
    expect(screen.getByTestId('campaign-view-tab-status')).toBeDefined()
    expect(screen.getByTestId('campaign-view-tab-combat')).toBeDefined()
    expect(screen.getByTestId('campaign-view-tab-spells')).toBeDefined()
    expect(screen.getByTestId('campaign-view-tab-inv')).toBeDefined()
    expect(screen.getByTestId('campaign-view-tab-lore')).toBeDefined()
  })

  it('back button navigates to campaign detail', async () => {
    renderDesktop()
    await userEvent.click(screen.getByTestId('campaign-sidebar-back'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/c1')
  })

  it('clicking a char in sidebar navigates to that char URL', async () => {
    renderDesktop({ activeCharId: 'char1' })
    await userEvent.click(screen.getByTestId('char-nav-char2'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/c1/characters/char2')
  })

  it('renders master badge', () => {
    renderDesktop()
    expect(screen.getAllByTestId('campaign-view-master-badge').length).toBeGreaterThanOrEqual(1)
  })

  it('renders character name in topbar', () => {
    renderDesktop()
    expect(screen.getAllByText('Aragorn').length).toBeGreaterThanOrEqual(1)
  })

  it('renders children', () => {
    renderDesktop()
    expect(screen.getByTestId('children-stub')).toBeDefined()
  })

  it('does NOT render lock button', () => {
    renderDesktop()
    expect(screen.queryByTestId('lock-btn')).toBeNull()
  })

  it('does NOT render import/export buttons', () => {
    renderDesktop()
    // Import/export buttons exist only in the regular shell
    expect(screen.queryByText(/Importar|Exportar|Import|Export/i)).toBeNull()
  })
})

// ── CampaignMobileShell ───────────────────────────────────────────────────────

describe('CampaignMobileShell', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders character name in header', () => {
    renderMobile()
    expect(screen.getByText('Aragorn')).toBeDefined()
  })

  it('renders bottom tab bar', () => {
    renderMobile()
    // BottomTabBar renders buttons; check for known tab names
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(5)
  })

  it('renders children', () => {
    renderMobile()
    expect(screen.getByTestId('children-stub')).toBeDefined()
  })

  it('drawer is closed by default', () => {
    renderMobile()
    expect(screen.queryByTestId('campaign-mobile-drawer')).toBeNull()
  })

  it('hamburger button opens drawer', async () => {
    renderMobile()
    const menuBtn = screen.getByLabelText(/abrir menu|open menu/i)
    await userEvent.click(menuBtn)
    expect(screen.getByTestId('campaign-mobile-drawer')).toBeDefined()
  })

  it('drawer has back to campaign button', async () => {
    renderMobile()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.getByTestId('campaign-mobile-drawer-back')).toBeDefined()
  })

  it('drawer back button navigates to campaign detail', async () => {
    renderMobile()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    await userEvent.click(screen.getByTestId('campaign-mobile-drawer-back'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/c1')
  })

  it('drawer has linked chars section', async () => {
    renderMobile()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.getByTestId('campaign-view-char-list')).toBeDefined()
    expect(screen.getByTestId('char-nav-char1')).toBeDefined()
    expect(screen.getByTestId('char-nav-char2')).toBeDefined()
  })

  it('drawer char click navigates and closes drawer', async () => {
    renderMobile({ activeCharId: 'char1' })
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    await userEvent.click(screen.getByTestId('char-nav-char2'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/c1/characters/char2')
    expect(screen.queryByTestId('campaign-mobile-drawer')).toBeNull()
  })

  it('drawer has my campaigns button', async () => {
    renderMobile()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.getByTestId('campaign-mobile-drawer-campaigns')).toBeDefined()
  })

  it('drawer my campaigns button navigates to /campaigns', async () => {
    renderMobile()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    await userEvent.click(screen.getByTestId('campaign-mobile-drawer-campaigns'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns')
  })

  it('drawer does NOT have lock button', async () => {
    renderMobile()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.queryByTestId('mobile-lock-btn')).toBeNull()
  })

  it('overlay click closes drawer', async () => {
    renderMobile()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    const overlay = screen.getByTestId('campaign-mobile-drawer')
    await userEvent.click(overlay)
    expect(screen.queryByTestId('campaign-mobile-drawer')).toBeNull()
  })

  it('active char has aria-current=page in drawer', async () => {
    renderMobile({ activeCharId: 'char1' })
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    const btn = screen.getByTestId('char-nav-char1')
    expect(btn.getAttribute('aria-current')).toBe('page')
  })
})
