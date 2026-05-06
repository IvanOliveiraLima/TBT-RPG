/**
 * IndexedDB wrapper for v2.
 *
 * Strategy:
 *   v1 DB  (dnd-character-sheet, v3)    — read-only in v2
 *   v2 DB  (dnd-character-sheet-v2, v1) — read + write
 *
 * listCharacters() merges both sources, applies the adapter, and returns
 * domain Character[]. v2 records win on id collision.
 *
 * saveCharacter() still persists as V1Character (same schema) so that v1
 * can continue reading the records. Phase C will revisit this when v2 has
 * its own save flow.
 *
 * copyFromV1(id)   copies a specific character from v1 → v2 before first edit.
 * deleteCharacter  is a stub — Phase C will add tombstones + sync.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { V1Character } from './schema-v1'
import type { Character } from '@/domain/character'
import { adaptCharacter } from './adapter'

/* ── DB constants ─────────────────────────────────────────────────────── */

const V1_DB_NAME = 'dnd-character-sheet'
const V1_DB_VER  = 3
const V1_STORE   = 'characters'

const V2_DB_NAME = 'dnd-character-sheet-v2'
const V2_DB_VER  = 1
const V2_STORE   = 'characters'

/* ── DB openers ───────────────────────────────────────────────────────── */

function openV1(): ReturnType<typeof openDB> {
  return openDB(V1_DB_NAME, V1_DB_VER, {
    upgrade(db) {
      // Never create — v1 manages its own schema. Only open if it exists.
      if (!db.objectStoreNames.contains(V1_STORE)) {
        db.createObjectStore(V1_STORE, { keyPath: 'id' })
      }
    },
  })
}

function openV2(): ReturnType<typeof openDB> {
  return openDB(V2_DB_NAME, V2_DB_VER, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(V2_STORE)) {
        db.createObjectStore(V2_STORE, { keyPath: 'id' })
      }
    },
  })
}

/* ── Public API ───────────────────────────────────────────────────────── */

/**
 * Returns merged list of characters from v1 + v2 as domain Character[].
 * Sorted by most recently updated. v2 records win on id collision.
 */
export async function listCharacters(): Promise<Character[]> {
  let v1db: IDBPDatabase | null = null
  let v2db: IDBPDatabase | null = null

  try {
    ;[v1db, v2db] = await Promise.all([openV1(), openV2()])

    const [v1All, v2All] = await Promise.all([
      v1db.getAll(V1_STORE) as Promise<V1Character[]>,
      v2db.getAll(V2_STORE) as Promise<V1Character[]>,
    ])

    const map = new Map<string, Character>()

    for (const c of v1All) {
      if (c.id === 'active') continue       // skip legacy record
      if (!c.page1?.basic_info) continue    // skip malformed
      try {
        map.set(c.id!, adaptCharacter(c))
      } catch (err) {
        console.error(`[listCharacters] Failed to adapt v1 character ${c.id}:`, err)
      }
    }
    for (const c of v2All) {
      if (c.id === 'active') continue
      if (!c.page1?.basic_info) continue
      try {
        map.set(c.id!, adaptCharacter(c))
      } catch (err) {
        console.error(`[listCharacters] Failed to adapt v2 character ${c.id}:`, err)
      }
    }

    return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (err) {
    console.error('[listCharacters] Failed to read characters:', err)
    return []
  } finally {
    v1db?.close()
    v2db?.close()
  }
}

/**
 * Fetch a single character by id. v2 wins on collision.
 * Returns null if not found in either DB, or on adapter error.
 */
export async function getCharacter(id: string): Promise<Character | null> {
  let v1db: IDBPDatabase | null = null
  let v2db: IDBPDatabase | null = null
  try {
    ;[v1db, v2db] = await Promise.all([openV1(), openV2()])
    const v2raw = await v2db.get(V2_STORE, id) as V1Character | undefined
    if (v2raw) return adaptCharacter(v2raw)
    const v1raw = await v1db.get(V1_STORE, id) as V1Character | undefined
    if (v1raw) return adaptCharacter(v1raw)
    return null
  } catch (err) {
    console.error('[getCharacter] Failed:', err)
    return null
  } finally {
    v1db?.close()
    v2db?.close()
  }
}

/**
 * Fetch the raw V1Character for a given id, without adapting to domain.
 * Checks v2 DB first (v2 wins on collision), falls back to v1 DB.
 * Used by serializeCharacter to preserve fields not modeled in the domain.
 * Returns null if not found in either DB.
 */
export async function getRawCharacter(id: string): Promise<V1Character | null> {
  let v1db: IDBPDatabase | null = null
  let v2db: IDBPDatabase | null = null
  try {
    ;[v1db, v2db] = await Promise.all([openV1(), openV2()])
    const v2raw = await v2db.get(V2_STORE, id) as V1Character | undefined
    if (v2raw) return v2raw
    const v1raw = await v1db.get(V1_STORE, id) as V1Character | undefined
    return v1raw ?? null
  } catch (err) {
    console.error('[getRawCharacter] Failed:', err)
    return null
  } finally {
    v1db?.close()
    v2db?.close()
  }
}

/**
 * Copy a character from v1 → v2 DB. Call before first edit in v2.
 * Returns the domain Character if found, null otherwise.
 */
export async function copyFromV1(id: string): Promise<Character | null> {
  let v1db: IDBPDatabase | null = null
  let v2db: IDBPDatabase | null = null
  try {
    ;[v1db, v2db] = await Promise.all([openV1(), openV2()])
    const raw = await v1db.get(V1_STORE, id) as V1Character | undefined
    if (!raw) return null
    const withTimestamp = { ...raw, updatedAt: Date.now() }
    await v2db.put(V2_STORE, withTimestamp)
    return adaptCharacter(withTimestamp)
  } finally {
    v1db?.close()
    v2db?.close()
  }
}

/**
 * Persist a character to both v1 DB and v2 DB.
 *
 * Writing to v1 DB: ensures v1 can read edits made in v2 (cross-version
 * round-trip invariant). v1 uses the same schema; additive v2 fields
 * (proficient, quantity, used) are ignored by v1 but do not break it.
 *
 * Writing to v2 DB: preserves additive v2 fields that would be lost if v1
 * later saves the character (v2 wins on collision in getCharacter/listCharacters).
 *
 * Both writes share the same updatedAt timestamp to keep the records in sync.
 */
export async function saveCharacter(data: V1Character): Promise<void> {
  let v1db: IDBPDatabase | null = null
  let v2db: IDBPDatabase | null = null
  try {
    ;[v1db, v2db] = await Promise.all([openV1(), openV2()])
    const record = { ...data, updatedAt: Date.now() }
    await Promise.all([
      v1db.put(V1_STORE, record),
      v2db.put(V2_STORE, record),
    ])
  } finally {
    v1db?.close()
    v2db?.close()
  }
}

/**
 * Delete — stub in Phase B. Phase C will implement tombstones + sync.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function deleteCharacter(_id: string): never {
  throw new Error('deleteCharacter: not implemented yet')
}
