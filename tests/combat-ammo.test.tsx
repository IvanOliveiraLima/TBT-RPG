/**
 * Combat.5 — Ammunition tracking on ranged attacks (linked to inventory)
 *
 * Covers:
 * - ammoCandidates helper returns all inventory items (today)
 * - Ammo select in expanded form: lists items, choosing sets ammoItemId, empty clears
 * - Ammo chip shows quantity when ammoItem is linked; absent for melee/spell
 * - Attacking with quantity > 0: rolls + decrements inventory via onUpdate({ inventory })
 * - Attacking with quantity === 0: rolls, no decrement, shows no-ammo warning
 * - No-ammo warning text EN/PT, auto-clears after 4s
 * - +1 restore: increments quantity (no ceiling), hidden when locked
 * - Locked: restore hidden, chip visible, roll works, no consume
 * - ammoItemId pointing to deleted item: no chip, no consume
 * - melee/spell attacks: no ammo UI, ammo not consumed
 * - Slot consume from Combat.4 remains intact alongside ammo
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { ammoCandidates } from '@/domain/inventory'
import type { Character, Attack, InventoryItem } from '@/domain/character'
import { useCharactersStore } from '@/store/characters'

vi.mock('@/services/sync', () => ({
  scheduleEditSync: vi.fn(),
  startPeriodicSync: vi.fn(),
  stopPeriodicSync: vi.fn(),
}))

/* ── Mock useSheetRoll ─────────────────────────────────────────────────── */

const mockRollCheck = vi.fn()
const mockRollDamage = vi.fn()

vi.mock('@/hooks/useSheetRoll', () => ({
  useSheetRoll: () => ({ rollCheck: mockRollCheck, rollDamage: mockRollDamage }),
}))

/* ── Helpers ──────────────────────────────────────────────────────────── */

function makeArrow(overrides?: Partial<InventoryItem>): InventoryItem {
  return {
    id: 'arrow1',
    name: 'Arrows',
    quantity: 20,
    weight: 0.05,
    category: 'misc',
    description: '',
    equipped: false,
    ...overrides,
  }
}

function makeRanged(overrides?: Partial<Attack>): Attack {
  return {
    id: 'r1',
    name: 'Longbow',
    kind: 'ranged',
    ability: 'dex',
    attackBonus: 5,
    damage: '1d8+3',
    damageType: 'Piercing',
    range: '150/600 ft',
    properties: '',
    notes: '',
    ...overrides,
  }
}

function makeMelee(overrides?: Partial<Attack>): Attack {
  return {
    id: 'm1',
    name: 'Longsword',
    kind: 'melee',
    ability: 'str',
    attackBonus: 4,
    damage: '1d8+3',
    damageType: 'Slashing',
    range: '5 ft',
    properties: '',
    notes: '',
    ...overrides,
  }
}

function makeSpellAttack(overrides?: Partial<Attack>): Attack {
  return {
    id: 's1',
    name: 'Firebolt',
    kind: 'spell',
    ability: 'int',
    attackBonus: 5,
    damage: '1d10',
    damageType: 'Fire',
    range: '120 ft',
    properties: '',
    notes: '',
    spellLevel: 0,
    ...overrides,
  }
}

