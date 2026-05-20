import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must be before the store import so the dynamic import is intercepted
vi.mock('@/data/db', () => ({
  getCharacter: vi.fn(),
  listCharacters: vi.fn().mockResolvedValue([]),
  saveCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
}))

import { useCharacterStore } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { getCharacter } from '@/data/db'
import type { Character } from '@/domain/character'

const MOCK_CHARACTER: Character = {
  id: 'char_test_1',
  name: 'Grimbold Ironfist',
  race: 'Anão',
  background: 'Outlander',
  alignment: 'Leal e Bom',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 18, dex: 10, con: 16, int: 8, wis: 12, cha: 6 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 17, initiative: 0, speed: 25,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('useCharacterStore', () => {
  beforeEach(() => {
    useCharacterStore.setState({ activeId: null, loading: false, error: null })
    useCharactersStore.setState({ characters: [], loading: false, error: null })
    vi.clearAllMocks()
  })

  it('has null activeId and no error in initial state', () => {
    const { activeId, loading, error } = useCharacterStore.getState()
    expect(activeId).toBeNull()
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })

  it('clearCharacter resets activeId, loading, and error', () => {
    useCharactersStore.setState({ characters: [MOCK_CHARACTER], loading: false, error: null })
    useCharacterStore.setState({ activeId: MOCK_CHARACTER.id, loading: false, error: 'old error' })
    useCharacterStore.getState().clearCharacter()
    const { activeId, loading, error } = useCharacterStore.getState()
    expect(activeId).toBeNull()
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })

  it('loadCharacter resolves with a character and sets activeId in state and character in characters list', async () => {
    vi.mocked(getCharacter).mockResolvedValueOnce(MOCK_CHARACTER)

    await useCharacterStore.getState().loadCharacter('char_test_1')

    const { activeId, loading, error } = useCharacterStore.getState()
    expect(activeId).toBe('char_test_1')
    expect(loading).toBe(false)
    expect(error).toBeNull()

    const charInStore = useCharactersStore.getState().characters.find(c => c.id === 'char_test_1')
    expect(charInStore).toEqual(MOCK_CHARACTER)
  })

  it('loadCharacter sets error when getCharacter returns null (not found)', async () => {
    vi.mocked(getCharacter).mockResolvedValueOnce(null)

    await useCharacterStore.getState().loadCharacter('nonexistent_id')

    const { activeId, error } = useCharacterStore.getState()
    expect(activeId).toBeNull()
    expect(error).toBe('Personagem não encontrado')
  })

  it('loadCharacter sets error message when getCharacter throws', async () => {
    vi.mocked(getCharacter).mockRejectedValueOnce(new Error('IDB error'))

    await useCharacterStore.getState().loadCharacter('char_test_1')

    const { activeId, error } = useCharacterStore.getState()
    expect(activeId).toBeNull()
    expect(error).toBe('Erro ao carregar personagem')
  })

  it('loadCharacter sets loading=true during fetch and false after', async () => {
    let loadingDuring = false
    vi.mocked(getCharacter).mockImplementationOnce(async () => {
      loadingDuring = useCharacterStore.getState().loading
      return MOCK_CHARACTER
    })

    await useCharacterStore.getState().loadCharacter('char_test_1')

    expect(loadingDuring).toBe(true)
    expect(useCharacterStore.getState().loading).toBe(false)
  })
})
