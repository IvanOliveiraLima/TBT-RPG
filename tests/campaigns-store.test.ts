import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock services ─────────────────────────────────────────────────────────────

const mockCreateCampaign = vi.fn()
const mockListMyCampaigns = vi.fn()
const mockDeleteCampaign = vi.fn()
const mockLeaveCampaign = vi.fn()

vi.mock('@/services/campaign', () => ({
  createCampaign:     (...args: unknown[]) => mockCreateCampaign(...args),
  listMyCampaigns:    (...args: unknown[]) => mockListMyCampaigns(...args),
  deleteCampaign:     (...args: unknown[]) => mockDeleteCampaign(...args),
  leaveCampaign:      (...args: unknown[]) => mockLeaveCampaign(...args),
  CampaignServiceError: class CampaignServiceError extends Error {
    constructor(public code: string) { super(code) }
  },
}))

import { useCampaignsStore } from '@/store/campaigns'
import type { Campaign } from '@/domain/campaign'

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'c1',
    name: 'Test Campaign',
    description: null,
    ownerId: 'u1',
    inviteCode: 'ABCD1234',
    autoInitiative: false,
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  }
}

describe('useCampaignsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useCampaignsStore.setState({ campaigns: [], loading: false, error: null })
  })

  describe('fetchCampaigns', () => {
    it('populates campaigns on success', async () => {
      const camps = [makeCampaign({ id: 'c1' }), makeCampaign({ id: 'c2', name: 'B' })]
      mockListMyCampaigns.mockResolvedValue(camps)

      await useCampaignsStore.getState().fetchCampaigns()

      expect(useCampaignsStore.getState().campaigns).toEqual(camps)
      expect(useCampaignsStore.getState().loading).toBe(false)
      expect(useCampaignsStore.getState().error).toBeNull()
    })

    it('sets loading=true during fetch then false after', async () => {
      let resolveList!: (value: Campaign[]) => void
      mockListMyCampaigns.mockReturnValue(new Promise<Campaign[]>(res => { resolveList = res }))

      const fetchPromise = useCampaignsStore.getState().fetchCampaigns()
      expect(useCampaignsStore.getState().loading).toBe(true)

      resolveList([])
      await fetchPromise
      expect(useCampaignsStore.getState().loading).toBe(false)
    })

    it('sets error on failure', async () => {
      mockListMyCampaigns.mockRejectedValue(new Error('list_failed'))

      await useCampaignsStore.getState().fetchCampaigns()

      expect(useCampaignsStore.getState().error).toBe('list_failed')
      expect(useCampaignsStore.getState().campaigns).toEqual([])
      expect(useCampaignsStore.getState().loading).toBe(false)
    })
  })

  describe('createCampaign', () => {
    it('prepends new campaign to list', async () => {
      const existing = makeCampaign({ id: 'c1' })
      useCampaignsStore.setState({ campaigns: [existing] })

      const newCamp = makeCampaign({ id: 'c2', name: 'New' })
      mockCreateCampaign.mockResolvedValue(newCamp)

      await useCampaignsStore.getState().createCampaign({ name: 'New' })

      const { campaigns } = useCampaignsStore.getState()
      expect(campaigns[0]?.id).toBe('c2')
      expect(campaigns[1]?.id).toBe('c1')
    })

    it('returns the created campaign', async () => {
      const camp = makeCampaign({ id: 'c3', name: 'Returned' })
      mockCreateCampaign.mockResolvedValue(camp)

      const result = await useCampaignsStore.getState().createCampaign({ name: 'Returned' })
      expect(result.id).toBe('c3')
    })

    it('propagates error from service', async () => {
      mockCreateCampaign.mockRejectedValue(new Error('create_failed'))
      await expect(useCampaignsStore.getState().createCampaign({ name: 'Fail' })).rejects.toThrow('create_failed')
    })
  })

  describe('deleteCampaign', () => {
    it('removes campaign from list', async () => {
      useCampaignsStore.setState({ campaigns: [makeCampaign({ id: 'c1' }), makeCampaign({ id: 'c2', name: 'B' })] })
      mockDeleteCampaign.mockResolvedValue(undefined)

      await useCampaignsStore.getState().deleteCampaign('c1')

      const { campaigns } = useCampaignsStore.getState()
      expect(campaigns).toHaveLength(1)
      expect(campaigns[0]?.id).toBe('c2')
    })

    it('propagates error from service', async () => {
      useCampaignsStore.setState({ campaigns: [makeCampaign()] })
      mockDeleteCampaign.mockRejectedValue(new Error('delete_failed'))

      await expect(useCampaignsStore.getState().deleteCampaign('c1')).rejects.toThrow('delete_failed')
      // List unchanged on failure
      expect(useCampaignsStore.getState().campaigns).toHaveLength(1)
    })
  })

  describe('leaveCampaign', () => {
    it('removes campaign from list on success', async () => {
      useCampaignsStore.setState({ campaigns: [makeCampaign({ id: 'c1' }), makeCampaign({ id: 'c2', name: 'B' })] })
      mockLeaveCampaign.mockResolvedValue(undefined)

      await useCampaignsStore.getState().leaveCampaign('c1')

      const { campaigns } = useCampaignsStore.getState()
      expect(campaigns).toHaveLength(1)
      expect(campaigns[0]?.id).toBe('c2')
    })

    it('propagates error from service', async () => {
      useCampaignsStore.setState({ campaigns: [makeCampaign()] })
      mockLeaveCampaign.mockRejectedValue(new Error('leave_failed'))

      await expect(useCampaignsStore.getState().leaveCampaign('c1')).rejects.toThrow('leave_failed')
      expect(useCampaignsStore.getState().campaigns).toHaveLength(1)
    })

    it('calls leaveCampaign service with correct id', async () => {
      useCampaignsStore.setState({ campaigns: [makeCampaign({ id: 'c99' })] })
      mockLeaveCampaign.mockResolvedValue(undefined)

      await useCampaignsStore.getState().leaveCampaign('c99')

      expect(mockLeaveCampaign).toHaveBeenCalledWith('c99')
    })
  })
})
