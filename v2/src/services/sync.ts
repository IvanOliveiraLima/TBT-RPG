/**
 * Sync service — Sub-fase 2.1 (upload + tombstones).
 *
 * Responsibilities:
 *  - Upload local characters to Supabase (upsert into `characters` table + Storage images)
 *  - Process pending tombstones (propagate cloud deletes)
 *  - Debounced reactive sync: 15s after the last edit
 *  - Periodic background sync: every 30s
 *  - Online/offline event listeners
 *
 * NOT in this sub-phase: download cloud→local, conflict resolution, UI retry polish.
 */

import { supabase, getSession } from '@/lib/supabase'
import { useCharactersStore } from '@/store/characters'
import { getPendingTombstones, removeTombstone } from '@/data/db'
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

/* ── Image upload helper ─────────────────────────────────────────────── */

function base64ToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
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

/* ── Per-character upload ────────────────────────────────────────────── */

async function uploadCharacter(character: Character, userId: string): Promise<void> {
  if (!supabase) return

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

/* ── Tombstone processing ────────────────────────────────────────────── */

async function processTombstones(userId: string): Promise<void> {
  const pending = await getPendingTombstones()

  for (const tombstone of pending) {
    if (tombstone.userId !== userId) continue  // tombstone from another user

    try {
      if (supabase) {
        const { error } = await supabase
          .from('characters')
          .delete()
          .eq('id', tombstone.id)
        if (error) throw error
      }

      // Delete images from Storage (best-effort)
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
    // 1. Propagate pending tombstones
    await processTombstones(userId)

    // 2. Upload all local characters
    const characters = useCharactersStore.getState().characters
    for (const char of characters) {
      try {
        await uploadCharacter(char, userId)
      } catch (err) {
        console.warn('[sync] Failed to upload character', char.id, err)
      }
    }

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
