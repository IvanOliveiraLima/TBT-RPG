/**
 * Character deletion service.
 *
 * Always deletes from local IndexedDB first. If that fails, throws
 * DeleteCharacterError('local_delete_failed') — nothing else runs.
 *
 * When the user is logged in:
 *  1. Creates a tombstone (ensures eventual cloud propagation even if offline)
 *  2. Attempts immediate cloud delete (best-effort)
 *  3. Attempts immediate Storage cleanup (best-effort)
 *  If both cloud + storage succeed, removes the tombstone (sync already done).
 *  If either fails, tombstone stays pending — sync service retries on next cycle.
 */

import { deleteCharacter as deleteFromDB, createTombstone, removeTombstone } from '@/data/db'
import { supabase, getSession } from '@/lib/supabase'
import { unlinkCharacterFromAllCampaigns } from '@/services/campaign-characters'

// ── Types ─────────────────────────────────────────────────────────────────

export interface DeleteCharacterResult {
  localOk:   boolean
  cloudOk:   boolean
  storageOk: boolean
  errors:    string[]
}

export class DeleteCharacterError extends Error {
  readonly code:   string
  readonly result: DeleteCharacterResult

  constructor(code: string, result: DeleteCharacterResult) {
    super(`Delete character failed: ${code}`)
    this.name   = 'DeleteCharacterError'
    this.code   = code
    this.result = result
  }
}

export function parseDeleteErrorCode(err: unknown): string {
  if (err instanceof DeleteCharacterError) return err.code
  return 'unknown'
}

// ── Service ───────────────────────────────────────────────────────────────

export async function deleteCharacterService(characterId: string): Promise<DeleteCharacterResult> {
  const result: DeleteCharacterResult = {
    localOk:   false,
    cloudOk:   false,
    storageOk: false,
    errors:    [],
  }

  // 1. Local IndexedDB — mandatory; throws on failure
  try {
    await deleteFromDB(characterId)
    result.localOk = true
  } catch {
    result.errors.push('local_delete_failed')
    throw new DeleteCharacterError('local_delete_failed', result)
  }

  // 2. Cloud — only when Supabase is configured and user is logged in
  if (!supabase) return result

  const session = await getSession()
  if (!session) return result

  const userId = session.user.id

  // 2a. Tombstone — guarantees eventual cloud propagation (even if offline)
  await createTombstone(characterId, userId)

  // 2b. Cascade unlink from campaign_characters (best-effort; mestre won't see stale links)
  try {
    await unlinkCharacterFromAllCampaigns(characterId)
  } catch {
    // non-fatal
  }

  // 2d. Delete row from characters table (best-effort; tombstone retries if fails)
  try {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
    if (error) throw error
    result.cloudOk = true
  } catch {
    result.errors.push('cloud_delete_failed')
    // non-fatal — tombstone will retry on next sync cycle
  }

  // 2e. Delete uploaded images from the character-images bucket (best-effort)
  try {
    await deleteCharacterImages(userId, characterId)
    result.storageOk = true
  } catch {
    result.errors.push('storage_delete_failed')
    // non-fatal — tombstone handles cleanup
  }

  // If both cloud operations succeeded, remove the tombstone (sync done immediately)
  if (result.cloudOk && result.storageOk) {
    await removeTombstone(characterId)
  }

  return result
}

// ── Storage helper ────────────────────────────────────────────────────────

/** Exported for use by the sync service when processing tombstones. */
export async function deleteCharacterImages(userId: string, characterId: string): Promise<void> {
  if (!supabase) return

  const prefix = `${userId}/${characterId}`

  const { data: files, error: listError } = await supabase.storage
    .from('character-images')
    .list(prefix)

  if (listError) throw listError
  if (!files || files.length === 0) return

  const paths = files.map(f => `${prefix}/${f.name}`)

  const { error: removeError } = await supabase.storage
    .from('character-images')
    .remove(paths)

  if (removeError) throw removeError
}