function makeChar(
  attacks: Attack[],
  inventory: InventoryItem[] = [],
): Character {
  return {
    id: 'c1',
    name: 'Test',
    race: '',
    background: '',
    alignment: '',
    classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
    experience: 0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 16, con: 12, int: 10, wis: 12, cha: 10 },
    proficiencyBonus: 3,
    hp: { current: 38, max: 38, temp: 0 },
    hitDice: [],
    deathSaves: { successes: 0, failures: 0 },
    ac: 14,
    initiative: 3,
    speed: 30,
    passivePerception: 13,
    spellSaveDC: 0,
    inspiration: false,
    savingThrows: [],
    skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] },
    languages: [],
    attacks,
    spells: [],
    spellSlots: {
      '1': { current: 0, max: 0 },
      '2': { current: 0, max: 0 },
      '3': { current: 0, max: 0 },
      '4': { current: 0, max: 0 },
      '5': { current: 0, max: 0 },
      '6': { current: 0, max: 0 },
      '7': { current: 0, max: 0 },
      '8': { current: 0, max: 0 },
      '9': { current: 0, max: 0 },
    },
    spellcastingAbility: '',
    spellcastingClass: '',
    inventory,
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    features: [],
    backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '',
    notes2: '',
    mountPet: '',
    mountPet2: '',
    alliesOrganizations: '',
    images: {},
    createdAt: 0,
    updatedAt: 0,
  }
}

