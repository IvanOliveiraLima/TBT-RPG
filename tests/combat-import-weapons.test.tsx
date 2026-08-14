/**
 * Tests for Combat.2 — import weapons into attacks (local snapshot)
 *
 * Covers:
 * - InventoryItem domain: optional weapon combat fields; addItem('weapon') defaults
 * - InventoryList/ItemCard: weapon fields render only for category==='weapon'
 * - AttacksList: import-weapons button (hidden when locked / read-only)
 * - ImportWeaponsPicker: lists only weapons, equipped first; imports snapshot; empty state
 * - Snapshot mapping: kind from attackKind, ability empty, all 9 fields
 * - Snapshot independence: editing attack does not change item
 * - Multiple imports; EN/PT labels
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, InventoryItem, Attack } from '@/domain/character'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { InventoryList } from '@/components/sheet/parts/InventoryList'
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

function makeItem(overrides: Pick<InventoryItem, 'id'> & Partial<InventoryItem>): InventoryItem {
  return {
    name:        '',
    quantity:    1,
    weight:      0,
    category:    'misc',
    description: '',
    equipped:    false,
    ...overrides,
  }
}

const LONGSWORD = makeItem({
  id:          'item1',
  name:        'Longsword',
  category:    'weapon',
  equipped:    true,
  damage:      '1d8+3',
  damageType:  'Slashing',
  range:       '5 ft',
  properties:  'Versatile',
  attackKind:  'melee',
})

const SHORTBOW = makeItem({
  id:          'item2',
  name:        'Shortbow',
  category:    'weapon',
  equipped:    false,
  damage:      '1d6',
  damageType:  'Piercing',
  range:       '80/320 ft',
  properties:  '',
  attackKind:  'ranged',
})

const DAGGER = makeItem({
  id:         'item3',
  name:       'Dagger',
  category:   'weapon',
  equipped:   false,
  // no combat fields — optional
})

const POTION = makeItem({
  id:       'item4',
  name:     'Healing Potion',
  category: 'consumable',
})

const BASE: Character = {
  id:   'char_fighter',
  name: 'Aragorn',
  race: 'Human', background: 'Soldier', alignment: 'LG',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 12 },
  hp: { current: 47, max: 47, temp: 0 },
  hitDice: [{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 17, initiative: 2, speed: 30,
  inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [LONGSWORD, SHORTBOW, DAGGER, POTION],
  currency: { pp: 0, gp: 10, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [], spellSlots: {}, spellcastingAbility: '', spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

// ── InventoryItem — optional weapon fields ────────────────────────────────────

describe('InventoryItem — optional weapon combat fields', () => {
  it('weapon item with all combat fields retains them', () => {
    expect(LONGSWORD.damage).toBe('1d8+3')
    expect(LONGSWORD.damageType).toBe('Slashing')
    expect(LONGSWORD.range).toBe('5 ft')
    expect(LONGSWORD.properties).toBe('Versatile')
    expect(LONGSWORD.attackKind).toBe('melee')
  })

  it('weapon item without combat fields is valid (optional fields absent)', () => {
    expect(DAGGER.damage).toBeUndefined()
    expect(DAGGER.damageType).toBeUndefined()
    expect(DAGGER.range).toBeUndefined()
    expect(DAGGER.properties).toBeUndefined()
    expect(DAGGER.attackKind).toBeUndefined()
  })

  it('non-weapon item does not have weapon fields', () => {
    expect(POTION.damage).toBeUndefined()
    expect(POTION.attackKind).toBeUndefined()
  })
})

// ── InventoryList — addItem initializes weapon fields ─────────────────────────

describe('InventoryList — addItem initializes weapon fields', () => {
  beforeEach(() => { localStorage.clear() })

  it('addItem weapon calls onUpdate with damage/damageType/properties/range/attackKind initialized', () => {
    const onUpdate = vi.fn()
    const emptyChar = { ...BASE, inventory: [] }
    renderWithI18n(<InventoryList character={emptyChar} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-item-weapon'))
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    const newItem = call.inventory[0]!
    expect(newItem.category).toBe('weapon')
    expect(newItem.damage).toBe('')
    expect(newItem.damageType).toBe('')
    expect(newItem.properties).toBe('')
    expect(newItem.range).toBe('')
    expect(newItem.attackKind).toBe('melee')
  })

  it('addItem consumable does NOT initialize weapon fields', () => {
    const onUpdate = vi.fn()
    const emptyChar = { ...BASE, inventory: [] }
    renderWithI18n(<InventoryList character={emptyChar} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-item-consumable'))
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    const newItem = call.inventory[0]!
    expect(newItem.category).toBe('consumable')
    expect(newItem.damage).toBeUndefined()
    expect(newItem.attackKind).toBeUndefined()
  })

  it('addItem misc does NOT initialize weapon fields', () => {
    const onUpdate = vi.fn()
    const emptyChar = { ...BASE, inventory: [] }
    renderWithI18n(<InventoryList character={emptyChar} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-item-misc'))
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    const newItem = call.inventory[0]!
    expect(newItem.damage).toBeUndefined()
    expect(newItem.attackKind).toBeUndefined()
  })
})

// ── ItemCard — weapon combat fields visibility ────────────────────────────────

describe('ItemCard — weapon combat fields render only for category=weapon', () => {
  beforeEach(() => { localStorage.clear() })

  function expandItem(id: string) {
    const card = screen.getByTestId(`inventory-item-${id}`)
    fireEvent.click(card)
  }

  it('weapon item shows damage input when expanded', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    expect(screen.getByTestId('item-damage-item1')).toBeDefined()
  })

  it('weapon item shows damage-type input when expanded', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    expect(screen.getByTestId('item-damage-type-item1')).toBeDefined()
  })

  it('weapon item shows range input when expanded', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    expect(screen.getByTestId('item-range-item1')).toBeDefined()
  })

  it('weapon item shows properties input when expanded', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    expect(screen.getByTestId('item-properties-item1')).toBeDefined()
  })

  it('weapon item shows attackKind select when expanded', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    expect(screen.getByTestId('item-attack-kind-item1')).toBeDefined()
  })

  it('non-weapon item (consumable) does NOT show damage input when expanded', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item4')
    expect(screen.queryByTestId('item-damage-item4')).toBeNull()
  })

  it('damage input shows existing value', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    const input = screen.getByTestId('item-damage-item1') as HTMLInputElement
    expect(input.value).toBe('1d8+3')
  })

  it('damageType input shows existing value', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    const input = screen.getByTestId('item-damage-type-item1') as HTMLInputElement
    expect(input.value).toBe('Slashing')
  })

  it('attackKind select shows existing value', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item2')
    const select = screen.getByTestId('item-attack-kind-item2') as HTMLSelectElement
    expect(select.value).toBe('ranged')
  })

  it('damage input defaults to empty string for weapon without damage', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item3')
    const input = screen.getByTestId('item-damage-item3') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('updating damage calls onUpdate with new damage', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<InventoryList character={BASE} onUpdate={onUpdate} />, 'en')
    expandItem('item1')
    fireEvent.change(screen.getByTestId('item-damage-item1'), { target: { value: '1d10+3' } })
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    const updated = call.inventory.find(i => i.id === 'item1')!
    expect(updated.damage).toBe('1d10+3')
  })

  it('updating attackKind calls onUpdate with new attackKind', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<InventoryList character={BASE} onUpdate={onUpdate} />, 'en')
    expandItem('item1')
    fireEvent.change(screen.getByTestId('item-attack-kind-item1'), { target: { value: 'ranged' } })
    const call = onUpdate.mock.calls[0]![0] as { inventory: InventoryItem[] }
    const updated = call.inventory.find(i => i.id === 'item1')!
    expect(updated.attackKind).toBe('ranged')
  })

  it('damage-type input has datalist attribute', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    const input = screen.getByTestId('item-damage-type-item1') as HTMLInputElement
    expect(input.getAttribute('list')).toBe('inventory-canonical-damage-types')
  })

  it('range input has datalist attribute', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandItem('item1')
    const input = screen.getByTestId('item-range-item1') as HTMLInputElement
    expect(input.getAttribute('list')).toBe('inventory-canonical-ranges')
  })
})

// ── AttacksList — import-weapons button visibility ────────────────────────────

describe('AttacksList — import-weapons button visibility', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('import-weapons button is shown when onUpdate is provided and not locked', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('import-weapons-btn')).toBeDefined()
  })

  it('import-weapons button is absent in read-only mode (no onUpdate)', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.queryByTestId('import-weapons-btn')).toBeNull()
  })

  it('import-weapons button is absent when character is locked', () => {
    const locked: Character = { ...BASE, id: 'char_locked_w', locked: true }
    useCharactersStore.setState({ characters: [locked], loading: false, error: null })
    renderWithI18n(<AttacksList character={locked} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('import-weapons-btn')).toBeNull()
  })
})

// ── ImportWeaponsPicker — listing and filtering ───────────────────────────────

describe('ImportWeaponsPicker — listing weapons', () => {
  beforeEach(() => { localStorage.clear() })

  function openPicker() {
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
  }

  it('opens picker when button is clicked', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-weapons-picker')).toBeDefined()
  })

  it('picker shows weapon names', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByText('Longsword')).toBeDefined()
    expect(screen.getByText('Shortbow')).toBeDefined()
    expect(screen.getByText('Dagger')).toBeDefined()
  })

  it('picker does NOT show non-weapon items', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.queryByText('Healing Potion')).toBeNull()
  })

  it('each weapon has an import button with correct testid', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-weapon-item1')).toBeDefined()
    expect(screen.getByTestId('import-weapon-item2')).toBeDefined()
    expect(screen.getByTestId('import-weapon-item3')).toBeDefined()
  })

  it('equipped weapons appear before unequipped ones', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    const buttons = screen.getAllByTestId(/^import-weapon-/)
    const ids = buttons.map(b => b.getAttribute('data-testid'))
    // LONGSWORD (equipped=true) must appear before SHORTBOW and DAGGER (equipped=false)
    const longswordIdx = ids.indexOf('import-weapon-item1')
    const shortbowIdx  = ids.indexOf('import-weapon-item2')
    const daggerIdx    = ids.indexOf('import-weapon-item3')
    expect(longswordIdx).toBeLessThan(shortbowIdx)
    expect(longswordIdx).toBeLessThan(daggerIdx)
  })

  it('shows empty state when no weapons in inventory', () => {
    const noWeapons = { ...BASE, inventory: [POTION] }
    renderWithI18n(<AttacksList character={noWeapons} onUpdate={vi.fn()} />, 'en')
    openPicker()
    expect(screen.getByTestId('import-weapons-empty')).toBeDefined()
  })

  it('closes picker when Done button is clicked', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapons-done'))
    expect(screen.queryByTestId('import-weapons-picker')).toBeNull()
  })

  it('picker stays open after importing one weapon', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(screen.getByTestId('import-weapons-picker')).toBeDefined()
  })
})

// ── ImportWeaponsPicker — snapshot mapping ────────────────────────────────────

describe('ImportWeaponsPicker — snapshot mapping', () => {
  beforeEach(() => { localStorage.clear() })

  function openPicker() {
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
  }

  function captureSnapshot(onUpdate: ReturnType<typeof vi.fn>) {
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    return call.attacks[0]!
  }

  it('snapshot has correct name', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).name).toBe('Longsword')
  })

  it('snapshot kind comes from attackKind (melee)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).kind).toBe('melee')
  })

  it('snapshot kind comes from attackKind (ranged)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item2'))
    expect(captureSnapshot(onUpdate).kind).toBe('ranged')
  })

  it('snapshot kind defaults to melee when attackKind is absent', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item3'))
    expect(captureSnapshot(onUpdate).kind).toBe('melee')
  })

  it('snapshot ability is empty (user chooses STR/DEX)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).ability).toBe('')
  })

  it('snapshot attackBonus is 0', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).attackBonus).toBe(0)
  })

  it('snapshot damage comes from item.damage', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).damage).toBe('1d8+3')
  })

  it('snapshot damageType comes from item.damageType', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).damageType).toBe('Slashing')
  })

  it('snapshot range comes from item.range', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).range).toBe('5 ft')
  })

  it('snapshot properties comes from item.properties', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).properties).toBe('Versatile')
  })

  it('snapshot notes comes from item.description', () => {
    const itemWithDesc = makeItem({
      id:          'item_desc',
      name:        'Rapier',
      category:    'weapon',
      description: 'An elegant blade.',
    })
    const char = { ...BASE, inventory: [itemWithDesc] }
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item_desc'))
    expect(captureSnapshot(onUpdate).notes).toBe('An elegant blade.')
  })

  it('snapshot has a non-empty id', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    expect(captureSnapshot(onUpdate).id).toBeTruthy()
  })

  it('snapshot damage defaults to empty string when item has no damage', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    openPicker()
    fireEvent.click(screen.getByTestId('import-weapon-item3'))
    expect(captureSnapshot(onUpdate).damage).toBe('')
  })
})

// ── Snapshot independence ─────────────────────────────────────────────────────

describe('Snapshot independence', () => {
  beforeEach(() => { localStorage.clear() })

  it('snapshot id differs from item id', () => {
    const onUpdate2 = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate2} />, 'en')
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    const call = onUpdate2.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.id).not.toBe('item1')
  })

  it('multiple imports each get a unique id', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
    // Import weapon 1 then weapon 2 — both stay in the picker
    fireEvent.click(screen.getByTestId('import-weapon-item1'))
    fireEvent.click(screen.getByTestId('import-weapon-item2'))
    const call1 = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    const call2 = onUpdate.mock.calls[1]![0] as { attacks: Attack[] }
    const id1 = call1.attacks[call1.attacks.length - 1]!.id
    const id2 = call2.attacks[call2.attacks.length - 1]!.id
    expect(id1).not.toBe(id2)
  })
})

// ── i18n labels ───────────────────────────────────────────────────────────────

describe('i18n — EN labels', () => {
  beforeEach(() => { localStorage.clear() })

  it('import-weapons button shows EN label', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('import-weapons-btn').textContent).toBe('Import from weapons')
  })

  it('picker title shows EN label', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
    // The picker title text may also match the button — scope to picker
    expect(screen.getByTestId('import-weapons-picker').textContent).toContain('Import from weapons')
  })

  it('picker empty state shows EN label', () => {
    const noWeapons = { ...BASE, inventory: [] }
    renderWithI18n(<AttacksList character={noWeapons} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
    expect(screen.getByText('No weapons yet')).toBeDefined()
  })

  it('ItemCard weapon fields have EN labels', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-item1'))
    // attack kind label
    expect(screen.getByText('Attack type')).toBeDefined()
  })
})

describe('i18n — PT labels', () => {
  beforeEach(() => { localStorage.clear() })

  it('import-weapons button shows PT label', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('import-weapons-btn').textContent).toBe('Importar de armas')
  })

  it('picker title shows PT label', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'pt')
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
    expect(screen.getByTestId('import-weapons-picker').textContent).toContain('Importar de armas')
  })

  it('picker empty state shows PT label', () => {
    const noWeapons = { ...BASE, inventory: [] }
    renderWithI18n(<AttacksList character={noWeapons} onUpdate={vi.fn()} />, 'pt')
    fireEvent.click(screen.getByTestId('import-weapons-btn'))
    expect(screen.getByText('Nenhuma arma cadastrada')).toBeDefined()
  })

  it('ItemCard weapon fields have PT labels', () => {
    renderWithI18n(<InventoryList character={BASE} onUpdate={vi.fn()} />, 'pt')
    fireEvent.click(screen.getByTestId('inventory-item-item1'))
    expect(screen.getByText('Tipo de ataque')).toBeDefined()
  })
})
