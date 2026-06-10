/**
 * Tests for the import/export service:
 * - buildExportBlob: blob structure, filename format
 * - parseImportFile: valid, invalid_json, invalid_schema, incompatible_version, read_failed
 * - applyImport merge mode: add new, update existing, preserve untouched, counts
 * - applyImport replace mode: delete all then insert, counts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Character } from '@/domain/character'
import {
  buildExportBlob,
  parseImportFile,
  applyImport,
  ImportError,
  EXPORT_SCHEMA_VERSION,
} from '@/services/import-export'

// ── Fixture character ─────────────────────────────────────────────────────────

function makeChar(id: string, ac = 15): Character {
  return {
    id,
    name: `Char ${id}`,
    race: '', background: '', alignment: '', classes: [], hitDice: [],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: [],
    skills: [],
    hp: { current: 10, max: 10, temp: 0 },
    deathSaves: { successes: 0, failures: 0 },
    ac,
    speed: 30,
    initiative: 0,
    inspiration: false,
    xp: 0,
    spellcastingAbility: '',
    spellcastingClass: '',
    spellSaveDC: 0,
    spellAttackBonus: 0,
    spellSlots: [],
    attacks: [],
    spells: [],
    inventory: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    features: [],
    languages: [],
    proficiencies: [],
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    backstory: '', notes: '', bonds: '', ideals: '', flaws: '', traits: '',
    portrait: '',
    locked: false,
    updatedAt: 1000,
  } as unknown as Character
}

// ── Mock store for applyImport ────────────────────────────────────────────────

const mockAddCharacter    = vi.fn().mockResolvedValue(undefined)
const mockUpdateCharacter = vi.fn().mockResolvedValue(undefined)
const mockDeleteCharacter = vi.fn().mockResolvedValue(undefined)

let storeCharacters: Character[] = []

vi.mock('@/store/characters', () => ({
  useCharactersStore: {
    getState: () => ({
      get characters() { return storeCharacters },
      addCharacter:    (...a: unknown[]) => mockAddCharacter(...a),
      updateCharacter: (...a: unknown[]) => mockUpdateCharacter(...a),
      deleteCharacter: (...a: unknown[]) => mockDeleteCharacter(...a),
    }),
  },
}))

// ── buildExportBlob ───────────────────────────────────────────────────────────

describe('buildExportBlob', () => {
  it('blob is application/json type', () => {
    const { blob } = buildExportBlob([])
    expect(blob.type).toBe('application/json')
  })

  it('payload contains schema_version = EXPORT_SCHEMA_VERSION', async () => {
    const { blob } = buildExportBlob([])
    const text = await blob.text()
    const parsed = JSON.parse(text)
    expect(parsed.schema_version).toBe(EXPORT_SCHEMA_VERSION)
  })

  it('payload count matches characters array length', async () => {
    const chars = [makeChar('c1'), makeChar('c2'), makeChar('c3')]
    const { blob } = buildExportBlob(chars)
    const text = await blob.text()
    const parsed = JSON.parse(text)
    expect(parsed.count).toBe(3)
    expect(parsed.characters).toHaveLength(3)
  })

  it('preserves all character fields including ac', async () => {
    const char = makeChar('c1', 18)
    const { blob } = buildExportBlob([char])
    const text = await blob.text()
    const parsed = JSON.parse(text)
    expect(parsed.characters[0].ac).toBe(18)
    expect(parsed.characters[0].id).toBe('c1')
  })

  it('filename contains current date in YYYY-MM-DD format', () => {
    const { filename } = buildExportBlob([])
    const today = new Date().toISOString().split('T')[0]
    expect(filename).toBe(`tbt-rpg-export-${today}.json`)
  })

  it('handles empty characters array without error', async () => {
    const { blob } = buildExportBlob([])
    const text = await blob.text()
    const parsed = JSON.parse(text)
    expect(parsed.count).toBe(0)
    expect(parsed.characters).toEqual([])
  })

  it('exported_at is a valid ISO date string', async () => {
    const { blob } = buildExportBlob([])
    const text = await blob.text()
    const parsed = JSON.parse(text)
    expect(() => new Date(parsed.exported_at).toISOString()).not.toThrow()
  })
})

// ── parseImportFile ───────────────────────────────────────────────────────────

describe('parseImportFile', () => {
  function makeFile(content: string, name = 'export.json'): File {
    return new File([content], name, { type: 'application/json' })
  }

  it('returns payload for valid v10 export', async () => {
    const chars = [makeChar('c1')]
    const payload = {
      schema_version: EXPORT_SCHEMA_VERSION,
      exported_at: new Date().toISOString(),
      count: 1,
      characters: chars,
    }
    const file = makeFile(JSON.stringify(payload))
    const result = await parseImportFile(file)
    expect(result.schema_version).toBe(EXPORT_SCHEMA_VERSION)
    expect(result.characters).toHaveLength(1)
  })

  it('throws ImportError invalid_json for malformed JSON', async () => {
    const file = makeFile('not valid json {{')
    await expect(parseImportFile(file)).rejects.toMatchObject({
      name: 'ImportError',
      code: 'invalid_json',
    })
  })

  it('throws ImportError invalid_schema for missing characters field', async () => {
    const file = makeFile(JSON.stringify({ schema_version: 10, exported_at: '', count: 0 }))
    await expect(parseImportFile(file)).rejects.toMatchObject({
      name: 'ImportError',
      code: 'invalid_schema',
    })
  })

  it('throws ImportError invalid_schema for non-array characters', async () => {
    const file = makeFile(JSON.stringify({ schema_version: 10, exported_at: '', count: 0, characters: 'oops' }))
    await expect(parseImportFile(file)).rejects.toMatchObject({
      name: 'ImportError',
      code: 'invalid_schema',
    })
  })

  it('throws ImportError invalid_schema for null payload', async () => {
    const file = makeFile('null')
    await expect(parseImportFile(file)).rejects.toMatchObject({
      name: 'ImportError',
      code: 'invalid_schema',
    })
  })

  it('throws ImportError incompatible_version for schema_version !== 10', async () => {
    const file = makeFile(JSON.stringify({
      schema_version: 9,
      exported_at: '',
      count: 0,
      characters: [],
    }))
    await expect(parseImportFile(file)).rejects.toMatchObject({
      name: 'ImportError',
      code: 'incompatible_version',
    })
  })

  it('throws ImportError read_failed when file.text() rejects', async () => {
    const badFile = { text: () => Promise.reject(new Error('disk error')) } as unknown as File
    await expect(parseImportFile(badFile)).rejects.toMatchObject({
      name: 'ImportError',
      code: 'read_failed',
    })
  })
})

// ── ImportError class ─────────────────────────────────────────────────────────

describe('ImportError', () => {
  it('has name ImportError and correct code', () => {
    const err = new ImportError('test_code')
    expect(err.name).toBe('ImportError')
    expect(err.code).toBe('test_code')
    expect(err instanceof Error).toBe(true)
  })
})

// ── applyImport — merge mode ──────────────────────────────────────────────────

describe('applyImport — merge mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeCharacters = []
  })

  it('adds new characters with unknown IDs', async () => {
    storeCharacters = []
    const chars = [makeChar('new1'), makeChar('new2')]
    const result = await applyImport(chars, 'merge')
    expect(mockAddCharacter).toHaveBeenCalledTimes(2)
    expect(result.imported).toBe(2)
    expect(result.replaced).toBe(0)
  })

  it('updates existing characters by id', async () => {
    storeCharacters = [makeChar('existing1')]
    const chars = [makeChar('existing1', 20)]
    const result = await applyImport(chars, 'merge')
    expect(mockUpdateCharacter).toHaveBeenCalledWith('existing1', expect.objectContaining({ ac: 20 }))
    expect(result.imported).toBe(0)
    expect(result.replaced).toBe(1)
  })

  it('does not delete characters not in import', async () => {
    storeCharacters = [makeChar('keep1'), makeChar('keep2')]
    const chars = [makeChar('new1')]
    await applyImport(chars, 'merge')
    expect(mockDeleteCharacter).not.toHaveBeenCalled()
  })

  it('returns correct counts for mixed import', async () => {
    storeCharacters = [makeChar('existing')]
    const chars = [makeChar('existing', 18), makeChar('brandnew')]
    const result = await applyImport(chars, 'merge')
    expect(result.imported).toBe(1)
    expect(result.replaced).toBe(1)
  })

  it('handles empty import without errors', async () => {
    const result = await applyImport([], 'merge')
    expect(result.imported).toBe(0)
    expect(result.replaced).toBe(0)
    expect(mockAddCharacter).not.toHaveBeenCalled()
    expect(mockUpdateCharacter).not.toHaveBeenCalled()
  })
})

// ── applyImport — replace mode ────────────────────────────────────────────────

describe('applyImport — replace mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeCharacters = []
  })

  it('deletes all existing characters before inserting', async () => {
    storeCharacters = [makeChar('old1'), makeChar('old2')]
    await applyImport([makeChar('new1')], 'replace')
    expect(mockDeleteCharacter).toHaveBeenCalledWith('old1')
    expect(mockDeleteCharacter).toHaveBeenCalledWith('old2')
    expect(mockAddCharacter).toHaveBeenCalledWith(expect.objectContaining({ id: 'new1' }))
  })

  it('replaced count equals number of old characters', async () => {
    storeCharacters = [makeChar('old1'), makeChar('old2'), makeChar('old3')]
    const result = await applyImport([makeChar('new1')], 'replace')
    expect(result.replaced).toBe(3)
  })

  it('imported count equals number of new characters', async () => {
    storeCharacters = [makeChar('old1')]
    const chars = [makeChar('n1'), makeChar('n2'), makeChar('n3')]
    const result = await applyImport(chars, 'replace')
    expect(result.imported).toBe(3)
  })

  it('handles replace with zero existing and zero imported', async () => {
    storeCharacters = []
    const result = await applyImport([], 'replace')
    expect(result.replaced).toBe(0)
    expect(result.imported).toBe(0)
    expect(mockDeleteCharacter).not.toHaveBeenCalled()
    expect(mockAddCharacter).not.toHaveBeenCalled()
  })

  it('does not call updateCharacter in replace mode', async () => {
    storeCharacters = [makeChar('old')]
    await applyImport([makeChar('old', 12)], 'replace')
    expect(mockUpdateCharacter).not.toHaveBeenCalled()
  })
})
