import { create } from 'zustand'
import type { Character } from '@/domain/character'

interface CharacterState {
  character: Character | null
  loading: boolean
  error: string | null

  loadCharacter: (id: string) => Promise<void>
  clearCharacter: () => void
}

export const useCharacterStore = create<CharacterState>((set) => ({
  character: null,
  loading: false,
  error: null,

  loadCharacter: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { getCharacter } = await import('@/data/db')
      const character = await getCharacter(id)
      if (!character) {
        set({ character: null, loading: false, error: 'Personagem não encontrado' })
        return
      }
      set({ character, loading: false, error: null })
    } catch (err) {
      console.error('[characterStore] loadCharacter failed:', err)
      set({ character: null, loading: false, error: 'Erro ao carregar personagem' })
    }
  },

  clearCharacter: () => set({ character: null, loading: false, error: null }),
}))
