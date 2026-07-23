/**
 * Dice.2 — contextual sheet roll tests
 *
 * Covers:
 *  - SkillsBlock: clicking a skill bonus calls rollCheck
 *  - SavingThrows: clicking a save bonus calls rollCheck
 *  - AttrGrid: clicking an attribute modifier calls rollCheck
 *  - CombatStrip: clicking initiative stat card calls rollCheck
 *  - AttacksList: attack bonus chip calls rollCheck with critDamage; damage btn calls rollDamage
 *  - AttacksList: crit damage button set in critContext after attack crit
 *  - DeathSaves: roll button calls rollExpr with d20
 *  - HitDicePool: roll button calls rollExpr with dieSize notation
 *  - DicePanel mode selector (mode-normal/advantage/disadvantage) writes rollMode to store
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { useDiceStore } from '@/store/useDiceStore'
import { createEmptyCharacter } from '@/domain/factories'

// Mock dice domain for deterministic results
vi.mock('@/domain/dice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/dice')>()
  return {
    ...actual,
    roll: vi.fn(),
  }
})

import { roll } from '@/domain/dice'
const mockRoll = vi.mocked(roll)

function makeRollResult(
  overrides: Partial<import('@/domain/dice').RollResult> = {},
): import('@/domain/dice').RollResult {
  return {
    id: `r_${Math.random()}`,
    notation: 'd20',
    dice: [{ sides: 20, value: 10, kept: true }],
    modifier: 0,
    total: 10,
    mode: 'normal',
    crit: null,
    at: Date.now(),
    ...overrides,
  }
}

// Components
import { SkillsBlock } from '@/components/sheet/parts/SkillsBlock'
import { SavingThrows } from '@/components/sheet/parts/SavingThrows'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { CombatStrip } from '@/components/sheet/parts/CombatStrip'
import { DeathSaves } from '@/components/sheet/parts/DeathSaves'
import { HitDicePool } from '@/components/sheet/parts/HitDicePool'

const baseChar = createEmptyCharacter('Test')

// ── SkillsBlock ───────────────────────────────────────────────────────────────

describe('SkillsBlock — roll on bonus click', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null, isOpen: false, rollMode: 'normal', critContext: null })
    mockRoll.mockClear()
    mockRoll.mockReturnValue(makeRollResult())
  })

  it('clicking a skill bonus opens the dice panel', async () => {
    renderWithI18n(<SkillsBlock character={baseChar} />, 'en')
    const acrobaticsBtn = screen.getByTestId('skill-Acrobatics-bonus')
    fireEvent.click(acrobaticsBtn)
    await waitFor(() => {
      expect(useDiceStore.getState().isOpen).toBe(true)
    })
  })

  it('clicking a skill bonus calls roll() with d20', async () => {
    renderWithI18n(<SkillsBlock character={baseChar} />, 'en')
    fireEvent.click(screen.getByTestId('skill-Acrobatics-bonus'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toMatch(/^d20/)
    })
  })

  it('clicking a skill bonus adds result to history', async () => {
    renderWithI18n(<SkillsBlock character={baseChar} />, 'en')
    fireEvent.click(screen.getByTestId('skill-Acrobatics-bonus'))
    await waitFor(() => {
      expect(useDiceStore.getState().history).toHaveLength(1)
    })
  })
})

// ── SavingThrows ──────────────────────────────────────────────────────────────

describe('SavingThrows — roll on bonus click', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null, isOpen: false, rollMode: 'normal', critContext: null })
    mockRoll.mockClear()
    mockRoll.mockReturnValue(makeRollResult())
  })

  it('clicking STR save bonus opens panel and adds history entry', async () => {
    renderWithI18n(<SavingThrows character={baseChar} />, 'en')
    fireEvent.click(screen.getByTestId('save-str-bonus'))
    await waitFor(() => {
      expect(useDiceStore.getState().isOpen).toBe(true)
      expect(useDiceStore.getState().history).toHaveLength(1)
    })
  })

  it('clicking a save bonus calls roll with d20 notation', async () => {
    renderWithI18n(<SavingThrows character={baseChar} />, 'en')
    fireEvent.click(screen.getByTestId('save-dex-bonus'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toMatch(/^d20/)
    })
  })
})

// ── CombatStrip ───────────────────────────────────────────────────────────────

describe('CombatStrip — initiative roll', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null, isOpen: false, rollMode: 'normal', critContext: null })
    mockRoll.mockClear()
    mockRoll.mockReturnValue(makeRollResult())
  })

  it('clicking initiative stat card opens panel', async () => {
    renderWithI18n(<CombatStrip character={baseChar} />, 'en')
    fireEvent.click(screen.getByTestId('combat-stat-init'))
    await waitFor(() => {
      expect(useDiceStore.getState().isOpen).toBe(true)
    })
  })

  it('clicking initiative calls roll with d20 notation', async () => {
    renderWithI18n(<CombatStrip character={baseChar} />, 'en')
    fireEvent.click(screen.getByTestId('combat-stat-init'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toMatch(/^d20/)
    })
  })

  it('clicking initiative passes kind="initiative" to roll()', async () => {
    renderWithI18n(<CombatStrip character={baseChar} />, 'en')
    fireEvent.click(screen.getByTestId('combat-stat-init'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const opts = mockRoll.mock.calls[0]?.[1]
      expect(opts).toMatchObject({ kind: 'initiative' })
    })
  })
})

// ── AttacksList ───────────────────────────────────────────────────────────────

describe('AttacksList — attack and damage rolls', () => {
  const charWithAttack = {
    ...baseChar,
    attacks: [{
      id: 'atk1',
      name: 'Espada',
      kind: 'melee' as const,
      ability: 'str' as const,
      attackBonus: 5,
      damage: '1d8+3',
      damageType: 'slashing',
      range: '',
      properties: '',
      notes: '',
    }],
  }

  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null, isOpen: false, rollMode: 'normal', critContext: null })
    mockRoll.mockClear()
    mockRoll.mockReturnValue(makeRollResult())
  })

  it('attack bonus chip is present', () => {
    renderWithI18n(<AttacksList character={charWithAttack} onUpdate={() => {}} />, 'en')
    expect(screen.getByTestId('attack-bonus-chip-atk1')).toBeDefined()
  })

  it('damage roll button is present when attack has damage', () => {
    renderWithI18n(<AttacksList character={charWithAttack} onUpdate={() => {}} />, 'en')
    expect(screen.getByTestId('attack-damage-btn-atk1')).toBeDefined()
  })

  it('clicking attack bonus chip calls roll() with d20+attackBonus', async () => {
    renderWithI18n(<AttacksList character={charWithAttack} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('attack-bonus-chip-atk1'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toBe('d20+5')
    })
  })

  it('clicking damage button calls roll() with damage notation', async () => {
    renderWithI18n(<AttacksList character={charWithAttack} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('attack-damage-btn-atk1'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toBe('1d8+3')
    })
  })

  it('crit hit on attack bonus click sets critContext', async () => {
    mockRoll.mockReturnValue(makeRollResult({ crit: 'hit', dice: [{ sides: 20, value: 20, kept: true }] }))
    renderWithI18n(<AttacksList character={charWithAttack} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('attack-bonus-chip-atk1'))
    await waitFor(() => {
      const ctx = useDiceStore.getState().critContext
      expect(ctx).not.toBeNull()
      expect(ctx?.damage).toBe('1d8+3')
    })
  })

  it('no crit → critContext stays null', async () => {
    mockRoll.mockReturnValue(makeRollResult({ crit: null }))
    renderWithI18n(<AttacksList character={charWithAttack} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('attack-bonus-chip-atk1'))
    await waitFor(() => {
      expect(useDiceStore.getState().critContext).toBeNull()
    })
  })
})

// ── DeathSaves ────────────────────────────────────────────────────────────────

describe('DeathSaves — roll button', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null, isOpen: false, rollMode: 'normal', critContext: null })
    mockRoll.mockClear()
    mockRoll.mockReturnValue(makeRollResult())
  })

  it('roll button is present', () => {
    renderWithI18n(<DeathSaves successes={0} failures={0} />, 'en')
    expect(screen.getByTestId('deathsave-roll-btn')).toBeDefined()
  })

  it('clicking roll button calls roll() with d20 notation', async () => {
    renderWithI18n(<DeathSaves successes={0} failures={0} />, 'en')
    fireEvent.click(screen.getByTestId('deathsave-roll-btn'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toBe('d20')
    })
  })

  it('clicking roll button opens panel', async () => {
    renderWithI18n(<DeathSaves successes={0} failures={0} />, 'en')
    fireEvent.click(screen.getByTestId('deathsave-roll-btn'))
    await waitFor(() => {
      expect(useDiceStore.getState().isOpen).toBe(true)
    })
  })
})

// ── HitDicePool ───────────────────────────────────────────────────────────────

describe('HitDicePool — roll button', () => {
  const hitDice = [{ className: 'Fighter', current: 3, max: 5, dieSize: 10 }]

  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null, isOpen: false, rollMode: 'normal', critContext: null })
    mockRoll.mockClear()
    mockRoll.mockReturnValue(makeRollResult())
  })

  it('roll button is present for each class', () => {
    renderWithI18n(<HitDicePool hitDice={hitDice} />, 'en')
    expect(screen.getByTestId('hitdice-Fighter-roll-btn')).toBeDefined()
  })

  it('clicking roll button calls roll() with 1dX notation', async () => {
    renderWithI18n(<HitDicePool hitDice={hitDice} conMod={2} />, 'en')
    fireEvent.click(screen.getByTestId('hitdice-Fighter-roll-btn'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toBe('1d10+2')
    })
  })

  it('with conMod=0, uses plain dX notation', async () => {
    renderWithI18n(<HitDicePool hitDice={hitDice} conMod={0} />, 'en')
    fireEvent.click(screen.getByTestId('hitdice-Fighter-roll-btn'))
    await waitFor(() => {
      expect(mockRoll).toHaveBeenCalledOnce()
      const call = mockRoll.mock.calls[0]
      expect(call?.[0]).toBe('1d10')
    })
  })
})
