/**
 * Debounced save scheduler for character edits.
 *
 * Batches rapid successive edits into a single IndexedDB write.
 * Matches v1's AUTO_SAVE_DEBOUNCE_MS = 800ms behaviour.
 *
 * Per-character-id: each character has its own timer so simultaneous
 * editors on different characters don't interfere.
 */

import type { V1Character } from '@/data/schema-v1'
import { saveCharacter } from '@/data/db'

const SAVE_DEBOUNCE_MS = 800

const saveTimers  = new Map<string, ReturnType<typeof setTimeout>>()
const pendingData = new Map<string, V1Character>()

/**
 * Schedule a save for `id` that fires after SAVE_DEBOUNCE_MS of inactivity.
 * Calling again before the timer fires cancels the previous timer (coalescing).
 */
export function scheduleSave(id: string, data: V1Character): void {
  const existing = saveTimers.get(id)
  if (existing !== undefined) clearTimeout(existing)

  pendingData.set(id, data)

  const timer = setTimeout(() => {
    saveTimers.delete(id)
    const toSave = pendingData.get(id)
    pendingData.delete(id)
    if (!toSave) return
    saveCharacter(toSave).catch((err: unknown) => {
      console.error('[scheduleSave] Failed to persist character', id, err)
    })
  }, SAVE_DEBOUNCE_MS)

  saveTimers.set(id, timer)
}

/**
 * Immediately flush all pending saves, bypassing the debounce timer.
 * Use before page unload or in tests that need synchronous verification.
 */
export async function flushPendingSaves(): Promise<void> {
  const ids = Array.from(saveTimers.keys())
  for (const id of ids) {
    const timer = saveTimers.get(id)
    if (timer !== undefined) clearTimeout(timer)
    saveTimers.delete(id)
    const data = pendingData.get(id)
    pendingData.delete(id)
    if (data) {
      try {
        await saveCharacter(data)
      } catch (err) {
        console.error('[flushPendingSaves] Failed to persist character', id, err)
      }
    }
  }
}
