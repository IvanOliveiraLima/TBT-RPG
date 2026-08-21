/**
 * Tests for attack reorder (↑/↓) and duplicate (⋮ menu).
 *
 * Critical case — interleaved array: weapons and spells share the flat `attacks`
 * array. Moving "within a section" must only swap among the section's members,
 * leaving items from other sections in place.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Attack } from '@/domain/character'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { renderWithI18n } from './helpers/render'

function makeAttack(overrides: Pick<Attack, 'id'> & Partial<Attack>): Attack {
  return {
    name: '',
    kind: 'melee',
    ability: 'str',
    attackBonus: 0,
    damage: '',
    damageType: '',
    range: '',
    properties: '',
    notes: '',
    ...overrides,
  }
}

const WEAPON_A = makeAttack({ id: 'w_a', name: 'Weapon A', kind: 'melee' })
const WEAPON_B = makeAttack({ id: 'w_b', name: 'Weapon B', kind: 'melee' })
const SPELL_N3_X = makeAttack({ id: 's_x', name: 'Spell X', kind: 'spell', spellLevel: 3 })
const SPELL_N3_Y = makeAttack({ id: 's_y', name: 'Spell Y', kind: 'spell', spellLevel: 3 })

// Interleaved: weapon A, spell X (lvl3), weapon B, spell Y (lvl3)
const INTERLEAVED_ATTACKS = [WEAPON_A, SPELL_N3_X, WEAPON_B, SPELL_N3_Y]

function makeBase(attacks: Attack[]): Character {
  return {
    id: 'char_test',
    name: 'Tester',
    race: '', background: '', alignment: '',
    classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
    experience: 0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hp: { current: 30, max: 30, temp: 0 },
    hitDice: [{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 10, initiative: 0, speed: 30, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks,
    inventory: [], currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features: [], backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [], spellSlots: {}, spellcastingAbility: '', spellcastingClass: '',
    images: {}, createdAt: 0, updatedAt: 0,
  }
}

// ── Reorder: move buttons ─────────────────────────────────────────────────

describe('Attack reorder — move up/down buttons', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows ↑/↓ buttons when section has 2+ items and onUpdate provided', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attack-move-up-w_a')).toBeDefined()
    expect(screen.getByTestId('attack-move-down-w_a')).toBeDefined()
  })

  it('hides ↑/↓ buttons when section has only 1 item', () => {
    const char = makeBase([WEAPON_A])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attack-move-up-w_a')).toBeNull()
    expect(screen.queryByTestId('attack-move-down-w_a')).toBeNull()
  })

  it('hides ↑/↓ buttons when no onUpdate (read-only)', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} />, 'en')
    expect(screen.queryByTestId('attack-move-up-w_a')).toBeNull()
  })

  it('↑ is disabled on the first item in section', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect((screen.getByTestId('attack-move-up-w_a') as HTMLButtonElement).disabled).toBe(true)
  })

  it('↓ is disabled on the last item in section', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect((screen.getByTestId('attack-move-down-w_b') as HTMLButtonElement).disabled).toBe(true)
  })

  it('↑ is enabled on the second item', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect((screen.getByTestId('attack-move-up-w_b') as HTMLButtonElement).disabled).toBe(false)
  })

  it('↓ is enabled on the first item', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect((screen.getByTestId('attack-move-down-w_a') as HTMLButtonElement).disabled).toBe(false)
  })
})

describe('Attack reorder — move within section', () => {
  beforeEach(() => { localStorage.clear() })

  it('moving ↓ on first weapon swaps them in the flat array', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('attack-move-down-w_a'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result[0]!.id).toBe('w_b')
    expect(result[1]!.id).toBe('w_a')
  })

  it('moving ↑ on second weapon swaps them', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('attack-move-up-w_b'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result[0]!.id).toBe('w_b')
    expect(result[1]!.id).toBe('w_a')
  })

  it('move buttons do not bubble to parent (no card expand)', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-move-down-w_a'))
    // Card should remain collapsed — no name input visible
    expect(screen.queryByTestId('attack-name-input-w_a')).toBeNull()
  })
})

describe('Attack reorder — interleaved array (critical case)', () => {
  beforeEach(() => { localStorage.clear() })

  /**
   * Array: [weapon A, spell X (lvl3), weapon B, spell Y (lvl3)]
   * Moving spell X "down" in the lvl-3 section should swap X↔Y in the flat array.
   * Weapons must NOT change their relative order.
   */
  it('moving spell X down swaps X and Y; weapons keep their positions', () => {
    const char = makeBase(INTERLEAVED_ATTACKS)
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('attack-move-down-s_x'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    // Weapons must keep their relative positions
    const weaponIds = result.filter(a => a.kind !== 'spell').map(a => a.id)
    expect(weaponIds).toEqual(['w_a', 'w_b'])
    // Spell Y must now come before spell X in the flat array
    const spellIds = result.filter(a => a.kind === 'spell').map(a => a.id)
    expect(spellIds).toEqual(['s_y', 's_x'])
  })

  it('spell sections are independent: moving in lvl-3 does not touch weapons', () => {
    const char = makeBase(INTERLEAVED_ATTACKS)
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('attack-move-down-s_x'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result).toHaveLength(4)
    const wA = result.findIndex(a => a.id === 'w_a')
    const wB = result.findIndex(a => a.id === 'w_b')
    expect(wA).toBeLessThan(wB)
  })
})

