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
 * Persist a character to v2 DB.
 * Accepts the raw V1Character shape so the record remains readable by v1.
 * Phase C will define a proper v2 save flow with domain → v1 shape conversion.
 */
export async function saveCharacter(data: V1Character): Promise<void> {
  const db = await openV2()
  try {
    await db.put(V2_STORE, { ...data, updatedAt: Date.now() })
  } finally {
    db.close()
  }
}

/**
 * Delete — stub in Phase B. Phase C will implement tombstones + sync.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function deleteCharacter(_id: string): never {
  throw new Error('deleteCharacter: not implemented yet')
}
