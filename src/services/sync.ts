/**
 * Sync service — Sub-fase 2.2 (download + multi-device) + Sync.2 (conflict detection).
 *
 * Responsibilities:
 *  - Upload local characters to Supabase (upsert into `characters` table + Storage images)
 *    with LWW guard: skip upload when cloud version is newer
 *  - Conflict detection: dirty char + cloud advanced past baseUpdatedAt → hold, surface to user
 *  - Process pending tombstones:
 *    upsert row to `deleted_characters` cloud table before removing from `characters`
 *  - Download cloud characters to local (LWW conflict resolution by updatedAt);
 *    skip chars currently in conflict (both sides held intact until user resolves)
 *  - Propagate cloud tombstones → delete local chars deleted on another device
 *  - Eager image download for chars new to this device (idempotent)
 *  - Debounced reactive sync: 15s after the last edit
 *  - Periodic background sync: every 30s
 *  - Online/offline event listeners
 *  - Conflict resolution: resolveConflictKeepMine / KeepCloud / KeepBoth
 */

import { supabase, getSession } from '@/lib/supabase'
import { useCharactersStore } from '@/store/characters'
import { useSyncConflictStore } from '@/store/useSyncConflictStore'
import {
  getPendingTombstones,
  removeTombstone,
  listCharacters,
  getCharacter,
  deleteCharacter,
  importCharacter,
  markCharacterSynced,
} from '@/data/db'
import { deleteCharacterImages } from '@/services/delete-character'
import type { Character } from '@/domain/character'

/* ── Sync status ──────────────────────────────────────────────────────── */

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'

let currentStatus: SyncStatus = 'idle'
let statusListeners: Array<(s: SyncStatus) => void> = []

export function getSyncStatus(): SyncStatus {
  return currentStatus
}

/** Subscribe to sync status changes. Returns an unsubscribe function. */
export function onSyncStatusChange(listener: (s: SyncStatus) => void): () => void {
  statusListeners.push(listener)
  return () => {
    statusListeners = statusListeners.filter(l => l !== listener)
  }
}

function setSyncStatus(status: SyncStatus): void {
  currentStatus = status
  for (const l of statusListeners) l(status)
}

/* ── Cloud row shapes ─────────────────────────────────────────────────── */

interface CloudCharacterRow {
  id:         string
  user_id:    string
  data:       Character
  updated_at: string  // ISO timestamp from Postgres
}

interface CloudDeletedRow {
  id:         string
  user_id:    string
  deleted_at: string
}

/* ── Image helpers ────────────────────────────────────────────────────── */

function base64ToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function uploadImage(
  userId: string,
  characterId: string,
  kind: 'character' | 'symbol',
  dataUrl: string,
): Promise<void> {
  if (!supabase) return
  const bytes = base64ToBytes(dataUrl)
  const path = `${userId}/${characterId}/${kind}.png`
  const { error } = await supabase.storage
    .from('character-images')
    .upload(path, bytes, { upsert: true, contentType: 'image/png' })
  if (error) throw error
}

/* ── Per-character upload (with conflict detection + LWW guard) ─────── */

async function uploadCharacter(character: Character, userId: string): Promise<void> {
  if (!supabase) return

  // Fetch cloud row — updated_at for LWW, data for conflict resolution snapshot
  const { data: cloudRow } = await supabase
    .from('characters')
    .select('updated_at, data')
    .eq('id', character.id)
    .maybeSingle() as { data: { updated_at: string; data: Character } | null }

  if (cloudRow) {
    const cloudTime = new Date(cloudRow.updated_at).getTime()

    if (character.baseUpdatedAt !== undefined) {
      // Sync.2 conflict detection: char has a known reconciled base.
      // If cloud advanced past that base while we have local edits, it's a conflict.
      if (cloudTime > character.baseUpdatedAt) {
        useSyncConflictStore.getState().addConflict({
          local: character,
          cloud: { data: cloudRow.data, updatedAt: cloudTime },
        })
        return  // Hold — do not upload until user resolves
      }
      // Cloud is at or before our base — safe to upload (we branched from the same snapshot)
    } else {
      // Legacy (no baseUpdatedAt): fall back to original LWW guard by wall-clock time
      const localTime = character.updatedAt ?? 0
      if (cloudTime > localTime) return  // cloud is newer — download will handle it
    }
  }

  // Strip local-only sync metadata before sending to cloud
  const { dirty: _dirty, baseUpdatedAt: _base, ...charData } = character

  const { error } = await supabase.from('characters').upsert({
    id:         character.id,
    user_id:    userId,
    data:       charData,
    updated_at: new Date(character.updatedAt).toISOString(),
  })
  if (error) throw error

  // Mark local copy as clean; skips if a concurrent edit advanced updatedAt
  await markCharacterSynced(character.id, character.updatedAt)

  // Upload images to Storage (best-effort per image)
  if (character.images.character) {
    try {
      await uploadImage(userId, character.id, 'character', character.images.character)
    } catch (err) {
      console.warn('[sync] Image upload failed (character)', character.id, err)
    }
  }
  if (character.symbolImage) {
    try {
      await uploadImage(userId, character.id, 'symbol', character.symbolImage)
    } catch (err) {
      console.warn('[sync] Image upload failed (symbol)', character.id, err)
    }
  }
}

