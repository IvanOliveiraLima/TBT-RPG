import { create } from 'zustand'
import type { Character } from '@/domain/character'
import { useCharactersStore } from './characters'

interface CharacterState {
  /** ID of the character currently open in the sheet. */
  activeId: string | null
  loading: boolean
  error: string | null

  loadCharacter: (id: string) => Promise<void>
  clearCharacter: () => void
}

export const useCharacterStore = create<CharacterState>(() => ({
  activeId: null,
  loading: false,
  error: null,

  loadCharacter: async (id: string) => {
    useCharacterStore.setState({ activeId: id, loading: true, error: null })

    // If the character is already in the characters list, activate it immediately.
    const existing = useCharactersStore.getState().characters.find(c => c.id === id)
    if (existing) {
      useCharacterStore.setState({ loading: false })
      return
    }

    try {
      const { getCharacter } = await import('@/data/db')
      const character = await getCharacter(id)
      if (!character) {
        useCharacterStore.setState({ activeId: null, loading: false, error: 'Personagem não encontrado' })
        return
      }
      // Insert into the characters list so updateCharacter can find and persist it.
      useCharactersStore.setState(state => ({
        characters: [...state.characters, character],
      }))
      useCharacterStore.setState({ loading: false, error: null })
    } catch (err) {
      console.error('[characterStore] loadCharacter failed:', err)
      useCharacterStore.setState({ activeId: null, loading: false, error: 'Erro ao carregar personagem' })
    }
  },

  clearCharacter: () =>
    useCharacterStore.setState({ activeId: null, loading: false, error: null }),
}))

/**
 * Derives the active character from the characters list (single source of truth).
 * Any component using this hook will re-render whenever the character is updated
 * via `useCharactersStore.updateCharacter` — no secondary patch needed.
 */
export function useActiveCharacter(): Character | null {
  const activeId = useCharacterStore(s => s.activeId)
  return useCharactersStore(s =>
    activeId ? (s.characters.find(c => c.id === activeId) ?? null) : null
  )
}
