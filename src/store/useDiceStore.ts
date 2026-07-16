import { create } from 'zustand'
import type { RollResult, RollMode } from '@/domain/dice'

const HISTORY_CAP = 20

interface CritContext {
  label: string
  damage: string
}

interface CampaignContext {
  campaignTargets: string[]
  actorName: string
}

interface DiceState {
  history: RollResult[]
  lastResult: RollResult | null
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

  campaignTargets: string[]
  actorName: string
  setCampaignContext: (ctx: CampaignContext) => void
  clearCampaignContext: () => void
}

export const useDiceStore = create<DiceState>((set, get) => ({
  history: [],
  lastResult: null,

  addRoll: (result) => {
    const { campaignTargets, actorName } = get()
    if (campaignTargets.length > 0) {
      // fire-and-forget: import lazily to avoid circular dep at module load time
      void import('@/services/campaign-dice-log').then(({ logRoll }) =>
        logRoll(campaignTargets, actorName, result).catch(err => {
          console.error('[dice-store] logRoll failed', err)
        })
      )
    }
    set((state) => ({
      history: [result, ...state.history].slice(0, HISTORY_CAP),
      lastResult: result,
    }))
  },

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

  campaignTargets: [],
  actorName: '',
  setCampaignContext: ({ campaignTargets, actorName }) =>
    set({ campaignTargets, actorName }),
  clearCampaignContext: () => set({ campaignTargets: [], actorName: '' }),
}))
