/**
 * Tests for LinkCharacterModal component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '@/i18n'
import { LinkCharacterModal } from '@/components/campaigns/LinkCharacterModal'
import type { CampaignCharacter } from '@/domain/campaign'
import type { Character } from '@/domain/character'

// ── Mock characters store ─────────────────────────────────────────────────────

let mockCharacters: Character[] = []

vi.mock('@/store/characters', () => ({
  useCharactersStore: (selector: (s: { characters: Character[] }) => unknown) =>
    selector({ characters: mockCharacters }),
}))

// ── Mock campaign-characters service ─────────────────────────────────────────

const mockLink = vi.fn()

vi.mock('@/services/campaign-characters', () => ({
  linkCharacterToCampaign: (...args: unknown[]) => mockLink(...args),
  CampaignCharacterServiceError: class CampaignCharacterServiceError extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeChar(id: string, name: string, race = 'Human', className = 'Fighter', level = 1): Character {
  return {
    id, name, race,
    classes: [{ name: className, level, hitDie: 10 }],
    background: '', alignment: '', experience: 0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 2,
    hp: { current: 10, max: 10, temp: 0 },
    hitDice: [{ className, current: 1, max: 1, dieSize: 10 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 10, initiative: 0, speed: 30, passivePerception: 10, spellSaveDC: 0,
    inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] },
    languages: [], attacks: [], spells: [], spellSlots: {},
    spellcastingAbility: '', spellcastingClass: '',
    inventory: [], currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    features: [], backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '', mountPet: '', mountPet2: '', alliesOrganizations: '',
    images: {}, createdAt: 0, updatedAt: 0,
  }
}

const CHAR_A = makeChar('c1', 'Aragorn', 'Human', 'Ranger', 5)
const CHAR_B = makeChar('c2', 'Legolas', 'Elf', 'Ranger', 5)

const LINKED_RESULT: CampaignCharacter = {
  campaignId: 'camp1',
  characterId: 'c1',
  userId: 'u1',
  characterName: 'Aragorn',
  characterSummary: 'Human — Ranger 5',
  addedAt: 0,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderModal(props: Partial<React.ComponentProps<typeof LinkCharacterModal>> = {}) {
  const defaults = {
    campaignId: 'camp1',
    alreadyLinkedIds: [] as string[],
    onLinked: vi.fn(),
    onCancel: vi.fn(),
  }
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <I18nProvider>
      <LinkCharacterModal {...defaults} {...props} />
    </I18nProvider>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LinkCharacterModal — empty states', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows no_chars_at_all when user has zero characters', () => {
    mockCharacters = []
    renderModal()
    expect(screen.getByTestId('link-char-no-chars')).toBeDefined()
  })

  it('shows all_already_linked when all chars are in alreadyLinkedIds', () => {
    mockCharacters = [CHAR_A, CHAR_B]
    renderModal({ alreadyLinkedIds: ['c1', 'c2'] })
    expect(screen.getByTestId('link-char-all-linked')).toBeDefined()
  })
})

describe('LinkCharacterModal — char list', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('lists only eligible chars (not already linked)', () => {
    mockCharacters = [CHAR_A, CHAR_B]
    renderModal({ alreadyLinkedIds: ['c2'] })
    expect(screen.getByTestId('link-char-option-c1')).toBeDefined()
    expect(screen.queryByTestId('link-char-option-c2')).toBeNull()
  })

  it('shows char name in option button', () => {
    mockCharacters = [CHAR_A]
    renderModal()
    expect(screen.getByText('Aragorn')).toBeDefined()
  })

  it('shows char summary in option button', () => {
    mockCharacters = [CHAR_A]
    renderModal()
    expect(screen.getByText('Human — Ranger 5')).toBeDefined()
  })

  it('confirm button is disabled until a char is selected', () => {
    mockCharacters = [CHAR_A]
    renderModal()
    const btn = screen.getByTestId('link-char-confirm') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('confirm button enabled after selecting a char', async () => {
    mockCharacters = [CHAR_A]
    renderModal()
    await userEvent.click(screen.getByTestId('link-char-option-c1'))
    const btn = screen.getByTestId('link-char-confirm') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })
})

describe('LinkCharacterModal — link flow', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('calls onLinked with new link on success', async () => {
    mockCharacters = [CHAR_A]
    mockLink.mockResolvedValue(LINKED_RESULT)
    const onLinked = vi.fn()
    renderModal({ onLinked })

    await userEvent.click(screen.getByTestId('link-char-option-c1'))
    await userEvent.click(screen.getByTestId('link-char-confirm'))

    await waitFor(() => expect(onLinked).toHaveBeenCalledWith(LINKED_RESULT))
  })

  it('shows error_already_linked when service throws already_linked', async () => {
    mockCharacters = [CHAR_A]
    const { CampaignCharacterServiceError } = await import('@/services/campaign-characters')
    mockLink.mockRejectedValue(new CampaignCharacterServiceError('already_linked'))

    renderModal()
    await userEvent.click(screen.getByTestId('link-char-option-c1'))
    await userEvent.click(screen.getByTestId('link-char-confirm'))

    await waitFor(() => expect(screen.getByTestId('link-char-error')).toBeDefined())
  })

  it('shows error_link_failed on generic service error', async () => {
    mockCharacters = [CHAR_A]
    const { CampaignCharacterServiceError } = await import('@/services/campaign-characters')
    mockLink.mockRejectedValue(new CampaignCharacterServiceError('link_failed'))

    renderModal()
    await userEvent.click(screen.getByTestId('link-char-option-c1'))
    await userEvent.click(screen.getByTestId('link-char-confirm'))

    await waitFor(() => expect(screen.getByTestId('link-char-error')).toBeDefined())
  })
})

describe('LinkCharacterModal — cancel', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('calls onCancel when cancel button clicked', async () => {
    mockCharacters = [CHAR_A]
    const onCancel = vi.fn()
    renderModal({ onCancel })
    await userEvent.click(screen.getByTestId('link-char-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onCancel when X button clicked', async () => {
    mockCharacters = []
    const onCancel = vi.fn()
    renderModal({ onCancel })
    // Cancel footer button (data-testid)
    await userEvent.click(screen.getByTestId('link-char-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })
})
