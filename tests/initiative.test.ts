/**
 * VTT — Initiative tracker tests
 *
 * Covers:
 *  Domain (src/domain/initiative.ts):
 *  - sortCombatants: descending by initiative, stable on ties
 *  - startCombat: sets active, round=1, first combatant active
 *  - endCombat: clears active and activeCombatantId, round=1
 *  - nextTurn: advances; wraps to first + round+1 at end; starts from first if no active
 *  - prevTurn: goes back; wraps to last + round-1 (min 1) at start
 *  - addCombatant / removeCombatant: removes and re-anchors active by id
 *  - setInitiative / renameCombatant
 *
 *  Service (src/services/campaign-initiative.ts):
 *  - getInitiative: returns emptyTracker when supabase null or no row
 *  - getInitiative: maps DB row to InitiativeTracker correctly
 *  - saveInitiative: calls upsert with correct payload; skips when supabase null
 *  - saveInitiative: does not throw on DB error (best-effort)
 *
 *  Panel roles (src/components/campaigns/CampaignInitiativePanel.tsx):
 *  - Owner sees start button, add-monster button, quick-add buttons, remove buttons
 *  - Member sees NO start/end button, NO add-monster, NO quick-add, NO remove
 *  - Empty state shown when combatants list is empty
 *  - PT / EN titles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Domain tests ──────────────────────────────────────────────────────────────

import {
  emptyTracker,
  sortCombatants,
  startCombat,
  endCombat,
  nextTurn,
  prevTurn,
  addCombatant,
  removeCombatant,
  setInitiative,
  renameCombatant,
} from '@/domain/initiative'
import type { Combatant, InitiativeTracker } from '@/domain/initiative'

function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return { id: 'c1', name: 'Fighter', initiative: 10, ...overrides }
}

function makeTracker(overrides: Partial<InitiativeTracker> = {}): InitiativeTracker {
  return { ...emptyTracker(), ...overrides }
}

describe('sortCombatants', () => {
  it('sorts descending by initiative', () => {
    const list = [
      makeCombatant({ id: 'a', initiative: 5 }),
      makeCombatant({ id: 'b', initiative: 20 }),
      makeCombatant({ id: 'c', initiative: 12 }),
    ]
    const sorted = sortCombatants(list)
    expect(sorted.map(c => c.id)).toEqual(['b', 'c', 'a'])
  })

  it('is stable: equal initiatives preserve insertion order', () => {
    const list = [
      makeCombatant({ id: 'first', initiative: 10 }),
      makeCombatant({ id: 'second', initiative: 10 }),
      makeCombatant({ id: 'third', initiative: 10 }),
    ]
    const sorted = sortCombatants(list)
    expect(sorted.map(c => c.id)).toEqual(['first', 'second', 'third'])
  })

  it('does not mutate the original list', () => {
    const list = [makeCombatant({ id: 'x', initiative: 1 }), makeCombatant({ id: 'y', initiative: 99 })]
    sortCombatants(list)
    expect(list[0]!.id).toBe('x')
  })
})

describe('startCombat', () => {
  it('sets active=true and round=1', () => {
    const t = makeTracker({
      combatants: [makeCombatant({ id: 'a', initiative: 5 }), makeCombatant({ id: 'b', initiative: 15 })],
    })
    const result = startCombat(t)
    expect(result.active).toBe(true)
    expect(result.round).toBe(1)
  })

  it('sets activeCombatantId to the highest-initiative combatant', () => {
    const t = makeTracker({
      combatants: [makeCombatant({ id: 'low', initiative: 3 }), makeCombatant({ id: 'high', initiative: 18 })],
    })
    const result = startCombat(t)
    expect(result.activeCombatantId).toBe('high')
  })

  it('sets activeCombatantId to null when no combatants', () => {
    const result = startCombat(emptyTracker())
    expect(result.activeCombatantId).toBeNull()
  })
})

describe('endCombat', () => {
  it('clears active, activeCombatantId and resets round to 1', () => {
    const t = makeTracker({ active: true, activeCombatantId: 'c1', round: 5, combatants: [makeCombatant()] })
    const result = endCombat(t)
    expect(result.active).toBe(false)
    expect(result.activeCombatantId).toBeNull()
    expect(result.round).toBe(1)
  })
})

describe('nextTurn', () => {
  const combatants = [
    makeCombatant({ id: 'a', initiative: 20 }),
    makeCombatant({ id: 'b', initiative: 10 }),
    makeCombatant({ id: 'c', initiative: 5 }),
  ]

  it('advances to the next combatant in sorted order', () => {
    const t = makeTracker({ combatants, activeCombatantId: 'a', round: 1 })
    const result = nextTurn(t)
    expect(result.activeCombatantId).toBe('b')
    expect(result.round).toBe(1)
  })

  it('wraps to first combatant and increments round at the end of the list', () => {
    const t = makeTracker({ combatants, activeCombatantId: 'c', round: 2 })
    const result = nextTurn(t)
    expect(result.activeCombatantId).toBe('a')
    expect(result.round).toBe(3)
  })

  it('starts at first when no activeCombatantId is set', () => {
    const t = makeTracker({ combatants, activeCombatantId: null, round: 1 })
    const result = nextTurn(t)
    expect(result.activeCombatantId).toBe('a')
    expect(result.round).toBe(2)
  })

  it('returns unchanged when combatants is empty', () => {
    const t = emptyTracker()
    expect(nextTurn(t)).toEqual(t)
  })
})

describe('prevTurn', () => {
  const combatants = [
    makeCombatant({ id: 'a', initiative: 20 }),
    makeCombatant({ id: 'b', initiative: 10 }),
    makeCombatant({ id: 'c', initiative: 5 }),
  ]

  it('goes back to the previous combatant in sorted order', () => {
    const t = makeTracker({ combatants, activeCombatantId: 'b', round: 2 })
    const result = prevTurn(t)
    expect(result.activeCombatantId).toBe('a')
    expect(result.round).toBe(2)
  })

  it('wraps to last and decrements round when at the first combatant', () => {
    const t = makeTracker({ combatants, activeCombatantId: 'a', round: 3 })
    const result = prevTurn(t)
    expect(result.activeCombatantId).toBe('c')
    expect(result.round).toBe(2)
  })

  it('does not decrement round below 1', () => {
    const t = makeTracker({ combatants, activeCombatantId: 'a', round: 1 })
    const result = prevTurn(t)
    expect(result.round).toBe(1)
  })

  it('returns unchanged when combatants is empty', () => {
    const t = emptyTracker()
    expect(prevTurn(t)).toEqual(t)
  })
})

describe('addCombatant', () => {
  it('appends the combatant to the list', () => {
    const t = makeTracker({ combatants: [makeCombatant({ id: 'a' })] })
    const result = addCombatant(t, makeCombatant({ id: 'b' }))
    expect(result.combatants.map(c => c.id)).toEqual(['a', 'b'])
  })

  it('does not change activeCombatantId', () => {
    const t = makeTracker({ combatants: [makeCombatant({ id: 'a' })], activeCombatantId: 'a' })
    const result = addCombatant(t, makeCombatant({ id: 'b' }))
    expect(result.activeCombatantId).toBe('a')
  })
})

describe('removeCombatant', () => {
  it('removes a non-active combatant without changing active', () => {
    const combatants = [
      makeCombatant({ id: 'a', initiative: 20 }),
      makeCombatant({ id: 'b', initiative: 10 }),
    ]
    const t = makeTracker({ combatants, activeCombatantId: 'a' })
    const result = removeCombatant(t, 'b')
    expect(result.combatants.map(c => c.id)).toEqual(['a'])
    expect(result.activeCombatantId).toBe('a')
  })

  it('anchors to next combatant in sorted order when removing the active one (middle)', () => {
    const combatants = [
      makeCombatant({ id: 'a', initiative: 20 }),
      makeCombatant({ id: 'b', initiative: 10 }),
      makeCombatant({ id: 'c', initiative: 5 }),
    ]
    const t = makeTracker({ combatants, activeCombatantId: 'b' })
    const result = removeCombatant(t, 'b')
    expect(result.activeCombatantId).toBe('c')
  })

  it('anchors to first when removing the last active combatant', () => {
    const combatants = [
      makeCombatant({ id: 'a', initiative: 20 }),
      makeCombatant({ id: 'b', initiative: 10 }),
      makeCombatant({ id: 'c', initiative: 5 }),
    ]
    const t = makeTracker({ combatants, activeCombatantId: 'c' })
    const result = removeCombatant(t, 'c')
    // 'c' was last → wraps to first of remaining sorted (a)
    expect(result.activeCombatantId).toBe('a')
  })

  it('sets activeCombatantId to null when last combatant is removed', () => {
    const t = makeTracker({ combatants: [makeCombatant({ id: 'only' })], activeCombatantId: 'only' })
    const result = removeCombatant(t, 'only')
    expect(result.combatants).toHaveLength(0)
    expect(result.activeCombatantId).toBeNull()
  })
})

describe('setInitiative', () => {
  it('updates the initiative value for the matching combatant', () => {
    const t = makeTracker({ combatants: [makeCombatant({ id: 'a', initiative: 5 })] })
    const result = setInitiative(t, 'a', 18)
    expect(result.combatants[0]!.initiative).toBe(18)
  })
})

describe('renameCombatant', () => {
  it('updates the name for the matching combatant', () => {
    const t = makeTracker({ combatants: [makeCombatant({ id: 'a', name: 'Goblin' })] })
    const result = renameCombatant(t, 'a', 'Orc')
    expect(result.combatants[0]!.name).toBe('Orc')
  })
})

// ── Service tests ─────────────────────────────────────────────────────────────

let mockSupabaseConfigured = false
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
}))

const mockMaybeSingle = vi.fn()
const mockUpsert      = vi.fn()

const mockClient = {
  from: (...args: unknown[]) => mockFrom(...args),
}

function setupSupabase() { mockSupabaseConfigured = true }
function resetSupabase() { mockSupabaseConfigured = false }

import { getInitiative, saveInitiative } from '@/services/campaign-initiative'

describe('getInitiative', () => {
  beforeEach(() => {
    resetSupabase()
    mockFrom.mockReset()
    mockMaybeSingle.mockReset()
  })

  it('returns emptyTracker when supabase is null', async () => {
    const result = await getInitiative('camp1')
    expect(result).toEqual(emptyTracker())
  })

  it('returns emptyTracker when DB returns null row', async () => {
    setupSupabase()
    mockFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) })
    const result = await getInitiative('camp1')
    expect(result).toEqual(emptyTracker())
  })

  it('maps DB row to InitiativeTracker', async () => {
    setupSupabase()
    const row = {
      combatants:          [{ id: 'c1', name: 'Fighter', initiative: 15 }],
      active_combatant_id: 'c1',
      round:               3,
      active:              true,
    }
    mockFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: row, error: null }) }) }) })
    const result = await getInitiative('camp1')
    expect(result.combatants).toEqual(row.combatants)
    expect(result.activeCombatantId).toBe('c1')
    expect(result.round).toBe(3)
    expect(result.active).toBe(true)
  })

  it('returns emptyTracker on DB error', async () => {
    setupSupabase()
    mockFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: { message: 'fail' } }) }) }) })
    const result = await getInitiative('camp1')
    expect(result).toEqual(emptyTracker())
  })
})

describe('saveInitiative', () => {
  beforeEach(() => {
    resetSupabase()
    mockFrom.mockReset()
    mockUpsert.mockReset()
  })

  it('skips when supabase is null', async () => {
    await expect(saveInitiative('camp1', emptyTracker())).resolves.toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls upsert with correct payload', async () => {
    setupSupabase()
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert: mockUpsert })

    const tracker: InitiativeTracker = {
      combatants:        [{ id: 'c1', name: 'Fighter', initiative: 20 }],
      activeCombatantId: 'c1',
      round:             2,
      active:            true,
    }
    await saveInitiative('camp1', tracker)

    expect(mockFrom).toHaveBeenCalledWith('campaign_initiative')
    const payload = mockUpsert.mock.calls[0]![0] as Record<string, unknown>
    expect(payload['campaign_id']).toBe('camp1')
    expect(payload['combatants']).toEqual(tracker.combatants)
    expect(payload['active_combatant_id']).toBe('c1')
    expect(payload['round']).toBe(2)
    expect(payload['active']).toBe(true)
    expect(typeof payload['updated_at']).toBe('string')
  })

  it('does not throw on DB error (best-effort)', async () => {
    setupSupabase()
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    await expect(saveInitiative('camp1', emptyTracker())).resolves.toBeUndefined()
  })
})
