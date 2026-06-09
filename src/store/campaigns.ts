import { create } from 'zustand'
import type { Campaign } from '@/domain/campaign'
import {
  createCampaign as createCampaignService,
  listMyCampaigns,
  deleteCampaign as deleteCampaignService,
  leaveCampaign as leaveCampaignService,
} from '@/services/campaign'

interface CampaignsState {
  campaigns: Campaign[]
  loading: boolean
  error: string | null

  fetchCampaigns: () => Promise<void>
  createCampaign: (input: { name: string; description?: string }) => Promise<Campaign>
  deleteCampaign: (id: string) => Promise<void>
  leaveCampaign: (id: string) => Promise<void>
}

export const useCampaignsStore = create<CampaignsState>((set) => ({
  campaigns: [],
  loading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ loading: true, error: null })
    try {
      const campaigns = await listMyCampaigns()
      set({ campaigns, loading: false })
    } catch (err) {
      set({ loading: false, error: (err as Error).message })
    }
  },

  createCampaign: async (input) => {
    const created = await createCampaignService(input)
    set((s) => ({ campaigns: [created, ...s.campaigns] }))
    return created
  },

  deleteCampaign: async (id) => {
    await deleteCampaignService(id)
    set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }))
  },

  leaveCampaign: async (id) => {
    await leaveCampaignService(id)
    set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }))
  },
}))
