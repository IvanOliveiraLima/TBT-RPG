import { create } from 'zustand'
import type { RollResult, RollMode } from '@/domain/dice'

const HISTORY_CAP = 20

interface CritContext {
  label: string
  damage: string
}

interface DiceState {
  history: RollResult[]
  addRoll: (result: RollResult) => void
  clear: () => void

  rollMode: RollMode
  setRollMode: (m: RollMode) => void

  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void

  critContext: CritContext | null
  setCritContext: (c: CritContext) => void
  clearCritContext: () => void
}

export const useDiceStore = create<DiceState>((set) => ({
  history: [],

  addRoll: (result) =>
    set((state) => ({
      history: [result, ...state.history].slice(0, HISTORY_CAP),
    })),

  clear: () => set({ history: [] }),

  rollMode: 'normal',
  setRollMode: (m) => set({ rollMode: m }),

  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  critContext: null,
  setCritContext: (c) => set({ critContext: c }),
  clearCritContext: () => set({ critContext: null }),
}))
