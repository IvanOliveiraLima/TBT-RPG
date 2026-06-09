/**
 * Tests for useCampaignViewStore — loadCharacter, polling, clear.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock service ──────────────────────────────────────────────────────────────

const mockFetchChar = vi.fn()
const mockFetchImages = vi.fn()

vi.mock('@/services/campaign-view', () => ({
  fetchCampaignCharacter: (...args: unknown[]) => mockFetchChar(...args),
  fetchCampaignCharacterImages: (...args: unknown[]) => mockFetchImages(...args),
  CampaignViewError: class CampaignViewError extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

import { useCampaignViewStore } from '@/store/campaign-view'
import type { Character } from '@/domain/character'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeChar(id = 'char1', updatedAt = 1000): Partial<Character> {
  return {
    id,
    name: 'Aragorn',
    images: {},
    updatedAt,
  }
}

const NO_IMAGES = { portraitData: null, symbolData: null }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStore() {
  return useCampaignViewStore.getState()
}

function resetStore() {
  useCampaignViewStore.setState({
    character: null,
    loading: false,
    error: null,
    lastFetchedAt: null,
  })
  getStore().stopPolling()
}

// ── loadCharacter ─────────────────────────────────────────────────────────────

describe('useCampaignViewStore.loadCharacter', () => {
  beforeEach(() => { vi.clearAllMocks(); resetStore() })

  it('sets loading true at start and false after success', async () => {
    mockFetchChar.mockResolvedValue({ char: makeChar(), ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue(NO_IMAGES)

    const promise = getStore().loadCharacter('c1', 'char1')
    expect(getStore().loading).toBe(true)
    await promise
    expect(getStore().loading).toBe(false)
  })

  it('sets character on success', async () => {
    const char = makeChar()
    mockFetchChar.mockResolvedValue({ char, ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue(NO_IMAGES)

    await getStore().loadCharacter('c1', 'char1')
    expect(getStore().character?.name).toBe('Aragorn')
    expect(getStore().error).toBeNull()
  })

  it('merges portrait image into character', async () => {
    const char = makeChar()
    mockFetchChar.mockResolvedValue({ char, ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue({ portraitData: 'data:image/png;base64,ABC', symbolData: null })

    await getStore().loadCharacter('c1', 'char1')
    expect(getStore().character?.images.character).toBe('data:image/png;base64,ABC')
  })

  it('sets error char_not_found when fetch returns null', async () => {
    mockFetchChar.mockResolvedValue(null)

    await getStore().loadCharacter('c1', 'char1')
    expect(getStore().error).toBe('char_not_found')
    expect(getStore().character).toBeNull()
    expect(getStore().loading).toBe(false)
  })

  it('sets error code when service throws CampaignViewError', async () => {
    const { CampaignViewError } = await import('@/services/campaign-view')
    mockFetchChar.mockRejectedValue(new CampaignViewError('fetch_failed'))

    await getStore().loadCharacter('c1', 'char1')
    expect(getStore().error).toBe('fetch_failed')
    expect(getStore().loading).toBe(false)
  })

  it('sets error unknown for non-CampaignViewError throws', async () => {
    mockFetchChar.mockRejectedValue(new Error('network'))

    await getStore().loadCharacter('c1', 'char1')
    expect(getStore().error).toBe('unknown')
  })
})

// ── polling ───────────────────────────────────────────────────────────────────

describe('useCampaignViewStore polling', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); resetStore() })
  afterEach(() => { vi.useRealTimers(); resetStore() })

  it('startPolling invokes fetch after interval', async () => {
    mockFetchChar.mockResolvedValue({ char: makeChar(), ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue(NO_IMAGES)

    getStore().startPolling('c1', 'char1', 1000)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mockFetchChar).toHaveBeenCalledWith({ campaignId: 'c1', characterId: 'char1' })
  })

  it('stopPolling prevents further fetches', async () => {
    mockFetchChar.mockResolvedValue({ char: makeChar(), ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue(NO_IMAGES)

    getStore().startPolling('c1', 'char1', 1000)
    getStore().stopPolling()
    await vi.advanceTimersByTimeAsync(5000)

    expect(mockFetchChar).not.toHaveBeenCalled()
  })

  it('polls updates character when updatedAt is newer', async () => {
    const oldChar = makeChar('char1', 1000)
    const newChar = makeChar('char1', 9999)

    useCampaignViewStore.setState({ character: oldChar as Character })
    mockFetchChar.mockResolvedValue({ char: newChar, ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue(NO_IMAGES)

    getStore().startPolling('c1', 'char1', 500)
    await vi.advanceTimersByTimeAsync(500)

    expect(getStore().character?.updatedAt).toBe(9999)
  })

  it('does not update when updatedAt is not newer', async () => {
    const existingChar = makeChar('char1', 5000)
    const staleChar = makeChar('char1', 1000)

    useCampaignViewStore.setState({ character: existingChar as Character })
    mockFetchChar.mockResolvedValue({ char: staleChar, ownerId: 'owner1' })

    getStore().startPolling('c1', 'char1', 500)
    await vi.advanceTimersByTimeAsync(500)

    expect(getStore().character?.updatedAt).toBe(5000)
  })

  it('sets char_not_found error and stops polling when char deleted', async () => {
    mockFetchChar.mockResolvedValue(null)

    getStore().startPolling('c1', 'char1', 500)
    await vi.advanceTimersByTimeAsync(500)

    expect(getStore().error).toBe('char_not_found')
    expect(getStore().character).toBeNull()

    // Further time passes — should not call again (stopped)
    vi.clearAllMocks()
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockFetchChar).not.toHaveBeenCalled()
  })
})

// ── clear ─────────────────────────────────────────────────────────────────────

describe('useCampaignViewStore.clear', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); resetStore() })
  afterEach(() => { vi.useRealTimers(); resetStore() })

  it('resets all state', async () => {
    mockFetchChar.mockResolvedValue({ char: makeChar(), ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue(NO_IMAGES)
    await getStore().loadCharacter('c1', 'char1')

    getStore().clear()

    const s = getStore()
    expect(s.character).toBeNull()
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
    expect(s.lastFetchedAt).toBeNull()
  })

  it('stops polling when cleared', async () => {
    mockFetchChar.mockResolvedValue({ char: makeChar(), ownerId: 'owner1' })
    mockFetchImages.mockResolvedValue(NO_IMAGES)

    getStore().startPolling('c1', 'char1', 500)
    getStore().clear()

    vi.clearAllMocks()
    await vi.advanceTimersByTimeAsync(2000)
    expect(mockFetchChar).not.toHaveBeenCalled()
  })
})
