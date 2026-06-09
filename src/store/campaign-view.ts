import { create } from 'zustand'
import type { Character } from '@/domain/character'
import {
  fetchCampaignCharacter,
  fetchCampaignCharacterImages,
  CampaignViewError,
} from '@/services/campaign-view'

const DEFAULT_POLL_MS = 15_000

// Polling state lives outside Zustand to avoid re-renders on timer ID changes.
let pollingTimer: ReturnType<typeof window.setInterval> | null = null
let pollingContext: { campaignId: string; characterId: string } | null = null

interface CampaignViewState {
  character: Character | null
  loading: boolean
  error: string | null
  lastFetchedAt: number | null

  loadCharacter: (campaignId: string, characterId: string) => Promise<void>
  startPolling: (campaignId: string, characterId: string, intervalMs?: number) => void
  stopPolling: () => void
  clear: () => void
}

function mergeImages(
  char: Character,
  images: { portraitData: string | null; symbolData: string | null },
): Character {
  return {
    ...char,
    ...(images.portraitData ? { images: { ...char.images, character: images.portraitData } } : {}),
    ...(images.symbolData ? { symbolImage: images.symbolData } : {}),
  }
}

export const useCampaignViewStore = create<CampaignViewState>((set, get) => ({
  character: null,
  loading: false,
  error: null,
  lastFetchedAt: null,

  loadCharacter: async (campaignId, characterId) => {
    set({ loading: true, error: null })
    try {
      const result = await fetchCampaignCharacter({ campaignId, characterId })
      if (!result) {
        set({ loading: false, error: 'char_not_found', character: null })
        return
      }
      const images = await fetchCampaignCharacterImages({
        userId: result.ownerId,
        characterId: result.char.id,
      })
      set({
        character: mergeImages(result.char, images),
        loading: false,
        error: null,
        lastFetchedAt: Date.now(),
      })
    } catch (err) {
      const code = err instanceof CampaignViewError ? err.code : 'unknown'
      set({ loading: false, error: code, character: null })
    }
  },

  startPolling: (campaignId, characterId, intervalMs = DEFAULT_POLL_MS) => {
    get().stopPolling()
    pollingContext = { campaignId, characterId }

    pollingTimer = window.setInterval(async () => {
      if (!pollingContext) return
      try {
        const result = await fetchCampaignCharacter({
          campaignId: pollingContext.campaignId,
          characterId: pollingContext.characterId,
        })
        if (!result) {
          set({ error: 'char_not_found', character: null })
          get().stopPolling()
          return
        }
        const current = get().character
        // Only update when char has been modified
        if (!current || result.char.updatedAt > current.updatedAt) {
          const images = await fetchCampaignCharacterImages({
            userId: result.ownerId,
            characterId: result.char.id,
          })
          set({
            character: mergeImages(result.char, images),
            lastFetchedAt: Date.now(),
          })
        }
      } catch {
        // Silent — next poll retries
      }
    }, intervalMs)
  },

  stopPolling: () => {
    if (pollingTimer !== null) {
      window.clearInterval(pollingTimer)
      pollingTimer = null
    }
    pollingContext = null
  },

  clear: () => {
    get().stopPolling()
    set({ character: null, loading: false, error: null, lastFetchedAt: null })
  },
}))
