/**
 * Tests for LinkedCharCard — campaign-linked character card with navigation and unlink.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import { LinkedCharCard } from '@/components/campaigns/LinkedCharCard'
import type { LinkedCharacterDetails } from '@/services/campaign-view'
import type { Character } from '@/domain/character'

// ── Mock react-router-dom navigate ───────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock fetchCampaignCharacterImages (lazy load) ─────────────────────────────

const mockFetchCampaignCharacterImages = vi.fn()

vi.mock('@/services/campaign-view', () => ({
  fetchCampaignCharacterImages: (...args: unknown[]) => mockFetchCampaignCharacterImages(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CHARACTER_ARAGORN: Character = {
  id: 'char1', name: 'Aragorn', race: 'Human', background: 'Noble',
  alignment: 'LG',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  experience: 0, age: '', height: '', weight: '',
  eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 14, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 14, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '', personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

const DETAIL_WITH_CHAR: LinkedCharacterDetails = {
  characterId: 'char1',
  ownerUserId: 'owner1',
  ownerDisplayName: 'Alice',
  character: CHARACTER_ARAGORN,
  portraitData: null,
  symbolData: null,
}

const DETAIL_NO_CHAR: LinkedCharacterDetails = {
  characterId: 'char2',
  ownerUserId: 'player1',
  ownerDisplayName: 'Bob',
  character: null,
  portraitData: null,
  symbolData: null,
}

const DETAIL_NO_DISPLAY_NAME: LinkedCharacterDetails = {
  characterId: 'char3',
  ownerUserId: 'player2',
  ownerDisplayName: null,
  character: CHARACTER_ARAGORN,
  portraitData: null,
  symbolData: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  detail?: LinkedCharacterDetails
  campaignId?: string
  isCurrentUserOwner?: boolean
  currentUserId?: string | null
  onUnlink?: () => Promise<void>
}

function renderCard({
  detail = DETAIL_WITH_CHAR,
  campaignId = 'c1',
  isCurrentUserOwner = false,
  currentUserId = null,
  onUnlink = vi.fn().mockResolvedValue(undefined),
}: RenderOptions = {}) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <LinkedCharCard
          detail={detail}
          campaignId={campaignId}
          isCurrentUserOwner={isCurrentUserOwner}
          currentUserId={currentUserId}
          onUnlink={onUnlink}
        />
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LinkedCharCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Default: lazy image fetch resolves with no images
    mockFetchCampaignCharacterImages.mockResolvedValue({ portraitData: null, symbolData: null })
  })

  it('renders character name from detail.character.name', async () => {
    renderCard()
    await waitFor(() => expect(screen.getByText('Aragorn')).toBeDefined())
  })

  it('renders "Personagem desconhecido" when detail.character is null (PT)', async () => {
    renderCard({ detail: DETAIL_NO_CHAR })
    await waitFor(() =>
      expect(screen.getByText('Personagem desconhecido')).toBeDefined()
    )
  })

  it('shows unlink button when isCurrentUserOwner=true', async () => {
    renderCard({ isCurrentUserOwner: true })
    await waitFor(() =>
      expect(screen.getByTestId('unlink-char-char1')).toBeDefined()
    )
  })

  it('shows unlink button when currentUserId equals detail.ownerUserId', async () => {
    renderCard({ currentUserId: 'owner1', isCurrentUserOwner: false })
    await waitFor(() =>
      expect(screen.getByTestId('unlink-char-char1')).toBeDefined()
    )
  })

  it('does NOT show unlink button for non-owner, non-char-owner', async () => {
    renderCard({ currentUserId: 'other_user', isCurrentUserOwner: false })
    await waitFor(() =>
      expect(screen.getByTestId('linked-char-char1')).toBeDefined()
    )
    expect(screen.queryByTestId('unlink-char-char1')).toBeNull()
  })

  it('clicking card navigates to character view when char is not null', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    renderCard()
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    await ue.click(screen.getByTestId('linked-char-char1'))
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/c1/characters/char1')
  })

  it('clicking card does NOT navigate when char is null', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    renderCard({ detail: DETAIL_NO_CHAR })
    await waitFor(() => expect(screen.getByTestId('linked-char-char2')).toBeDefined())
    await ue.click(screen.getByTestId('linked-char-char2'))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clicking unlink button does NOT trigger card navigation (stopPropagation)', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    renderCard({ isCurrentUserOwner: true })
    await waitFor(() => expect(screen.getByTestId('unlink-char-char1')).toBeDefined())
    await ue.click(screen.getByTestId('unlink-char-char1'))
    // mockNavigate should NOT have been called for char view navigation
    const charViewCalls = mockNavigate.mock.calls.filter(
      (call: string[]) => call[0]?.includes('/characters/')
    )
    expect(charViewCalls.length).toBe(0)
  })

  it('shows owner display name in owner label', async () => {
    renderCard()
    await waitFor(() => expect(screen.getByText(/Alice/)).toBeDefined())
    // Format is "{owner_label}: {ownerDisplayName}"
    expect(screen.getByText(/Jogador: Alice/)).toBeDefined()
  })

  it('shows "Membro desconhecido" when ownerDisplayName is null (PT)', async () => {
    renderCard({ detail: DETAIL_NO_DISPLAY_NAME })
    await waitFor(() =>
      expect(screen.getByText(/Membro desconhecido/)).toBeDefined()
    )
  })

  it('calls onUnlink when unlink button is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    const onUnlink = vi.fn().mockResolvedValue(undefined)
    renderCard({ isCurrentUserOwner: true, onUnlink })
    await waitFor(() => expect(screen.getByTestId('unlink-char-char1')).toBeDefined())
    await ue.click(screen.getByTestId('unlink-char-char1'))
    expect(onUnlink).toHaveBeenCalledOnce()
  })

  it('renders card with correct testid for the detail characterId', async () => {
    renderCard({ detail: DETAIL_NO_CHAR })
    await waitFor(() =>
      expect(screen.getByTestId('linked-char-char2')).toBeDefined()
    )
  })
})

describe('LinkedCharCard — lazy image loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockFetchCampaignCharacterImages.mockResolvedValue({ portraitData: null, symbolData: null })
  })

  it('renders card immediately without portrait (placeholder visible before images load)', async () => {
    // Mock a slow image fetch that never resolves during the test
    mockFetchCampaignCharacterImages.mockReturnValue(new Promise(() => { /* pending */ }))
    renderCard()
    // Card should be visible immediately
    expect(screen.getByTestId('linked-char-char1')).toBeDefined()
    // Name should be rendered right away
    expect(screen.getByText('Aragorn')).toBeDefined()
  })

  it('calls fetchCampaignCharacterImages on mount when char exists', async () => {
    renderCard()
    await waitFor(() => expect(mockFetchCampaignCharacterImages).toHaveBeenCalledOnce())
    expect(mockFetchCampaignCharacterImages).toHaveBeenCalledWith({
      userId: 'owner1',
      characterId: 'char1',
    })
  })

  it('does NOT call fetchCampaignCharacterImages when char is null (deleted)', async () => {
    renderCard({ detail: DETAIL_NO_CHAR })
    await waitFor(() => expect(screen.getByTestId('linked-char-char2')).toBeDefined())
    // Give a tick for any potential async effects
    await new Promise(r => setTimeout(r, 10))
    expect(mockFetchCampaignCharacterImages).not.toHaveBeenCalled()
  })

  it('does NOT call fetchCampaignCharacterImages when portraitData is already present', async () => {
    const detailWithPortrait: LinkedCharacterDetails = {
      ...DETAIL_WITH_CHAR,
      portraitData: 'data:image/png;base64,abc123',
    }
    renderCard({ detail: detailWithPortrait })
    await waitFor(() => expect(screen.getByTestId('linked-char-char1')).toBeDefined())
    await new Promise(r => setTimeout(r, 10))
    expect(mockFetchCampaignCharacterImages).not.toHaveBeenCalled()
  })

  it('passes isLoading=true to CharCardVisual while images are loading', async () => {
    // Images never resolve — card should render immediately while load is pending
    mockFetchCampaignCharacterImages.mockReturnValue(new Promise(() => { /* pending */ }))
    renderCard()
    // Card is rendered immediately even before images arrive
    expect(screen.getByTestId('linked-char-char1')).toBeDefined()
    expect(screen.getByText('Aragorn')).toBeDefined()
  })

  it('handles image fetch failure gracefully (placeholder remains, no crash)', async () => {
    mockFetchCampaignCharacterImages.mockRejectedValue(new Error('network error'))
    renderCard()
    // Card should still render after failure
    await waitFor(() => expect(screen.getByText('Aragorn')).toBeDefined())
    // No skeleton after failure (imagesLoaded set to true)
    await waitFor(() => expect(screen.queryByTestId('char-card-visual-hp-skeleton')).toBeNull())
  })
})
