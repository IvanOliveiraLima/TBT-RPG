/**
 * Tests for campaign-view service:
 * fetchCampaignCharacter, fetchCampaignCharacterImages, fetchLinkedCharactersDetails
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false
let mockSessionUserId: string | null = 'user1'

const mockFrom = vi.fn()
const mockStorage = { from: vi.fn() }

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
  getSession: () => Promise.resolve(
    mockSessionUserId ? { user: { id: mockSessionUserId } } : null
  ),
}))

const mockClient = {
  from: (...args: unknown[]) => mockFrom(...args),
  storage: mockStorage,
}

function setupSupabase() { mockSupabaseConfigured = true }
function resetSupabase() { mockSupabaseConfigured = false }

import {
  fetchCampaignCharacter,
  fetchCampaignCharacterImages,
  fetchLinkedCharactersDetails,
  CampaignViewError,
} from '@/services/campaign-view'

// ── Mock @/services/campaign-characters ──────────────────────────────────────

const mockListCampaignCharacters = vi.fn()

vi.mock('@/services/campaign-characters', () => ({
  listCampaignCharacters: (...args: unknown[]) => mockListCampaignCharacters(...args),
}))

// ── Mock @/services/user-profile ─────────────────────────────────────────────

const mockListProfilesByIds = vi.fn()

vi.mock('@/services/user-profile', () => ({
  listProfilesByIds: (...args: unknown[]) => mockListProfilesByIds(...args),
  getMyProfile: vi.fn(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const LINK_ROW = { character_id: 'char1', user_id: 'owner1' }

const CHAR_ROW = {
  id: 'char1',
  user_id: 'owner1',
  data: {
    id: 'char1',
    name: 'Aragorn',
    race: 'Human',
    classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
    updatedAt: 0,
  },
  updated_at: '2024-01-15T00:00:00Z',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMaybeSingleChain(data: unknown, error: unknown = null) {
  return {
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeEqEqChain(data: unknown, error: unknown = null) {
  const chain = makeMaybeSingleChain(data, error)
  const eq2 = vi.fn().mockReturnValue(chain)
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  return { chain, eq1, eq2, select: vi.fn().mockReturnValue({ eq: eq1 }) }
}

function makeEqSingleChain(data: unknown, error: unknown = null) {
  const chain = makeMaybeSingleChain(data, error)
  const eq1 = vi.fn().mockReturnValue(chain)
  return { chain, eq1, select: vi.fn().mockReturnValue({ eq: eq1 }) }
}

// ── fetchCampaignCharacter ────────────────────────────────────────────────────

describe('fetchCampaignCharacter', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSessionUserId = 'user1' })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws not_authenticated when no session', async () => {
    setupSupabase()
    mockSessionUserId = null
    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns null when link not found', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(null, null)
    mockFrom.mockReturnValueOnce({ select: linkChain.select })

    const result = await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    expect(result).toBeNull()
  })

  it('throws fetch_failed on link query error', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(null, { message: 'db error' })
    mockFrom.mockReturnValueOnce({ select: linkChain.select })

    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'fetch_failed' })
  })

  it('returns null when char row not found', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(LINK_ROW)
    const charChain = makeEqSingleChain(null, null)
    mockFrom
      .mockReturnValueOnce({ select: linkChain.select })
      .mockReturnValueOnce({ select: charChain.select })

    const result = await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    expect(result).toBeNull()
  })

  it('throws fetch_failed on char query error', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(LINK_ROW)
    const charChain = makeEqSingleChain(null, { message: 'db error' })
    mockFrom
      .mockReturnValueOnce({ select: linkChain.select })
      .mockReturnValueOnce({ select: charChain.select })

    await expect(
      fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'fetch_failed' })
  })

  it('returns mapped char and ownerId on success', async () => {
    setupSupabase()
    const linkChain = makeEqEqChain(LINK_ROW)
    const charChain = makeEqSingleChain(CHAR_ROW)
    mockFrom
      .mockReturnValueOnce({ select: linkChain.select })
      .mockReturnValueOnce({ select: charChain.select })

    const result = await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    expect(result).not.toBeNull()
    expect(result!.char.name).toBe('Aragorn')
    expect(result!.char.updatedAt).toBe(new Date('2024-01-15T00:00:00Z').getTime())
    expect(result!.ownerId).toBe('owner1')
  })

  it('char instance has CampaignViewError class', async () => {
    resetSupabase()
    try {
      await fetchCampaignCharacter({ campaignId: 'c1', characterId: 'char1' })
    } catch (err) {
      expect(err).toBeInstanceOf(CampaignViewError)
    }
  })
})

// ── fetchCampaignCharacterImages ──────────────────────────────────────────────

describe('fetchCampaignCharacterImages', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null values when supabase is null', async () => {
    resetSupabase()
    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
  })

  it('returns null values when list returns error', async () => {
    setupSupabase()
    const listFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
    mockStorage.from.mockReturnValue({ list: listFn })

    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
  })

  it('returns null values when list returns empty array', async () => {
    setupSupabase()
    const listFn = vi.fn().mockResolvedValue({ data: [], error: null })
    mockStorage.from.mockReturnValue({ list: listFn })

    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
  })

  it('skips files with unrecognised kind', async () => {
    setupSupabase()
    const listFn = vi.fn().mockResolvedValue({
      data: [{ name: 'thumbnail.png' }],
      error: null,
    })
    const downloadFn = vi.fn().mockResolvedValue({ data: null, error: null })
    mockStorage.from.mockReturnValue({ list: listFn, download: downloadFn })

    const result = await fetchCampaignCharacterImages({ userId: 'u1', characterId: 'c1' })
    expect(result.portraitData).toBeNull()
    expect(result.symbolData).toBeNull()
    expect(downloadFn).not.toHaveBeenCalled()
  })
})

// ── fetchLinkedCharactersDetails — batch query ────────────────────────────────

const BATCH_LINK_1 = {
  campaignId: 'c1', characterId: 'char1', userId: 'user1',
  characterName: 'Aragorn', characterSummary: 'Human — Ranger 5', addedAt: 0,
}
const BATCH_LINK_2 = {
  campaignId: 'c1', characterId: 'char2', userId: 'user2',
  characterName: 'Legolas', characterSummary: 'Elf — Ranger 5', addedAt: 1000,
}
const BATCH_CHAR_ROW_1 = {
  id: 'char1', user_id: 'user1',
  data: { id: 'char1', name: 'Aragorn', race: 'Human', classes: [], abilities: {}, hp: { current: 40, max: 40, temp: 0 } },
  updated_at: '2024-01-01T00:00:00Z',
}
const BATCH_CHAR_ROW_2 = {
  id: 'char2', user_id: 'user2',
  data: { id: 'char2', name: 'Legolas', race: 'Elf', classes: [], abilities: {}, hp: { current: 35, max: 35, temp: 0 } },
  updated_at: '2024-01-01T00:00:00Z',
}
const BATCH_PROFILE_1 = { userId: 'user1', displayName: 'Alice', createdAt: 0, updatedAt: 0 }
const BATCH_PROFILE_2 = { userId: 'user2', displayName: 'Bob', createdAt: 0, updatedAt: 0 }

// Build a chainable mock that supports .in() as a terminal Promise
function makeInChain(result: { data: unknown; error: unknown }) {
  const inFn = vi.fn().mockResolvedValue(result)
  const selectFn = vi.fn().mockReturnValue({ in: inFn })
  return { selectFn, inFn }
}

describe('fetchLinkedCharactersDetails — batch query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListCampaignCharacters.mockResolvedValue([BATCH_LINK_1, BATCH_LINK_2])
    mockListProfilesByIds.mockResolvedValue([BATCH_PROFILE_1, BATCH_PROFILE_2])
  })

  it('returns empty array when supabase is null', async () => {
    resetSupabase()
    const result = await fetchLinkedCharactersDetails('c1')
    expect(result).toEqual([])
  })

  it('returns empty array when no links exist', async () => {
    setupSupabase()
    mockListCampaignCharacters.mockResolvedValue([])
    mockFrom.mockReturnValue(makeInChain({ data: [], error: null }).selectFn)
    const result = await fetchLinkedCharactersDetails('c1')
    expect(result).toEqual([])
  })

  it('uses .in() to batch-fetch characters (not per-char .eq() calls)', async () => {
    setupSupabase()
    const { selectFn, inFn } = makeInChain({ data: [BATCH_CHAR_ROW_1, BATCH_CHAR_ROW_2], error: null })
    mockFrom.mockReturnValue({ select: selectFn })

    await fetchLinkedCharactersDetails('c1')

    expect(inFn).toHaveBeenCalledWith('id', ['char1', 'char2'])
  })

  it('does NOT fetch images (portraitData and symbolData are null)', async () => {
    setupSupabase()
    const { selectFn } = makeInChain({ data: [BATCH_CHAR_ROW_1, BATCH_CHAR_ROW_2], error: null })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await fetchLinkedCharactersDetails('c1')

    for (const detail of result) {
      expect(detail.portraitData).toBeNull()
      expect(detail.symbolData).toBeNull()
    }
    // Storage should not have been touched
    expect(mockStorage.from).not.toHaveBeenCalled()
  })

  it('populates character data from batch result', async () => {
    setupSupabase()
    const { selectFn } = makeInChain({ data: [BATCH_CHAR_ROW_1, BATCH_CHAR_ROW_2], error: null })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await fetchLinkedCharactersDetails('c1')

    expect(result).toHaveLength(2)
    expect(result[0]!.character?.name).toBe('Aragorn')
    expect(result[1]!.character?.name).toBe('Legolas')
  })

  it('populates ownerDisplayName from profiles batch', async () => {
    setupSupabase()
    const { selectFn } = makeInChain({ data: [BATCH_CHAR_ROW_1, BATCH_CHAR_ROW_2], error: null })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await fetchLinkedCharactersDetails('c1')

    expect(result[0]!.ownerDisplayName).toBe('Alice')
    expect(result[1]!.ownerDisplayName).toBe('Bob')
  })

  it('returns character: null for links whose char is absent from batch (deleted char)', async () => {
    setupSupabase()
    // Only char1 in batch result — char2 is gone
    const { selectFn } = makeInChain({ data: [BATCH_CHAR_ROW_1], error: null })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await fetchLinkedCharactersDetails('c1')
    const char2Detail = result.find(d => d.characterId === 'char2')
    expect(char2Detail).toBeDefined()
    expect(char2Detail!.character).toBeNull()
  })

  it('returns character: null for all when batch query errors (graceful degradation)', async () => {
    setupSupabase()
    const { selectFn } = makeInChain({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await fetchLinkedCharactersDetails('c1')
    expect(result).toHaveLength(2)
    for (const detail of result) {
      expect(detail.character).toBeNull()
    }
  })

  it('returns [] gracefully when listCampaignCharacters rejects', async () => {
    setupSupabase()
    mockListCampaignCharacters.mockRejectedValue(new Error('network'))
    const result = await fetchLinkedCharactersDetails('c1')
    expect(result).toEqual([])
  })

  it('sets ownerDisplayName to null when profiles fetch rejects', async () => {
    setupSupabase()
    const { selectFn } = makeInChain({ data: [BATCH_CHAR_ROW_1], error: null })
    mockFrom.mockReturnValue({ select: selectFn })
    mockListProfilesByIds.mockRejectedValue(new Error('network'))

    const result = await fetchLinkedCharactersDetails('c1')
    expect(result[0]!.ownerDisplayName).toBeNull()
  })
})
