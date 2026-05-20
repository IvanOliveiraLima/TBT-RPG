/**
 * IndexedDB wrapper for v2 — v2-native persistence.
 *
 * Strategy (Phase C.1.0 pivot):
 *   v2 DB  (dnd-character-sheet-v2, version 2) — read + write, stores Character directly
 *   v1 DB  (dnd-character-sheet, version 3)    — read-only, accessed only during migration
 *
 * Characters are stored as domain Character objects (v2-native schema).
 * The v1 DB is read ONCE via migrateV1Characters() (migration.ts), then
 * never touched again from v2. The v1 app at /TBT-RPG/ remains frozen and
 * unaware of v2's existence.
 *
 * Schema upgrade v1 → v2: the store is cleared because v1-shape V1Character
 * records are not compatible with v2-native Character records. Migration
 * re-populates from the v1 DB via the adapter.
 */

import { openDB } from 'idb'
import type { Character } from '@/domain/character'

/* ── DB constants ─────────────────────────────────────────────────────── */

const V2_DB_NAME = 'dnd-character-sheet-v2'
const V2_DB_VER  = 3
const V2_STORE   = 'characters'

/* ── DB opener ────────────────────────────────────────────────────────── */

function openV2() {
  return openDB(V2_DB_NAME, V2_DB_VER, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        db.createObjectStore(V2_STORE, { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        // v1-shape data (V1Character) is incompatible with v2-native Character.
        // Clear the store so migration can re-populate with adapted records.
        // This only affects dev environments that had C.1.a phase data.
        if (db.objectStoreNames.contains(V2_STORE)) {
          // Cannot use db.transaction during upgrade in this context — use deleteObjectStore + recreate
          db.deleteObjectStore(V2_STORE)
        }
        db.createObjectStore(V2_STORE, { keyPath: 'id' })
      }
      if (oldVersion < 3) {
        // Add className to each hitDice entry, deriving it from classes[i].name.
        // Characters stored in v2 DB have hitDice without className (C.1.c.4 shape change).
        // For fresh installs (store just recreated above), cursor is null and this loop is a no-op.
        const store = transaction.objectStore(V2_STORE)
        let cursor = await store.openCursor()
        while (cursor) {
          const char = cursor.value as Record<string, unknown>
          if (Array.isArray(char.hitDice)) {
            const classes = (char.classes as Array<{ name: string }> | undefined) ?? []
            char.hitDice = (char.hitDice as Array<Record<string, unknown>>).map((hd, i) => ({
              className: classes[i]?.name ?? '',
              ...hd,
            }))
            await cursor.update(char)
          }
          cursor = await cursor.continue()
        }
      }
    },
  })
}

/* ── Public API ───────────────────────────────────────────────────────── */

/**
 * Returns all characters from the v2 DB, sorted by most recently updated.
 * Post-migration this is the single source of truth; no v1 merging needed.
 */
export async function listCharacters(): Promise<Character[]> {
  const db = await openV2()
  try {
    const all = await db.getAll(V2_STORE) as Character[]
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  } finally {
    db.close()
  }
}

/**
 * Fetch a single character by id from the v2 DB.
 * Returns null if not found.
 */
export async function getCharacter(id: string): Promise<Character | null> {
  const db = await openV2()
  try {
    const result = await db.get(V2_STORE, id) as Character | undefined
    return result ?? null
  } finally {
    db.close()
  }
}

/**
 * Persist a Character to the v2 DB.
 * Always stamps updatedAt to the current time.
 *
 * IMPORTANT: writes ONLY to the v2 DB (dnd-character-sheet-v2).
 * The v1 DB is treated as read-only from v2's perspective.
 */
export async function saveCharacter(character: Character): Promise<void> {
  const db = await openV2()
  try {
    await db.put(V2_STORE, { ...character, updatedAt: Date.now() })
  } finally {
    db.close()
  }
}

/**
 * Delete a character by id from the v2 DB.
 */
export async function deleteCharacter(id: string): Promise<void> {
  const db = await openV2()
  try {
    await db.delete(V2_STORE, id)
  } finally {
    db.close()
  }
}
