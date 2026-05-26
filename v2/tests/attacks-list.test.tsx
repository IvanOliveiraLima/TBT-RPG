import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Attack } from '@/domain/character'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { renderWithI18n } from './helpers/render'

function makeAttack(overrides: Pick<Attack, 'id'> & Partial<Attack>): Attack {
  return {
    name:        '',
    kind:        'melee',
    ability:     'str',
    attackBonus: 0,
    damage:      '',
    damageType:  '',
    range:       '',
    properties:  '',
    notes:       '',
    ...overrides,
  }
}

const LONGSWORD = makeAttack({
  id:          'atk_0',
  name:        'Longsword',
  kind:        'melee',
  ability:     'str',
  attackBonus: 5,
  damage:      '1d8+3',
  damageType:  'Slashing',
  range:       '5 ft',
})

const FIRE_BOLT = makeAttack({
  id:          'atk_1',
  name:        'Fire Bolt',
  kind:        'spell',
  ability:     'int',
  attackBonus: 6,
  damage:      '2d10',
  damageType:  'Fire',
  range:       '120 ft',
})

const BASE: Character = {
  id: 'char_test',
  name: 'Kael',
  race: 'Human', background: 'Sage', alignment: 'Neutral Good',
  classes: [{ name: 'Wizard', level: 5, hitDie: 6 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 14, con: 12, int: 18, wis: 12, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 28, max: 28, temp: 0 },
  hitDice: [{ className: 'Wizard', current: 5, max: 5, dieSize: 6 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 13, initiative: 2, speed: 30,
  passivePerception: 11, spellSaveDC: 15, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [LONGSWORD, FIRE_BOLT],
  inventory: [], currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  images: {}, createdAt: 0, updatedAt: 0,
}

describe('AttacksList — compact mode', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders attacks-list container', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByTestId('attacks-list')).toBeDefined()
  })

  it('renders a card for each attack', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByTestId('attack-card-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-card-atk_1')).toBeDefined()
  })

  it('shows attack name', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByText('Longsword')).toBeDefined()
    expect(screen.getByText('Fire Bolt')).toBeDefined()
  })

  it('shows formatted attack bonus chip', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByTestId('attack-bonus-chip-atk_0').textContent).toBe('+5')
    expect(screen.getByTestId('attack-bonus-chip-atk_1').textContent).toBe('+6')
  })

  it('formats zero bonus as +0', () => {
    const char = { ...BASE, attacks: [makeAttack({ id: 'x', name: 'Punch', attackBonus: 0 })] }
    renderWithI18n(<AttacksList character={char} />, 'en')
    expect(screen.getByTestId('attack-bonus-chip-x').textContent).toBe('+0')
  })

  it('formats negative bonus correctly', () => {
    const char = { ...BASE, attacks: [makeAttack({ id: 'x', name: 'Throw', attackBonus: -2 })] }
    renderWithI18n(<AttacksList character={char} />, 'en')
    expect(screen.getByTestId('attack-bonus-chip-x').textContent).toBe('-2')
  })

  it('shows summary line with ability + damage + range in EN', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    const summary = screen.getByTestId('attack-summary-atk_0')
    expect(summary.textContent).toBe('STR · 1d8+3 Slashing · 5 ft')
  })

  it('shows summary line with localized ability in PT', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'pt')
    const summary = screen.getByTestId('attack-summary-atk_0')
    expect(summary.textContent).toBe('FOR · 1d8+3 Slashing · 5 ft')
  })

  it('omits empty damage from summary', () => {
    const char = { ...BASE, attacks: [makeAttack({ id: 'x', name: 'Punch', ability: 'str', damage: '', damageType: '' })] }
    renderWithI18n(<AttacksList character={char} />, 'en')
    expect(screen.getByTestId('attack-summary-x').textContent).toBe('STR')
  })

  it('omits summary line entirely when all summary fields are empty', () => {
    const char = { ...BASE, attacks: [makeAttack({ id: 'x', name: 'Unnamed', ability: '', damage: '', range: '' })] }
    renderWithI18n(<AttacksList character={char} />, 'en')
    expect(screen.queryByTestId('attack-summary-x')).toBeNull()
  })

  it('shows kind icon for melee', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByTestId('attack-kind-icon-atk_0')).toBeDefined()
  })

  it('shows kind icon for spell', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByTestId('attack-kind-icon-atk_1')).toBeDefined()
  })

  it('shows empty state when attacks array is empty', () => {
    renderWithI18n(<AttacksList character={{ ...BASE, attacks: [] }} />, 'pt')
    expect(screen.getByTestId('attacks-empty-state')).toBeDefined()
    expect(screen.getByText('Nenhum ataque cadastrado.')).toBeDefined()
  })

  it('shows empty state in EN', () => {
    renderWithI18n(<AttacksList character={{ ...BASE, attacks: [] }} />, 'en')
    expect(screen.getByText('No attacks registered.')).toBeDefined()
    expect(screen.getByText('Add an attack to register your weapons and offensive spells.')).toBeDefined()
  })

  it('shows section title in PT', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'pt')
    expect(screen.getByText('ATAQUES')).toBeDefined()
  })

  it('shows section title in EN', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByText('ATTACKS')).toBeDefined()
  })

  it('shows count label', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.getByText('(2)')).toBeDefined()
  })
})

