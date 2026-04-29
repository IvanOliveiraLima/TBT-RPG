import { create } from 'zustand'
import { listCharacters } from '@/data/db'
import type { Character } from '@/domain/character'

interface CharactersState {
  characters: Character[]
  loading:    boolean
  error:      string | null
  fetchCharacters: () => Promise<void>
}

export const useCharactersStore = create<CharactersState>((set) => ({
  characters: [],
  loading:    false,
  error:      null,

  fetchCharacters: async () => {
    set({ loading: true, error: null })
    try {
      const characters = await listCharacters()
      set({ characters, loading: false })
    } catch (err) {
      set({
        error:   err instanceof Error ? err.message : 'Failed to load characters',
        loading: false,
      })
    }
  },
}))