/* ── Tombstone processing (with cloud tombstone insert) ──────────────── */

async function processTombstones(userId: string): Promise<void> {
  const pending = await getPendingTombstones()

  for (const tombstone of pending) {
    if (tombstone.userId !== userId) continue  // tombstone from another user

    try {
      if (supabase) {
        // 1. Insert cloud tombstone (idempotent via PK) — must come before characters delete
        //    so other devices can see the deletion even if step 2 fails on retry
        const { error: tombError } = await supabase.from('deleted_characters').upsert({
          id:         tombstone.id,
          user_id:    userId,
          deleted_at: new Date(tombstone.deletedAt).toISOString(),
        })
        if (tombError) throw tombError

        // 2. Remove from characters
        const { error } = await supabase
          .from('characters')
          .delete()
          .eq('id', tombstone.id)
        if (error) throw error
      }

      // 3. Delete images from Storage (best-effort)
      try {
        await deleteCharacterImages(userId, tombstone.id)
      } catch {
        // Non-fatal — row is gone; orphaned images will be cleaned up later
      }

      await removeTombstone(tombstone.id)
    } catch (err) {
      console.warn('[sync] Failed to process tombstone, will retry', tombstone.id, err)
    }
  }
}

/* ── Image download (eager, idempotent) ──────────────────────────────── */

async function downloadCharacterImages(userId: string, characterId: string): Promise<void> {
  if (!supabase) return

  const prefix = `${userId}/${characterId}`
  const { data: files, error: listError } = await supabase.storage
    .from('character-images')
    .list(prefix)

  if (listError || !files || files.length === 0) return

  const localChar = await getCharacter(characterId)
  if (!localChar) return

  let updated = false

  for (const file of files) {
    const dotIdx = file.name.lastIndexOf('.')
    const kind = (dotIdx > -1 ? file.name.slice(0, dotIdx) : file.name) as 'character' | 'symbol'
    if (kind !== 'character' && kind !== 'symbol') continue

    // Idempotent: skip if local already has this image
    if (kind === 'character' && localChar.images.character) continue
    if (kind === 'symbol' && localChar.symbolImage) continue

    const path = `${prefix}/${file.name}`
    const { data: blob, error: dlErr } = await supabase.storage
      .from('character-images')
      .download(path)

    if (dlErr || !blob) {
      console.warn('[sync] Failed to download image', path, dlErr)
      continue
    }

    try {
      const base64 = await blobToBase64(blob)
      if (kind === 'character') {
        localChar.images = { ...localChar.images, character: base64 }
      } else {
        localChar.symbolImage = base64
      }
      updated = true
    } catch (err) {
      console.warn('[sync] Error converting image', path, err)
    }
  }

  if (updated) {
    await importCharacter(localChar)
  }
}

/* ── Character download (LWW + cloud tombstone propagation) ─────────── */

