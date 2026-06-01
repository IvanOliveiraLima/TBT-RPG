/**
 * @deprecated v1 migration is no longer invoked at runtime.
 * v2 is fully independent from v1 DB as of the cut-v1-dependency refactor.
 *
 * migrateV1Characters() is kept here as a reference and potential utility
 * for a future "Import from v1 DB" feature if needed. Tests remain to
 * validate shape conversions.
 *
 * If this module starts being imported by boot code again, it re-introduces
 * the ghost-character bug: characters deleted from v2 would be reimported
 * from v1 on next reload (migration skips only existing IDs, not deleted IDs).
 *
 * ── Original purpose ─────────────────────────────────────────────────────────
 * One-time migration: v1 IndexedDB → v2 IndexedDB.
 *
 * Reads all characters from the v1 DB (dnd-character-sheet), adapts each one
 * to the domain Character shape via adaptCharacter(), and persists them to the
 * v2 DB (dnd-character-sheet-v2).
 *
 * Idempotent: characters whose id already exists in the v2 DB are skipped.
 * Subsequent boots see all ids already in v2 and produce migrated: 0, skipped: N.
 *
 * The v1 DB is opened with version 3 and NO upgrade callback — v2 must never
 * migrate or modify the v1 DB schema.
 *
 * Safe when v1 DB does not exist (fresh install or browser that never ran v1):
 * openDB throws and the function returns { migrated: 0, skipped: 0 } gracefully.
 */

import { openDB } from 'idb'
import type { V1Character } from './schema-v1'
import { adaptCharacter } from './adapter'
import { listCharacters, saveCharacter } from './db'

const V1_DB_NAME = 'dnd-character-sheet'
const V1_DB_VER  = 3
const V1_STORE   = 'characters'

export interface MigrationResult {
  migrated: number
  skipped:  number
}

/**
 * Migrate all v1 characters to the v2 DB.
 * Call once on app boot — idempotent, safe to call multiple times.
 */
export async function migrateV1Characters(): Promise<MigrationResult> {
  // Collect existing v2 ids first — characters already in v2 are skipped
  const v2chars = await listCharacters()
  const existingIds = new Set(v2chars.map(c => c.id))

  // Open v1 DB read-only — no upgrade callback so v2 never touches v1 schema
  let v1db: Awaited<ReturnType<typeof openDB>> | null = null
  try {
    v1db = await openDB(V1_DB_NAME, V1_DB_VER)
  } catch {
    // v1 DB does not exist (fresh install, private browsing, etc.)
    return { migrated: 0, skipped: 0 }
  }

  let v1chars: V1Character[]
  try {
    v1chars = await v1db.getAll(V1_STORE) as V1Character[]
  } finally {
    v1db.close()
  }

  let migrated = 0
  let skipped  = 0

  for (const v1char of v1chars) {
    // Skip legacy 'active' record and records without id
    if (!v1char.id || v1char.id === 'active') continue
    // Skip malformed records with no basic_info (can't adapt)
    if (!v1char.page1?.basic_info) continue
    // Skip already-migrated characters
    if (existingIds.has(v1char.id)) { skipped++; continue }

    try {
      const character = adaptCharacter(v1char)
      await saveCharacter(character)
      migrated++
    } catch (err) {
      console.error('[migration] Failed to adapt character', v1char.id, err)
    }
  }

  return { migrated, skipped }
}
