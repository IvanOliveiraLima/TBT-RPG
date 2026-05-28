/**
 * Tests that v2 is fully independent from the v1 IndexedDB.
 *
 * Root cause of the ghost-character bug (PR #110 sub-phase):
 *   migrateV1Characters() was called on every boot. It skips chars whose ID
 *   already exists in v2 — but a *deleted* char has no ID in v2 anymore, so
 *   the next boot reimports it from v1.
 *
 * Fix: remove migrateV1Characters() from main.tsx entirely.
 * These tests assert the invariants that prevent that regression.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Character } from '@/domain/character'

// ── In-memory IndexedDB mock (same pattern as db.test.ts) ───────────────────
const store = new Map<string, unknown>()

vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    getAll:  vi.fn().mockImplementation(() => Promise.resolve([...store.values()])),
    get:     vi.fn().mockImplementation((_storeName: string, id: string) =>
               Promise.resolve(store.get(id))),
    put:     vi.fn().mockImplementation((_storeName: string, value: unknown) => {
               const record = value as { id: string }
               store.set(record.id, record)
               return Promise.resolve()
             }),
    delete:  vi.fn().mockImplementation((_storeName: string, id: string) => {
               store.delete(id)
               return Promise.resolve()
             }),
    close:   vi.fn(),
    objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
    deleteObjectStore: vi.fn(),
    createObjectStore: vi.fn(),
    transaction: vi.fn(),
  }),
}))

import { listCharacters, saveCharacter, deleteCharacter } from '@/data/db'
import { openDB } from 'idb'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id:          'char_001',
    name:        'Eira Thornwood',
    race:        'Wood Elf',
    background:  'Outlander',
    alignment:   'Neutral Good',
    classes:     [{ name: 'Ranger', level: 5, hitDie: 10 }],
    experience:  0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities:   { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
    proficiencyBonus: 3,
    hp:          { current: 42, max: 42, temp: 0 },
    hitDice:     [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
    deathSaves:  { successes: 0, failures: 0 },
    ac: 16, initiative: 4, speed: 35,
    passivePerception: 16, spellSaveDC: 0, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks: [], inventory: [],
    currency:    { pp: 0, gp: 0, sp: 0, cp: 0 },
    features:    [],
    backstory:   '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [],
    spellSlots: {},
    spellcastingAbility: '',
    spellcastingClass: '',
    images:      {},
    createdAt:   1700000000000,
    updatedAt:   1700000000000,
    ...overrides,
  }
}

// ── Boot entry point: no v1 migration call ───────────────────────────────────

describe('main.tsx — v1 migration removed', () => {
  it('does not import migrateV1Characters', () => {
    const mainSrc = readFileSync(
      resolve(__dirname, '../src/main.tsx'),
      'utf-8',
    )
    expect(mainSrc).not.toContain('migrateV1Characters')
  })

  it('does not import from ./data/migration', () => {
    const mainSrc = readFileSync(
      resolve(__dirname, '../src/main.tsx'),
      'utf-8',
    )
    expect(mainSrc).not.toContain("from './data/migration'")
    expect(mainSrc).not.toContain('from "./data/migration"')
  })
})

// ── Ghost-character regression ────────────────────────────────────────────────

describe('ghost-character regression — deleted char does not return', () => {
  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
  })

  it('deleted character is not returned by listCharacters (simulates reload)', async () => {
    // Populate v2 DB with 3 characters (simulates state before delete)
    await saveCharacter(makeChar({ id: 'char_001', name: 'Eira', updatedAt: 1000 }))
    await saveCharacter(makeChar({ id: 'char_002', name: 'Zariel', updatedAt: 2000 }))
    await saveCharacter(makeChar({ id: 'char_003', name: 'Mira', updatedAt: 3000 }))

    // User deletes the middle character
    await deleteCharacter('char_002')

    // Simulate reload: call listCharacters again (as if the page was refreshed)
    const result = await listCharacters()

    // The deleted char must not reappear — this is the ghost-character fix
    expect(result.find(c => c.id === 'char_002')).toBeUndefined()
  })

  it('remaining characters are intact after delete', async () => {
    await saveCharacter(makeChar({ id: 'char_001', name: 'Eira', updatedAt: 1000 }))
    await saveCharacter(makeChar({ id: 'char_002', name: 'Zariel', updatedAt: 2000 }))
    await saveCharacter(makeChar({ id: 'char_003', name: 'Mira', updatedAt: 3000 }))

    await deleteCharacter('char_002')

    const result = await listCharacters()
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id).sort()).toEqual(['char_001', 'char_003'])
  })

  it('listCharacters returns empty list when v2 store is empty — no v1 fallback', async () => {
    // v2 DB is empty; without the migration call there is nothing to fall back to
    const result = await listCharacters()
    expect(result).toHaveLength(0)
  })

  it('multiple delete+reload cycles leave store clean', async () => {
    await saveCharacter(makeChar({ id: 'char_001', name: 'Eira', updatedAt: 1000 }))
    await saveCharacter(makeChar({ id: 'char_002', name: 'Zariel', updatedAt: 2000 }))

    // Cycle 1: delete char_001, reload
    await deleteCharacter('char_001')
    const after1 = await listCharacters()
    expect(after1).toHaveLength(1)
    expect(after1[0]!.id).toBe('char_002')

    // Cycle 2: delete char_002, reload
    await deleteCharacter('char_002')
    const after2 = await listCharacters()
    expect(after2).toHaveLength(0)
  })
})

// ── v2 DB isolation — openDB only called with v2 name ────────────────────────

describe('v2 DB isolation — only v2 DB name is opened', () => {
  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
  })

  it('listCharacters does not open v1 DB name', async () => {
    await listCharacters()
    const mockOpenDB = vi.mocked(openDB)
    const v1Calls = mockOpenDB.mock.calls.filter(args => args[0] === 'dnd-character-sheet')
    expect(v1Calls).toHaveLength(0)
  })

  it('saveCharacter does not open v1 DB name', async () => {
    await saveCharacter(makeChar())
    const mockOpenDB = vi.mocked(openDB)
    const v1Calls = mockOpenDB.mock.calls.filter(args => args[0] === 'dnd-character-sheet')
    expect(v1Calls).toHaveLength(0)
  })

  it('deleteCharacter does not open v1 DB name', async () => {
    await deleteCharacter('char_001')
    const mockOpenDB = vi.mocked(openDB)
    const v1Calls = mockOpenDB.mock.calls.filter(args => args[0] === 'dnd-character-sheet')
    expect(v1Calls).toHaveLength(0)
  })
})
