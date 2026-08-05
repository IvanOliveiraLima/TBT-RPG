/**
 * Combat.6 — Attack bonus suggestion chip (ability mod + proficiency)
 *
 * Covers:
 * - Weapon with ability='dex': chip shows abilityModifier(DEX) + profBonus; click applies
 * - Weapon with ability='str': chip uses STR mod
 * - Spell: chip uses spellcastingAbility (not attack.ability)
 * - No ability (ability='') → no chip
 * - Spell without spellcastingAbility → no chip
 * - attackBonus already equals suggestion → no chip
 * - locked → no chip
 * - Render does NOT mutate attackBonus without click
 * - EN + PT text
 * - Breakdown text shows ability abbreviation, mod, prof correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import type { Character, Attack } from '@/domain/character'
import { useCharactersStore } from '@/store/characters'

vi.mock('@/services/sync', () => ({
  scheduleEditSync: vi.fn(),
  startPeriodicSync: vi.fn(),
  stopPeriodicSync: vi.fn(),
}))

const mockRollCheck = vi.fn()
const mockRollDamage = vi.fn()

vi.mock('@/hooks/useSheetRoll', () => ({
  useSheetRoll: () => ({ rollCheck: mockRollCheck, rollDamage: mockRollDamage }),
}))

/* ── Helpers ──────────────────────────────────────────────────────────── */

function makeWeapon(overrides?: Partial<Attack>): Attack {
  return {
    id: 'w1',
    name: 'Longbow',
    kind: 'ranged',
    ability: 'dex',
    attackBonus: 0,
    damage: '1d8+3',
    damageType: 'Piercing',
    range: '150/600 ft',
    properties: '',
    notes: '',
    ...overrides,
  }
}

function makeSpell(overrides?: Partial<Attack>): Attack {
  return {
    id: 's1',
    name: 'Firebolt',
    kind: 'spell',
    ability: 'int',
    attackBonus: 0,
    damage: '1d10',
    damageType: 'Fire',
    range: '120 ft',
    properties: '',
    notes: '',
    spellLevel: 0,
    ...overrides,
  }
}

function makeChar(attacks: Attack[], overrides?: Partial<Character>): Character {
  return {
    id: 'c1',
    name: 'Test',
    race: '',
    background: '',
    alignment: '',
    classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
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
    inventory: [],
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
    ...overrides,
  }
}

function makeLocked(char: Character): Character {
  const locked = { ...char, locked: true }
  useCharactersStore.setState({ characters: [locked], loading: false, error: null })
  return locked
}

function openCard(id: string) {
  fireEvent.click(screen.getByTestId(`attack-card-${id}`))
}

/* ── Tests ──────────────────────────────────────────────────────────── */

