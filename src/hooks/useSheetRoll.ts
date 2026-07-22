/**
 * useSheetRoll — contextual roll helpers for sheet components.
 *
 * All helpers log to useDiceStore (history + open the panel).
 * - rollCheck: d20 + bonus with current rollMode (vant/desv only affects d20)
 * - rollDamage: damage notation (normal mode always; crit doubles dice count)
 * - rollExpr: free notation (normal mode always)
 */
import { roll, doubleDiceCount } from '@/domain/dice'
import type { RollKind } from '@/domain/dice'
import { useDiceStore } from '@/store/useDiceStore'

interface CritDamage {
  label: string
  damage: string
}

export function useSheetRoll() {
  const rollMode = useDiceStore(s => s.rollMode)
  const addRoll = useDiceStore(s => s.addRoll)
  const open = useDiceStore(s => s.open)
  const setCritContext = useDiceStore(s => s.setCritContext)
  const clearCritContext = useDiceStore(s => s.clearCritContext)

  /**
   * Roll a d20 check with the global rollMode.
   * If the result is a crit hit AND critDamage is provided, stores critContext.
   */
  function rollCheck(label: string, bonus: number, critDamage?: CritDamage, kind?: RollKind): void {
    const bonusPart = bonus !== 0 ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''
    const notation = `d20${bonusPart}`
    const opts: Parameters<typeof roll>[1] = { mode: rollMode, label }
    if (kind !== undefined) opts.kind = kind
    const result = roll(notation, opts)
    addRoll(result)
    clearCritContext()
    if (result.crit === 'hit' && critDamage !== undefined) {
      setCritContext(critDamage)
    }
    open()
  }

  /**
   * Roll a damage expression (mode always 'normal').
   * With `crit: true`, dice count is doubled via doubleDiceCount.
   * No-ops if notation is empty.
   */
  function rollDamage(label: string, notation: string, opts?: { crit?: boolean }): void {
    const n = opts?.crit === true ? doubleDiceCount(notation) : notation
    if (!n) return
    const result = roll(n, { mode: 'normal', label })
    addRoll(result)
    open()
  }

  /**
   * Roll a free notation (hit die, death save, etc.) with mode 'normal'.
   * No-ops if notation is empty.
   */
  function rollExpr(label: string, notation: string): void {
    if (!notation) return
    const result = roll(notation, { mode: 'normal', label })
    addRoll(result)
    open()
  }

  function rollInitiative(label: string, bonus: number): void {
    rollCheck(label, bonus, undefined, 'initiative')
  }

  return { rollCheck, rollDamage, rollExpr, rollInitiative }
}
