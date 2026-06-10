import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import CharSelect from '@/pages/CharSelect'

// ── mock react-router-dom navigate ────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── mock store ────────────────────────────────────────────────────────────────
const mockAddCharacter      = vi.fn().mockResolvedValue(undefined)
const mockFetchCharacters   = vi.fn().mockResolvedValue(undefined)
const mockDeleteCharacter   = vi.fn().mockResolvedValue(undefined)

vi.mock('@/store/characters', () => ({
  useCharactersStore: () => ({
    characters:        mockCharacters,
    loading:           false,
    error:             null,
    fetchCharacters:   mockFetchCharacters,
    addCharacter:      mockAddCharacter,
    deleteCharacter:   mockDeleteCharacter,
    updateCharacter:   vi.fn(),
    flushPendingSaves: vi.fn(),
  }),
}))

// Characters list — tests that need characters can override this
let mockCharacters: unknown[] = []

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector?: (s: { user: null; loading: boolean; signOut: () => void }) => unknown) => {
    const state = { user: null, loading: false, signOut: vi.fn() }
    return selector ? selector(state) : state
  },
}))

// ── mock campaigns store ───────────────────────────────────────────────────────
const mockFetchCampaigns = vi.fn().mockResolvedValue(undefined)
vi.mock('@/store/campaigns', () => ({
  useCampaignsStore: (selector?: (s: { campaigns: unknown[]; loading: boolean; fetchCampaigns: () => Promise<void> }) => unknown) => {
    const state = { campaigns: [], loading: false, error: null, fetchCampaigns: mockFetchCampaigns, createCampaign: vi.fn(), deleteCampaign: vi.fn() }
    return selector ? selector(state) : state
  },
}))

// ── mock user-profile service ─────────────────────────────────────────────────
vi.mock('@/services/user-profile', () => ({
  getMyProfile: vi.fn().mockResolvedValue(null),
  upsertMyProfile: vi.fn(),
}))

// ── mock campaign modals ──────────────────────────────────────────────────────
vi.mock('@/components/campaigns/ProfileSetupModal', () => ({
  ProfileSetupModal: ({ onCancel }: { onComplete: () => void; onCancel: () => void }) => (
    <div data-testid="profile-setup-modal-stub">
      <button data-testid="profile-setup-cancel-stub" onClick={onCancel}>Cancel</button>
    </div>
  ),
}))
vi.mock('@/components/campaigns/CreateCampaignModal', () => ({
  CreateCampaignModal: ({ onCancel }: { onCreated: (c: unknown) => void; onCancel: () => void }) => (
    <div data-testid="create-campaign-modal-stub">
      <button data-testid="create-campaign-cancel-stub" onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

// ── mock AI modal so we don't pull in service fetch ───────────────────────────
vi.mock('@/components/AIGenerationModal', () => ({
  AIGenerationModal: ({ onClose, onCharacterGenerated }: {
    onClose: () => void
    onCharacterGenerated: (c: unknown) => void
  }) => (
    <div data-testid="ai-modal">
      <button data-testid="ai-modal-close" onClick={onClose}>Close</button>
      <button
        data-testid="ai-modal-submit"
        onClick={() => onCharacterGenerated({
          id: 'gen_01', name: 'Generated', classes: [{ name: 'Wizard', level: 1, hitDie: 6 }],
          abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 },
          hp: { current: 6, max: 6, temp: 0 },
          proficiencyBonus: 2, savingThrows: [], skills: [], hitDice: [],
          deathSaves: { successes: 0, failures: 0 },
          ac: 10, initiative: 0, speed: 30, passivePerception: 10,
          spellSaveDC: 0, inspiration: false,
          proficiencies: { weapons: [], armor: [], tools: [], other: [] },
          languages: [], attacks: [], spells: [], spellSlots: {},
          spellcastingAbility: '', spellcastingClass: '',
          inventory: [], currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
          features: [], backstory: '', personality: { traits: '', ideals: '', bonds: '', flaws: '' },
          notes1: '', notes2: '', mountPet: '', mountPet2: '', alliesOrganizations: '',
          images: {}, race: 'Human', background: 'Sage', alignment: 'Neutral',
          experience: 0, age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
          createdAt: 0, updatedAt: 0,
        })}
      >
        Submit
      </button>
    </div>
  ),
}))

// ── helpers ────────────────────────────────────────────────────────────────────

function render(lang: 'pt' | 'en' = 'pt') {
  return renderWithI18n(<CharSelect />, lang)
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('CharSelect — create buttons', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockAddCharacter.mockClear()
    mockDeleteCharacter.mockClear()
    mockFetchCampaigns.mockClear()
    mockCharacters = []
    localStorage.clear()
  })

  it('renders "Create from scratch" button', () => {
    render('en')
    expect(screen.getByTestId('create-from-scratch')).toBeDefined()
  })

  it('renders "Create with AI" button', () => {
    render('en')
    expect(screen.getByTestId('create-with-ai')).toBeDefined()
  })

  it('"Create from scratch" shows PT label', () => {
    render('pt')
    expect(screen.getByText('Criar do zero')).toBeDefined()
  })

  it('"Create with AI" shows PT label', () => {
    render('pt')
    expect(screen.getByText('Criar com IA')).toBeDefined()
  })

  it('"Create from scratch" shows EN label', () => {
    render('en')
    expect(screen.getByText('Create from scratch')).toBeDefined()
  })

  it('"Create with AI" shows EN label', () => {
    render('en')
    expect(screen.getByText('Create with AI')).toBeDefined()
  })

  it('clicking "Create from scratch" calls addCharacter and navigates', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('create-from-scratch'))
    await waitFor(() => expect(mockAddCharacter).toHaveBeenCalledOnce())
    const savedChar = mockAddCharacter.mock.calls[0]![0]
    expect(savedChar.classes[0].name).toBeTruthy()  // non-empty class name invariant
    expect(savedChar.abilities.str).toBe(10)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/character/')
    ))
  })

  it('clicking "Create with AI" opens the AI modal', async () => {
    render('pt')
    expect(screen.queryByTestId('ai-modal')).toBeNull()
    fireEvent.click(screen.getByTestId('create-with-ai'))
    expect(screen.getByTestId('ai-modal')).toBeDefined()
  })

  it('closing the AI modal hides it', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('create-with-ai'))
    fireEvent.click(screen.getByTestId('ai-modal-close'))
    expect(screen.queryByTestId('ai-modal')).toBeNull()
  })

  it('submitting generated char calls addCharacter and navigates', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('create-with-ai'))
    fireEvent.click(screen.getByTestId('ai-modal-submit'))
    await waitFor(() => expect(mockAddCharacter).toHaveBeenCalledOnce())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/character/gen_01'))
  })
})

