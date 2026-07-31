/**
 * Tests for Combat.3 — group spell attacks by level + save DC on cards
 *
 * Covers:
 * - Attack domain: spellLevel optional field
 * - Import from spells: snapshot captures spellLevel from spell.level
 * - AttackCard expanded: spell level select appears/updates when kind='spell'
 * - AttacksList grouping: weapons first, spells by level; only non-empty sections
 * - Flat list preserved when no spell attacks exist
 * - Retrofit inference: attack without spellLevel inferred by name-match in character.spells
 * - Unknown spells (no level resolved) go to "other spells" section
 * - Save DC badge: shown when spellcastingAbility set; absent when not; correct value
 * - PT/EN label coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Attack, Spell } from '@/domain/character'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAttack(overrides: Pick<Attack, 'id'> & Partial<Attack>): Attack {
  return {
    name: '', kind: 'melee', ability: '', attackBonus: 0,
    damage: '', damageType: '', range: '', properties: '', notes: '',
    ...overrides,
  }
}

function makeSpell(overrides: Pick<Spell, 'id' | 'level'> & Partial<Spell>): Spell {
  return {
    name: '', school: 'evocation', castingTime: '1 action',
    range: '', description: '', prepared: false,
    damage: '', damageType: '',
    ...overrides,
  }
}

// ── Base character ─────────────────────────────────────────────────────────────

const BASE: Character = {
  id:   'char_wizard',
  name: 'Gandalf',
  race: 'Maia', background: 'Sage', alignment: 'NG',
  classes: [{ name: 'Wizard', level: 5, hitDie: 6 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 8, dex: 14, con: 14, int: 18, wis: 14, cha: 16 },
  proficiencyBonus: 3,
  hp: { current: 30, max: 30, temp: 0 },
  hitDice: [{ className: 'Wizard', current: 5, max: 5, dieSize: 6 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 12,
  // spellSaveDC = 8 + 3 (profBonus) + 4 (INT mod) = 15
  spellSaveDC: 15,
  inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [],
  spellSlots: {},
  spellcastingAbility: 'int',
  spellcastingClass: 'Wizard',
  images: {}, createdAt: 0, updatedAt: 0,
}

// ── Domain: spellLevel optional on Attack ─────────────────────────────────────

describe('Attack domain — spellLevel optional field', () => {
  it('Attack without spellLevel is valid', () => {
    const a = makeAttack({ id: 'a1', kind: 'spell' })
    expect(a.spellLevel).toBeUndefined()
  })

  it('Attack with spellLevel 0 (cantrip) is valid', () => {
    const a = makeAttack({ id: 'a2', kind: 'spell', spellLevel: 0 })
    expect(a.spellLevel).toBe(0)
  })

  it('Attack with spellLevel 5 is valid', () => {
    const a = makeAttack({ id: 'a3', kind: 'spell', spellLevel: 5 })
    expect(a.spellLevel).toBe(5)
  })
})

// ── Import from spells: captures spellLevel ───────────────────────────────────

describe('ImportSpellsPicker — snapshot captures spellLevel', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('importing a level-1 spell sets spellLevel=1 on the attack', () => {
    const fireball = makeSpell({ id: 'sp1', name: 'Magic Missile', level: 1, damage: '1d4+1' })
    const char = { ...BASE, spells: [fireball] }
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('import-spells-btn'))
    fireEvent.click(screen.getByTestId('import-spell-sp1'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    const imported = call.attacks[0]!
    expect(imported.kind).toBe('spell')
    expect(imported.spellLevel).toBe(1)
  })

  it('importing a cantrip sets spellLevel=0', () => {
    const cantrip = makeSpell({ id: 'sp2', name: 'Fire Bolt', level: 0, damage: '1d10' })
    const char = { ...BASE, spells: [cantrip] }
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('import-spells-btn'))
    fireEvent.click(screen.getByTestId('import-spell-sp2'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.spellLevel).toBe(0)
  })

  it('importing a level-3 spell sets spellLevel=3', () => {
    const fb = makeSpell({ id: 'sp3', name: 'Fireball', level: 3, damage: '8d6' })
    const char = { ...BASE, spells: [fb] }
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('import-spells-btn'))
    fireEvent.click(screen.getByTestId('import-spell-sp3'))
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.spellLevel).toBe(3)
  })
})

// ── AttackCard — spell level select ───────────────────────────────────────────

describe('AttackCard — spell level select (kind=spell, expanded)', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('spell level select renders when kind=spell and card is expanded', () => {
    const attack = makeAttack({ id: 'a1', kind: 'spell', spellLevel: 1 })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId(`attack-card-a1`))
    expect(screen.getByTestId('attack-spell-level-a1')).toBeDefined()
  })

  it('spell level select does NOT render for melee attacks', () => {
    const attack = makeAttack({ id: 'a2', kind: 'melee' })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId(`attack-card-a2`))
    expect(screen.queryByTestId('attack-spell-level-a2')).toBeNull()
  })

  it('spell level select does NOT render for ranged attacks', () => {
    const attack = makeAttack({ id: 'a3', kind: 'ranged' })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId(`attack-card-a3`))
    expect(screen.queryByTestId('attack-spell-level-a3')).toBeNull()
  })

  it('spell level select shows current spellLevel value', () => {
    const attack = makeAttack({ id: 'a4', kind: 'spell', spellLevel: 3 })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId(`attack-card-a4`))
    const sel = screen.getByTestId('attack-spell-level-a4') as HTMLSelectElement
    expect(sel.value).toBe('3')
  })

  it('spell level select shows blank when spellLevel is undefined', () => {
    const attack = makeAttack({ id: 'a5', kind: 'spell' })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId(`attack-card-a5`))
    const sel = screen.getByTestId('attack-spell-level-a5') as HTMLSelectElement
    expect(sel.value).toBe('')
  })

  it('changing spell level select calls onUpdate with correct spellLevel', () => {
    const attack = makeAttack({ id: 'a6', kind: 'spell', spellLevel: 1 })
    const char = { ...BASE, attacks: [attack] }
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId(`attack-card-a6`))
    fireEvent.change(screen.getByTestId('attack-spell-level-a6'), { target: { value: '4' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.spellLevel).toBe(4)
  })

  it('changing spell level to 0 (cantrip) calls onUpdate with spellLevel=0', () => {
    const attack = makeAttack({ id: 'a7', kind: 'spell', spellLevel: 2 })
    const char = { ...BASE, attacks: [attack] }
    const onUpdate = vi.fn()
    renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId(`attack-card-a7`))
    fireEvent.change(screen.getByTestId('attack-spell-level-a7'), { target: { value: '0' } })
    const call = onUpdate.mock.calls[0]![0] as { attacks: Attack[] }
    expect(call.attacks[0]!.spellLevel).toBe(0)
  })
})

// ── AttacksList — grouping ─────────────────────────────────────────────────────

describe('AttacksList — grouping: flat list when no spells', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('no section headers when all attacks are non-spell', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Sword', kind: 'melee' }),
      makeAttack({ id: 'a2', name: 'Bow', kind: 'ranged' }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attacks-section-weapons')).toBeNull()
    expect(screen.queryByTestId('attacks-section-level-0')).toBeNull()
    expect(screen.queryByTestId('attacks-section-other')).toBeNull()
    expect(screen.getByTestId('attack-card-a1')).toBeDefined()
    expect(screen.getByTestId('attack-card-a2')).toBeDefined()
  })

  it('no section headers with single melee attack', () => {
    const attacks = [makeAttack({ id: 'a1', name: 'Dagger', kind: 'melee' })]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attacks-section-weapons')).toBeNull()
  })
})

describe('AttacksList — grouping: sections appear when spells present', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('weapons section appears above spell sections', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Sword', kind: 'melee' }),
      makeAttack({ id: 'a2', name: 'Fireball', kind: 'spell', spellLevel: 3 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-weapons')).toBeDefined()
    expect(screen.getByTestId('attacks-section-level-3')).toBeDefined()
  })

  it('weapons section absent when there are only spell attacks', () => {
    const attacks = [makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 })]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attacks-section-weapons')).toBeNull()
    expect(screen.getByTestId('attacks-section-level-3')).toBeDefined()
  })

  it('cantrip section has testid attacks-section-level-0', () => {
    const attacks = [makeAttack({ id: 'a1', name: 'Fire Bolt', kind: 'spell', spellLevel: 0 })]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-level-0')).toBeDefined()
    expect(screen.queryByTestId('attacks-section-level-1')).toBeNull()
  })

  it('only non-empty spell level sections render', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Fire Bolt', kind: 'spell', spellLevel: 0 }),
      makeAttack({ id: 'a2', name: 'Fireball', kind: 'spell', spellLevel: 3 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-level-0')).toBeDefined()
    expect(screen.getByTestId('attacks-section-level-3')).toBeDefined()
    expect(screen.queryByTestId('attacks-section-level-1')).toBeNull()
    expect(screen.queryByTestId('attacks-section-level-2')).toBeNull()
    expect(screen.queryByTestId('attacks-section-level-5')).toBeNull()
  })

  it('attack cards retain their testids in grouped view', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Sword', kind: 'melee' }),
      makeAttack({ id: 'a2', name: 'Fireball', kind: 'spell', spellLevel: 3 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attack-card-a1')).toBeDefined()
    expect(screen.getByTestId('attack-card-a2')).toBeDefined()
  })

  it('multiple spell attacks at same level group under one section header', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Magic Missile', kind: 'spell', spellLevel: 1 }),
      makeAttack({ id: 'a2', name: 'Thunderwave', kind: 'spell', spellLevel: 1 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    // Only one level-1 section header
    expect(screen.getAllByTestId('attacks-section-level-1')).toHaveLength(1)
    expect(screen.getByTestId('attack-card-a1')).toBeDefined()
    expect(screen.getByTestId('attack-card-a2')).toBeDefined()
  })

  it('order preserved within a section (insertion order)', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'First Spell', kind: 'spell', spellLevel: 2 }),
      makeAttack({ id: 'a2', name: 'Second Spell', kind: 'spell', spellLevel: 2 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    const cards = screen.getAllByTestId(/attack-card-/)
    expect(cards[0]!.getAttribute('data-testid')).toBe('attack-card-a1')
    expect(cards[1]!.getAttribute('data-testid')).toBe('attack-card-a2')
  })
})

// ── Retrofit inference ─────────────────────────────────────────────────────────

describe('AttacksList — retrofit inference by spell name', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('spell attack without spellLevel is placed in the correct level by name match', () => {
    const spell = makeSpell({ id: 'sp1', name: 'Fireball', level: 3 })
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell' }) // no spellLevel
    const char = { ...BASE, spells: [spell], attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-level-3')).toBeDefined()
    expect(screen.queryByTestId('attacks-section-other')).toBeNull()
  })

  it('name match is case-insensitive and trim-safe', () => {
    const spell = makeSpell({ id: 'sp1', name: '  MAGIC MISSILE  ', level: 1 })
    const attack = makeAttack({ id: 'a1', name: 'magic missile', kind: 'spell' })
    const char = { ...BASE, spells: [spell], attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-level-1')).toBeDefined()
  })

  it('spell attack without spellLevel and no name match goes to "other spells"', () => {
    const attack = makeAttack({ id: 'a1', name: 'Mystery Bolt', kind: 'spell' })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-other')).toBeDefined()
    expect(screen.queryByTestId('attacks-section-level-0')).toBeNull()
  })

  it('explicit spellLevel takes precedence over name match', () => {
    // spell has level 3 in character.spells, but the attack has spellLevel=5 (upcasted)
    const spell = makeSpell({ id: 'sp1', name: 'Fireball', level: 3 })
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 5 })
    const char = { ...BASE, spells: [spell], attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-level-5')).toBeDefined()
    expect(screen.queryByTestId('attacks-section-level-3')).toBeNull()
  })

  it('other spells section absent when all spells resolve to a level', () => {
    const spell = makeSpell({ id: 'sp1', name: 'Fireball', level: 3 })
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell' })
    const char = { ...BASE, spells: [spell], attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attacks-section-other')).toBeNull()
  })
})

// ── Save DC badge ──────────────────────────────────────────────────────────────

describe('AttacksList — save DC badge on spell attack cards', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('save DC badge shown for spell attack when spellcastingAbility is set', () => {
    // INT 18 → mod +4; profBonus 3 → DC = 8 + 4 + 3 = 15
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 })
    const char = { ...BASE, attacks: [attack], spellcastingAbility: 'int' as const }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    const badge = screen.getByTestId('attack-save-dc-a1')
    expect(badge.textContent).toContain('15')
  })

  it('save DC badge NOT shown when spellcastingAbility is empty', () => {
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 })
    const char = { ...BASE, attacks: [attack], spellcastingAbility: '' as const }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attack-save-dc-a1')).toBeNull()
  })

  it('save DC badge NOT shown for non-spell attacks', () => {
    const attack = makeAttack({ id: 'a1', name: 'Sword', kind: 'melee' })
    // Only melee attack, no spells → flat view, no DC badge
    const char = { ...BASE, attacks: [attack], spellcastingAbility: 'int' as const }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('attack-save-dc-a1')).toBeNull()
  })

  it('save DC value matches deriveSpellSaveDC formula (WIS example)', () => {
    // WIS 16 → mod +3; profBonus 3 → DC = 8 + 3 + 3 = 14
    const attack = makeAttack({ id: 'a1', name: 'Sacred Flame', kind: 'spell', spellLevel: 0 })
    const char = {
      ...BASE,
      abilities: { ...BASE.abilities, wis: 16 },
      proficiencyBonus: 3,
      spellcastingAbility: 'wis' as const,
      attacks: [attack],
    }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attack-save-dc-a1').textContent).toContain('14')
  })

  it('save DC badge shows EN format "DC {n}"', () => {
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 })
    const char = { ...BASE, attacks: [attack], spellcastingAbility: 'int' as const }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attack-save-dc-a1').textContent).toContain('DC')
  })

  it('save DC badge shows PT format "CD {n}"', () => {
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 })
    const char = { ...BASE, attacks: [attack], spellcastingAbility: 'int' as const }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('attack-save-dc-a1').textContent).toContain('CD')
  })

  it('multiple spell attacks all show the same DC', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 }),
      makeAttack({ id: 'a2', name: 'Sacred Flame', kind: 'spell', spellLevel: 0 }),
    ]
    const char = { ...BASE, attacks, spellcastingAbility: 'int' as const }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attack-save-dc-a1').textContent).toContain('15')
    expect(screen.getByTestId('attack-save-dc-a2').textContent).toContain('15')
  })
})

// ── i18n — section labels ──────────────────────────────────────────────────────

describe('AttacksList — section labels EN/PT', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('EN: weapons section label is "Attacks" (title case; CSS uppercases it visually)', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Sword', kind: 'melee' }),
      makeAttack({ id: 'a2', name: 'Fireball', kind: 'spell', spellLevel: 3 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-weapons').textContent).toBe('Attacks')
  })

  it('PT: weapons section label is "Ataques" (title case; CSS uppercases it visually)', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Espada', kind: 'melee' }),
      makeAttack({ id: 'a2', name: 'Bola de Fogo', kind: 'spell', spellLevel: 3 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('attacks-section-weapons').textContent).toBe('Ataques')
  })

  it('EN: other spells section label is "Other spells"', () => {
    const attack = makeAttack({ id: 'a1', name: 'Mystery', kind: 'spell' })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-other').textContent).toBe('Other spells')
  })

  it('PT: other spells section label is "Outras magias"', () => {
    const attack = makeAttack({ id: 'a1', name: 'Mistério', kind: 'spell' })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('attacks-section-other').textContent).toBe('Outras magias')
  })

  it('EN: cantrip section reuses spells.cantrips_section label', () => {
    const attack = makeAttack({ id: 'a1', name: 'Fire Bolt', kind: 'spell', spellLevel: 0 })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-level-0').textContent).toBe('CANTRIPS')
  })

  it('EN: level section reuses spells.level_section label', () => {
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('attacks-section-level-3').textContent).toBe('LEVEL 3')
  })

  it('EN: spell level select label is "Spell Level"', () => {
    const attack = makeAttack({ id: 'a1', kind: 'spell', spellLevel: 1 })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-card-a1'))
    // The label is rendered as a <label> element
    const labels = screen.getAllByText('Spell Level')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('PT: spell level select label is "Nível de magia"', () => {
    const attack = makeAttack({ id: 'a1', kind: 'spell', spellLevel: 1 })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
    fireEvent.click(screen.getByTestId('attack-card-a1'))
    const labels = screen.getAllByText('Nível de magia')
    expect(labels.length).toBeGreaterThan(0)
  })
})

// ── Accordion preserved in grouped view ───────────────────────────────────────

describe('AttacksList — accordion preserved in grouped view', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('clicking a spell card in grouped view expands it', () => {
    const attack = makeAttack({ id: 'a1', name: 'Fireball', kind: 'spell', spellLevel: 3 })
    const char = { ...BASE, attacks: [attack] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-card-a1'))
    // Expanded: name input should be present
    expect(screen.getByTestId('attack-name-input-a1')).toBeDefined()
  })

  it('expanding one card in grouped view collapses another', () => {
    const attacks = [
      makeAttack({ id: 'a1', name: 'Spell One', kind: 'spell', spellLevel: 1 }),
      makeAttack({ id: 'a2', name: 'Spell Two', kind: 'spell', spellLevel: 2 }),
    ]
    const char = { ...BASE, attacks }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-card-a1'))
    expect(screen.getByTestId('attack-name-input-a1')).toBeDefined()
    fireEvent.click(screen.getByTestId('attack-card-a2'))
    expect(screen.queryByTestId('attack-name-input-a1')).toBeNull()
    expect(screen.getByTestId('attack-name-input-a2')).toBeDefined()
  })
})
