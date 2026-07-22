export interface Combatant {
  id: string
  name: string
  initiative: number
  linkedCharacterId?: string
}

export interface InitiativeTracker {
  combatants: Combatant[]
  activeCombatantId: string | null
  round: number
  active: boolean
}

export function emptyTracker(): InitiativeTracker {
  return { combatants: [], activeCombatantId: null, round: 1, active: false }
}

/**
 * Sort combatants by initiative descending.
 * Stable: equal initiative values preserve insertion order.
 */
export function sortCombatants(list: Combatant[]): Combatant[] {
  return [...list].sort((a, b) => b.initiative - a.initiative)
}

export function startCombat(t: InitiativeTracker): InitiativeTracker {
  const sorted = sortCombatants(t.combatants)
  return { ...t, active: true, round: 1, activeCombatantId: sorted[0]?.id ?? null }
}

export function endCombat(t: InitiativeTracker): InitiativeTracker {
  return { ...t, active: false, activeCombatantId: null, round: 1 }
}

/**
 * Advance to the next combatant in sorted order.
 * At the end of the list wraps to the first and increments round.
 * If no active combatant is set, selects the first.
 */
export function nextTurn(t: InitiativeTracker): InitiativeTracker {
  const sorted = sortCombatants(t.combatants)
  if (sorted.length === 0) return t
  const idx = sorted.findIndex(c => c.id === t.activeCombatantId)
  if (idx === -1 || idx === sorted.length - 1) {
    return { ...t, activeCombatantId: sorted[0]!.id, round: t.round + 1 }
  }
  return { ...t, activeCombatantId: sorted[idx + 1]!.id }
}

/**
 * Go back to the previous combatant in sorted order.
 * Before the first wraps to the last and decrements round (min 1).
 */
export function prevTurn(t: InitiativeTracker): InitiativeTracker {
  const sorted = sortCombatants(t.combatants)
  if (sorted.length === 0) return t
  const idx = sorted.findIndex(c => c.id === t.activeCombatantId)
  if (idx <= 0) {
    return {
      ...t,
      activeCombatantId: sorted[sorted.length - 1]!.id,
      round: Math.max(1, t.round - 1),
    }
  }
  return { ...t, activeCombatantId: sorted[idx - 1]!.id }
}

export function addCombatant(t: InitiativeTracker, c: Combatant): InitiativeTracker {
  return { ...t, combatants: [...t.combatants, c] }
}

/**
 * Remove a combatant by id.
 * If the removed combatant was active, anchors to the next in sorted order
 * (wraps to first if removed was last; null if list becomes empty).
 */
export function removeCombatant(t: InitiativeTracker, id: string): InitiativeTracker {
  const remaining = t.combatants.filter(c => c.id !== id)
  let activeCombatantId = t.activeCombatantId

  if (t.activeCombatantId === id) {
    if (remaining.length === 0) {
      activeCombatantId = null
    } else {
      const sorted = sortCombatants(t.combatants)
      const idx = sorted.findIndex(c => c.id === id)
      const next = sorted[idx + 1]
      if (next) {
        activeCombatantId = next.id
      } else {
        activeCombatantId = sortCombatants(remaining)[0]!.id
      }
    }
  }

  return { ...t, combatants: remaining, activeCombatantId }
}

export function setInitiative(t: InitiativeTracker, id: string, value: number): InitiativeTracker {
  return {
    ...t,
    combatants: t.combatants.map(c => c.id === id ? { ...c, initiative: value } : c),
  }
}

export function renameCombatant(t: InitiativeTracker, id: string, name: string): InitiativeTracker {
  return {
    ...t,
    combatants: t.combatants.map(c => c.id === id ? { ...c, name } : c),
  }
}