async function downloadCharacters(userId: string): Promise<void> {
  if (!supabase) return

  // 1. Fetch all characters from cloud
  const { data: cloudChars, error: charsError } = await supabase
    .from('characters')
    .select('id, user_id, data, updated_at')
    .eq('user_id', userId)
    .returns<CloudCharacterRow[]>()

  if (charsError) throw charsError

  // 2. Fetch cloud tombstones
  const { data: cloudTombstones, error: tombError } = await supabase
    .from('deleted_characters')
    .select('id, user_id, deleted_at')
    .eq('user_id', userId)
    .returns<CloudDeletedRow[]>()

  if (tombError) throw tombError

  const rows         = cloudChars      ?? []
  const deletedRows  = cloudTombstones ?? []
  const cloudCharIds = new Set(rows.map(r => r.id))
  const cloudTombIds = new Set(deletedRows.map(r => r.id))

  // 3. Local state
  const localChars   = await listCharacters()
  const pendingTombs = await getPendingTombstones()
  const localTombIds = new Set(pendingTombs.map(t => t.id))

  let storeNeedsRefresh = false

  // 4a. Process each cloud character
  for (const cloudChar of rows) {
    // Local has a pending delete for this char — don't resurrect it
    if (localTombIds.has(cloudChar.id)) continue

    const cloudTime = new Date(cloudChar.updated_at).getTime()
    const localChar = localChars.find(c => c.id === cloudChar.id)

    if (localChar) {
      // Conflict pending for this char — skip download until user resolves
      if (useSyncConflictStore.getState().hasConflict(cloudChar.id)) continue

      // LWW: only overwrite local if cloud is strictly newer
      if (cloudTime > (localChar.updatedAt ?? 0)) {
        await importCharacter({ ...cloudChar.data, updatedAt: cloudTime })
        storeNeedsRefresh = true
      }
    } else {
      // Cloud has this char; local doesn't
      if (cloudTombIds.has(cloudChar.id)) continue  // cloud already has it tombstoned — skip
      await importCharacter({ ...cloudChar.data, updatedAt: cloudTime })
      await downloadCharacterImages(userId, cloudChar.id)
      storeNeedsRefresh = true
    }
  }

  // 4b. Propagate cloud tombstones → delete local chars
  for (const localChar of localChars) {
    if (cloudCharIds.has(localChar.id)) continue  // handled above
    if (localTombIds.has(localChar.id)) continue  // pending local delete — sync will handle

    if (cloudTombIds.has(localChar.id)) {
      // Another device deleted this char deliberately — remove it locally too
      await deleteCharacter(localChar.id)
      storeNeedsRefresh = true
    }
    // No cloud char AND no cloud tombstone: ambiguous (may not have been uploaded yet).
    // Conservative fallback (Q2=C): keep local; next upload will reconcile.
  }

  if (storeNeedsRefresh) {
    await useCharactersStore.getState().fetchCharacters()
  }
}

/* ── Pre-fetch cloud tombstone IDs (upload guard) ────────────────────── */

async function fetchCloudTombstoneIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set()

  const { data, error } = await supabase
    .from('deleted_characters')
    .select('id')
    .eq('user_id', userId)
    .returns<{ id: string }[]>()

  if (error) {
    console.warn('[sync] Failed to pre-fetch cloud tombstones', error)
    return new Set()
  }

  return new Set((data ?? []).map(r => r.id))
}

/* ── syncAll ─────────────────────────────────────────────────────────── */

export async function syncAll(): Promise<void> {
  if (!navigator.onLine) {
    setSyncStatus('offline')
    return
  }

  const session = await getSession()
  if (!session) {
    setSyncStatus('idle')
    return
  }

  const userId = session.user.id
  setSyncStatus('syncing')

  try {
    // 1. Propagate pending tombstones (local deletes → cloud)
    await processTombstones(userId)

    // 2. Pre-fetch cloud tombstone IDs — prevents re-uploading chars deleted on another device
    const cloudTombstoneIds = await fetchCloudTombstoneIds(userId)

    // 3. Upload local characters — skip tombstoned and clean chars; LWW for the rest.
    //    dirty === undefined is treated as dirty (legacy: chars without the flag may have unsynced edits).
    let uploadPhaseDeletedLocally = false
    const characters = useCharactersStore.getState().characters
    for (const char of characters) {
      if (cloudTombstoneIds.has(char.id)) {
        // Deleted on another device — remove locally and do not re-upload
        try {
          await deleteCharacter(char.id)
          uploadPhaseDeletedLocally = true
        } catch (err) {
          console.warn('[sync] Failed to delete locally for tombstoned char', char.id, err)
        }
        continue
      }
      // Skip chars known to have no local edits; undefined ⇒ dirty (legacy compatibility)
      if (char.dirty === false) continue
      try {
        await uploadCharacter(char, userId)
      } catch (err) {
        console.warn('[sync] Failed to upload character', char.id, err)
      }
    }
    if (uploadPhaseDeletedLocally) {
      await useCharactersStore.getState().fetchCharacters()
    }

    // 4. Download cloud → local: new chars, LWW overwrites, cloud tombstone propagation
    await downloadCharacters(userId)

    setSyncStatus('idle')
  } catch (err) {
    console.error('[sync] syncAll failed', err)
    setSyncStatus('error')
  }
}

