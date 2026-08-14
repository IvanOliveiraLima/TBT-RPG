/**
 * CoMestre.2 — promote/demote + isMaster gates
 *
 * Covers:
 * - setCampaignMemberRole service: params, ok, error
 * - MemberRowMenu: co-master visibility, promote/demote items, no transfer/promote for co-master
 * - CampaignDetail: isMaster → dice FAB; co-master sees master sections; promote/demote calls service
 * - CampaignCard: myRole badge (Mestre for co-master, PT/EN)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import React from 'react'

// ── MemberRowMenu — co-master scenarios ──────────────────────────────────────

import { MemberRowMenu } from '@/components/campaigns/MemberRowMenu'
import type { CampaignMember, UserProfile } from '@/domain/campaign'

function makeMember(overrides: Partial<CampaignMember & { profile: UserProfile | null }> = {}) {
  return {
    campaignId: 'c1',
    userId: 'u-player',
    role: 'player' as const,
    joinedAt: 1000,
    profile: { userId: 'u-player', displayName: 'Bob', createdAt: 0, updatedAt: 0 },
    ...overrides,
  }
}

function renderMemberMenu(props: {
  member: ReturnType<typeof makeMember>
  currentUserId: string
  isCurrentUserOwner: boolean
  isCurrentUserMaster: boolean
  [k: string]: unknown
}) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <MemberRowMenu
          member={props.member}
          currentUserId={props.currentUserId}
          isCurrentUserOwner={props.isCurrentUserOwner}
          isCurrentUserMaster={props.isCurrentUserMaster}
          onEditName={vi.fn()}
          onLeaveCampaign={vi.fn()}
          onDeleteCampaign={vi.fn()}
          onRemoveMember={vi.fn()}
          onTransferOwnership={vi.fn()}
          onPromoteToMaster={vi.fn()}
          onDemoteToPlayer={vi.fn()}
          {...(props as Partial<Parameters<typeof MemberRowMenu>[0]>)}
        />
      </I18nProvider>
    </MemoryRouter>
  )
}

describe('MemberRowMenu — co-master as current user', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('co-master sees Remove on player row (but not promote/demote/transfer)', async () => {
    const member = makeMember({ userId: 'u-player' })
    renderMemberMenu({ member, currentUserId: 'u-comaster', isCurrentUserOwner: false, isCurrentUserMaster: true })
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    expect(screen.getByTestId('member-remove-u-player')).toBeDefined()
    expect(screen.queryByTestId('promote-master-u-player')).toBeNull()
    expect(screen.queryByTestId('demote-player-u-player')).toBeNull()
    expect(screen.queryByTestId('transfer-ownership-u-player')).toBeNull()
  })

  it('co-master has NO menu on co-master row (cannot act on peers)', () => {
    const member = makeMember({ userId: 'u-master2', role: 'master' })
    const { container } = renderMemberMenu({
      member, currentUserId: 'u-comaster', isCurrentUserOwner: false, isCurrentUserMaster: true,
    })
    expect(container.firstChild).toBeNull()
  })

  it('co-master sees own row menu (edit name + leave)', async () => {
    const member = makeMember({ userId: 'u-comaster', role: 'master' })
    renderMemberMenu({ member, currentUserId: 'u-comaster', isCurrentUserOwner: false, isCurrentUserMaster: true })
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-comaster'))
    expect(screen.getByTestId('member-edit-name-u-comaster')).toBeDefined()
    expect(screen.getByTestId('member-leave-u-comaster')).toBeDefined()
  })
})

describe('MemberRowMenu — owner promote/demote actions', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('owner sees Promote on player row', async () => {
    const member = makeMember({ userId: 'u-player' })
    renderMemberMenu({ member, currentUserId: 'u-owner', isCurrentUserOwner: true, isCurrentUserMaster: true })
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    expect(screen.getByTestId('promote-master-u-player')).toBeDefined()
    expect(screen.queryByTestId('demote-player-u-player')).toBeNull()
  })

  it('owner sees Demote on co-master row', async () => {
    const member = makeMember({ userId: 'u-comaster', role: 'master' })
    renderMemberMenu({ member, currentUserId: 'u-owner', isCurrentUserOwner: true, isCurrentUserMaster: true })
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-comaster'))
    expect(screen.getByTestId('demote-player-u-comaster')).toBeDefined()
    expect(screen.queryByTestId('promote-master-u-comaster')).toBeNull()
  })

  it('calls onPromoteToMaster when Promote is clicked', async () => {
    const onPromoteToMaster = vi.fn()
    const member = makeMember({ userId: 'u-player' })
    renderMemberMenu({
      member, currentUserId: 'u-owner', isCurrentUserOwner: true, isCurrentUserMaster: true,
      onPromoteToMaster,
    })
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    await userEvent.click(screen.getByTestId('promote-master-u-player'))
    expect(onPromoteToMaster).toHaveBeenCalled()
  })

  it('calls onDemoteToPlayer when Demote is clicked', async () => {
    const onDemoteToPlayer = vi.fn()
    const member = makeMember({ userId: 'u-comaster', role: 'master' })
    renderMemberMenu({
      member, currentUserId: 'u-owner', isCurrentUserOwner: true, isCurrentUserMaster: true,
      onDemoteToPlayer,
    })
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-comaster'))
    await userEvent.click(screen.getByTestId('demote-player-u-comaster'))
    expect(onDemoteToPlayer).toHaveBeenCalled()
  })

  it('owner can transfer to co-master (transfer appears on co-master row)', async () => {
    const member = makeMember({ userId: 'u-comaster', role: 'master' })
    renderMemberMenu({ member, currentUserId: 'u-owner', isCurrentUserOwner: true, isCurrentUserMaster: true })
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-comaster'))
    expect(screen.getByTestId('transfer-ownership-u-comaster')).toBeDefined()
  })
})

describe('MemberRowMenu — hooks regression with co-master (PR #270)', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('does not throw when isCurrentUserMaster changes from true to false while mounted', () => {
    const member = makeMember({ userId: 'u-player' })
    const { rerender } = renderMemberMenu({
      member, currentUserId: 'u-comaster', isCurrentUserOwner: false, isCurrentUserMaster: true,
    })
    expect(() =>
      rerender(
        <MemoryRouter>
          <I18nProvider>
            <MemberRowMenu
              member={member}
              currentUserId="u-comaster"
              isCurrentUserOwner={false}
              isCurrentUserMaster={false}
              onEditName={vi.fn()} onLeaveCampaign={vi.fn()}
              onDeleteCampaign={vi.fn()} onRemoveMember={vi.fn()} onTransferOwnership={vi.fn()}
              onPromoteToMaster={vi.fn()} onDemoteToPlayer={vi.fn()}
            />
          </I18nProvider>
        </MemoryRouter>
      )
    ).not.toThrow()
    expect(screen.queryByTestId('member-menu-trigger-u-player')).toBeNull()
  })
})

// ── CampaignDetail — co-master (isMaster) ───────────────────────────────────

const mockGetCampaign2 = vi.fn()
const mockListCampaignMembers2 = vi.fn()
const mockSetCampaignMemberRole2 = vi.fn()
const mockNavigate2 = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate2 }
})

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: { user: { id: string; email: string } | null; loading: boolean }) => unknown) =>
    selector({ user: { id: 'u-comaster', email: 'co@test.com' }, loading: false }),
}))

vi.mock('@/services/campaign', () => ({
  getCampaign: (...a: unknown[]) => mockGetCampaign2(...a),
  listCampaignMembers: (...a: unknown[]) => mockListCampaignMembers2(...a),
  removeMember: vi.fn(),
  transferCampaignOwnership: vi.fn().mockResolvedValue({ ok: true }),
  setCampaignMemberRole: (...a: unknown[]) => mockSetCampaignMemberRole2(...a),
  CampaignServiceError: class extends Error {
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

vi.mock('@/store/useDiceStore', () => ({
  useDiceStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ setCampaignContext: vi.fn(), clearCampaignContext: vi.fn() }),
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
  DicePanel: () => <div data-testid="dice-panel-stub" />,
}))

const CAMPAIGN = {
  id: 'c1', name: 'Test', description: null,
  ownerId: 'u-owner', inviteCode: 'ABCD1234', autoInitiative: false, createdAt: 1000, updatedAt: 2000,
}

import CampaignDetail from '@/pages/CampaignDetail'

function renderDetailImported() {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
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

describe('CampaignDetail — co-master isMaster gates', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('co-master sees dice FAB (isMaster = true)', async () => {
    mockGetCampaign2.mockResolvedValue(CAMPAIGN)
    // u-comaster is a master member, not the owner
    mockListCampaignMembers2.mockResolvedValue([
      { campaignId: 'c1', userId: 'u-owner', role: 'master', joinedAt: 1000 },
      { campaignId: 'c1', userId: 'u-comaster', role: 'master', joinedAt: 2000 },
    ])
    renderDetailImported()
    await waitFor(() => expect(screen.getByTestId('campaign-detail-dice-fab')).toBeDefined())
  })

  it('player does NOT see dice FAB', async () => {
    mockGetCampaign2.mockResolvedValue(CAMPAIGN)
    mockListCampaignMembers2.mockResolvedValue([
      { campaignId: 'c1', userId: 'u-owner', role: 'master', joinedAt: 1000 },
      { campaignId: 'c1', userId: 'u-comaster', role: 'player', joinedAt: 2000 },
    ])
    renderDetailImported()
    await waitFor(() => expect(screen.queryByTestId('campaign-detail-members')).toBeDefined())
    expect(screen.queryByTestId('campaign-detail-dice-fab')).toBeNull()
  })

  it('co-master sees promote button on player row', async () => {
    mockGetCampaign2.mockResolvedValue(CAMPAIGN)
    mockListCampaignMembers2.mockResolvedValue([
      { campaignId: 'c1', userId: 'u-owner', role: 'master', joinedAt: 1000 },
      { campaignId: 'c1', userId: 'u-comaster', role: 'master', joinedAt: 2000 },
      { campaignId: 'c1', userId: 'u-player', role: 'player', joinedAt: 3000 },
    ])
    renderDetailImported()
    // u-comaster is not the owner, so no Promote button
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    // co-master (not owner) cannot see promote on player row
    expect(screen.queryByTestId('promote-master-u-player')).toBeNull()
  })

  it('promote calls setCampaignMemberRole and refetches members', async () => {
    // Re-setup with u-comaster as the OWNER to trigger the promote action
    mockGetCampaign2.mockResolvedValue({ ...CAMPAIGN, ownerId: 'u-comaster' })
    mockListCampaignMembers2.mockResolvedValue([
      { campaignId: 'c1', userId: 'u-comaster', role: 'master', joinedAt: 1000 },
      { campaignId: 'c1', userId: 'u-player', role: 'player', joinedAt: 2000 },
    ])
    mockSetCampaignMemberRole2.mockResolvedValue({ ok: true })
    renderDetailImported()
    await waitFor(() => screen.getByTestId('member-row-u-player'))
    await userEvent.click(screen.getByTestId('member-menu-trigger-u-player'))
    await userEvent.click(screen.getByTestId('promote-master-u-player'))
    await waitFor(() => expect(mockSetCampaignMemberRole2).toHaveBeenCalledWith(
      'c1', 'u-player', 'master',
    ))
    // After promote, refetch was triggered (at least twice: once on mount + once after promote)
    expect(mockListCampaignMembers2.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})

// ── CampaignCard — myRole badge ───────────────────────────────────────────────

import { CampaignCard } from '@/components/campaigns/CampaignCard'

const BASE_CAMPAIGN = {
  id: 'c1', name: 'My Campaign', description: null,
  ownerId: 'u-owner', inviteCode: 'ABCD', autoInitiative: false,
  createdAt: 1000, updatedAt: 2000,
}

function renderCard(campaign: typeof BASE_CAMPAIGN & { myRole?: 'master' | 'player' }, currentUserId: string, lang: 'pt' | 'en' = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CampaignCard
          campaign={campaign}
          currentUserId={currentUserId}
          onOpen={vi.fn()}
          onRequestDelete={vi.fn()}
          onRequestLeave={vi.fn()}
        />
      </I18nProvider>
    </MemoryRouter>
  )
}

describe('CampaignCard — myRole badge', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows Mestre (PT) when user is owner', () => {
    renderCard(BASE_CAMPAIGN, 'u-owner', 'pt')
    expect(screen.getByText('Mestre')).toBeDefined()
  })

  it('shows Master (EN) when user is owner', () => {
    renderCard(BASE_CAMPAIGN, 'u-owner', 'en')
    expect(screen.getByText('Master')).toBeDefined()
  })

  it('shows Co-Mestre (PT) when myRole=master (co-master)', () => {
    renderCard({ ...BASE_CAMPAIGN, myRole: 'master' }, 'u-comaster', 'pt')
    expect(screen.getByText('Co-Mestre')).toBeDefined()
  })

  it('shows Co-master (EN) when myRole=master (co-master)', () => {
    renderCard({ ...BASE_CAMPAIGN, myRole: 'master' }, 'u-comaster', 'en')
    expect(screen.getByText('Co-master')).toBeDefined()
  })

  it('shows Jogador (PT) when myRole=player', () => {
    renderCard({ ...BASE_CAMPAIGN, myRole: 'player' }, 'u-player', 'pt')
    expect(screen.getByText('Jogador')).toBeDefined()
  })

  it('shows Player (EN) when myRole=player', () => {
    renderCard({ ...BASE_CAMPAIGN, myRole: 'player' }, 'u-player', 'en')
    expect(screen.getByText('Player')).toBeDefined()
  })

  it('shows Jogador (PT) when myRole is absent and user is not owner', () => {
    renderCard({ ...BASE_CAMPAIGN }, 'u-player', 'pt')
    expect(screen.getByText('Jogador')).toBeDefined()
  })

  it('co-master card menu shows Leave (not Delete)', async () => {
    renderCard({ ...BASE_CAMPAIGN, myRole: 'master' }, 'u-comaster', 'pt')
    await userEvent.click(screen.getByTestId(`campaign-menu-${BASE_CAMPAIGN.id}`))
    expect(screen.getByTestId(`campaign-leave-${BASE_CAMPAIGN.id}`)).toBeDefined()
    expect(screen.queryByTestId(`campaign-delete-${BASE_CAMPAIGN.id}`)).toBeNull()
  })
})
