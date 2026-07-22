import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false
let mockSession: { user: { id: string } } | null = null

const mockFrom = vi.fn()
const mockStorageList = vi.fn()
const mockStorageRemove = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockClient = {
  auth: {
    getSession: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: { session: mockSession } })
    ),
  },
  from: (...args: unknown[]) => mockFrom(...args),
  storage: {
    from: (_bucket: string) => ({
      list: (prefix: string) => mockStorageList(prefix),
      remove: (paths: string[]) => mockStorageRemove(paths),
    }),
  },
}

// ── helpers ───────────────────────────────────────────────────────────────────

function setupAuth(userId = 'user_001') {
  mockSupabaseConfigured = true
  mockSession = { user: { id: userId } }
  mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } })
}

function resetAuth() {
  mockSupabaseConfigured = false
  mockSession = null
}

// build a chainable supabase mock for .from().select().order() etc.
function makeChain(returnValue: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'maybeSingle', 'single']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  // terminal: make last call return the value
  ;(chain['single'] as ReturnType<typeof vi.fn>).mockResolvedValue(returnValue)
  ;(chain['maybeSingle'] as ReturnType<typeof vi.fn>).mockResolvedValue(returnValue)
  ;(chain['order'] as ReturnType<typeof vi.fn>).mockResolvedValue(returnValue)
  ;(chain['eq'] as ReturnType<typeof vi.fn>).mockReturnValue({
    ...chain,
    maybeSingle: vi.fn().mockResolvedValue(returnValue),
    single: vi.fn().mockResolvedValue(returnValue),
    delete: vi.fn().mockResolvedValue(returnValue),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(returnValue),
        single: vi.fn().mockResolvedValue(returnValue),
      }),
      maybeSingle: vi.fn().mockResolvedValue(returnValue),
      order: vi.fn().mockResolvedValue(returnValue),
    }),
  })
  return chain
}

import {
  createCampaign,
  listMyCampaigns,
  getCampaign,
  deleteCampaign,
  leaveCampaign,
  listCampaignMembers,
  updateAutoInitiative,
  getAutoInitiative,
  CampaignServiceError,
} from '@/services/campaign'

// ── createCampaign ─────────────────────────────────────────────────────────────

describe('createCampaign', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws CampaignServiceError("not_authenticated") when supabase is null', async () => {
    resetAuth()
    await expect(createCampaign({ name: 'Test' })).rejects.toThrow(CampaignServiceError)
    await expect(createCampaign({ name: 'Test' })).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws CampaignServiceError("not_authenticated") when session is null', async () => {
    mockSupabaseConfigured = true
    mockSession = null
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
    await expect(createCampaign({ name: 'Test' })).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws CampaignServiceError("create_failed") on supabase insert error', async () => {
    setupAuth()
    const chain = makeChain({ data: null, error: { message: 'db error' } })
    mockFrom.mockReturnValue(chain)
    // Override single to return error
    const insertChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
      }),
    }
    const insertMock = { insert: vi.fn().mockReturnValue(insertChain) }
    mockFrom.mockReturnValue(insertMock)

    await expect(createCampaign({ name: 'Test' })).rejects.toMatchObject({ code: 'create_failed' })
  })

  it('returns a mapped Campaign on success', async () => {
    setupAuth('owner_1')
    const row = {
      id: 'camp_1',
      name: 'My Campaign',
      description: 'A test',
      owner_id: 'owner_1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    }
    const insertChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: row, error: null }),
      }),
    }
    mockFrom.mockReturnValue({ insert: vi.fn().mockReturnValue(insertChain) })

    const result = await createCampaign({ name: 'My Campaign', description: 'A test' })
    expect(result.id).toBe('camp_1')
    expect(result.name).toBe('My Campaign')
    expect(result.description).toBe('A test')
    expect(result.ownerId).toBe('owner_1')
    expect(typeof result.createdAt).toBe('number')
    expect(typeof result.updatedAt).toBe('number')
  })

  it('trims name before inserting', async () => {
    setupAuth()
    let capturedInsert: unknown
    const insertChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'c1', name: 'Trimmed', description: null,
            owner_id: 'u1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      }),
    }
    const insertFn = vi.fn().mockImplementation((val: unknown) => {
      capturedInsert = val
      return insertChain
    })
    mockFrom.mockReturnValue({ insert: insertFn })

    await createCampaign({ name: '  Trimmed  ' })
    expect((capturedInsert as Record<string, unknown>)['name']).toBe('Trimmed')
  })
})

// ── listMyCampaigns ────────────────────────────────────────────────────────────

