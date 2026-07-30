/**
 * Tests for Combat.1 — import spells into attacks (local snapshot)
 *
 * Covers:
 * - Spell domain: damage/damageType optional fields; addSpell defaults
 * - SpellCard: damage/damageType inputs render and update
 * - AttacksList: import-spells button (hidden when locked / read-only)
 * - ImportSpellsPicker: lists spells grouped by level; imports snapshot; empty state
 * - Snapshot independence: editing the attack does not change the spell
 * - i18n: EN/PT labels
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Attack, Spell } from '@/domain/character'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { SpellList } from '@/components/sheet/parts/SpellList'
import { renderWithI18n } from './helpers/render'
import { useCharactersStore } from '@/store/characters'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/sync', () => ({
  scheduleEditSync:   vi.fn(),
  startPeriodicSync:  vi.fn(),
  stopPeriodicSync:   vi.fn(),
  getSyncStatus:      () => 'idle' as const,
  onSyncStatusChange: () => () => undefined,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSpell(overrides: Pick<Spell, 'id'> & Partial<Spell>): Spell {
  return {
    name: '',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '',
    description: '',
    prepared: false,
    ...overrides,
  }
}

const FIREBALL = makeSpell({
  id: 'sp1',
  name: 'Fireball',
  level: 3,
  school: 'evocation',
  range: '150 ft',
  description: 'Deals 8d6 fire damage.',
  damage: '8d6',
  damageType: 'Fire',
})

const VICIOUS_MOCKERY = makeSpell({
  id: 'sp2',
  name: 'Vicious Mockery',
  level: 0,
  school: 'enchantment',
  range: '60 ft',
  description: 'Deals psychic damage.',
  damage: '1d4',
  damageType: 'Psychic',
})

const MAGE_ARMOR = makeSpell({
  id: 'sp3',
  name: 'Mage Armor',
  level: 1,
  school: 'abjuration',
  range: 'Touch',
  description: 'No damage — utility.',
  // no damage / damageType
})

const BASE: Character = {
  id: 'char_wizard',
  name: 'Gandalf',
  race: 'Human', background: 'Sage', alignment: 'NG',
  classes: [{ name: 'Wizard', level: 5, hitDie: 6 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 8, dex: 14, con: 12, int: 18, wis: 14, cha: 12 },
  proficiencyBonus: 3,
  hp: { current: 30, max: 30, temp: 0 },
  hitDice: [{ className: 'Wizard', current: 5, max: 5, dieSize: 6 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 13, initiative: 2, speed: 30,
  passivePerception: 12, spellSaveDC: 15, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [], currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [FIREBALL, VICIOUS_MOCKERY, MAGE_ARMOR],
  spellSlots: { '1': { current: 4, max: 4 }, '3': { current: 2, max: 2 } },
  spellcastingAbility: 'int',
  spellcastingClass: 'Wizard',
  images: {}, createdAt: 0, updatedAt: 0,
}

// ── Spell domain ─────────────────────────────────────────────────────────────

describe('Spell — optional damage/damageType fields', () => {
  it('spell with damage/damageType retains those values', () => {
    expect(FIREBALL.damage).toBe('8d6')
    expect(FIREBALL.damageType).toBe('Fire')
  })

  it('spell without damage/damageType is valid (optional fields absent)', () => {
    expect(MAGE_ARMOR.damage).toBeUndefined()
    expect(MAGE_ARMOR.damageType).toBeUndefined()
  })
})

// ── SpellCard — damage/damageType inputs ──────────────────────────────────────

describe('SpellCard — damage/damageType editor', () => {
  beforeEach(() => { localStorage.clear() })

  function expandSpell(id: string) {
    const card = screen.getByTestId(`spell-card-${id}`)
    const pip = card.querySelector(`[data-testid="spell-school-pip-${id}"]`)!
    fireEvent.click(pip)
  }

  it('renders damage input in expanded SpellCard', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandSpell('sp1')
    expect(screen.getByTestId('spell-damage-sp1')).toBeDefined()
  })

  it('renders damage-type input in expanded SpellCard', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandSpell('sp1')
    expect(screen.getByTestId('spell-damage-type-sp1')).toBeDefined()
  })

  it('damage input shows existing value', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandSpell('sp1')
    const input = screen.getByTestId('spell-damage-sp1') as HTMLInputElement
    expect(input.value).toBe('8d6')
  })

  it('damage-type input shows existing value', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandSpell('sp1')
    const input = screen.getByTestId('spell-damage-type-sp1') as HTMLInputElement
    expect(input.value).toBe('Fire')
  })

  it('damage input defaults to empty string for spells without damage', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandSpell('sp3')
    const input = screen.getByTestId('spell-damage-sp3') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('updating damage calls onUpdate with new damage', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SpellList character={BASE} onUpdate={onUpdate} />, 'en')
    expandSpell('sp1')
    fireEvent.change(screen.getByTestId('spell-damage-sp1'), { target: { value: '10d6' } })
    const call = onUpdate.mock.calls[0]![0] as { spells: Spell[] }
    const updated = call.spells.find(s => s.id === 'sp1')!
    expect(updated.damage).toBe('10d6')
  })

  it('updating damageType calls onUpdate with new damageType', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SpellList character={BASE} onUpdate={onUpdate} />, 'en')
    expandSpell('sp1')
    fireEvent.change(screen.getByTestId('spell-damage-type-sp1'), { target: { value: 'Cold' } })
    const call = onUpdate.mock.calls[0]![0] as { spells: Spell[] }
    const updated = call.spells.find(s => s.id === 'sp1')!
    expect(updated.damageType).toBe('Cold')
  })

  it('damage-type input has datalist attribute', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandSpell('sp1')
    const input = screen.getByTestId('spell-damage-type-sp1') as HTMLInputElement
    expect(input.getAttribute('list')).toBe('canonical-damage-types')
  })

  it('damage label renders in EN', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandSpell('sp1')
    expect(screen.getAllByText('Damage').length).toBeGreaterThanOrEqual(1)
  })

  it('damage label renders in PT', () => {
    renderWithI18n(<SpellList character={BASE} onUpdate={vi.fn()} />, 'pt')
    expandSpell('sp1')
    expect(screen.getAllByText('Dano').length).toBeGreaterThanOrEqual(1)
  })
})

// ── addSpell default includes damage/damageType ───────────────────────────────

describe('SpellList — addSpell defaults', () => {
  beforeEach(() => { localStorage.clear() })

  it('addSpell includes damage and damageType as empty strings', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <SpellList character={{ ...BASE, spells: [] }} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('add-cantrip'))
    const call = onUpdate.mock.calls[0]![0] as { spells: Spell[] }
    expect(call.spells[0]!.damage).toBe('')
    expect(call.spells[0]!.damageType).toBe('')
  })
})

// ── AttacksList — import button visibility ─────────────────────────────────────

describe('AttacksList — import-spells button', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows import button when onUpdate provided and not locked', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('import-spells-btn')).toBeDefined()
  })

  it('hides import button when onUpdate not provided (read-only)', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.queryByTestId('import-spells-btn')).toBeNull()
  })

  it('shows import button label in EN', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('import-spells-btn').textContent).toContain('Import from spells')
  })

  it('shows import button label in PT', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('import-spells-btn').textContent).toContain('Importar de magias')
  })
})

// ── AttacksList — locked state ────────────────────────────────────────────────

describe('AttacksList — locked hides import button', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('import button is absent when character is locked', () => {
    const locked = { ...BASE, id: 'char_locked', locked: true }
    useCharactersStore.setState({ characters: [locked], loading: false, error: null })
    renderWithI18n(
      <AttacksList character={locked} onUpdate={vi.fn()} />,
      'en',
    )
    expect(screen.queryByTestId('import-spells-btn')).toBeNull()
  })
})

// ── ImportSpellsPicker — listing and grouping ──────────────────────────────────

describe('ImportSpellsPicker — spell listing', () => {
  beforeEach(() => { localStorage.clear() })

  function openPicker() {
    fireEvent.click(screen.getByTestId('import-spells-btn'))
  }

  it('opens picker on button click', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-spells-picker')).toBeDefined()
  })

  it('shows all spells by name in picker', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByText('Fireball')).toBeDefined()
    expect(screen.getByText('Vicious Mockery')).toBeDefined()
    expect(screen.getByText('Mage Armor')).toBeDefined()
  })

  it('groups spells by level — cantrip group (level 0)', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-level-group-0')).toBeDefined()
  })

  it('groups spells by level — level 1 group', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-level-group-1')).toBeDefined()
  })

  it('groups spells by level — level 3 group', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-level-group-3')).toBeDefined()
  })

  it('renders per-spell import button', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-spell-sp1')).toBeDefined()
    expect(screen.getByTestId('import-spell-sp2')).toBeDefined()
    expect(screen.getByTestId('import-spell-sp3')).toBeDefined()
  })

  it('shows empty state when character has no spells', () => {
    renderWithI18n(
      <AttacksList character={{ ...BASE, spells: [] }} onUpdate={vi.fn()} />,
      'en',
    )
    openPicker()
    expect(screen.getByTestId('import-spells-empty')).toBeDefined()
  })

  it('empty state label in EN', () => {
    renderWithI18n(
      <AttacksList character={{ ...BASE, spells: [] }} onUpdate={vi.fn()} />,
      'en',
    )
    openPicker()
    expect(screen.getByText('No spells yet')).toBeDefined()
  })

  it('empty state label in PT', () => {
    renderWithI18n(
      <AttacksList character={{ ...BASE, spells: [] }} onUpdate={vi.fn()} />,
      'pt',
    )
    openPicker()
    expect(screen.getByText('Nenhuma magia cadastrada')).toBeDefined()
  })

  it('done button closes picker', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spells-done'))
    expect(screen.queryByTestId('import-spells-picker')).toBeNull()
  })

  it('picker remains open after importing one spell (import multiple)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    // Picker still visible
    expect(screen.getByTestId('import-spells-picker')).toBeDefined()
  })
})

// ── ImportSpellsPicker — snapshot creation ─────────────────────────────────────

describe('ImportSpellsPicker — snapshot attack creation', () => {
  beforeEach(() => { localStorage.clear() })

  function openPicker() {
    fireEvent.click(screen.getByTestId('import-spells-btn'))
  }

  it('importing Fireball creates an attack with kind=spell', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    const attack = call.attacks[0]!
    expect(attack.kind).toBe('spell')
  })

  it('snapshot name matches spell name', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.name).toBe('Fireball')
  })

  it('snapshot damage matches spell damage', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.damage).toBe('8d6')
  })

  it('snapshot damageType matches spell damageType', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.damageType).toBe('Fire')
  })

  it('snapshot range matches spell range', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.range).toBe('150 ft')
  })

  it('snapshot notes = spell description', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.notes).toBe('Deals 8d6 fire damage.')
  })

  it('snapshot ability = character spellcastingAbility', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.ability).toBe('int')
  })

  it('snapshot attackBonus defaults to 0', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.attackBonus).toBe(0)
  })

  it('snapshot id is a non-empty string', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.id).toBeTruthy()
  })

  it('spell without damage produces attack with empty damage', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp3'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.damage).toBe('')
    expect(call.attacks[0]!.damageType).toBe('')
  })

  it('importing two spells calls onUpdate twice with each snapshot', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    fireEvent.click(screen.getByTestId('import-spell-sp2'))
    expect(onUpdate).toHaveBeenCalledTimes(2)
    const first = (onUpdate.mock.calls[0]![0] as { attacks: Attack[] }).attacks[0]!
    const second = (onUpdate.mock.calls[1]![0] as { attacks: Attack[] }).attacks[0]!
    expect(first.name).toBe('Fireball')
    expect(second.name).toBe('Vicious Mockery')
  })

  it('snapshot is independent — changing the attack does not alter the spell', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    const snapshot = call.attacks[0]!
    // Mutate the snapshot object — the original spell must be unchanged
    snapshot.name = 'Modified Attack'
    snapshot.damage = '99d6'
    expect(FIREBALL.name).toBe('Fireball')
    expect(FIREBALL.damage).toBe('8d6')
  })
})
