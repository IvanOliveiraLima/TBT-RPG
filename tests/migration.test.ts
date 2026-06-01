import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Character } from '@/domain/character'
import { deriveTotalLevel } from '@/domain/derived'
import type { V1Character } from '@/data/schema-v1'

// ── Dual-store mock: v1 DB and v2 DB as separate Maps ───────────────────────

const v1Store = new Map<string, V1Character>()
const v2Store = new Map<string, Character>()

/**
 * Minimal valid V1Character for the adapter to accept.
 * Must have page1.basic_info to pass the malformed-record guard.
 */
function makeV1Char(id: string, name: string): V1Character {
  return {
    id,
    schemaVersion: 2,
    updatedAt: 1700000000000,
    page1: {
      basic_info: { char_name: name, char_class: 'Fighter', level: '5' },
      character_info: { race_class: 'Human', background: '', alignment: '', exp: '' },
      top_bar: {},
      attributes: { str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10' },
      saves_skills: { saves: {}, skills: {} },
      status: { max_health: '10', current_health: '10', temp_health: '0' },
      proficiencies: {},
      attacks_spells: [],
    },
  }
}

vi.mock('idb', () => ({
  openDB: vi.fn().mockImplementation((name: string) => {
    const isV1 = name === 'dnd-character-sheet'
    const activeStore = isV1 ? v1Store : v2Store

    return Promise.resolve({
      getAll: vi.fn().mockImplementation(() =>
        Promise.resolve([...activeStore.values()])
      ),
      put: vi.fn().mockImplementation((_storeName: string, value: unknown) => {
        const record = value as { id: string }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(activeStore as Map<string, any>).set(record.id, record)
        return Promise.resolve()
      }),
      close: vi.fn(),
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      deleteObjectStore: vi.fn(),
      createObjectStore: vi.fn(),
    })
  }),
}))

import { migrateV1Characters } from '@/data/migration'

describe('migrateV1Characters', () => {
  beforeEach(() => {
    v1Store.clear()
    v2Store.clear()
    vi.clearAllMocks()
  })

  it('returns { migrated: 0, skipped: 0 } when v1 DB is empty', async () => {
    const result = await migrateV1Characters()
    expect(result).toEqual({ migrated: 0, skipped: 0 })
  })

  it('migrates a v1 character to the v2 DB', async () => {
    v1Store.set('char_001', makeV1Char('char_001', 'Eira Thornwood'))
    const result = await migrateV1Characters()
    expect(result.migrated).toBe(1)
    expect(result.skipped).toBe(0)
    expect(v2Store.has('char_001')).toBe(true)
  })

  it('adapted character has domain fields (name, race, etc.)', async () => {
    v1Store.set('char_001', makeV1Char('char_001', 'Grimbold'))
    await migrateV1Characters()
    const migrated = v2Store.get('char_001') as Character
    expect(migrated.name).toBe('Grimbold')
    expect(deriveTotalLevel(migrated)).toBe(5)
  })

  it('migrates multiple v1 characters', async () => {
    v1Store.set('char_001', makeV1Char('char_001', 'Alpha'))
    v1Store.set('char_002', makeV1Char('char_002', 'Beta'))
    v1Store.set('char_003', makeV1Char('char_003', 'Gamma'))
    const result = await migrateV1Characters()
    expect(result.migrated).toBe(3)
    expect(result.skipped).toBe(0)
    expect(v2Store.size).toBe(3)
  })

  it('skips character already present in v2 DB', async () => {
    v1Store.set('char_001', makeV1Char('char_001', 'Eira'))
    // Pre-populate v2 with same id
    const existingChar = { id: 'char_001', name: 'Already in v2', updatedAt: Date.now() } as Character
    v2Store.set('char_001', existingChar)
    const result = await migrateV1Characters()
    expect(result.migrated).toBe(0)
    expect(result.skipped).toBe(1)
    // v2 record should remain unchanged
    expect(v2Store.get('char_001')!.name).toBe('Already in v2')
  })

  it('is idempotent: second run migrates 0, skips N', async () => {
    v1Store.set('char_001', makeV1Char('char_001', 'Eira'))
    await migrateV1Characters()
    const result2 = await migrateV1Characters()
    expect(result2.migrated).toBe(0)
    expect(result2.skipped).toBe(1)
  })

  it('skips legacy "active" record', async () => {
    v1Store.set('active', { id: 'active', page1: { basic_info: { char_name: 'Legacy' } } } as V1Character)
    const result = await migrateV1Characters()
    expect(result.migrated).toBe(0)
    expect(v2Store.has('active')).toBe(false)
  })

  it('skips malformed records (no page1.basic_info)', async () => {
    v1Store.set('bad_001', { id: 'bad_001' } as V1Character)
    const result = await migrateV1Characters()
    expect(result.migrated).toBe(0)
    expect(v2Store.has('bad_001')).toBe(false)
  })

  it('returns { migrated: 0, skipped: 0 } gracefully when v1 DB throws on open', async () => {
    const { openDB } = await import('idb')
    // listCharacters() opens v2 DB first (1st call succeeds via default mock),
    // then migration opens v1 DB (2nd call fails).
    vi.mocked(openDB)
      .mockResolvedValueOnce({         // 1st call: v2 DB for listCharacters — empty
        getAll: vi.fn().mockResolvedValue([]),
        put: vi.fn(),
        close: vi.fn(),
        objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
        deleteObjectStore: vi.fn(),
        createObjectStore: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .mockRejectedValueOnce(new Error('IDB unavailable'))  // 2nd call: v1 DB fails
    const result = await migrateV1Characters()
    expect(result).toEqual({ migrated: 0, skipped: 0 })
  })
})