describe('AttacksList — add-attack button', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows add button when onUpdate provided', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('add-attack-btn')).toBeDefined()
  })

  it('hides add button when onUpdate not provided (read-only)', () => {
    renderWithI18n(<AttacksList character={BASE} />, 'en')
    expect(screen.queryByTestId('add-attack-btn')).toBeNull()
  })

  it('add button shows localized label in PT', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('add-attack-btn').textContent).toContain('Adicionar')
  })

  it('add button shows localized label in EN', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('add-attack-btn').textContent).toContain('Add')
  })

  it('clicking add calls onUpdate with one more attack', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={{ ...BASE, attacks: [] }} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-attack-btn'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks).toHaveLength(1)
  })

  it('new attack has a non-empty UUID id', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={{ ...BASE, attacks: [] }} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-attack-btn'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.id).toBeTruthy()
    expect(call.attacks[0]!.id.length).toBeGreaterThan(0)
  })

  it('new attack defaults to kind melee', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={{ ...BASE, attacks: [] }} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-attack-btn'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.kind).toBe('melee')
  })

  it('new attack defaults to attackBonus 0', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={{ ...BASE, attacks: [] }} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-attack-btn'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.attackBonus).toBe(0)
  })
})

describe('AttacksList — remove attack', () => {
  beforeEach(() => { localStorage.clear() })

  it('remove button calls onUpdate with attack filtered out by id (two-step confirm)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    // First click enters confirming state — no action yet
    fireEvent.click(screen.getByTestId('remove-attack-atk_0'))
    expect(onUpdate).not.toHaveBeenCalled()
    // Second click confirms
    fireEvent.click(screen.getByTestId('remove-attack-atk_0'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks).toHaveLength(1)
    expect(call.attacks[0]!.id).toBe('atk_1')
  })

  it('preserves other attacks by id when removing (two-step confirm)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('remove-attack-atk_1'))
    expect(onUpdate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('remove-attack-atk_1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks).toHaveLength(1)
    expect(call.attacks[0]!.name).toBe('Longsword')
  })

  it('remove button has accessible aria-label in PT', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByRole('button', { name: 'Remover ataque Longsword' })).toBeDefined()
  })

  it('remove button has accessible aria-label in EN', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByRole('button', { name: 'Remove attack Longsword' })).toBeDefined()
  })
})

describe('AttackCard — expand/collapse', () => {
  beforeEach(() => { localStorage.clear() })

  it('starts in compact mode (no edit form visible)', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attack-name-input-atk_0')).toBeNull()
  })

  it('expands on card click (not on remove button)', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    const card = screen.getByTestId('attack-card-atk_0')
    // Click the card itself (not a button)
    const header = card.querySelector('[data-testid="attack-kind-icon-atk_0"]')!
    fireEvent.click(header)
    expect(screen.getByTestId('attack-name-input-atk_0')).toBeDefined()
  })

  it('shows edit form fields when expanded', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    const card = screen.getByTestId('attack-card-atk_0')
    const icon = card.querySelector('[data-testid="attack-kind-icon-atk_0"]')!
    fireEvent.click(icon)
    expect(screen.getByTestId('attack-kind-select-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-ability-select-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-bonus-input-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-damage-input-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-damage-type-input-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-range-input-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-properties-input-atk_0')).toBeDefined()
    expect(screen.getByTestId('attack-notes-textarea-atk_0')).toBeDefined()
  })

  it('remove click does not expand the card', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('remove-attack-atk_0'))
    expect(screen.queryByTestId('attack-name-input-atk_0')).toBeNull()
  })
})

