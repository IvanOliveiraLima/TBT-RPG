import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the idb module — IndexedDB is not available in jsdom
vi.mock('idb', () => {
  const store = new Map<string, unknown>()

  return {
    openDB: vi.fn().mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      get:    vi.fn().mockResolvedValue(undefined),
      put:    vi.fn().mockImplementation((_storeName: string, value: unknown) => {
        const record = value as { id: string }
        store.set(record.id, record)
        return Promise.resolve()
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      close:  vi.fn(),
    }),
  }
})

import { listCharacters } from '@/data/db'

describe('listCharacters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an array', async () => {
    const result = await listCharacters()
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns empty array when both DBs have no characters', async () => {
    const result = await listCharacters()
    expect(result).toHaveLength(0)
  })
})
