import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { CombatStrip } from '@/components/sheet/parts/CombatStrip'
import { renderWithI18n } from './helpers/render'

// BASE has wis=18 so derived PP = 10 + abilityModifier(18) = 10 + 4 = 14
// (no Perception skill, no proficiency). DEX=14 → initiative = +2.
const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Elf',
  background: 'Outlander',
  alignment: 'CN',
  classes: [{ name: 'Ranger', level: 4, hitDie: 10 }],
  experience: 0,
  abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 18, cha: 8 },
  proficiencyBonus: 2,
  hp: { current: 30, max: 30, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 4, max: 4, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15,
  initiative: 2,
  speed: 30,
  passivePerception: 14,
  spellSaveDC: 0,
  inspiration: false,
  savingThrows: [],
  skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('CombatStrip', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders AC value', () => {
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    expect(screen.getByTestId('combat-stat-ac').textContent).toContain('15')
  })

  it('formats positive initiative from DEX modifier (dex=14 → +2)', () => {
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    expect(screen.getByTestId('combat-stat-init').textContent).toContain('+2')
  })

  it('formats negative initiative from DEX modifier (dex=8 → -1)', () => {
    renderWithI18n(<CombatStrip character={{ ...BASE, abilities: { ...BASE.abilities, dex: 8 } }} />, 'pt')
    expect(screen.getByTestId('combat-stat-init').textContent).toContain('-1')
  })

  it('formats zero initiative as +0 (dex=10 → +0)', () => {
    renderWithI18n(<CombatStrip character={{ ...BASE, abilities: { ...BASE.abilities, dex: 10 } }} />, 'pt')
    expect(screen.getByTestId('combat-stat-init').textContent).toContain('+0')
  })

  it('renders speed with ft unit', () => {
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    expect(screen.getByTestId('combat-stat-spd').textContent).toContain('30 ft')
  })

  it('renders passive perception derived from wis (wis=18, no prof → 14)', () => {
    // passivePerception(18, false, false, profBonus(4)=2) = 10 + 4 = 14
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    expect(screen.getByTestId('combat-stat-pp').textContent).toContain('14')
  })

  it('PP updates when WIS modifier changes', () => {
    // wis=10 → mod 0 → PP = 10 + 0 = 10
    renderWithI18n(<CombatStrip character={{ ...BASE, abilities: { ...BASE.abilities, wis: 10 } }} />, 'pt')
    expect(screen.getByTestId('combat-stat-pp').textContent).toContain('10')
  })

  it('PP includes perception proficiency when skill is present', () => {
    // WIS=14 (mod +2), Perception proficient, profBonus=2 → PP = 10 + 2 + 2 = 14
    const withPerception = {
      ...BASE,
      abilities: { ...BASE.abilities, wis: 14, },
      skills: [{ name: 'Perception', ability: 'wis' as const, proficient: true, expertise: false, bonus: 4 }],
    }
    renderWithI18n(<CombatStrip character={withPerception} />, 'pt')
    expect(screen.getByTestId('combat-stat-pp').textContent).toContain('14')
  })

  it('omits DC when spellSaveDC is 0', () => {
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    expect(screen.queryByTestId('combat-stat-dc')).toBeNull()
  })

  it('shows DC when spellSaveDC is defined', () => {
    renderWithI18n(<CombatStrip character={{ ...BASE, spellSaveDC: 14 }} />, 'pt')
    expect(screen.getByTestId('combat-stat-dc').textContent).toContain('14')
  })

  it('formats proficiency bonus derived from total level (level 4 → +2)', () => {
    // proficiencyBonus(4) = 2
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    expect(screen.getByTestId('combat-stat-prof').textContent).toContain('+2')
  })

  it('profBonus updates when level increases (level 5 → +3)', () => {
    const level5 = { ...BASE, classes: [{ name: 'Ranger', level: 5, hitDie: 10 }] }
    renderWithI18n(<CombatStrip character={level5} />, 'pt')
    expect(screen.getByTestId('combat-stat-prof').textContent).toContain('+3')
  })

  it('uses 3-col grid by default', () => {
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    const strip = screen.getByTestId('combat-strip')
    expect(strip.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })

  it('uses 6-col grid when cols=6', () => {
    renderWithI18n(<CombatStrip character={BASE} cols={6} />, 'pt')
    const strip = screen.getByTestId('combat-strip')
    expect(strip.style.gridTemplateColumns).toBe('repeat(6, 1fr)')
  })

  it('renders PT label "CA" for AC stat', () => {
    renderWithI18n(<CombatStrip character={BASE} />, 'pt')
    expect(screen.getByTestId('combat-stat-ac').textContent).toContain('CA')
  })

  it('renders EN label "AC" for AC stat', () => {
    renderWithI18n(<CombatStrip character={BASE} />, 'en')
    expect(screen.getByTestId('combat-stat-ac').textContent).toContain('AC')
  })
})
