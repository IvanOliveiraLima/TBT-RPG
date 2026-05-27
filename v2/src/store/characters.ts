import { create } from 'zustand'
import { listCharacters, saveCharacter } from '@/data/db'
import { deleteCharacterService } from '@/services/delete-character'
import type { Character } from '@/domain/character'

const SAVE_DEBOUNCE_MS = 800

/** Map of character id → pending save timer handle */
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()

interface CharactersState {
  characters: Character[]
  loading:    boolean
  error:      string | null
  fetchCharacters: () => Promise<void>
  /**
   * Persist a new character to IndexedDB immediately and add it to the store.
   * Used by character creation flows (manual and AI-generated).
   */
  addCharacter: (character: Character) => Promise<void>
  /**
   * Delete a character by id — removes from IndexedDB and local array.
   * Best-effort Supabase + Storage delete if user is logged in.
   * Throws DeleteCharacterError if the local delete fails.
   */
  deleteCharacter: (id: string) => Promise<void>
  /**
   * Apply a partial update to a character in the store.
   * Optimistically updates local state immediately, then debounces
   * the IndexedDB write by 800ms. Coalesces rapid updates.
   */
  updateCharacter: (id: string, partial: Partial<Character>) => Promise<void>
  /**
   * Flush all pending debounced saves to IndexedDB immediately.
   * Call before page unload or cross-version validation.
   */
  flushPendingSaves: () => Promise<void>
}

export const useCharactersStore = create<CharactersState>((set, get) => ({
  characters: [],
  loading:    false,
  error:      null,

  addCharacter: async (character) => {
    await saveCharacter(character)
    set(state => ({ characters: [...state.characters, character] }))
  },

  deleteCharacter: async (id) => {
    await deleteCharacterService(id)
    set(state => ({ characters: state.characters.filter(c => c.id !== id) }))
  },

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

  updateCharacter: async (id, partial) => {
    const current = get().characters.find(c => c.id === id)
    if (!current) return

    const updated: Character = { ...current, ...partial }

    // Optimistic local update
    set(state => ({
      characters: state.characters.map(c => c.id === id ? updated : c),
    }))

    // Debounced save — cancel previous timer if any, start a new one
    const existing = saveTimers.get(id)
    if (existing !== undefined) clearTimeout(existing)

    const timer = setTimeout(async () => {
      saveTimers.delete(id)
      try {
        await saveCharacter(updated)
      } catch (err) {
        console.error('[characters] Failed to persist character', id, err)
      }
    }, SAVE_DEBOUNCE_MS)
    saveTimers.set(id, timer)
  },

  flushPendingSaves: async () => {
    // Cancel all pending timers and save current state immediately
    const ids = [...saveTimers.keys()]
    for (const id of ids) {
      const timer = saveTimers.get(id)
      if (timer !== undefined) clearTimeout(timer)
      saveTimers.delete(id)
    }

    const { characters } = get()
    const toSave = characters.filter(c => ids.includes(c.id))
    await Promise.all(toSave.map(c => saveCharacter(c)))
  },
}))
