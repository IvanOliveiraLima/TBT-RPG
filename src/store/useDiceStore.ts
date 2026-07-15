import { create } from 'zustand'
import type { RollResult } from '@/domain/dice'

const HISTORY_CAP = 20

interface DiceState {
  history: RollResult[]
  addRoll: (result: RollResult) => void
  clear: () => void
}

export const useDiceStore = create<DiceState>((set) => ({
  history: [],

  addRoll: (result) =>
    set((state) => ({
      history: [result, ...state.history].slice(0, HISTORY_CAP),
    })),

  clear: () => set({ history: [] }),
}))
