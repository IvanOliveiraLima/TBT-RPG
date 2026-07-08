/**
 * card-accordion.test.tsx
 *
 * Tests for the single-open accordion behaviour introduced in feat/card-accordion:
 *   - SpellList, AttacksList, InventoryList each manage openId at list level
 *   - Clicking a card below an open card closes the old one and opens the new one (the bug)
 *   - Clicking outside the list closes the open card (pointerdown)
 *   - Adding a new item opens it immediately
 *   - readOnly prevents expansion (SpellList without onUpdate)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Spell, Attack, InventoryItem } from '@/domain/character'
import { SpellList } from '@/components/sheet/parts/SpellList'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { InventoryList } from '@/components/sheet/parts/InventoryList'
import { renderWithI18n } from './helpers/render'

// ── Shared character fixture helpers ─────────────────────────────────────────

function makeSpell(overrides: Partial<Spell> = {}): Spell {
  return {
    id: crypto.randomUUID(),
    name: 'Test Spell',
    level: 1,
    school: 'abjuration',
    castingTime: '1 action',
    range: '30 ft',
    description: '',
    prepared: false,
    ...overrides,
  }
}

function makeAttack(overrides: Partial<Attack> = {}): Attack {
  return {
    id: crypto.randomUUID(),
    name: 'Test Attack',
    kind: 'melee',
    ability: 'str',
    attackBonus: 3,
    damage: '1d8+3',
    damageType: 'slashing',
    range: '5 ft',
    properties: '',
    notes: '',
    ...overrides,
  }
}

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: crypto.randomUUID(),
    name: 'Test Item',
    quantity: 1,
    weight: 1,
    category: 'weapon',
    description: '',
    equipped: false,
    ...overrides,
  }
}

const BASE: Character = {
  id: 'acc_test',
  name: 'Accordion Tester',
  race: '', background: '', alignment: '',
  classes: [{ name: 'Fighter', level: 1, hitDie: 10 }],
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 10, max: 10, temp: 0 },
  hitDice: [{ className: 'Fighter', current: 1, max: 1, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 10, initiative: 0, speed: 30,
  passivePerception: 10, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  spells: [],
  spellSlots: { '1': { current: 0, max: 2 } },
  spellcastingAbility: 'int', spellcastingClass: '',
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '', personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0, updatedAt: 0,
}

beforeEach(() => { localStorage.clear() })

// ── SpellList accordion ───────────────────────────────────────────────────────

describe('SpellList — single-open accordion', () => {
  const sp1 = makeSpell({ id: 'sp1', name: 'Spell Alpha' })
  const sp2 = makeSpell({ id: 'sp2', name: 'Spell Beta' })
  const char: Character = { ...BASE, spells: [sp1, sp2] }

  it('no card is expanded on initial render', () => {
    renderWithI18n(<SpellList character={char} onUpdate={() => {}} />, 'en')
    expect(screen.queryByTestId('spell-name-sp1')).toBeNull()
    expect(screen.queryByTestId('spell-name-sp2')).toBeNull()
  })

  it('clicking a card expands it', () => {
    renderWithI18n(<SpellList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByText('Spell Alpha'))
    expect(screen.getByTestId('spell-name-sp1')).toBeDefined()
  })

  it('clicking card A, then card B below A — B opens, A closes (the bug)', () => {
    // sp1 appears first (above), sp2 appears second (below)
    renderWithI18n(<SpellList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByText('Spell Alpha'))
    expect(screen.getByTestId('spell-name-sp1')).toBeDefined()
    // Now click card below
    fireEvent.click(screen.getByText('Spell Beta'))
    expect(screen.queryByTestId('spell-name-sp1')).toBeNull()
    expect(screen.getByTestId('spell-name-sp2')).toBeDefined()
  })

  it('clicking card B, then card A above B — A opens, B closes', () => {
    renderWithI18n(<SpellList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByText('Spell Beta'))
    expect(screen.getByTestId('spell-name-sp2')).toBeDefined()
    fireEvent.click(screen.getByText('Spell Alpha'))
    expect(screen.queryByTestId('spell-name-sp2')).toBeNull()
    expect(screen.getByTestId('spell-name-sp1')).toBeDefined()
  })

  it('clicking outside the list closes the open card', () => {
    renderWithI18n(<SpellList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByText('Spell Alpha'))
    expect(screen.getByTestId('spell-name-sp1')).toBeDefined()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByTestId('spell-name-sp1')).toBeNull()
  })

  it('does not expand in readOnly mode (no onUpdate)', () => {
    renderWithI18n(<SpellList character={char} />, 'en')
    fireEvent.click(screen.getByText('Spell Alpha'))
    expect(screen.queryByTestId('spell-name-sp1')).toBeNull()
  })
})

// ── AttacksList accordion ─────────────────────────────────────────────────────

describe('AttacksList — single-open accordion', () => {
  const atk1 = makeAttack({ id: 'atk1', name: 'Longsword' })
  const atk2 = makeAttack({ id: 'atk2', name: 'Dagger' })
  const char: Character = { ...BASE, attacks: [atk1, atk2] }

  function clickCardBody(testId: string) {
    // Click the kind icon (a span) — not a button/input, passes the guard
    const card = screen.getByTestId(testId)
    const icon = card.querySelector(`[data-testid="attack-kind-icon-${testId.replace('attack-card-', '')}"]`)!
    fireEvent.click(icon)
  }

  it('no card is expanded on initial render', () => {
    renderWithI18n(<AttacksList character={char} onUpdate={() => {}} />, 'en')
    expect(screen.queryByTestId('attack-name-input-atk1')).toBeNull()
    expect(screen.queryByTestId('attack-name-input-atk2')).toBeNull()
  })

  it('clicking a card expands it', () => {
    renderWithI18n(<AttacksList character={char} onUpdate={() => {}} />, 'en')
    clickCardBody('attack-card-atk1')
    expect(screen.getByTestId('attack-name-input-atk1')).toBeDefined()
  })

  it('clicking card A (above), then card B (below) — B opens, A closes (the bug)', () => {
    renderWithI18n(<AttacksList character={char} onUpdate={() => {}} />, 'en')
    clickCardBody('attack-card-atk1')
    expect(screen.getByTestId('attack-name-input-atk1')).toBeDefined()
    clickCardBody('attack-card-atk2')
    expect(screen.queryByTestId('attack-name-input-atk1')).toBeNull()
    expect(screen.getByTestId('attack-name-input-atk2')).toBeDefined()
  })

  it('clicking card B, then card A above B — A opens, B closes', () => {
    renderWithI18n(<AttacksList character={char} onUpdate={() => {}} />, 'en')
    clickCardBody('attack-card-atk2')
    expect(screen.getByTestId('attack-name-input-atk2')).toBeDefined()
    clickCardBody('attack-card-atk1')
    expect(screen.queryByTestId('attack-name-input-atk2')).toBeNull()
    expect(screen.getByTestId('attack-name-input-atk1')).toBeDefined()
  })

  it('clicking outside the list closes the open card', () => {
    renderWithI18n(<AttacksList character={char} onUpdate={() => {}} />, 'en')
    clickCardBody('attack-card-atk1')
    expect(screen.getByTestId('attack-name-input-atk1')).toBeDefined()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByTestId('attack-name-input-atk1')).toBeNull()
  })

  it('clicking same open card toggles it closed', () => {
    renderWithI18n(<AttacksList character={char} onUpdate={() => {}} />, 'en')
    clickCardBody('attack-card-atk1')
    expect(screen.getByTestId('attack-name-input-atk1')).toBeDefined()
    clickCardBody('attack-card-atk1')
    expect(screen.queryByTestId('attack-name-input-atk1')).toBeNull()
  })
})

// ── InventoryList accordion ───────────────────────────────────────────────────

describe('InventoryList — single-open accordion', () => {
  const it1 = makeItem({ id: 'itm1', name: 'Longsword', category: 'weapon' })
  const it2 = makeItem({ id: 'itm2', name: 'Dagger',    category: 'weapon' })
  const char: Character = { ...BASE, inventory: [it1, it2] }

  it('no card is expanded on initial render', () => {
    renderWithI18n(<InventoryList character={char} onUpdate={() => {}} />, 'en')
    expect(screen.queryByTestId('item-name-itm1')).toBeNull()
    expect(screen.queryByTestId('item-name-itm2')).toBeNull()
  })

  it('clicking a card expands it', () => {
    renderWithI18n(<InventoryList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm1'))
    expect(screen.getByTestId('item-name-itm1')).toBeDefined()
  })

  it('clicking card A (above), then card B (below) — B opens, A closes (the bug)', () => {
    renderWithI18n(<InventoryList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm1'))
    expect(screen.getByTestId('item-name-itm1')).toBeDefined()
    // Click the compact row of item 2 (when item 1 is open, item 2's name shows as a span)
    fireEvent.click(screen.getByTestId('inventory-item-itm2'))
    expect(screen.queryByTestId('item-name-itm1')).toBeNull()
    expect(screen.getByTestId('item-name-itm2')).toBeDefined()
  })

  it('clicking card B, then card A above B — A opens, B closes', () => {
    renderWithI18n(<InventoryList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm2'))
    expect(screen.getByTestId('item-name-itm2')).toBeDefined()
    fireEvent.click(screen.getByTestId('inventory-item-itm1'))
    expect(screen.queryByTestId('item-name-itm2')).toBeNull()
    expect(screen.getByTestId('item-name-itm1')).toBeDefined()
  })

  it('clicking outside the list closes the open card', () => {
    renderWithI18n(<InventoryList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm1'))
    expect(screen.getByTestId('item-name-itm1')).toBeDefined()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByTestId('item-name-itm1')).toBeNull()
  })

  it('does not expand in readOnly mode (no onUpdate)', () => {
    renderWithI18n(<InventoryList character={char} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm1'))
    expect(screen.queryByTestId('item-name-itm1')).toBeNull()
  })
})

// ── FeaturesList accordion ────────────────────────────────────────────────────

import { FeaturesList } from '@/components/sheet/parts/FeaturesList'
import type { Feature } from '@/domain/character'

function makeFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: crypto.randomUUID(),
    name: 'Test Feature',
    source: 'Classe',
    description: '',
    type: 'passive',
    ...overrides,
  }
}

describe('FeaturesList — single-open accordion', () => {
  const ft1 = makeFeature({ id: 'ft1', name: 'Feature Alpha', source: 'Raça', type: 'passive' })
  const ft2 = makeFeature({ id: 'ft2', name: 'Feature Beta', source: 'Classe', type: 'active', usesLeft: 1, usesMax: 2 })
  const char: Character = { ...BASE, features: [ft1, ft2] }

  it('no card is expanded on initial render', () => {
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    expect(screen.queryByTestId('feature-name-ft1')).toBeNull()
    expect(screen.queryByTestId('feature-name-ft2')).toBeNull()
  })

  it('clicking a card expands it (shows name input)', () => {
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('feature-card-ft1'))
    expect(screen.getByTestId('feature-name-ft1')).toBeDefined()
  })

  it('clicking card A (above), then card B (below) — B opens, A closes (the bug)', () => {
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('feature-card-ft1'))
    expect(screen.getByTestId('feature-name-ft1')).toBeDefined()
    fireEvent.click(screen.getByTestId('feature-card-ft2'))
    expect(screen.queryByTestId('feature-name-ft1')).toBeNull()
    expect(screen.getByTestId('feature-name-ft2')).toBeDefined()
  })

  it('clicking card B, then card A above B — A opens, B closes', () => {
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('feature-card-ft2'))
    expect(screen.getByTestId('feature-name-ft2')).toBeDefined()
    fireEvent.click(screen.getByTestId('feature-card-ft1'))
    expect(screen.queryByTestId('feature-name-ft2')).toBeNull()
    expect(screen.getByTestId('feature-name-ft1')).toBeDefined()
  })

  it('clicking outside the list closes the open card', () => {
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('feature-card-ft1'))
    expect(screen.getByTestId('feature-name-ft1')).toBeDefined()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByTestId('feature-name-ft1')).toBeNull()
  })

  it('does not expand in readOnly mode (no onUpdate)', () => {
    renderWithI18n(<FeaturesList character={char} />, 'en')
    fireEvent.click(screen.getByTestId('feature-card-ft1'))
    expect(screen.queryByTestId('feature-name-ft1')).toBeNull()
  })

  it('compact summary shows name, source, type when closed', () => {
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    expect(screen.getByTestId('feature-summary-name-ft1').textContent).toBe('Feature Alpha')
    expect(screen.getByTestId('feature-summary-source-ft1').textContent).toBe('Raça')
    expect(screen.getByTestId('feature-summary-type-ft1')).toBeDefined()
  })

  it('compact summary shows uses for active feature when closed', () => {
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    const usesSpan = screen.getByTestId('feature-summary-uses-ft2')
    expect(usesSpan.textContent).toBe('1/2')
    // Passive feature has no uses chip
    expect(screen.queryByTestId('feature-summary-uses-ft1')).toBeNull()
  })
})

// ── Name field shrink — clicking free header space collapses item ─────────────

describe('Name field shrink — click free header space collapses open item', () => {
  it('SpellList: clicking header gap collapses the open spell card', () => {
    const sp = makeSpell({ id: 'gsp1', name: 'Gap Spell' })
    const char: Character = { ...BASE, spells: [sp] }
    renderWithI18n(<SpellList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByText('Gap Spell'))
    expect(screen.getByTestId('spell-name-gsp1')).toBeDefined()
    fireEvent.click(screen.getByTestId('spell-header-gap-gsp1'))
    expect(screen.queryByTestId('spell-name-gsp1')).toBeNull()
  })

  it('AttacksList: clicking header gap collapses the open attack card', () => {
    const atk = makeAttack({ id: 'gatk1', name: 'Gap Attack' })
    const char: Character = { ...BASE, attacks: [atk] }
    renderWithI18n(<AttacksList character={char} onUpdate={() => {}} />, 'en')
    // Click the kind icon (non-interactive for the guard) to expand
    const card = screen.getByTestId('attack-card-gatk1')
    const icon = card.querySelector('[data-testid="attack-kind-icon-gatk1"]')!
    fireEvent.click(icon)
    expect(screen.getByTestId('attack-name-input-gatk1')).toBeDefined()
    fireEvent.click(screen.getByTestId('attack-header-gap-gatk1'))
    expect(screen.queryByTestId('attack-name-input-gatk1')).toBeNull()
  })

  it('FeaturesList: clicking header gap collapses the open feature card', () => {
    const ft = makeFeature({ id: 'gft1', name: 'Gap Feature' })
    const char: Character = { ...BASE, features: [ft] }
    renderWithI18n(<FeaturesList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('feature-card-gft1'))
    expect(screen.getByTestId('feature-name-gft1')).toBeDefined()
    fireEvent.click(screen.getByTestId('feature-header-gap-gft1'))
    expect(screen.queryByTestId('feature-name-gft1')).toBeNull()
  })

  it('InventoryList: clicking header gap collapses the open item card', () => {
    const itm = makeItem({ id: 'gitm1', name: 'Gap Item' })
    const char: Character = { ...BASE, inventory: [itm] }
    renderWithI18n(<InventoryList character={char} onUpdate={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-gitm1'))
    expect(screen.getByTestId('item-name-gitm1')).toBeDefined()
    fireEvent.click(screen.getByTestId('item-header-gap-gitm1'))
    expect(screen.queryByTestId('item-name-gitm1')).toBeNull()
  })
})