describe('Combat.6 — Attack bonus suggestion chip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  /* ── Weapon with DEX (suggestion = 3 + 3 = +6) ── */

  describe('weapon with dex ability', () => {
    it('shows suggestion chip when attackBonus differs from mod+prof', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      // DEX 16 → mod +3, profBonus 3 → suggestion +6
      expect(screen.getByTestId('attack-bonus-suggest-w1')).toBeInTheDocument()
    })

    it('chip text shows formatted suggestion value (EN)', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      expect(screen.getByTestId('attack-bonus-suggest-w1')).toHaveTextContent('Suggest +6')
    })

    it('chip text shows formatted suggestion value (PT)', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      openCard('w1')
      expect(screen.getByTestId('attack-bonus-suggest-w1')).toHaveTextContent('Sugerir +6')
    })

    it('breakdown text shows ability abbreviation, mod, and prof (EN)', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      // breakdown: "DEX +3 · prof +3"
      const container = screen.getByTestId('attack-card-w1')
      expect(container.textContent).toContain('DEX +3 · prof +3')
    })

    it('breakdown text shows PT ability abbreviation (PT)', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      openCard('w1')
      // PT: DES, PT breakdown format
      const container = screen.getByTestId('attack-card-w1')
      expect(container.textContent).toContain('DES +3 · prof +3')
    })

    it('clicking chip calls onUpdate with the suggested attackBonus', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      openCard('w1')
      fireEvent.click(screen.getByTestId('attack-bonus-suggest-w1'))
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          attacks: expect.arrayContaining([
            expect.objectContaining({ id: 'w1', attackBonus: 6 }),
          ]),
        }),
      )
    })

    it('no chip when attackBonus already equals the suggestion', () => {
      // DEX 16 + profBonus 3 = +6
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 6 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      expect(screen.queryByTestId('attack-bonus-suggest-w1')).not.toBeInTheDocument()
    })

    it('render does NOT mutate attackBonus without a click', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      openCard('w1')
      // chip shown but not clicked
      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  /* ── Weapon with STR ── */

  describe('weapon with str ability', () => {
    it('suggestion uses STR mod (STR 10 → mod 0, total +3)', () => {
      // STR 10 → mod 0, profBonus 3 → suggestion +3
      const char = makeChar([makeWeapon({ id: 'w2', ability: 'str', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w2')
      expect(screen.getByTestId('attack-bonus-suggest-w2')).toHaveTextContent('Suggest +3')
    })

    it('breakdown uses STR abbreviation (EN)', () => {
      const char = makeChar([makeWeapon({ id: 'w2', ability: 'str', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w2')
      expect(screen.getByTestId('attack-card-w2').textContent).toContain('STR +0 · prof +3')
    })
  })

  /* ── No ability ── */

  describe('no ability selected', () => {
    it('no chip when attack.ability is empty', () => {
      const char = makeChar([makeWeapon({ ability: '', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      expect(screen.queryByTestId('attack-bonus-suggest-w1')).not.toBeInTheDocument()
    })
  })

  /* ── Spell attacks ── */

  describe('spell attacks', () => {
    it('spell chip uses spellcastingAbility, not attack.ability', () => {
      // attack.ability='int', spellcastingAbility='wis' (WIS 12 → mod +1), profBonus=3 → suggestion +4
      const char = makeChar(
        [makeSpell({ id: 's1', ability: 'int', attackBonus: 0 })],
        { spellcastingAbility: 'wis' },
      )
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('s1')
      // WIS 12 → mod +1 + prof 3 = +4
      expect(screen.getByTestId('attack-bonus-suggest-s1')).toHaveTextContent('Suggest +4')
    })

    it('spell chip breakdown uses spellcasting ability abbreviation (EN)', () => {
      const char = makeChar(
        [makeSpell({ id: 's1', ability: 'int', attackBonus: 0 })],
        { spellcastingAbility: 'wis' },
      )
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('s1')
      expect(screen.getByTestId('attack-card-s1').textContent).toContain('WIS +1 · prof +3')
    })

    it('spell chip breakdown uses PT ability abbreviation (PT)', () => {
      const char = makeChar(
        [makeSpell({ id: 's1', ability: 'int', attackBonus: 0 })],
        { spellcastingAbility: 'wis' },
      )
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      openCard('s1')
      expect(screen.getByTestId('attack-card-s1').textContent).toContain('SAB +1 · prof +3')
    })

    it('no chip for spell when spellcastingAbility is not set', () => {
      const char = makeChar(
        [makeSpell({ id: 's1', attackBonus: 0 })],
        { spellcastingAbility: '' },
      )
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('s1')
      expect(screen.queryByTestId('attack-bonus-suggest-s1')).not.toBeInTheDocument()
    })

    it('no chip for spell when attackBonus already matches spellcasting bonus', () => {
      // INT 10 → mod 0, profBonus 3 → suggestion +3
      const char = makeChar(
        [makeSpell({ id: 's1', attackBonus: 3 })],
        { spellcastingAbility: 'int' },
      )
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('s1')
      expect(screen.queryByTestId('attack-bonus-suggest-s1')).not.toBeInTheDocument()
    })

    it('clicking spell chip applies spellcasting-based bonus', () => {
      const onUpdate = vi.fn()
      const char = makeChar(
        [makeSpell({ id: 's1', attackBonus: 0 })],
        { spellcastingAbility: 'int' },
      )
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      openCard('s1')
      fireEvent.click(screen.getByTestId('attack-bonus-suggest-s1'))
      // INT 10 → 0 + profBonus 3 = +3
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          attacks: expect.arrayContaining([
            expect.objectContaining({ id: 's1', attackBonus: 3 }),
          ]),
        }),
      )
    })
  })

  /* ── Locked mode ── */

  describe('locked mode', () => {
    it('no chip shown when character is locked', () => {
      const char = makeLocked(makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })]))
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      expect(screen.queryByTestId('attack-bonus-suggest-w1')).not.toBeInTheDocument()
    })
  })

  /* ── Compact row: chip absent ── */

  describe('compact row', () => {
    it('chip is not visible in compact (collapsed) row', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      // card not expanded
      expect(screen.queryByTestId('attack-bonus-suggest-w1')).not.toBeInTheDocument()
    })
  })

  /* ── Negative mod ── */

  describe('negative modifier', () => {
    it('shows negative suggestion correctly (e.g. STR 6 → mod -2, total +1)', () => {
      const char = makeChar(
        [makeWeapon({ id: 'w3', ability: 'str', attackBonus: 0 })],
        { abilities: { str: 6, dex: 16, con: 12, int: 10, wis: 12, cha: 10 } },
      )
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w3')
      // STR 6 → mod -2, profBonus 3 → total +1
      expect(screen.getByTestId('attack-bonus-suggest-w3')).toHaveTextContent('Suggest +1')
      expect(screen.getByTestId('attack-card-w3').textContent).toContain('STR -2 · prof +3')
    })
  })

  /* ── HelpHint ── */

  describe('HelpHint on bonus suggestion chip', () => {
    it('renders help-hint-trigger alongside the chip', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      expect(screen.getByTestId('help-hint-trigger')).toBeDefined()
    })

    it('clicking trigger opens balloon with EN explanation text', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      fireEvent.click(screen.getByTestId('help-hint-trigger'))
      const tooltip = document.body.querySelector('[role="tooltip"]')
      expect(tooltip).not.toBeNull()
      expect(tooltip!.textContent).toContain('ability modifier + proficiency bonus')
    })

    it('clicking trigger opens balloon with PT explanation text', () => {
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      openCard('w1')
      fireEvent.click(screen.getByTestId('help-hint-trigger'))
      const tooltip = document.body.querySelector('[role="tooltip"]')
      expect(tooltip).not.toBeNull()
      expect(tooltip!.textContent).toContain('modificador da habilidade')
    })

    it('hint trigger absent when chip is hidden (attackBonus already matches suggestion)', () => {
      // DEX 16 + profBonus 3 = +6; chip not shown → HelpHint not rendered
      const char = makeChar([makeWeapon({ ability: 'dex', attackBonus: 6 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      expect(screen.queryByTestId('help-hint-trigger')).toBeNull()
    })

    it('hint trigger absent when locked', () => {
      const char = makeLocked(makeChar([makeWeapon({ ability: 'dex', attackBonus: 0 })]))
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      openCard('w1')
      expect(screen.queryByTestId('help-hint-trigger')).toBeNull()
    })
  })
})
