/**
 * Tests for the "Minhas Campanhas" navigation link in Sidebar and MobileShell.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import { Sidebar } from '@/components/sheet/Sidebar'
import { MobileShell } from '@/components/sheet/MobileShell'
import type { Character } from '@/domain/character'

// ── Mock navigate ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock auth store ───────────────────────────────────────────────────────────
// mockUser is captured by reference in the mock closure — updated per test

let mockUser: { id: string } | null = null

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector?: (s: { user: { id: string } | null; loading: boolean }) => unknown) => {
    const state = { user: mockUser, loading: false }
    return selector ? selector(state) : state
  },
}))

// ── Mock useAuthStatus ────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuthStatus', () => ({
  useAuthStatus: () => 'unauthenticated',
}))

// ── Mock useCharactersStore ───────────────────────────────────────────────────

vi.mock('@/store/characters', () => ({
  useCharactersStore: (selector: (s: { updateCharacter: () => void }) => unknown) =>
    selector({ updateCharacter: vi.fn() }),
}))

// ── Mock useCharacterLocked ───────────────────────────────────────────────────

vi.mock('@/hooks/useCharacterLocked', () => ({
  useCharacterLocked: () => false,
}))

// ── Shared character fixture ──────────────────────────────────────────────────

const CHARACTER: Character = {
  id: 'c1', name: 'Aria', race: 'Elf', background: 'Sage',
  alignment: 'LG',
  classes: [{ name: 'Wizard', level: 3, hitDie: 6 }],
  experience: 0, age: '', height: '', weight: '',
  eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 14, con: 12, int: 18, wis: 14, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 18, max: 18, temp: 0 },
  hitDice: [{ className: 'Wizard', current: 3, max: 3, dieSize: 6 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 12, initiative: 2, speed: 30,
  passivePerception: 12, spellSaveDC: 14, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

function renderSidebar(lang: 'pt' | 'en' = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <Sidebar character={CHARACTER} activeTab="status" onTabChange={() => undefined} />
      </I18nProvider>
    </MemoryRouter>
  )
}

function renderMobile(lang: 'pt' | 'en' = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <MobileShell character={CHARACTER} activeTab="status" onTabChange={() => undefined}>
          <div />
        </MobileShell>
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Sidebar tests ─────────────────────────────────────────────────────────────

describe('Sidebar — Minhas Campanhas link', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows PT "Minhas Campanhas" button', () => {
    renderSidebar('pt')
    expect(screen.getByTestId('sidebar-campaigns-btn')).toBeDefined()
    expect(screen.getByText('Minhas Campanhas')).toBeDefined()
  })

  it('shows EN "My Campaigns" button', () => {
    renderSidebar('en')
    expect(screen.getByText('My Campaigns')).toBeDefined()
  })

  it('navigates to /campaigns when user is logged in', () => {
    mockUser = { id: 'u1' }
    renderSidebar()
    fireEvent.click(screen.getByTestId('sidebar-campaigns-btn'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns')
  })

  it('navigates to /login?redirectTo=/campaigns when user is not logged in', () => {
    mockUser = null
    renderSidebar()
    fireEvent.click(screen.getByTestId('sidebar-campaigns-btn'))
    expect(mockNavigate).toHaveBeenCalledWith('/login?redirectTo=/campaigns')
  })
})

// ── MobileShell tests ─────────────────────────────────────────────────────────

describe('MobileShell drawer — Minhas Campanhas link', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows PT "Minhas Campanhas" in drawer', () => {
    renderMobile('pt')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.getByTestId('mobile-campaigns-btn')).toBeDefined()
    expect(screen.getByText('Minhas Campanhas')).toBeDefined()
  })

  it('shows EN "My Campaigns" in drawer', () => {
    renderMobile('en')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.getByText('My Campaigns')).toBeDefined()
  })

  it('navigates to /campaigns when user is logged in', () => {
    mockUser = { id: 'u1' }
    renderMobile()
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    fireEvent.click(screen.getByTestId('mobile-campaigns-btn'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns')
  })
})
