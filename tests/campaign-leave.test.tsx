/**
 * Tests for leave-campaign feature:
 * - CampaignCard role-based kebab (owner=Excluir, player=Sair)
 * - ConfirmLeaveCampaignModal
 * - CampaignDetail actions section
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import React from 'react'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { ConfirmLeaveCampaignModal } from '@/components/campaigns/ConfirmLeaveCampaignModal'
import type { Campaign } from '@/domain/campaign'

// ── Mock navigate ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock store ────────────────────────────────────────────────────────────────

const mockLeaveCampaign = vi.fn()
const mockDeleteCampaign = vi.fn()

vi.mock('@/store/campaigns', () => ({
  useCampaignsStore: (selector: (s: {
    leaveCampaign: typeof mockLeaveCampaign
    deleteCampaign: typeof mockDeleteCampaign
  }) => unknown) =>
    selector({ leaveCampaign: mockLeaveCampaign, deleteCampaign: mockDeleteCampaign }),
}))

// ── Mock CampaignDetail dependencies ─────────────────────────────────────────

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: { user: { id: string; email: string } | null; loading: boolean }) => unknown) =>
    selector({ user: { id: 'u1', email: 'test@test.com' }, loading: false }),
}))

const mockGetCampaign = vi.fn()
const mockListCampaignMembers = vi.fn()
const mockListProfilesByIds = vi.fn()
const mockListCampaignCharacters = vi.fn()

vi.mock('@/services/campaign', () => ({
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaignMembers: (...args: unknown[]) => mockListCampaignMembers(...args),
  CampaignServiceError: class CampaignServiceError extends Error {
    constructor(public code: string) { super(code) }
  },
}))

vi.mock('@/services/user-profile', () => ({
  listProfilesByIds: (...args: unknown[]) => mockListProfilesByIds(...args),
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: (...args: unknown[]) => mockListCampaignCharacters(...args),
  unlinkCharacterFromCampaign: vi.fn(),
}))

vi.mock('@/components/campaigns/InviteCodeBlock', () => ({
  InviteCodeBlock: () => <div data-testid="invite-code-stub" />,
}))

vi.mock('@/components/campaigns/LinkCharacterModal', () => ({
  LinkCharacterModal: () => <div data-testid="link-char-modal-stub" />,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'c1',
    name: 'Test Campaign',
    description: null,
    ownerId: 'u1',
    inviteCode: 'ABCD1234',
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderCard(opts: { campaign: Campaign; currentUserId: string }) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CampaignCard
          campaign={opts.campaign}
          currentUserId={opts.currentUserId}
          onOpen={vi.fn()}
          onRequestDelete={vi.fn()}
          onRequestLeave={vi.fn()}
        />
      </I18nProvider>
    </MemoryRouter>
  )
}

function renderLeaveModal(campaign: Campaign, onLeft = vi.fn(), onCancel = vi.fn()) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <ConfirmLeaveCampaignModal
          campaign={campaign}
          onLeft={onLeft}
          onCancel={onCancel}
        />
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── CampaignCard — role-based kebab ───────────────────────────────────────────

describe('CampaignCard — owner', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows Excluir in kebab for owner', async () => {
    const camp = makeCampaign({ ownerId: 'u1' })
    renderCard({ campaign: camp, currentUserId: 'u1' })
    await userEvent.click(screen.getByTestId('campaign-menu-c1'))
    expect(screen.getByTestId('campaign-delete-c1')).toBeDefined()
    expect(screen.queryByTestId('campaign-leave-c1')).toBeNull()
  })

  it('calls onRequestDelete when Excluir is clicked', async () => {
    const onRequestDelete = vi.fn()
    const camp = makeCampaign({ ownerId: 'u1' })
    localStorage.setItem('tbt-rpg-v2-lang', 'pt')
    render(
      <MemoryRouter>
        <I18nProvider>
          <CampaignCard
            campaign={camp}
            currentUserId="u1"
            onOpen={vi.fn()}
            onRequestDelete={onRequestDelete}
            onRequestLeave={vi.fn()}
          />
        </I18nProvider>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByTestId('campaign-menu-c1'))
    await userEvent.click(screen.getByTestId('campaign-delete-c1'))
    expect(onRequestDelete).toHaveBeenCalledWith('c1', 'Test Campaign')
  })
})

describe('CampaignCard — player (not owner)', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows Sair in kebab for player', async () => {
    const camp = makeCampaign({ ownerId: 'owner-id' })
    renderCard({ campaign: camp, currentUserId: 'u1' })
    await userEvent.click(screen.getByTestId('campaign-menu-c1'))
    expect(screen.getByTestId('campaign-leave-c1')).toBeDefined()
    expect(screen.queryByTestId('campaign-delete-c1')).toBeNull()
  })

  it('calls onRequestLeave when Sair is clicked', async () => {
    const onRequestLeave = vi.fn()
    const camp = makeCampaign({ ownerId: 'owner-id' })
    localStorage.setItem('tbt-rpg-v2-lang', 'pt')
    render(
      <MemoryRouter>
        <I18nProvider>
          <CampaignCard
            campaign={camp}
            currentUserId="u1"
            onOpen={vi.fn()}
            onRequestDelete={vi.fn()}
            onRequestLeave={onRequestLeave}
          />
        </I18nProvider>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByTestId('campaign-menu-c1'))
    await userEvent.click(screen.getByTestId('campaign-leave-c1'))
    expect(onRequestLeave).toHaveBeenCalledWith('c1', 'Test Campaign')
  })

  it('closes menu after Sair click', async () => {
    const camp = makeCampaign({ ownerId: 'owner-id' })
    renderCard({ campaign: camp, currentUserId: 'u1' })
    await userEvent.click(screen.getByTestId('campaign-menu-c1'))
    await userEvent.click(screen.getByTestId('campaign-leave-c1'))
    expect(screen.queryByTestId('campaign-leave-c1')).toBeNull()
  })
})

// ── ConfirmLeaveCampaignModal ─────────────────────────────────────────────────

describe('ConfirmLeaveCampaignModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders with campaign name in warning text', () => {
    renderLeaveModal(makeCampaign({ name: 'Dungeon Campaign' }))
    expect(screen.getByText(/Dungeon Campaign/)).toBeDefined()
  })

  it('renders title in PT', () => {
    renderLeaveModal(makeCampaign())
    expect(screen.getByText('Sair da Campanha?')).toBeDefined()
  })

  it('cancel button calls onCancel', async () => {
    const onCancel = vi.fn()
    renderLeaveModal(makeCampaign(), vi.fn(), onCancel)
    await userEvent.click(screen.getByTestId('leave-campaign-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('confirm button calls leaveCampaign and then onLeft', async () => {
    mockLeaveCampaign.mockResolvedValue(undefined)
    const onLeft = vi.fn()
    renderLeaveModal(makeCampaign(), onLeft)
    await userEvent.click(screen.getByTestId('leave-campaign-confirm'))
    await waitFor(() => expect(onLeft).toHaveBeenCalled())
    expect(mockLeaveCampaign).toHaveBeenCalledWith('c1')
  })

  it('shows leaving state while in progress', async () => {
    let resolve!: () => void
    mockLeaveCampaign.mockReturnValue(new Promise<void>(r => { resolve = r }))
    renderLeaveModal(makeCampaign())
    await userEvent.click(screen.getByTestId('leave-campaign-confirm'))
    expect(screen.getByTestId('leave-campaign-confirm')).toHaveProperty('disabled', true)
    resolve()
  })

  it('shows error message on failure', async () => {
    mockLeaveCampaign.mockRejectedValue(new Error('oops'))
    renderLeaveModal(makeCampaign())
    await userEvent.click(screen.getByTestId('leave-campaign-confirm'))
    await waitFor(() => expect(screen.getByTestId('leave-campaign-error')).toBeDefined())
  })

  it('does not call onLeft on failure', async () => {
    mockLeaveCampaign.mockRejectedValue(new Error('oops'))
    const onLeft = vi.fn()
    renderLeaveModal(makeCampaign(), onLeft)
    await userEvent.click(screen.getByTestId('leave-campaign-confirm'))
    await waitFor(() => expect(screen.getByTestId('leave-campaign-error')).toBeDefined())
    expect(onLeft).not.toHaveBeenCalled()
  })
})

