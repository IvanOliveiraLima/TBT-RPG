/**
 * Transfer.1 — transfer campaign ownership UI tests
 *
 * Covers:
 *  - MemberRowMenu: transfer item shown for owner on player row (EN/PT)
 *  - MemberRowMenu: transfer item hidden on self, on master row, for non-owner
 *  - MemberRowMenu: onTransferOwnership called when item clicked
 *  - ConfirmTransferOwnershipModal: shows member name; cancel; confirm; error state
 *  - CampaignDetail: opens modal from player row; confirm calls service with correct userId
 *  - CampaignDetail: success triggers refetch + modal closes
 *  - CampaignDetail: error displayed in modal; modal stays open
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import React from 'react'
import { MemberRowMenu } from '@/components/campaigns/MemberRowMenu'
import { ConfirmTransferOwnershipModal } from '@/components/campaigns/ConfirmTransferOwnershipModal'
import type { CampaignMember, UserProfile } from '@/domain/campaign'

// ── Mock navigate ──────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock useDiceStore ──────────────────────────────────────────────────────────

vi.mock('@/store/useDiceStore', () => ({
  useDiceStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setCampaignContext: vi.fn(),
      clearCampaignContext: vi.fn(),
    }),
}))

// ── Mock campaign service ──────────────────────────────────────────────────────

const mockGetCampaign = vi.fn()
const mockListCampaignMembers = vi.fn()
const mockTransferCampaignOwnership = vi.fn()

vi.mock('@/services/campaign', () => ({
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaignMembers: (...args: unknown[]) => mockListCampaignMembers(...args),
  removeMember: vi.fn(),
  transferCampaignOwnership: (...args: unknown[]) => mockTransferCampaignOwnership(...args),
  CampaignServiceError: class CampaignServiceError extends Error {
    constructor(public code: string) { super(code) }
  },
}))

vi.mock('@/services/user-profile', () => ({
  upsertMyProfile: vi.fn(),
  getMyProfile: vi.fn(),
  listProfilesByIds: vi.fn().mockResolvedValue([]),
  UserProfileServiceError: class extends Error {
    constructor(public code: string) { super(code) }
  },
}))

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: vi.fn().mockResolvedValue([]),
  unlinkCharacterFromCampaign: vi.fn(),
}))

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: vi.fn().mockResolvedValue([]),
  fetchCampaignCharacterImages: vi.fn().mockResolvedValue({ portraitData: null, symbolData: null }),
}))

vi.mock('@/components/campaigns/InviteCodeBlock', () => ({
  InviteCodeBlock: () => <div data-testid="invite-code-stub" />,
}))
vi.mock('@/components/campaigns/LinkCharacterModal', () => ({
  LinkCharacterModal: () => <div data-testid="link-char-modal-stub" />,
}))
vi.mock('@/components/campaigns/ConfirmDeleteCampaignModal', () => ({
  ConfirmDeleteCampaignModal: () => <div data-testid="confirm-delete-stub" />,
}))
vi.mock('@/components/campaigns/ConfirmLeaveCampaignModal', () => ({
  ConfirmLeaveCampaignModal: () => <div data-testid="confirm-leave-stub" />,
}))
vi.mock('@/components/campaigns/CampaignMapsSection', () => ({
  CampaignMapsSection: () => <div data-testid="maps-section-stub" />,
}))
vi.mock('@/components/campaigns/TokenPresetsSection', () => ({
  TokenPresetsSection: () => <div data-testid="token-presets-stub" />,
}))
vi.mock('@/components/campaigns/CampaignRollLog', () => ({
  CampaignRollLog: () => <div data-testid="campaign-roll-log-stub" />,
}))
vi.mock('@/components/dice/DicePanel', () => ({
  DicePanel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="dice-panel-mock">
      <button type="button" data-testid="dice-panel-close" onClick={onClose}>close</button>
    </div>
  ),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: { user: { id: string; email: string } | null; loading: boolean }) => unknown) =>
    selector({ user: { id: 'u-owner', email: 'owner@test.com' }, loading: false }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<CampaignMember & { profile: UserProfile | null }> = {}) {
  return {
    campaignId: 'c1',
    userId: 'u-player',
    role: 'player' as const,
    joinedAt: 1000,
    profile: { userId: 'u-player', displayName: 'Alice', createdAt: 0, updatedAt: 0 },
    ...overrides,
  }
}

function renderMenu(props: Parameters<typeof MemberRowMenu>[0], lang: 'en' | 'pt' = 'en') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <MemberRowMenu {...props} />
      </I18nProvider>
    </MemoryRouter>
  )
}

const CAMPAIGN_OWNER = {
  id: 'c1', name: 'Test Campaign', description: null,
  ownerId: 'u-owner', inviteCode: 'ABCD1234', autoInitiative: false, createdAt: 1000, updatedAt: 2000,
}

// ── MemberRowMenu — transfer ownership item ───────────────────────────────────

describe('MemberRowMenu — transfer ownership', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows transfer item when owner views player row (EN)', async () => {
    renderMenu({
      member: makeMember({ userId: 'u-player' }),
      currentUserId: 'u-owner', isCurrentUserOwner: true,
      onEditName: vi.fn(), onLeaveCampaign: vi.fn(),
      onDeleteCampaign: vi.fn(), onRemoveMember: vi.fn(), onTransferOwnership: vi.fn(),
    }, 'en')
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    expect(screen.getByTestId('transfer-ownership-u-player').textContent).toContain('Transfer ownership')
  })

  it('shows transfer item when owner views player row (PT)', async () => {
    renderMenu({
      member: makeMember({ userId: 'u-player' }),
      currentUserId: 'u-owner', isCurrentUserOwner: true,
      onEditName: vi.fn(), onLeaveCampaign: vi.fn(),
      onDeleteCampaign: vi.fn(), onRemoveMember: vi.fn(), onTransferOwnership: vi.fn(),
    }, 'pt')
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    expect(screen.getByTestId('transfer-ownership-u-player').textContent).toContain('Transferir propriedade')
  })

  it('does NOT show transfer item on own row', async () => {
    renderMenu({
      member: makeMember({ userId: 'u-owner', role: 'master' }),
      currentUserId: 'u-owner', isCurrentUserOwner: true,
      onEditName: vi.fn(), onLeaveCampaign: vi.fn(),
      onDeleteCampaign: vi.fn(), onRemoveMember: vi.fn(), onTransferOwnership: vi.fn(),
    }, 'en')
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-owner'))
    expect(screen.queryByTestId('transfer-ownership-u-owner')).toBeNull()
  })

  it('does NOT show transfer item for non-owner (no menu at all)', () => {
    const { container } = renderMenu({
      member: makeMember({ userId: 'u-player' }),
      currentUserId: 'u-other', isCurrentUserOwner: false,
      onEditName: vi.fn(), onLeaveCampaign: vi.fn(),
      onDeleteCampaign: vi.fn(), onRemoveMember: vi.fn(), onTransferOwnership: vi.fn(),
    }, 'en')
    expect(container.firstChild).toBeNull()
  })

  it('does NOT show transfer item when target is already a master (no menu)', () => {
    const { container } = renderMenu({
      member: makeMember({ userId: 'u-master2', role: 'master' }),
      currentUserId: 'u-owner', isCurrentUserOwner: true,
      onEditName: vi.fn(), onLeaveCampaign: vi.fn(),
      onDeleteCampaign: vi.fn(), onRemoveMember: vi.fn(), onTransferOwnership: vi.fn(),
    }, 'en')
    expect(container.firstChild).toBeNull()
  })

  it('calls onTransferOwnership when transfer item is clicked', async () => {
    const onTransferOwnership = vi.fn()
    renderMenu({
      member: makeMember({ userId: 'u-player' }),
      currentUserId: 'u-owner', isCurrentUserOwner: true,
      onEditName: vi.fn(), onLeaveCampaign: vi.fn(),
      onDeleteCampaign: vi.fn(), onRemoveMember: vi.fn(), onTransferOwnership,
    }, 'en')
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-u-player'))
    expect(onTransferOwnership).toHaveBeenCalledOnce()
  })
})

// ── ConfirmTransferOwnershipModal ─────────────────────────────────────────────

describe('ConfirmTransferOwnershipModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  function renderModal(props: Partial<Parameters<typeof ConfirmTransferOwnershipModal>[0]> = {}, lang: 'en' | 'pt' = 'en') {
    localStorage.setItem('tbt-rpg-v2-lang', lang)
    const member = makeMember()
    return render(
      <MemoryRouter>
        <I18nProvider>
          <ConfirmTransferOwnershipModal
            member={member}
            onConfirm={vi.fn().mockResolvedValue(undefined)}
            onCancel={vi.fn()}
            {...props}
          />
        </I18nProvider>
      </MemoryRouter>
    )
  }

  it('shows member name in warning (EN)', () => {
    renderModal({}, 'en')
    expect(screen.getByTestId('confirm-transfer-ownership-modal').textContent).toContain('Alice')
  })

  it('shows modal title (PT)', () => {
    renderModal({}, 'pt')
    expect(screen.getByTestId('confirm-transfer-ownership-modal').textContent).toContain('Transferir propriedade')
  })

  it('cancel button calls onCancel', async () => {
    const onCancel = vi.fn()
    renderModal({ onCancel })
    await userEvent.click(screen.getByTestId('transfer-ownership-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('confirm button calls onConfirm', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    renderModal({ onConfirm })
    await userEvent.click(screen.getByTestId('transfer-ownership-confirm'))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
  })

  it('shows error state when onConfirm throws', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('fail'))
    renderModal({ onConfirm })
    await userEvent.click(screen.getByTestId('transfer-ownership-confirm'))
    await waitFor(() => expect(screen.getByTestId('transfer-ownership-error')).toBeDefined())
  })

  it('disables confirm button while in progress', async () => {
    let resolve!: () => void
    const onConfirm = vi.fn().mockReturnValue(new Promise<void>(r => { resolve = r }))
    renderModal({ onConfirm })
    await userEvent.click(screen.getByTestId('transfer-ownership-confirm'))
    expect(screen.getByTestId('transfer-ownership-confirm')).toHaveProperty('disabled', true)
    resolve()
  })
})

// ── CampaignDetail — transfer ownership integration ───────────────────────────

import CampaignDetail from '@/pages/CampaignDetail'

describe('CampaignDetail — transfer ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetCampaign.mockResolvedValue(CAMPAIGN_OWNER)
    mockListCampaignMembers.mockResolvedValue([
      { campaignId: 'c1', userId: 'u-owner', role: 'master', joinedAt: 1000 },
      { campaignId: 'c1', userId: 'u-player', role: 'player', joinedAt: 1000 },
    ])
  })

  function renderPage(lang: 'en' | 'pt' = 'en') {
    localStorage.setItem('tbt-rpg-v2-lang', lang)
    return render(
      <MemoryRouter initialEntries={['/campaigns/c1']}>
        <I18nProvider>
          <Routes>
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
          </Routes>
        </I18nProvider>
      </MemoryRouter>
    )
  }

  it('shows transfer action in player row kebab (EN)', async () => {
    renderPage('en')
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    expect(screen.getByTestId('transfer-ownership-u-player')).toBeDefined()
  })

  it('shows transfer action in player row kebab (PT)', async () => {
    renderPage('pt')
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    expect(screen.getByTestId('transfer-ownership-u-player').textContent).toContain('Transferir')
  })

  it('opens ConfirmTransferOwnershipModal when transfer is clicked', async () => {
    renderPage('en')
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-u-player'))
    expect(screen.getByTestId('confirm-transfer-ownership-modal')).toBeDefined()
  })

  it('calls transferCampaignOwnership with correct userId on confirm', async () => {
    // beforeEach sets up initial state (u-owner is owner, u-player is player)
    mockTransferCampaignOwnership.mockResolvedValue({ ok: true })
    renderPage('en')
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-confirm'))
    await waitFor(() => expect(mockTransferCampaignOwnership).toHaveBeenCalledWith('c1', 'u-player'))
  })

  it('refetches campaign and members on success (modal closes)', async () => {
    // beforeEach sets up initial state; refetch returns same state (sufficient for modal close test)
    mockTransferCampaignOwnership.mockResolvedValue({ ok: true })
    renderPage('en')
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-confirm'))
    // Modal closes after success
    await waitFor(() => expect(screen.queryByTestId('confirm-transfer-ownership-modal')).toBeNull())
    // getCampaign called more than once (initial + post-transfer refetch)
    expect(mockGetCampaign.mock.calls.length).toBeGreaterThan(1)
  })

  it('shows error in modal and keeps it open on service failure', async () => {
    mockTransferCampaignOwnership.mockResolvedValue({ ok: false, error: 'not_owner' })
    renderPage('en')
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-u-player'))
    await userEvent.click(screen.getByTestId('transfer-ownership-confirm'))
    await waitFor(() => expect(screen.getByTestId('transfer-ownership-error')).toBeDefined())
    expect(screen.getByTestId('confirm-transfer-ownership-modal')).toBeDefined()
  })
})
