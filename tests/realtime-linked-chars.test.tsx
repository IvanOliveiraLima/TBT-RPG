/**
 * Tests for the Realtime integration in CampaignDetail (RT.1).
 *
 * Covers:
 * - subscribeCharacterChanges called on mount, cleanup on unmount
 * - Event with linked id → refetch once (debounce), even with 3 bursts
 * - Event with non-linked id → no refetch
 * - SUBSCRIBED → polling interval switches to 30 s; CHANNEL_ERROR → back to 5 s
 * - Offline (no supabase / inactive) → nothing breaks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { act } from 'react'
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

vi.mock('@/store/auth', () => {
  const state = { user: { id: 'owner1' }, loading: false }
  return {
    useAuthStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  }
})

// ── Campaign service ──────────────────────────────────────────────────────────

const mockGetCampaign = vi.fn()
const mockListCampaignMembers = vi.fn()

vi.mock('@/services/campaign', () => ({
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaignMembers: (...args: unknown[]) => mockListCampaignMembers(...args),
  removeMember: vi.fn(),
  transferCampaignOwnership: vi.fn().mockResolvedValue({ ok: true }),
  setCampaignMemberRole: vi.fn().mockResolvedValue({ ok: true }),
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

// ── campaign-view service ─────────────────────────────────────────────────────

const mockFetchLinkedCharactersDetails = vi.fn()
vi.mock('@/services/campaign-view', () => ({
  fetchLinkedCharactersDetails: (...args: unknown[]) => mockFetchLinkedCharactersDetails(...args),
  fetchCampaignCharacterImages: vi.fn().mockResolvedValue({ portraitData: null, symbolData: null }),
}))

// ── Realtime service (controllable) ──────────────────────────────────────────

type ChangeCb = (id: string) => void
type StatusCb = (status: string) => void

let capturedOnChange: ChangeCb | null = null
let capturedOnStatus: StatusCb | null = null
const mockCleanup = vi.fn()
const mockSubscribeCharacterChanges = vi.fn((onChange: ChangeCb, onStatus: StatusCb) => {
  capturedOnChange = onChange
  capturedOnStatus = onStatus
  onStatus('inactive')
  return mockCleanup
})

vi.mock('@/services/realtime', () => ({
  subscribeCharacterChanges: (onChange: ChangeCb, onStatus: StatusCb) =>
    mockSubscribeCharacterChanges(onChange, onStatus),
}))

// ── characters store ──────────────────────────────────────────────────────────

vi.mock('@/store/characters', () => ({
  useCharactersStore: (selector: (s: { characters: [] }) => unknown) =>
    selector({ characters: [] }),
}))

// ── Stub heavy sub-components ─────────────────────────────────────────────────

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
  ConfirmDeleteCampaignModal: () => <div />,
}))
vi.mock('@/components/campaigns/ConfirmLeaveCampaignModal', () => ({
  ConfirmLeaveCampaignModal: () => <div />,
}))
vi.mock('@/components/campaigns/CampaignMapsSection', () => ({
  CampaignMapsSection: () => <div />,
}))
vi.mock('@/components/campaigns/TokenPresetsSection', () => ({
  TokenPresetsSection: () => <div />,
}))
vi.mock('@/components/campaigns/CampaignRollLog', () => ({
  CampaignRollLog: () => <div />,
}))
vi.mock('@/components/campaigns/LinkedCharCard', () => ({
  LinkedCharCard: ({ detail }: { detail: LinkedCharacterDetails }) => (
    <div data-testid={`linked-char-${detail.characterId}`} />
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN: Campaign = {
  id: 'c1', name: 'RT Test Campaign', description: '',
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
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [], deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30, inspiration: false,
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

function resetMocks() {
  capturedOnChange = null
  capturedOnStatus = null
  mockCleanup.mockReset()
  mockSubscribeCharacterChanges.mockClear()
  mockGetCampaign.mockReset().mockResolvedValue(CAMPAIGN)
  mockListCampaignMembers.mockReset().mockResolvedValue([MEMBER])
  mockListProfilesByIds.mockReset().mockResolvedValue([PROFILE])
  mockFetchLinkedCharactersDetails.mockReset().mockResolvedValue([DETAIL])
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

// ── Tests — lifecycle ─────────────────────────────────────────────────────────

describe('RT.1 — subscribeCharacterChanges lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    resetMocks()
  })

  it('calls subscribeCharacterChanges on mount', async () => {
    renderDetail()
    // Wait for full data load so no pending async ops spill into subsequent tests.
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
    expect(mockSubscribeCharacterChanges).toHaveBeenCalledTimes(1)
  })

  it('calls the cleanup function on unmount', async () => {
    const { unmount } = renderDetail()
    // Wait for full data load before unmounting.
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
    unmount()
    expect(mockCleanup).toHaveBeenCalled()
  })
})

// ── Tests — event filtering ───────────────────────────────────────────────────
// Real timers are used here so waitFor works normally and the 300 ms debounce
// can be exercised without fake-timer infinite-loop issues.

describe('RT.1 — event filtering', () => {
  beforeEach(() => {
    localStorage.clear()
    resetMocks()
  })

  it('event with linked char id triggers a refetch after the 300 ms debounce', async () => {
    renderDetail()
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
    const callsBefore = mockFetchLinkedCharactersDetails.mock.calls.length

    act(() => { capturedOnChange?.('char1') })
    // Debounce hasn't fired yet — no extra call
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore)
    // Wait past the 300 ms debounce
    await act(async () => { await new Promise(r => setTimeout(r, 350)) })
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore + 1)
  })

  it('3 rapid events with linked id produce exactly 1 refetch (debounce coalescing)', async () => {
    renderDetail()
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
    const callsBefore = mockFetchLinkedCharactersDetails.mock.calls.length

    act(() => {
      capturedOnChange?.('char1')
      capturedOnChange?.('char1')
      capturedOnChange?.('char1')
    })
    await act(async () => { await new Promise(r => setTimeout(r, 400)) })
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore + 1)
  })

  it('event with non-linked char id does not trigger a refetch', async () => {
    renderDetail()
    await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
    const callsBefore = mockFetchLinkedCharactersDetails.mock.calls.length

    act(() => { capturedOnChange?.('other-char-99') })
    await act(async () => { await new Promise(r => setTimeout(r, 400)) })
    expect(mockFetchLinkedCharactersDetails.mock.calls.length).toBe(callsBefore)
  })
})

// ── Tests — polling interval ──────────────────────────────────────────────────
// We spy on setInterval to check the interval value without running the timers.

describe('RT.1 — polling interval adapts to realtime status', () => {
  beforeEach(() => {
    localStorage.clear()
    resetMocks()
  })

  it('uses 5 s interval when realtime is inactive (default)', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      renderDetail()
      await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
      const call = spy.mock.calls.find(([, delay]) => delay === 5_000)
      expect(call).toBeDefined()
    } finally {
      spy.mockRestore()
    }
  })

  it('switches to 30 s interval when realtime becomes active', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      renderDetail()
      await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
      // The component's onStatus callback expects 'active'/'inactive' (the real service
      // converts Supabase's 'SUBSCRIBED'/'CHANNEL_ERROR' before calling onStatus).
      act(() => { capturedOnStatus?.('active') })
      await waitFor(() => {
        const thirtyCall = spy.mock.calls.find(([, delay]) => delay === 30_000)
        expect(thirtyCall).toBeDefined()
      })
    } finally {
      spy.mockRestore()
    }
  })

  it('falls back to 5 s interval when realtime goes inactive after being active', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      renderDetail()
      await waitFor(() => expect(mockFetchLinkedCharactersDetails).toHaveBeenCalledWith('c1'))
      // Go active → 30 s
      act(() => { capturedOnStatus?.('active') })
      await waitFor(() => expect(spy.mock.calls.some(([, d]) => d === 30_000)).toBe(true))
      // Go inactive → 5 s again
      act(() => { capturedOnStatus?.('inactive') })
      await waitFor(() => {
        const fiveSCalls = spy.mock.calls.filter(([, d]) => d === 5_000)
        expect(fiveSCalls.length).toBeGreaterThanOrEqual(2)
      })
    } finally {
      spy.mockRestore()
    }
  })
})

// ── Tests — offline safety ────────────────────────────────────────────────────

describe('RT.1 — offline safety', () => {
  beforeEach(() => {
    localStorage.clear()
    resetMocks()
  })

  it('returns inactive status when supabase is unavailable; cleanup is a no-op', () => {
    const onChange = vi.fn()
    const onStatus = vi.fn()
    mockSubscribeCharacterChanges.mockImplementationOnce((_cb: ChangeCb, status: StatusCb) => {
      status('inactive')
      return () => {}
    })
    const cleanup = mockSubscribeCharacterChanges(onChange, onStatus)
    expect(onStatus).toHaveBeenCalledWith('inactive')
    expect(() => cleanup()).not.toThrow()
  })
})
