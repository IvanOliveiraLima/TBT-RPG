import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import { DesktopShell } from '@/components/sheet/DesktopShell'
import { MobileShell } from '@/components/sheet/MobileShell'
import type { Character } from '@/domain/character'
import type { AuthStatus } from '@/hooks/useAuthStatus'

// ── mock useAuthStatus ────────────────────────────────────────────────────────

const mockStatus = vi.fn<[], AuthStatus>().mockReturnValue('unauthenticated')

vi.mock('@/hooks/useAuthStatus', () => ({
  useAuthStatus: () => mockStatus(),
}))

// ── mock react-router-dom navigate ───────────────────────────────────────────

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

// ── shared character fixture ──────────────────────────────────────────────────

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

function renderDesktop(lang: 'pt' | 'en' = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <DesktopShell character={CHARACTER} activeTab="status" onTabChange={() => undefined}>
          <div />
        </DesktopShell>
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

// ── DesktopShell ──────────────────────────────────────────────────────────────

describe('DesktopShell — auth badge', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows PT "Entrar" badge when unauthenticated', () => {
    mockStatus.mockReturnValue('unauthenticated')
    renderDesktop('pt')
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
    expect(screen.getByText('Entrar')).toBeDefined()
  })

  it('shows EN "Sign in" badge when unauthenticated', () => {
    mockStatus.mockReturnValue('unauthenticated')
    renderDesktop('en')
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
    expect(screen.getByText('Sign in')).toBeDefined()
  })

  it('shows PT "Conectado" badge when authenticated_idle', () => {
    mockStatus.mockReturnValue('authenticated_idle')
    renderDesktop('pt')
    expect(screen.getByTestId('status-badge-success')).toBeDefined()
    expect(screen.getByText('Conectado')).toBeDefined()
  })

  it('shows EN "Connected" badge when authenticated_idle', () => {
    mockStatus.mockReturnValue('authenticated_idle')
    renderDesktop('en')
    expect(screen.getByTestId('status-badge-success')).toBeDefined()
    expect(screen.getByText('Connected')).toBeDefined()
  })

  it('does not render any badge during loading state', () => {
    mockStatus.mockReturnValue('loading')
    renderDesktop('pt')
    expect(screen.queryByTestId('status-badge-success')).toBeNull()
    expect(screen.queryByTestId('status-badge-neutral')).toBeNull()
  })

  it('shows PT "Sincronizando…" badge when authenticated_syncing', () => {
    mockStatus.mockReturnValue('authenticated_syncing')
    renderDesktop('pt')
    expect(screen.getByTestId('status-badge-success')).toBeDefined()
    expect(screen.getByText('Sincronizando…')).toBeDefined()
  })

  it('shows EN "Syncing…" badge when authenticated_syncing', () => {
    mockStatus.mockReturnValue('authenticated_syncing')
    renderDesktop('en')
    expect(screen.getByTestId('status-badge-success')).toBeDefined()
    expect(screen.getByText('Syncing…')).toBeDefined()
  })

  it('shows PT "Offline" badge when authenticated_offline', () => {
    mockStatus.mockReturnValue('authenticated_offline')
    renderDesktop('pt')
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
    expect(screen.getByText('Offline')).toBeDefined()
  })

  it('shows PT "Erro de sincronização" badge when authenticated_error', () => {
    mockStatus.mockReturnValue('authenticated_error')
    renderDesktop('pt')
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
    expect(screen.getByText('Erro de sincronização')).toBeDefined()
  })

  it('shows EN "Sync error" badge when authenticated_error', () => {
    mockStatus.mockReturnValue('authenticated_error')
    renderDesktop('en')
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
    expect(screen.getByText('Sync error')).toBeDefined()
  })

  it('badge appears before the Lock button in DOM order', () => {
    mockStatus.mockReturnValue('unauthenticated')
    const { container } = renderDesktop('pt')
    const badge = container.querySelector('[data-testid="status-badge-neutral"]')
    const lockBtn = screen.getByTestId('lock-btn')
    if (!badge || !lockBtn) throw new Error('elements missing')
    // badge should come before lock button in DOM
    expect(
      badge.compareDocumentPosition(lockBtn) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})

// ── MobileShell ───────────────────────────────────────────────────────────────

describe('MobileShell — auth badge', () => {
  beforeEach(() => { localStorage.clear() })

  it('drawer header shows PT "Entrar" badge when unauthenticated', () => {
    mockStatus.mockReturnValue('unauthenticated')
    renderMobile('pt')
    // open drawer via menu button
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
    expect(screen.getByText('Entrar')).toBeDefined()
  })

  it('drawer header shows PT "Conectado" badge when authenticated_idle', () => {
    mockStatus.mockReturnValue('authenticated_idle')
    renderMobile('pt')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.getByTestId('status-badge-success')).toBeDefined()
    expect(screen.getByText('Conectado')).toBeDefined()
  })

  it('drawer does not show badge during loading state', () => {
    mockStatus.mockReturnValue('loading')
    renderMobile('pt')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.queryByTestId('status-badge-success')).toBeNull()
    expect(screen.queryByTestId('status-badge-neutral')).toBeNull()
  })

  it('drawer shows PT "Sincronizando…" badge when authenticated_syncing', () => {
    mockStatus.mockReturnValue('authenticated_syncing')
    renderMobile('pt')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.getByTestId('status-badge-success')).toBeDefined()
    expect(screen.getByText('Sincronizando…')).toBeDefined()
  })

  it('drawer shows "Offline" badge when authenticated_offline', () => {
    mockStatus.mockReturnValue('authenticated_offline')
    renderMobile('pt')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.getByTestId('status-badge-neutral')).toBeDefined()
    expect(screen.getByText('Offline')).toBeDefined()
  })

  it('badge label matches desktop for same language/state (PT unauthenticated)', () => {
    mockStatus.mockReturnValue('unauthenticated')
    renderMobile('pt')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.getByText('Entrar')).toBeDefined()
  })

  it('badge label matches desktop for same language/state (EN authenticated_idle)', () => {
    mockStatus.mockReturnValue('authenticated_idle')
    renderMobile('en')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu|open menu/i }))
    expect(screen.getByText('Connected')).toBeDefined()
  })
})