/* ── Debounced reactive sync (15s after last edit) ───────────────────── */

let editDebounceTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleEditSync(): void {
  if (editDebounceTimer !== null) {
    clearTimeout(editDebounceTimer)
  }
  editDebounceTimer = setTimeout(() => {
    editDebounceTimer = null
    void syncAll()
  }, 15_000)
}

/* ── Periodic background sync (30s) ─────────────────────────────────── */

let periodicTimer: ReturnType<typeof setInterval> | null = null

export function startPeriodicSync(): void {
  if (periodicTimer !== null) return  // already running
  periodicTimer = setInterval(() => { void syncAll() }, 30_000)
}

export function stopPeriodicSync(): void {
  if (periodicTimer !== null) {
    clearInterval(periodicTimer)
    periodicTimer = null
  }
}

/* ── Online/offline event listeners ─────────────────────────────────── */

let listenersInitialised = false

export function initSyncListeners(): void {
  if (listenersInitialised) return
  listenersInitialised = true

  window.addEventListener('online', () => {
    setSyncStatus('idle')
    void syncAll()
  })

  window.addEventListener('offline', () => {
    setSyncStatus('offline')
  })
}

/* ── Conflict resolution ─────────────────────────────────────────────── */

/**
 * Keep this device's version: force-upload local over cloud with a winning timestamp.
 *
 * Uses winTs = max(Date.now(), cloudUpdatedAt + 1) to guarantee the chosen version
 * is strictly newer than the cloud on every device's clock — so other devices running
 * LWW will pull it down and not revert to the old cloud version.
 *
 * Requires an active session (throws if not authenticated or supabase unavailable).
 */
export async function resolveConflictKeepMine(
  local: Character,
  cloudUpdatedAt: number,
): Promise<void> {
  if (!supabase) throw new Error('supabase_not_configured')
  const session = await getSession()
  if (!session) throw new Error('not_authenticated')

  // Stamp a timestamp guaranteed to beat the cloud's version on any device clock
  const winTs = Math.max(Date.now(), cloudUpdatedAt + 1)
  const { dirty: _dirty, baseUpdatedAt: _base, ...charData } = local
  const winner = { ...charData, updatedAt: winTs }

  const { error } = await supabase.from('characters').upsert({
    id:         local.id,
    user_id:    session.user.id,
    data:       winner,                              // updatedAt stamped inside data too
    updated_at: new Date(winTs).toISOString(),
  })
  if (error) throw error

  // Persist locally as clean and reconciled (importCharacter sets dirty:false, baseUpdatedAt:winTs)
  await importCharacter({ ...winner })
  useSyncConflictStore.getState().removeConflict(local.id)
  await useCharactersStore.getState().fetchCharacters()
}

/**
 * Keep cloud version: import the cloud snapshot locally (overwrites local edits).
 */
export async function resolveConflictKeepCloud(
  cloud: { data: Character; updatedAt: number },
  charId: string,
): Promise<void> {
  await importCharacter({ ...cloud.data, updatedAt: cloud.updatedAt })
  useSyncConflictStore.getState().removeConflict(charId)
  await useCharactersStore.getState().fetchCharacters()
}

/**
 * Keep both: cloud version stays at the original id (canonical); local edits become
 * a new character with a fresh id and the provided name, scheduled for next upload.
 * Zero data loss guaranteed.
 */
export async function resolveConflictKeepBoth(
  local: Character,
  cloud: { data: Character; updatedAt: number },
  copyName: string,
): Promise<void> {
  // 1. Cloud version overwrites the local record (becomes canonical at this id)
  await importCharacter({ ...cloud.data, updatedAt: cloud.updatedAt })

  // 2. Local edits become a new character with a fresh id (dirty → uploaded in next sync)
  const { dirty: _d, baseUpdatedAt: _b, ...localBase } = local
  const newId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const localCopy: Character = {
    ...localBase,
    id:        newId,
    name:      copyName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await useCharactersStore.getState().addCharacter(localCopy)

  useSyncConflictStore.getState().removeConflict(local.id)
  await useCharactersStore.getState().fetchCharacters()
}