describe('AttackCard — editing (expanded)', () => {
  beforeEach(() => { localStorage.clear() })

  function expandCard(id: string) {
    const card = screen.getByTestId(`attack-card-${id}`)
    const icon = card.querySelector(`[data-testid="attack-kind-icon-${id}"]`)!
    fireEvent.click(icon)
  }

  it('updates name via input', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-name-input-atk_0'), { target: { value: 'Greatsword' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks.find(a => a.id === 'atk_0')!.name).toBe('Greatsword')
  })

  it('updates kind via select', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-kind-select-atk_0'), { target: { value: 'ranged' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks.find(a => a.id === 'atk_0')!.kind).toBe('ranged')
  })

  it('updates ability via select', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-ability-select-atk_0'), { target: { value: 'dex' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks.find(a => a.id === 'atk_0')!.ability).toBe('dex')
  })

  it('updates damage as free-text', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-damage-input-atk_0'), { target: { value: '2d6+4' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks.find(a => a.id === 'atk_0')!.damage).toBe('2d6+4')
  })

  it('updates damageType as free-text', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-damage-type-input-atk_0'), { target: { value: 'Piercing' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks.find(a => a.id === 'atk_0')!.damageType).toBe('Piercing')
  })

  it('updates range as free-text', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-range-input-atk_0'), { target: { value: '10 ft' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks.find(a => a.id === 'atk_0')!.range).toBe('10 ft')
  })

  it('updates notes via textarea', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-notes-textarea-atk_0'), { target: { value: 'Magic weapon' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks.find(a => a.id === 'atk_0')!.notes).toBe('Magic weapon')
  })

  it('preserves other attacks when one is updated (id-based, not index-based)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={BASE} onUpdate={onUpdate} />, 'en')
    expandCard('atk_0')
    fireEvent.change(screen.getByTestId('attack-name-input-atk_0'), { target: { value: 'Updated' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks).toHaveLength(2)
    expect(call.attacks.find(a => a.id === 'atk_1')!.name).toBe('Fire Bolt')
  })

  it('damage type input has datalist attribute', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandCard('atk_0')
    const input = screen.getByTestId('attack-damage-type-input-atk_0') as HTMLInputElement
    expect(input.getAttribute('list')).toBe('canonical-damage-types')
  })

  it('range input has datalist attribute', () => {
    renderWithI18n(<AttacksList character={BASE} onUpdate={vi.fn()} />, 'en')
    expandCard('atk_0')
    const input = screen.getByTestId('attack-range-input-atk_0') as HTMLInputElement
    expect(input.getAttribute('list')).toBe('canonical-ranges')
  })
})

describe('AttackKindIcon', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders SVG for melee attack', () => {
    const char = { ...BASE, attacks: [makeAttack({ id: 'x', name: 'Sword', kind: 'melee' })] }
    renderWithI18n(<AttacksList character={char} />, 'en')
    const iconEl = screen.getByTestId('attack-kind-icon-x')
    expect(iconEl.querySelector('svg')).toBeDefined()
  })

  it('renders SVG for ranged attack', () => {
    const char = { ...BASE, attacks: [makeAttack({ id: 'x', name: 'Bow', kind: 'ranged' })] }
    renderWithI18n(<AttacksList character={char} />, 'en')
    const iconEl = screen.getByTestId('attack-kind-icon-x')
    expect(iconEl.querySelector('svg')).toBeDefined()
  })

  it('renders SVG for spell attack', () => {
    const char = { ...BASE, attacks: [makeAttack({ id: 'x', name: 'Fireball', kind: 'spell' })] }
    renderWithI18n(<AttacksList character={char} />, 'en')
    const iconEl = screen.getByTestId('attack-kind-icon-x')
    expect(iconEl.querySelector('svg')).toBeDefined()
  })
})