function makeLocked(char: Character): Character {
  const locked = { ...char, locked: true }
  useCharactersStore.setState({ characters: [locked], loading: false, error: null })
  return locked
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe('Combat.5 — Ammunition tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /* ── ammoCandidates helper ── */

  describe('ammoCandidates', () => {
    it('returns all inventory items today', () => {
      const items = [makeArrow(), makeArrow({ id: 'sword1', name: 'Sword', category: 'weapon' })]
      expect(ammoCandidates(items)).toHaveLength(2)
    })

    it('returns empty array for empty inventory', () => {
      expect(ammoCandidates([])).toHaveLength(0)
    })
  })

  /* ── Ammo select in expanded form ── */

  describe('ammo select', () => {
    it('shows ammo select when ranged attack is expanded', () => {
      const arrow = makeArrow()
      const char = makeChar([makeRanged()], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      // Expand the card
      fireEvent.click(screen.getByTestId('attack-card-r1'))
      expect(screen.getByTestId('attack-ammo-select-r1')).toBeInTheDocument()
    })

    it('ammo select lists all inventory items', () => {
      const arrow = makeArrow()
      const bolt = makeArrow({ id: 'bolt1', name: 'Crossbow Bolts', quantity: 10 })
      const char = makeChar([makeRanged()], [arrow, bolt])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-card-r1'))
      const select = screen.getByTestId('attack-ammo-select-r1') as HTMLSelectElement
      const options = Array.from(select.options).map(o => o.text)
      expect(options.some(o => o.includes('Arrows'))).toBe(true)
      expect(options.some(o => o.includes('Crossbow Bolts'))).toBe(true)
    })

    it('ammo select shows item quantity in label', () => {
      const arrow = makeArrow({ quantity: 15 })
      const char = makeChar([makeRanged()], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-card-r1'))
      const select = screen.getByTestId('attack-ammo-select-r1') as HTMLSelectElement
      const options = Array.from(select.options).map(o => o.text)
      expect(options.some(o => o.includes('×15'))).toBe(true)
    })

    it('choosing an item calls onUpdate with ammoItemId', () => {
      const arrow = makeArrow()
      const char = makeChar([makeRanged()], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-card-r1'))
      const select = screen.getByTestId('attack-ammo-select-r1')
      fireEvent.change(select, { target: { value: 'arrow1' } })
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ attacks: expect.arrayContaining([expect.objectContaining({ ammoItemId: 'arrow1' })]) })
      )
    })

    it('choosing empty option clears ammoItemId', () => {
      const arrow = makeArrow()
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-card-r1'))
      const select = screen.getByTestId('attack-ammo-select-r1')
      fireEvent.change(select, { target: { value: '' } })
      // onUpdate is called — the ammoItemId should be cleared (undefined or absent)
      expect(onUpdate).toHaveBeenCalled()
      const callArg = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
      const updatedAttack = callArg.attacks?.find((a: Attack) => a.id === 'r1')
      expect(updatedAttack?.ammoItemId).toBeFalsy()
    })

    it('ammo select is disabled when locked', () => {
      const arrow = makeArrow()
      const char = makeLocked(makeChar([makeRanged()], [arrow]))
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-card-r1'))
      const select = screen.getByTestId('attack-ammo-select-r1') as HTMLSelectElement
      expect(select.disabled).toBe(true)
    })

    it('melee attack has no ammo select', () => {
      const char = makeChar([makeMelee()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-card-m1'))
      expect(screen.queryByTestId('attack-ammo-select-m1')).not.toBeInTheDocument()
    })
  })

  /* ── Ammo chip (compact row) ── */

  describe('ammo chip', () => {
    it('shows ammo chip when ranged attack is linked and item exists', () => {
      const arrow = makeArrow({ quantity: 15 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-ammo-count-r1')).toBeInTheDocument()
    })

    it('EN: chip shows "{n} left" with quantity', () => {
      const arrow = makeArrow({ quantity: 7 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-ammo-count-r1').textContent).toContain('7')
    })

    it('PT: chip shows "{n} restantes" with quantity', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      expect(screen.getByTestId('attack-ammo-count-r1').textContent).toContain('restantes')
    })

    it('no chip when ammoItemId is missing', () => {
      const char = makeChar([makeRanged()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-ammo-count-r1')).not.toBeInTheDocument()
    })

    it('no chip when ammoItemId points to deleted item', () => {
      const char = makeChar([makeRanged({ ammoItemId: 'ghost' })], [])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-ammo-count-r1')).not.toBeInTheDocument()
    })

    it('no ammo chip on melee attack', () => {
      const arrow = makeArrow()
      const char = makeChar([makeMelee()], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-ammo-count-m1')).not.toBeInTheDocument()
    })

    it('no ammo chip on spell attack', () => {
      const arrow = makeArrow()
      const char = makeChar([makeSpellAttack()], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-ammo-count-s1')).not.toBeInTheDocument()
    })
  })

  /* ── Attack consume ── */

  describe('consume on attack', () => {
    it('rolls via rollCheck always', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })

    it('decrements inventory quantity by 1 when quantity > 0', () => {
      const arrow = makeArrow({ quantity: 10 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      const calls = onUpdate.mock.calls
      const inventoryCall = calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeDefined()
      const updatedItem = inventoryCall![0].inventory.find((i: InventoryItem) => i.id === 'arrow1')
      expect(updatedItem?.quantity).toBe(9)
    })

    it('quantity never goes below 0', () => {
      const arrow = makeArrow({ quantity: 0 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeUndefined()
    })

    it('rolls even when quantity === 0 (attack anyway)', () => {
      const arrow = makeArrow({ quantity: 0 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })

    it('no consume when ammoItemId is missing', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged()], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeUndefined()
    })

    it('no consume when ammoItemId points to deleted item', () => {
      const char = makeChar([makeRanged({ ammoItemId: 'ghost' })], [])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeUndefined()
    })

    it('melee attack: no inventory consumed', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeMelee()], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-m1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeUndefined()
    })
  })

  /* ── No-ammo warning ── */

  describe('no-ammo warning', () => {
    it('shows warning when quantity === 0', () => {
      const arrow = makeArrow({ quantity: 0 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(screen.getByTestId('attack-no-ammo-r1')).toBeInTheDocument()
    })

    it('EN: warning text "Out of ammo"', () => {
      const arrow = makeArrow({ quantity: 0 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(screen.getByTestId('attack-no-ammo-r1').textContent).toMatch(/Out of ammo/i)
    })

    it('PT: warning text "Sem munição"', () => {
      const arrow = makeArrow({ quantity: 0 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(screen.getByTestId('attack-no-ammo-r1').textContent).toMatch(/Sem munição/i)
    })

    it('warning absent when quantity > 0', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(screen.queryByTestId('attack-no-ammo-r1')).not.toBeInTheDocument()
    })

    it('auto-clears after 4s', async () => {
      vi.useFakeTimers()
      const arrow = makeArrow({ quantity: 0 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(screen.getByTestId('attack-no-ammo-r1')).toBeInTheDocument()
      await act(async () => { vi.advanceTimersByTime(4000) })
      expect(screen.queryByTestId('attack-no-ammo-r1')).not.toBeInTheDocument()
    })

    it('no-slots warning (Combat.4) still works alongside ammo', () => {
      // Spell attack with no slots shows the slots warning
      const char = makeChar([
        { id: 'sp1', name: 'Fireball', kind: 'spell' as const, ability: 'int' as const,
          attackBonus: 5, damage: '8d6', damageType: 'Fire', range: '150 ft',
          properties: '', notes: '', spellLevel: 3 },
      ])
      // Override char to have level-3 slots with current=0 but max>0
      const charWithSlots = {
        ...char,
        spellSlots: { ...char.spellSlots, '3': { current: 0, max: 3 } },
      }
      renderWithI18n(<AttacksList character={charWithSlots} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-sp1'))
      expect(screen.getByTestId('attack-no-slots-sp1')).toBeInTheDocument()
    })
  })

  /* ── +1 restore ── */

  describe('+1 restore', () => {
    it('restore button visible when linked item exists', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-restore-ammo-r1')).toBeInTheDocument()
    })

    it('clicking restore increments quantity by 1', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-restore-ammo-r1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeDefined()
      const updatedItem = inventoryCall![0].inventory.find((i: InventoryItem) => i.id === 'arrow1')
      expect(updatedItem?.quantity).toBe(6)
    })

    it('restore has no ceiling (can exceed initial quantity)', () => {
      const arrow = makeArrow({ quantity: 20 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-restore-ammo-r1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeDefined()
      const updatedItem = inventoryCall![0].inventory.find((i: InventoryItem) => i.id === 'arrow1')
      expect(updatedItem?.quantity).toBe(21)
    })

    it('restore aria-label EN is "+1 ammo"', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-restore-ammo-r1').getAttribute('aria-label')).toBe('+1 ammo')
    })

    it('restore aria-label PT is "+1 munição"', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      expect(screen.getByTestId('attack-restore-ammo-r1').getAttribute('aria-label')).toBe('+1 munição')
    })

    it('restore button absent when no ammo link', () => {
      const char = makeChar([makeRanged()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-restore-ammo-r1')).not.toBeInTheDocument()
    })
  })

  /* ── Locked mode ── */

  describe('locked mode', () => {
    it('restore button is hidden when locked', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeLocked(makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow]))
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-restore-ammo-r1')).not.toBeInTheDocument()
    })

    it('chip is visible when locked (read-only display)', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeLocked(makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow]))
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-ammo-count-r1')).toBeInTheDocument()
    })

    it('roll still fires when locked', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeLocked(makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow]))
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })

    it('no inventory consumed when locked', () => {
      const arrow = makeArrow({ quantity: 5 })
      const char = makeLocked(makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow]))
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeUndefined()
    })
  })

  /* ── Multiple items ── */

  describe('multiple items in inventory', () => {
    it('only the linked item is decremented, not others', () => {
      const arrow = makeArrow({ quantity: 10 })
      const bolt = makeArrow({ id: 'bolt1', name: 'Bolts', quantity: 15 })
      const char = makeChar([makeRanged({ ammoItemId: 'arrow1' })], [arrow, bolt])
      const onUpdate = vi.fn()
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-r1'))
      const inventoryCall = onUpdate.mock.calls.find(([arg]) => 'inventory' in arg)
      expect(inventoryCall).toBeDefined()
      const updatedArrow = inventoryCall![0].inventory.find((i: InventoryItem) => i.id === 'arrow1')
      const updatedBolt = inventoryCall![0].inventory.find((i: InventoryItem) => i.id === 'bolt1')
      expect(updatedArrow?.quantity).toBe(9)
      expect(updatedBolt?.quantity).toBe(15) // unchanged
    })
  })
})
