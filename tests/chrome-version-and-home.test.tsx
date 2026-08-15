/**
 * Tests for:
 * - Real app version (__APP_VERSION__) shown in all shells (no "beta")
 * - One-tap home (logo/brand block) from campaign shells
 * - "Meus personagens" item in campaign mobile drawer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import React from 'react'
import { DesktopShell } from '@/components/sheet/DesktopShell'
import { MobileShell } from '@/components/sheet/MobileShell'
import { CampaignDesktopShell } from '@/components/sheet/CampaignDesktopShell'
import { CampaignMobileShell } from '@/components/sheet/CampaignMobileShell'
import type { Character } from '@/domain/character'
import type { CampaignCharacter } from '@/domain/campaign'
import type { AuthStatus } from '@/hooks/useAuthStatus'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/hooks/useAuthStatus', () => ({
  useAuthStatus: (): AuthStatus => 'unauthenticated',
}))

vi.mock('@/hooks/useCharacterLocked', () => ({
  useCharacterLocked: () => false,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CHAR: Character = {
  id: 'char1',
  name: 'Aragorn',
  race: 'Human',
  background: '',
  alignment: 'LG',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  experience: 0, age: '', height: '', weight: '',
  eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 14, cha: 10 },
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15, initiative: 2, speed: 30,
  inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

const LINKED_CHARS: CampaignCharacter[] = [
  { characterId: 'char1', characterName: 'Aragorn', characterSummary: 'Human — Ranger 5', userId: 'u1', campaignId: 'c1', addedAt: 0 },
]

// ── Render helpers ────────────────────────────────────────────────────────────

function renderDesktopShell() {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <DesktopShell character={CHAR} activeTab="status" onTabChange={vi.fn()}>
          <div />
        </DesktopShell>
      </I18nProvider>
    </MemoryRouter>
  )
}

function renderMobileShell() {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <MobileShell character={CHAR} activeTab="status" onTabChange={vi.fn()}>
          <div />
        </MobileShell>
      </I18nProvider>
    </MemoryRouter>
  )
}

function renderCampaignDesktopShell() {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CampaignDesktopShell
          character={CHAR}
          campaignId="c1"
          activeCharId="char1"
          linkedChars={LINKED_CHARS}
          activeTab="status"
          onTabChange={vi.fn()}
        >
          <div />
        </CampaignDesktopShell>
      </I18nProvider>
    </MemoryRouter>
  )
}

function renderCampaignMobileShell() {
  localStorage.setItem('tbt-rpg-v2-lang', 'en')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CampaignMobileShell
          character={CHAR}
          campaignId="c1"
          activeCharId="char1"
          linkedChars={LINKED_CHARS}
          activeTab="status"
          onTabChange={vi.fn()}
        >
          <div />
        </CampaignMobileShell>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Version badge — all shells ────────────────────────────────────────────────

describe('app version — Sidebar (desktop ficha)', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders version from __APP_VERSION__ (e.g. v2.0.0)', () => {
    renderDesktopShell()
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeDefined()
  })

  it('does NOT show "beta" in sidebar', () => {
    renderDesktopShell()
    expect(screen.queryByText(/beta/i)).toBeNull()
  })
})

describe('app version — MobileShell drawer (ficha)', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders version in mobile drawer header', async () => {
    renderMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeDefined()
  })

  it('does NOT show "beta" in mobile drawer', async () => {
    renderMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.queryByText(/beta/i)).toBeNull()
  })
})

describe('app version — CampaignSidebar (desktop campanha)', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders version from __APP_VERSION__ in campaign sidebar', () => {
    renderCampaignDesktopShell()
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeDefined()
  })

  it('does NOT show "beta" in campaign sidebar', () => {
    renderCampaignDesktopShell()
    expect(screen.queryByText(/beta/i)).toBeNull()
  })
})

describe('app version — CampaignMobileShell drawer', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders version in campaign mobile drawer', async () => {
    renderCampaignMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeDefined()
  })

  it('does NOT show "beta" in campaign mobile drawer', async () => {
    renderCampaignMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.queryByText(/beta/i)).toBeNull()
  })
})

// ── Home shortcut — campaign sidebar ─────────────────────────────────────────

describe('home shortcut — CampaignSidebar', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders campaign-sidebar-home brand block', () => {
    renderCampaignDesktopShell()
    expect(screen.getByTestId('campaign-sidebar-home')).toBeDefined()
  })

  it('clicking campaign-sidebar-home navigates to /', async () => {
    renderCampaignDesktopShell()
    await userEvent.click(screen.getByTestId('campaign-sidebar-home'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('brand block shows TBT-RPG label', () => {
    renderCampaignDesktopShell()
    // There might be multiple TBT-RPG texts (header + sidebar) — just need at least one
    expect(screen.getAllByText('TBT-RPG').length).toBeGreaterThanOrEqual(1)
  })
})

// ── Home shortcut — campaign mobile ──────────────────────────────────────────

describe('home shortcut — CampaignMobileShell', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders campaign-mobile-home button in drawer', async () => {
    renderCampaignMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.getByTestId('campaign-mobile-home')).toBeDefined()
  })

  it('clicking campaign-mobile-home navigates to / and closes drawer', async () => {
    renderCampaignMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    await userEvent.click(screen.getByTestId('campaign-mobile-home'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(screen.queryByTestId('campaign-mobile-drawer')).toBeNull()
  })

  it('renders "Meus personagens" item in drawer (EN: My characters)', async () => {
    renderCampaignMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    expect(screen.getByTestId('campaign-mobile-my-characters')).toBeDefined()
  })

  it('"My characters" item navigates to / and closes drawer', async () => {
    renderCampaignMobileShell()
    await userEvent.click(screen.getByLabelText(/abrir menu|open menu/i))
    await userEvent.click(screen.getByTestId('campaign-mobile-my-characters'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(screen.queryByTestId('campaign-mobile-drawer')).toBeNull()
  })
})
