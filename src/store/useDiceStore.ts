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
  characterId?: string
  isMaster?: boolean
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
  characterId: string
  isMaster: boolean
  secretMode: boolean
  toggleSecretMode: () => void
  setSecretMode: (v: boolean) => void
  setCampaignContext: (ctx: CampaignContext) => void
  clearCampaignContext: () => void
}

export const useDiceStore = create<DiceState>((set, get) => ({
  history: [],
  lastResult: null,

  addRoll: (result) => {
    const { campaignTargets, actorName, characterId, secretMode } = get()
    if (!secretMode && campaignTargets.length > 0) {
      // fire-and-forget: import lazily to avoid circular dep at module load time
      void import('@/services/campaign-dice-log').then(({ logRoll }) =>
        logRoll(campaignTargets, actorName, result).catch(err => {
          console.error('[dice-store] logRoll failed', err)
        })
      )
      if (result.kind === 'initiative' && characterId) {
        void import('@/services/campaign-initiative').then(({ registerInitiative }) =>
          registerInitiative(campaignTargets, characterId, result.total, actorName).catch(err => {
            console.error('[dice-store] registerInitiative failed', err)
          })
        )
      }
    }
    const stored = secretMode ? { ...result, secret: true as const } : result
    set((state) => ({
      history: [stored, ...state.history].slice(0, HISTORY_CAP),
      lastResult: stored,
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
  characterId: '',
  isMaster: false,
  secretMode: false,
  toggleSecretMode: () => set((state) => ({ secretMode: !state.secretMode })),
  setSecretMode: (v) => set({ secretMode: v }),
  setCampaignContext: ({ campaignTargets, actorName, characterId, isMaster }) =>
    set({ campaignTargets, actorName, characterId: characterId ?? '', isMaster: isMaster ?? false }),
  clearCampaignContext: () => set({ campaignTargets: [], actorName: '', characterId: '', isMaster: false, secretMode: false }),
}))