describe('CharSelect — sidebar AI button removed', () => {
  it('does not render the old Generate with AI button in the character list screen', () => {
    render('pt')
    // The stub alert button should be gone — both PT and EN labels
    expect(screen.queryByText('Gerar com IA')).toBeNull()
    expect(screen.queryByText('Generate with AI')).toBeNull()
  })
})

// ── Delete flow integration ───────────────────────────────────────────────────

const STUB_CHAR = {
  id: 'char_001', name: 'Eira', race: 'Wood Elf',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  hp: { current: 38, max: 38, temp: 0 },
  images: {},
}

describe('CharSelect — delete flow integration', () => {
  beforeEach(() => {
    mockDeleteCharacter.mockClear()
    mockCharacters = [STUB_CHAR]
  })

  it('renders the kebab menu trigger on each character card', () => {
    render('pt')
    expect(screen.getByTestId('character-card-menu-trigger')).toBeDefined()
  })

  it('opens confirm modal when Delete is clicked in the menu', async () => {
    render('pt')
    // Open menu
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    // Click delete option
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    expect(screen.getByTestId('confirm-delete-modal')).toBeDefined()
  })

  it('does NOT open the confirm modal until delete is clicked', () => {
    render('pt')
    expect(screen.queryByTestId('confirm-delete-modal')).toBeNull()
  })

  it('calls deleteCharacter store action after confirming', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    fireEvent.click(screen.getByTestId('delete-modal-confirm'))
    await waitFor(() => expect(mockDeleteCharacter).toHaveBeenCalledWith('char_001'))
  })

  it('modal closes after successful delete', async () => {
    render('pt')
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    fireEvent.click(screen.getByTestId('delete-modal-confirm'))
    await waitFor(() => expect(screen.queryByTestId('confirm-delete-modal')).toBeNull())
  })

  it('modal closes when Cancel is clicked', () => {
    render('pt')
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    fireEvent.click(screen.getByTestId('delete-modal-cancel'))
    expect(screen.queryByTestId('confirm-delete-modal')).toBeNull()
  })

  it('shows character name in confirm modal warning', () => {
    render('pt')
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    // The warning paragraph contains the name — /Eira/ matches both card and modal text,
    // so check for the full warning pattern instead
    expect(screen.getByText(/excluir "Eira"/i)).toBeDefined()
  })
})
