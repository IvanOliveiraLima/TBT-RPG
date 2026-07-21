import { create } from 'zustand'
import type { Character } from '@/domain/character'

export interface ConflictEntry {
  local: Character
  cloud: { data: Character; updatedAt: number }
}

interface SyncConflictState {
  conflicts: Record<string, ConflictEntry>
  addConflict:    (entry: ConflictEntry) => void
  removeConflict: (id: string) => void
  clear:          () => void
  hasConflict:    (id: string) => boolean
}

export const useSyncConflictStore = create<SyncConflictState>((set, get) => ({
  conflicts: {},

  addConflict: (entry) =>
    set(state => ({ conflicts: { ...state.conflicts, [entry.local.id]: entry } })),

  removeConflict: (id) =>
    set(state => {
      const { [id]: _removed, ...rest } = state.conflicts
      return { conflicts: rest }
    }),

  clear: () => set({ conflicts: {} }),

  hasConflict: (id) => id in get().conflicts,
}))