// ── Duplicate ─────────────────────────────────────────────────────────────

describe('Attack duplicate', () => {
  beforeEach(() => { localStorage.clear() })

  function openMenu(id: string) {
    fireEvent.click(screen.getByTestId(`attack-menu-${id}`))
  }

  it('duplicate inserts copy immediately after original', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    openMenu('w_a')
    fireEvent.click(screen.getByTestId('attack-duplicate-w_a'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result).toHaveLength(3)
    expect(result[0]!.id).toBe('w_a')
    expect(result[1]!.id).not.toBe('w_a')  // new copy
    expect(result[2]!.id).toBe('w_b')
  })

  it('duplicate appends copy suffix to name (EN)', () => {
    const char = makeBase([WEAPON_A])
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    openMenu('w_a')
    fireEvent.click(screen.getByTestId('attack-duplicate-w_a'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result[1]!.name).toBe('Weapon A (copy)')
  })

  it('duplicate appends copy suffix to name (PT)', () => {
    const char = makeBase([WEAPON_A])
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'pt')
    openMenu('w_a')
    fireEvent.click(screen.getByTestId('attack-duplicate-w_a'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result[1]!.name).toBe('Weapon A (cópia)')
  })

  it('duplicate gives the copy a different id', () => {
    const char = makeBase([WEAPON_A])
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    openMenu('w_a')
    fireEvent.click(screen.getByTestId('attack-duplicate-w_a'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result[1]!.id).not.toBe('w_a')
    expect(result[1]!.id.length).toBeGreaterThan(0)
  })

  it('duplicate copies all other fields from source', () => {
    const char = makeBase([WEAPON_A])
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    openMenu('w_a')
    fireEvent.click(screen.getByTestId('attack-duplicate-w_a'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result[1]!.kind).toBe(WEAPON_A.kind)
    expect(result[1]!.attackBonus).toBe(WEAPON_A.attackBonus)
  })

  it('duplicate button is absent in read-only mode (no onUpdate)', () => {
    const char = makeBase([WEAPON_A])
    renderWithI18n(<AttacksList character={char} />, 'en')
    expect(screen.queryByTestId('attack-menu-w_a')).toBeNull()
  })
})

// ── Row menu — delete via menu ────────────────────────────────────────────

describe('Attack delete via row menu', () => {
  beforeEach(() => { localStorage.clear() })

  it('row menu trigger exists for each attack when editable', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attack-menu-w_a')).toBeDefined()
    expect(screen.getByTestId('attack-menu-w_b')).toBeDefined()
  })

  it('row menu trigger has correct aria-label (EN)', () => {
    const char = makeBase([WEAPON_A])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByRole('button', { name: 'Actions for Weapon A' })).toBeDefined()
  })

  it('row menu trigger has correct aria-label (PT)', () => {
    const char = makeBase([WEAPON_A])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByRole('button', { name: 'Ações de Weapon A' })).toBeDefined()
  })

  it('delete requires two clicks (confirm flow)', () => {
    const onUpdate = vi.fn()
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    // Open menu
    fireEvent.click(screen.getByTestId('attack-menu-w_a'))
    // First click on delete → confirm state, no action yet
    fireEvent.click(screen.getByTestId('attack-remove-w_a'))
    expect(onUpdate).not.toHaveBeenCalled()
    // Second click → executes
    fireEvent.click(screen.getByTestId('attack-remove-w_a'))
    const result = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('w_b')
  })

  it('opening delete menu does not expand the card', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-menu-w_a'))
    expect(screen.queryByTestId('attack-name-input-w_a')).toBeNull()
  })

  it('clicking delete item does not expand the card', () => {
    const char = makeBase([WEAPON_A, WEAPON_B])
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-menu-w_a'))
    fireEvent.click(screen.getByTestId('attack-remove-w_a'))
    expect(screen.queryByTestId('attack-name-input-w_a')).toBeNull()
  })

  it('row menu is absent in read-only mode', () => {
    const char = makeBase([WEAPON_A])
    renderWithI18n(<AttacksList character={char} />, 'en')
    expect(screen.queryByTestId('attack-menu-w_a')).toBeNull()
  })
})
