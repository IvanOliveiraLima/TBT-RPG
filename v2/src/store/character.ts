import { create } from 'zustand'
import type { Character } from '@/domain/character'

interface CharacterState {
  character: Character | null
  loading: boolean
  error: string | null

  loadCharacter:   (id: string) => Promise<void>
  updateCharacter: (id: string, partial: Partial<Character>) => Promise<void>
  clearCharacter:  () => void
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
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

  /**
   * Applies a partial update to the current character.
   *
   * Steps:
   *  1. Optimistically update in-memory state (instant UI feedback).
   *  2. Fetch raw V1Character from IndexedDB (v2 wins over v1).
   *  3. Serialize domain → V1Character, preserving unmapped fields.
   *  4. Schedule debounced save (800ms) to IndexedDB v2.
   *
   * Error handling: failures are logged; the in-memory state is already
   * updated regardless. UI error feedback is deferred to Phase C.1.b.
   */
  updateCharacter: async (id: string, partial: Partial<Character>) => {
    const current = get().character
    if (!current || current.id !== id) return

    const updated: Character = {
      ...current,
      ...partial,
      updatedAt: Date.now(),
    }

    // Optimistic update — instant UI
    set({ character: updated })

    try {
      const { getRawCharacter } = await import('@/data/db')
      const { serializeCharacter } = await import('@/data/serializer')
      const { scheduleSave } = await import('@/lib/save-debounce')

      let raw = await getRawCharacter(id)

      // If character only exists in v1, copy it to v2 DB before first edit
      if (!raw) {
        const { copyFromV1 } = await import('@/data/db')
        await copyFromV1(id)
        raw = await getRawCharacter(id)
      }

      if (!raw) {
        console.error('[updateCharacter] Cannot find raw data for id:', id)
        return
      }

      const v1Data = serializeCharacter(updated, raw)
      scheduleSave(id, v1Data)
    } catch (err) {
      console.error('[updateCharacter] Failed to schedule save for:', id, err)
    }
  },

  clearCharacter: () => set({ character: null, loading: false, error: null }),
}))
