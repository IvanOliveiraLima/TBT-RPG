/**
 * Sync service — Sub-fase 2.2 (download + multi-device).
 *
 * Responsibilities:
 *  - Upload local characters to Supabase (upsert into `characters` table + Storage images)
 *    with LWW guard: skip upload when cloud version is newer
 *  - Process pending tombstones:
 *    upsert row to `deleted_characters` cloud table before removing from `characters`
 *  - Download cloud characters to local (LWW conflict resolution by updatedAt)
 *  - Propagate cloud tombstones → delete local chars deleted on another device
 *  - Eager image download for chars new to this device (idempotent)
 *  - Debounced reactive sync: 15s after the last edit
 *  - Periodic background sync: every 30s
 *  - Online/offline event listeners
 */

import { supabase, getSession } from '@/lib/supabase'
import { useCharactersStore } from '@/store/characters'
import {
  getPendingTombstones,
  removeTombstone,
  listCharacters,
  getCharacter,
  deleteCharacter,
  importCharacter,
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

/* ── Per-character upload (with LWW guard) ───────────────────────────── */

async function uploadCharacter(character: Character, userId: string): Promise<void> {
  if (!supabase) return

  // LWW: check if cloud has a newer version before uploading
  const { data: cloudRow } = await supabase
    .from('characters')
    .select('updated_at')
    .eq('id', character.id)
    .maybeSingle() as { data: { updated_at: string } | null }

  if (cloudRow) {
    const cloudTime = new Date(cloudRow.updated_at).getTime()
    const localTime = character.updatedAt ?? 0
    if (cloudTime > localTime) return  // cloud is newer — download will handle it
  }

  const { error } = await supabase.from('characters').upsert({
    id:         character.id,
    user_id:    userId,
    data:       character,
    updated_at: new Date(character.updatedAt).toISOString(),
  })
  if (error) throw error

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

    // 2. Upload local characters (LWW: skip if cloud is newer)
    const characters = useCharactersStore.getState().characters
    for (const char of characters) {
      try {
        await uploadCharacter(char, userId)
      } catch (err) {
        console.warn('[sync] Failed to upload character', char.id, err)
      }
    }

    // 3. Download cloud → local: new chars, LWW overwrites, cloud tombstone propagation
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
