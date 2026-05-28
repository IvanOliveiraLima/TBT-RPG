/**
 * Character deletion service.
 *
 * Always deletes from local IndexedDB first. If that fails, throws
 * DeleteCharacterError('local_delete_failed') — nothing else runs.
 *
 * If the Supabase client is configured and the user is logged in, also
 * attempts to delete the row from the characters table and any uploaded
 * images from the character-images bucket. These operations are
 * best-effort: failures are collected in `result.errors` but do NOT
 * abort the flow. The character is gone locally regardless.
 *
 * v2 has no tombstone/sync layer yet — cloud delete is fire-and-forget.
 */

import { deleteCharacter as deleteFromDB } from '@/data/db'
import { supabase, getSession } from '@/lib/supabase'

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

  // 2a. Delete row from characters table
  try {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
    if (error) throw error
    result.cloudOk = true
  } catch {
    result.errors.push('cloud_delete_failed')
    // non-fatal — continue to storage
  }

  // 2b. Delete uploaded images from the character-images bucket
  try {
    await deleteCharacterImages(userId, characterId)
    result.storageOk = true
  } catch {
    result.errors.push('storage_delete_failed')
    // non-fatal
  }

  return result
}

// ── Storage helper ────────────────────────────────────────────────────────

async function deleteCharacterImages(userId: string, characterId: string): Promise<void> {
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
