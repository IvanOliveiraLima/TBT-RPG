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
const mockAddCharacter    = vi.fn().mockResolvedValue(undefined)
const mockFetchCharacters = vi.fn().mockResolvedValue(undefined)

vi.mock('@/store/characters', () => ({
  useCharactersStore: () => ({
    characters:       [],
    loading:          false,
    error:            null,
    fetchCharacters:  mockFetchCharacters,
    addCharacter:     mockAddCharacter,
    updateCharacter:  vi.fn(),
    flushPendingSaves: vi.fn(),
  }),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ user: null, loading: false, signOut: vi.fn() }),
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