describe('listMyCampaigns', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when supabase is null', async () => {
    resetAuth()
    await expect(listMyCampaigns()).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns empty array when no campaigns', async () => {
    setupAuth()
    const selectChain = {
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) })

    const result = await listMyCampaigns()
    expect(result).toEqual([])
  })

  it('returns mapped campaigns sorted by updated_at descending', async () => {
    setupAuth()
    const rows = [
      { id: 'c2', name: 'B', description: null, owner_id: 'u1', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-03T00:00:00Z' },
      { id: 'c1', name: 'A', description: null, owner_id: 'u1', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
    ]
    const selectChain = {
      order: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) })

    const result = await listMyCampaigns()
    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe('c2')
    expect(result[1]?.id).toBe('c1')
  })
})

// ── getCampaign ────────────────────────────────────────────────────────────────

describe('getCampaign', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when supabase is null', async () => {
    resetAuth()
    await expect(getCampaign('c1')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns null when campaign not found', async () => {
    setupAuth()
    const eqChain = {
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) }),
    })

    const result = await getCampaign('nonexistent')
    expect(result).toBeNull()
  })

  it('returns mapped campaign when found', async () => {
    setupAuth()
    const row = {
      id: 'c1', name: 'Campaign', description: 'desc',
      owner_id: 'u1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    const eqChain = {
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    }
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) }),
    })

    const result = await getCampaign('c1')
    expect(result?.id).toBe('c1')
    expect(result?.name).toBe('Campaign')
  })
})

// ── deleteCampaign ─────────────────────────────────────────────────────────────

describe('deleteCampaign', () => {
  beforeEach(() => { vi.clearAllMocks() })

  function setupDelete(error: unknown = null) {
    setupAuth()
    const deleteMock = { eq: vi.fn().mockResolvedValue({ error }) }
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue(deleteMock) })
    mockStorageList.mockResolvedValue({ data: [] })
    mockStorageRemove.mockResolvedValue({ error: null })
  }

  it('throws when supabase is null', async () => {
    resetAuth()
    await expect(deleteCampaign('c1')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws CampaignServiceError("delete_failed") on supabase error', async () => {
    setupDelete({ message: 'fail' })
    await expect(deleteCampaign('c1')).rejects.toMatchObject({ code: 'delete_failed' })
  })

  it('resolves on success', async () => {
    setupDelete(null)
    await expect(deleteCampaign('c1')).resolves.toBeUndefined()
  })

  it('lists and removes map files from storage before deleting the campaign', async () => {
    setupDelete(null)
    mockStorageList.mockResolvedValue({ data: [{ name: 'map-1.png' }, { name: 'map-2.png' }] })
    await deleteCampaign('c1')
    expect(mockStorageList).toHaveBeenCalledWith('c1')
    expect(mockStorageRemove).toHaveBeenCalledWith(['c1/map-1.png', 'c1/map-2.png'])
  })

  it('skips storage remove when folder is empty', async () => {
    setupDelete(null)
    mockStorageList.mockResolvedValue({ data: [] })
    await deleteCampaign('c1')
    expect(mockStorageRemove).not.toHaveBeenCalled()
  })

  it('still deletes campaign even if storage cleanup throws', async () => {
    setupDelete(null)
    mockStorageList.mockRejectedValue(new Error('storage error'))
    await expect(deleteCampaign('c1')).resolves.toBeUndefined()
  })
})

// ── listCampaignMembers ────────────────────────────────────────────────────────

describe('listCampaignMembers', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when supabase is null', async () => {
    resetAuth()
    await expect(listCampaignMembers('c1')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns empty array when no members', async () => {
    setupAuth()
    const eqChain = { eq: vi.fn().mockResolvedValue({ data: [], error: null }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(eqChain) })

    const result = await listCampaignMembers('c1')
    expect(result).toEqual([])
  })

  it('maps member rows correctly', async () => {
    setupAuth()
    const rows = [{
      campaign_id: 'c1', user_id: 'u1', role: 'master', joined_at: '2024-01-01T00:00:00Z',
    }]
    const eqChain = { eq: vi.fn().mockResolvedValue({ data: rows, error: null }) }
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(eqChain) })

    const result = await listCampaignMembers('c1')
    expect(result).toHaveLength(1)
    expect(result[0]?.role).toBe('master')
    expect(result[0]?.userId).toBe('u1')
  })
})

// ── leaveCampaign ──────────────────────────────────────────────────────────────

