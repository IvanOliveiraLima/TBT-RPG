/**
 * Tests for save-debounce.ts (scheduleSave + flushPendingSaves).
 *
 * Uses fake timers to control the 800ms debounce precisely.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/data/db', () => ({
  saveCharacter: vi.fn().mockResolvedValue(undefined),
}))

import { scheduleSave, flushPendingSaves } from '@/lib/save-debounce'
import { saveCharacter } from '@/data/db'
import type { V1Character } from '@/data/schema-v1'

const CHAR_A: V1Character = { id: 'a', page1: { basic_info: { char_name: 'Alice' } } }
const CHAR_B: V1Character = { id: 'b', page1: { basic_info: { char_name: 'Bob' } } }
const CHAR_A2: V1Character = { id: 'a', page1: { basic_info: { char_name: 'Alice Updated' } } }

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  vi.mocked(saveCharacter).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('scheduleSave — basic timing', () => {
  it('does not call saveCharacter before 800ms', () => {
    scheduleSave('a', CHAR_A)
    vi.advanceTimersByTime(799)
    expect(saveCharacter).not.toHaveBeenCalled()
  })

  it('calls saveCharacter after 800ms', async () => {
    scheduleSave('a', CHAR_A)
    await vi.advanceTimersByTimeAsync(800)
    expect(saveCharacter).toHaveBeenCalledOnce()
    expect(saveCharacter).toHaveBeenCalledWith(CHAR_A)
  })
})

describe('scheduleSave — coalescing', () => {
  it('coalesces multiple updates within 800ms into a single save', async () => {
    scheduleSave('a', CHAR_A)
    vi.advanceTimersByTime(400)
    scheduleSave('a', CHAR_A2)  // resets timer
    vi.advanceTimersByTime(400)
    // Only 800ms total but timer was reset at 400ms → not yet fired
    expect(saveCharacter).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(400)  // 400ms after reset = 800ms total
    expect(saveCharacter).toHaveBeenCalledOnce()
    expect(saveCharacter).toHaveBeenCalledWith(CHAR_A2)  // latest data wins
  })

  it('saves the most recent data when coalesced', async () => {
    scheduleSave('a', CHAR_A)
    scheduleSave('a', CHAR_A2)
    await vi.advanceTimersByTimeAsync(800)
    expect(saveCharacter).toHaveBeenCalledOnce()
    expect(saveCharacter).toHaveBeenCalledWith(CHAR_A2)
  })
})

describe('scheduleSave — independent per id', () => {
  it('schedules independent timers per character id', async () => {
    scheduleSave('a', CHAR_A)
    vi.advanceTimersByTime(400)
    scheduleSave('b', CHAR_B)

    await vi.advanceTimersByTimeAsync(400)  // 800ms since 'a' was scheduled
    expect(saveCharacter).toHaveBeenCalledOnce()
    expect(saveCharacter).toHaveBeenCalledWith(CHAR_A)

    await vi.advanceTimersByTimeAsync(400)  // 800ms since 'b' was scheduled
    expect(saveCharacter).toHaveBeenCalledTimes(2)
    expect(saveCharacter).toHaveBeenLastCalledWith(CHAR_B)
  })

  it('coalescing one id does not affect other ids', async () => {
    scheduleSave('a', CHAR_A)
    scheduleSave('b', CHAR_B)
    scheduleSave('a', CHAR_A2)  // only 'a' is coalesced

    await vi.advanceTimersByTimeAsync(800)

    // Both should have fired, 'a' with latest data
    expect(saveCharacter).toHaveBeenCalledTimes(2)
    const calls = vi.mocked(saveCharacter).mock.calls
    const aCall = calls.find(c => (c[0] as V1Character).id === 'a')
    const bCall = calls.find(c => (c[0] as V1Character).id === 'b')
    expect((aCall?.[0] as V1Character).page1?.basic_info?.char_name).toBe('Alice Updated')
    expect((bCall?.[0] as V1Character).page1?.basic_info?.char_name).toBe('Bob')
  })
})

describe('flushPendingSaves', () => {
  it('immediately calls saveCharacter without waiting for timer', async () => {
    scheduleSave('a', CHAR_A)
    await flushPendingSaves()
    expect(saveCharacter).toHaveBeenCalledOnce()
    expect(saveCharacter).toHaveBeenCalledWith(CHAR_A)
    // Timer should have been cleared — advancing time should not cause another call
    await vi.advanceTimersByTimeAsync(800)
    expect(saveCharacter).toHaveBeenCalledOnce()
  })

  it('flushes all pending ids at once', async () => {
    scheduleSave('a', CHAR_A)
    scheduleSave('b', CHAR_B)
    await flushPendingSaves()
    expect(saveCharacter).toHaveBeenCalledTimes(2)
  })

  it('resolves even when there are no pending saves', async () => {
    await expect(flushPendingSaves()).resolves.not.toThrow()
    expect(saveCharacter).not.toHaveBeenCalled()
  })
})
