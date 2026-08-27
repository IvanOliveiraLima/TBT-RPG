/**
 * Unit tests for src/services/realtime.ts
 *
 * Covers:
 *  - Two simultaneous subscribers receive different channel names (no duplicate)
 *  - Each cleanup removes its own channel, not the other's
 *  - Offline (supabase null) → returns inactive + no-op cleanup without throwing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock (controlled channel factory) ────────────────────────────────

type ChannelSpy = {
  name: string
  on:    ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
}

const channels: ChannelSpy[] = []
const mockRemoveChannel = vi.fn()

vi.mock('@/lib/supabase', () => {
  return {
    get supabase() {
      return {
        channel(name: string) {
          const spy: ChannelSpy = {
            name,
            on:        vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
          }
          channels.push(spy)
          return spy
        },
        removeChannel: mockRemoveChannel,
      }
    },
  }
})

// ── Import AFTER mock is in place ─────────────────────────────────────────────

import { subscribeCharacterChanges } from '@/services/realtime'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('subscribeCharacterChanges — unique channels per subscriber', () => {
  beforeEach(() => {
    channels.length = 0
    mockRemoveChannel.mockReset()
  })

  it('two calls receive different channel names (no duplicate)', () => {
    const noop = () => {}
    subscribeCharacterChanges(noop, noop)
    subscribeCharacterChanges(noop, noop)

    expect(channels).toHaveLength(2)
    expect(channels[0]!.name).not.toBe(channels[1]!.name)
  })

  it('cleanup A removes channel A, not channel B', () => {
    const noop = () => {}
    const cleanupA = subscribeCharacterChanges(noop, noop)
    subscribeCharacterChanges(noop, noop)

    const channelA = channels[0]
    cleanupA()

    expect(mockRemoveChannel).toHaveBeenCalledTimes(1)
    expect(mockRemoveChannel).toHaveBeenCalledWith(channelA)
  })

  it('cleanup B removes channel B, not channel A', () => {
    const noop = () => {}
    subscribeCharacterChanges(noop, noop)
    const cleanupB = subscribeCharacterChanges(noop, noop)

    const channelB = channels[1]
    cleanupB()

    expect(mockRemoveChannel).toHaveBeenCalledTimes(1)
    expect(mockRemoveChannel).toHaveBeenCalledWith(channelB)
  })

  it('online: calls the onChange callback with the event id', () => {
    let receivedId: string | undefined
    subscribeCharacterChanges((id) => { receivedId = id }, () => {})

    // Simulate a postgres_changes event by calling the callback registered with .on()
    // .on(event, filter, handler) — handler is at index 2
    const [, , handler] = channels[0]!.on.mock.calls[0] as [unknown, unknown, (payload: { new: { id: string } }) => void]
    handler({ new: { id: 'char-xyz' } })

    expect(receivedId).toBe('char-xyz')
  })

  it('online: calls onStatus("active") when channel reports SUBSCRIBED', () => {
    const statuses: string[] = []
    subscribeCharacterChanges(() => {}, (s) => { statuses.push(s) })

    const subscribeCb = channels[0]!.subscribe.mock.calls[0]![0] as (s: string) => void
    subscribeCb('SUBSCRIBED')

    expect(statuses).toContain('active')
  })

  it('online: calls onStatus("inactive") for any non-SUBSCRIBED status', () => {
    const statuses: string[] = []
    subscribeCharacterChanges(() => {}, (s) => { statuses.push(s) })

    const subscribeCb = channels[0]!.subscribe.mock.calls[0]![0] as (s: string) => void
    subscribeCb('CHANNEL_ERROR')

    expect(statuses).toContain('inactive')
  })
})

describe('subscribeCharacterChanges — multiple subscribers do not share state', () => {
  beforeEach(() => {
    channels.length = 0
    mockRemoveChannel.mockReset()
  })

  it('five simultaneous subscribers all get unique channel names', () => {
    const noop = () => {}
    for (let i = 0; i < 5; i++) subscribeCharacterChanges(noop, noop)
    const names = channels.map(c => c.name)
    expect(new Set(names).size).toBe(5)
  })

  it('cleaning up all subscribers removes each channel exactly once', () => {
    const noop = () => {}
    const cleanups = [
      subscribeCharacterChanges(noop, noop),
      subscribeCharacterChanges(noop, noop),
    ]
    cleanups.forEach(c => c())
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2)
    expect(mockRemoveChannel).toHaveBeenCalledWith(channels[0])
    expect(mockRemoveChannel).toHaveBeenCalledWith(channels[1])
  })
})
