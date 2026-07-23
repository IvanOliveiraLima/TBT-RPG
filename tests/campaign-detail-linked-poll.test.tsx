/**
 * Tests that CampaignDetail polls fetchLinkedCharactersDetails every 10 s so
 * linked characters' HP updates without a page reload.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import CampaignDetail from '@/pages/CampaignDetail'
import type { Campaign, CampaignMember, UserProfile } from '@/domain/campaign'
import type { LinkedCharacterDetails } from '@/services/campaign-view'
import type { Character } from '@/domain/character'

// ── react-router-dom ──────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Dice store + panel ────────────────────────────────────────────────────────

vi.mock('@/store/useDiceStore', () => ({
  useDiceStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isOpen: false, toggle: vi.fn(), close: vi.fn(), open: vi.fn(),
      rollMode: 'normal', setRollMode: vi.fn(),
      setCampaignContext: vi.fn(), clearCampaignContext: vi.fn(),
    }),
}))

vi.mock('@/components/dice/DicePanel', () => ({
  DicePanel: () => <div data-testid="dice-panel-stub" />,
}))

// ── Auth store ────────────────────────────────────────────────────────────────

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector?: (s: { user: { id: string } | null; loading: boolean }) => unknown) => {
    const state = { user: { id: 'owner1' }, loading: false }
    return selector ? selector(state) : state
  },
}))

// ── Campaign service ──────────────────────────────────────────────────────────

const mockGetCampaign = vi.fn()
const mockListCampaignMembers = vi.fn()

vi.mock('@/services/campaign', () => ({
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaignMembers: (...args: unknown[]) => mockListCampaignMembers(...args),
  removeMember: vi.fn(),
  CampaignServiceError: class extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── user-profile service ──────────────────────────────────────────────────────

const mockListProfilesByIds = vi.fn()
vi.mock('@/services/user-profile', () => ({
  listProfilesByIds: (...args: unknown[]) => mockListProfilesByIds(...args),
  upsertMyProfile: vi.fn(),
  getMyProfile: vi.fn(),
  UserProfileServiceError: class extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── campaign-characters service ───────────────────────────────────────────────

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: vi.fn().mockResolvedValue([]),
  unlinkCharacterFromCampaign: vi.fn(),
}))

// ── campaign-view service — the target ───────────────────────────────────────

const mockFetchLinkedCharactersDetails = vi.fn()

vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: (...args: unknown[]) => mockFetchLinkedCharactersDetails(...args),
  fetchCampaignCharacterImages: vi.fn().mockResolvedValue({ portraitData: null, symbolData: null }),
}))

// ── characters store ──────────────────────────────────────────────────────────

vi.mock('@/store/characters', () => ({
  useCharactersStore: (selector: (s: { characters: [] }) => unknown) =>
    selector({ characters: [] }),
}))

// ── Stub all heavy sub-components ─────────────────────────────────────────────

vi.mock('@/components/campaigns/InviteCodeBlock', () => ({
  InviteCodeBlock: () => <div data-testid="invite-code-block-stub" />,
}))

vi.mock('@/components/campaigns/LinkCharacterModal', () => ({
  LinkCharacterModal: ({ onCancel }: { onCancel: () => void; campaignId: string; alreadyLinkedIds: string[]; onLinked: () => void }) => (
    <div data-testid="link-char-modal-stub">
      <button onClick={onCancel} data-testid="stub-modal-close">Close</button>
    </div>
  ),
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

vi.mock('@/components/campaigns/LinkedCharCard', () => ({
  LinkedCharCard: ({ detail }: { detail: LinkedCharacterDetails }) => (
    <div data-testid={`linked-char-${detail.characterId}`}>
      <span data-testid={`linked-char-hp-${detail.characterId}`}>{detail.character?.hp.current ?? '?'}</span>
    </div>
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN: Campaign = {
  id: 'c1', name: 'Poll Test Campaign', description: '',
  ownerId: 'owner1', inviteCode: 'ABCD1234', autoInitiative: false,
  createdAt: 0, updatedAt: 0,
}

const MEMBER: CampaignMember = { campaignId: 'c1', userId: 'owner1', role: 'master', joinedAt: 0 }
const PROFILE: UserProfile = { userId: 'owner1', displayName: 'Alice', createdAt: 0, updatedAt: 0 }

const BASE_CHAR: Character = {
  id: 'char1', name: 'Aragorn', race: '', background: '', alignment: '',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  experience: 0, age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [], deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 10, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '', mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

const DETAIL: LinkedCharacterDetails = {
  characterId: 'char1', ownerUserId: 'owner1', ownerDisplayName: 'Alice',
  character: BASE_CHAR, portraitData: null, symbolData: null,
}

function renderDetail() {
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CampaignDetail — linked characters polling', () => {
  beforeEach(() => {
    localStorage.clear()
    mockGetCampaign.mockReset().mockResolvedValue(CAMPAIGN)
    mockListCampaignMembers.mockReset().mockResolvedValue([MEMBER])
    mockListProfilesByIds.mockReset().mockResolvedValue([PROFILE])
    mockFetchLinkedCharactersDetails.mockReset().mockResolvedValue([DETAIL])
  })

  it('calls fetchLinkedCharactersDetails on mount', async () => {
    renderDetail()
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
  })

  it('registers a 10 s setInterval for polling on mount', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      renderDetail()
      await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
      const pollingCall = spy.mock.calls.find(([, delay]) => delay === 10_000)
      expect(pollingCall).toBeDefined()
    } finally {
      spy.mockRestore()
    }
  })

  it('calls clearInterval on unmount (polling cleaned up)', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    try {
      const { unmount } = renderDetail()
      await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
      unmount()
      expect(clearSpy).toHaveBeenCalled()
    } finally {
      clearSpy.mockRestore()
    }
  })
})