describe('leaveCampaign', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws not_authenticated when supabase is null', async () => {
    resetAuth()
    await expect(leaveCampaign('c1')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws not_authenticated when no session', async () => {
    mockSupabaseConfigured = true
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
    await expect(leaveCampaign('c1')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws leave_failed when campaign_characters delete fails', async () => {
    setupAuth()
    // First call (campaign_characters delete) fails
    const failChain = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
        }),
      }),
    }
    mockFrom.mockReturnValue(failChain)
    await expect(leaveCampaign('c1')).rejects.toMatchObject({ code: 'leave_failed' })
  })

  it('throws leave_failed when campaign_members delete fails', async () => {
    setupAuth()
    const okEq = { eq: vi.fn().mockResolvedValue({ error: null }) }
    const failEq = { eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }) }
    const okDeleteChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(okEq) }) }
    const failDeleteChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(failEq) }) }
    mockFrom
      .mockReturnValueOnce(okDeleteChain)   // campaign_characters
      .mockReturnValueOnce(failDeleteChain) // campaign_members
    await expect(leaveCampaign('c1')).rejects.toMatchObject({ code: 'leave_failed' })
  })

  it('resolves without error on success', async () => {
    setupAuth()
    const okEq = { eq: vi.fn().mockResolvedValue({ error: null }) }
    const okChain = { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(okEq) }) }
    mockFrom.mockReturnValue(okChain)
    await expect(leaveCampaign('c1')).resolves.toBeUndefined()
  })
})

// ── updateAutoInitiative ──────────────────────────────────────────────────────

describe('updateAutoInitiative', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns without error when supabase is null', async () => {
    resetAuth()
    await expect(updateAutoInitiative('c1', true)).resolves.toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase.from("campaigns").update({auto_initiative}).eq("id", id)', async () => {
    setupAuth()
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    mockFrom.mockReturnValue({ update: updateMock })

    await updateAutoInitiative('camp-1', true)

    expect(mockFrom).toHaveBeenCalledWith('campaigns')
    expect(updateMock).toHaveBeenCalledWith({ auto_initiative: true })
    expect(eqMock).toHaveBeenCalledWith('id', 'camp-1')
  })

  it('passes false correctly', async () => {
    setupAuth()
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: eqMock }) })

    await updateAutoInitiative('camp-2', false)
    // Should resolve without error
    await expect(updateAutoInitiative('camp-2', false)).resolves.toBeUndefined()
  })

  it('logs error on supabase failure but does not throw', async () => {
    setupAuth()
    const eqMock = vi.fn().mockResolvedValue({ error: { message: 'db error' } })
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: eqMock }) })

    await expect(updateAutoInitiative('c1', true)).resolves.toBeUndefined()
  })
})

// ── mapCampaignRow — autoInitiative ───────────────────────────────────────────

describe('getCampaign — autoInitiative mapping', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('maps auto_initiative=true to autoInitiative=true', async () => {
    setupAuth()
    const row = {
      id: 'c1', name: 'Camp', description: null, owner_id: 'u1',
      invite_code: 'CODE1234', auto_initiative: true,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z',
    }
    const chain = makeChain({ data: row, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await getCampaign('c1')
    expect(result?.autoInitiative).toBe(true)
  })

  it('maps auto_initiative=false to autoInitiative=false', async () => {
    setupAuth()
    const row = {
      id: 'c1', name: 'Camp', description: null, owner_id: 'u1',
      invite_code: 'CODE1234', auto_initiative: false,
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z',
    }
    const chain = makeChain({ data: row, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await getCampaign('c1')
    expect(result?.autoInitiative).toBe(false)
  })

  it('defaults autoInitiative=false when auto_initiative is absent', async () => {
    setupAuth()
    const row = {
      id: 'c1', name: 'Camp', description: null, owner_id: 'u1',
      invite_code: 'CODE1234',
      created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z',
    }
    const chain = makeChain({ data: row, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await getCampaign('c1')
    expect(result?.autoInitiative).toBe(false)
  })
})

// ── getAutoInitiative ─────────────────────────────────────────────────────────

describe('getAutoInitiative', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns false when supabase is null', async () => {
    resetAuth()
    await expect(getAutoInitiative('c1')).resolves.toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns true when auto_initiative is true', async () => {
    setupAuth()
    const chain = makeChain({ data: { auto_initiative: true }, error: null })
    mockFrom.mockReturnValue(chain)
    await expect(getAutoInitiative('c1')).resolves.toBe(true)
  })

  it('returns false when auto_initiative is false', async () => {
    setupAuth()
    const chain = makeChain({ data: { auto_initiative: false }, error: null })
    mockFrom.mockReturnValue(chain)
    await expect(getAutoInitiative('c1')).resolves.toBe(false)
  })

  it('returns false on supabase error', async () => {
    setupAuth()
    const chain = makeChain({ data: null, error: { message: 'not found' } })
    mockFrom.mockReturnValue(chain)
    await expect(getAutoInitiative('c1')).resolves.toBe(false)
  })
})
