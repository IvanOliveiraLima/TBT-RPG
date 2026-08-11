/**
 * Regression tests: stale stored proficiencyBonus / spellSaveDC
 *
 * The stored fields `character.proficiencyBonus` and `character.spellSaveDC` are
 * written at character creation and NOT updated when the user levels up.
 * All runtime UI must derive values from `deriveProficiencyBonus(character)` and
 * `deriveSpellSaveDC(...)` — never read the stored fields.
 *
 * Scenario: a character whose stored `proficiencyBonus = 2` but whose total level
 * is 9 (correct prof = +4), and whose `spellSaveDC = 12` but the correct derived
 * DC is 15 (8 + 4 + INT mod +3, with int=16).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Attack } from '@/domain/character'
import { deriveProficiencyBonus } from '@/domain/derived'
import { CombatStrip } from '@/components/sheet/parts/CombatStrip'
import { SpellHeader } from '@/components/sheet/parts/SpellHeader'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { renderWithI18n } from './helpers/render'
import { useCharactersStore } from '@/store/characters'

vi.mock('@/services/sync', () => ({
  scheduleEditSync:   vi.fn(),
  startPeriodicSync:  vi.fn(),
  stopPeriodicSync:   vi.fn(),
  getSyncStatus:      () => 'idle' as const,
  onSyncStatusChange: () => () => undefined,
}))

const mockRollCheck  = vi.fn()
const mockRollDamage = vi.fn()
vi.mock('@/hooks/useSheetRoll', () => ({
  useSheetRoll: () => ({
    rollCheck: mockRollCheck,
    rollDamage: mockRollDamage,
    rollInitiative: vi.fn(),
  }),
}))

// ── Level-9 single-class character with stale stored fields ────────────────
// classes: Wizard 9 → actual prof = +4
// stored proficiencyBonus: 2 (stale, from character creation at level 1)
// stored spellSaveDC: 12 (stale)
// actual DC: 8 + 4 (prof) + 3 (INT mod from int=16) = 15

const STALE: Character = {
  id:   'stale1',
  name: 'Stale Wizard',
  race: 'Human', background: 'Sage', alignment: 'NG',
  classes: [{ name: 'Wizard', level: 9, hitDie: 6 }],
  experience: 48000,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 },
  proficiencyBonus: 2,   // ← stale: should be 4 for level 9
  hp: { current: 40, max: 40, temp: 0 },
  hitDice: [{ className: 'Wizard', current: 9, max: 9, dieSize: 6 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 12, initiative: 2, speed: 30,
  passivePerception: 11,
  spellSaveDC: 12,       // ← stale: should be 15 (8 + 4 + 3)
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

// ── Multiclass character: Wizard 5 + Fighter 4 = level 9 → prof +4 ─────────
const MULTI: Character = {
  ...STALE,
  id: 'multi1',
  name: 'Multiclass',
  classes: [
    { name: 'Wizard',  level: 5, hitDie: 6 },
    { name: 'Fighter', level: 4, hitDie: 10 },
  ],
  proficiencyBonus: 2,  // ← stale; total 9 → +4
}

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSpellAttack(overrides?: Partial<Attack>): Attack {
  return {
    id: 'atk1', name: 'Fire Bolt',
    kind: 'spell', ability: 'int',
    attackBonus: 0,
    damage: '2d10', damageType: 'Fire',
    range: '120 ft', properties: '', notes: '',
    ...overrides,
  }
}

// ── deriveProficiencyBonus ─────────────────────────────────────────────────

describe('deriveProficiencyBonus', () => {
  it('returns +2 for level 1–4', () => {
    const char = { ...STALE, classes: [{ name: 'Wizard', level: 1, hitDie: 6 }] }
    expect(deriveProficiencyBonus(char)).toBe(2)
  })

  it('returns +3 for level 5–8', () => {
    const char = { ...STALE, classes: [{ name: 'Wizard', level: 5, hitDie: 6 }] }
    expect(deriveProficiencyBonus(char)).toBe(3)
  })

  it('returns +4 for level 9–12 (ignoring stale stored field)', () => {
    // STALE has proficiencyBonus: 2 stored — must return 4
    expect(deriveProficiencyBonus(STALE)).toBe(4)
  })

  it('multiclass: Wizard 5 + Fighter 4 = total 9 → +4', () => {
    expect(deriveProficiencyBonus(MULTI)).toBe(4)
  })

  it('ignores the stale stored field completely', () => {
    const lv9WithStaleProfOf2 = { ...STALE, proficiencyBonus: 2 }
    expect(deriveProficiencyBonus(lv9WithStaleProfOf2)).toBe(4)
  })
})

// ── CombatStrip ────────────────────────────────────────────────────────────

describe('CombatStrip — stale stored proficiencyBonus / spellSaveDC', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows proficiency bonus +4 derived from level (not stale stored +2)', () => {
    renderWithI18n(<CombatStrip character={STALE} />, 'en')
    expect(screen.getByTestId('combat-stat-prof').textContent).toContain('+4')
  })

  it('shows spell save DC 15 derived live (not stale stored 12)', () => {
    // 8 + 4 (prof lv9) + 3 (INT mod from int=16) = 15
    renderWithI18n(<CombatStrip character={STALE} />, 'en')
    expect(screen.getByTestId('combat-stat-dc').textContent).toContain('15')
  })

  it('multiclass Wizard 5 + Fighter 4: shows prof +4', () => {
    renderWithI18n(<CombatStrip character={MULTI} />, 'en')
    expect(screen.getByTestId('combat-stat-prof').textContent).toContain('+4')
  })

  it('multiclass Wizard 5 + Fighter 4: shows DC 15 derived', () => {
    renderWithI18n(<CombatStrip character={MULTI} />, 'en')
    expect(screen.getByTestId('combat-stat-dc').textContent).toContain('15')
  })
})

// ── SpellHeader ────────────────────────────────────────────────────────────

describe('SpellHeader — stale stored proficiencyBonus', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows save DC 15 derived (not stale spellSaveDC=12)', () => {
    // 8 + 4 + 3 = 15
    renderWithI18n(<SpellHeader character={STALE} />, 'en')
    expect(screen.getByText('15')).toBeDefined()
  })

  it('shows attack bonus +7 derived (profBonus 4 + INT mod 3)', () => {
    renderWithI18n(<SpellHeader character={STALE} />, 'en')
    expect(screen.getByText('+7')).toBeDefined()
  })

  it('multiclass: DC and attack bonus use level-9 prof (+4)', () => {
    renderWithI18n(<SpellHeader character={MULTI} />, 'en')
    expect(screen.getByText('15')).toBeDefined()   // DC
    expect(screen.getByText('+7')).toBeDefined()   // atkBonus
  })
})

// ── AttacksList — bonus suggestion chip ───────────────────────────────────

describe('AttacksList — bonus suggestion uses derived prof (stale stored ignored)', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('spell attack chip shows prof +4 in breakdown (not stale +2)', () => {
    const char = { ...STALE, attacks: [makeSpellAttack()] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-card-atk1'))
    // breakdown text inside card: "INT +3 · prof +4"
    expect(screen.getByTestId('attack-card-atk1').textContent).toContain('prof +4')
  })

  it('spell attack chip suggestion value uses +4 prof (7 = INT mod 3 + prof 4)', () => {
    const char = { ...STALE, attacks: [makeSpellAttack()] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-card-atk1'))
    // chip button text: "Suggest +7"
    expect(screen.getByTestId('attack-bonus-suggest-atk1').textContent).toContain('+7')
  })

  it('multiclass: chip uses level-9 derived prof (+4)', () => {
    const char = { ...MULTI, attacks: [makeSpellAttack()] }
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('attack-card-atk1'))
    expect(screen.getByTestId('attack-card-atk1').textContent).toContain('prof +4')
  })
})
