import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { SpellHeader } from '@/components/sheet/parts/SpellHeader'
import { renderWithI18n } from './helpers/render'

const KAEL: Character = {
  id: 'kael_01',
  name: 'Kael Brightweave',
  race: 'Half-Elf',
  background: 'Entertainer',
  alignment: 'Chaotic Good',
  classes: [{ name: 'Bard', level: 5, hitDie: 8 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
  proficiencyBonus: 3,
  hp: { current: 35, max: 35, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14,
  initiative: 2,
  speed: 30,
  passivePerception: 13,
  spellSaveDC: 15,
  inspiration: false,
  savingThrows: [],
  skills: [],
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  spells: {
    ability: 'cha',
    attackBonus: 7,
    saveDC: 15,
    slots: [{ level: 1, current: 4, max: 4 }],
    known: [],
  },
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('SpellHeader', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders class name (Bard)', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('Bard')).toBeDefined()
  })

  it('renders ability abbreviation (CHA in EN)', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('CHA')).toBeDefined()
  })

  it('renders saveDC numeric value', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('15')).toBeDefined()
  })

  it('renders attack bonus with sign', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('+7')).toBeDefined()
  })

  it('attack bonus has "+" prefix for positive values', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    const header = screen.getByTestId('spell-header')
    expect(header.textContent).toContain('+7')
  })

  it('returns null for non-caster (spells undefined)', () => {
    const nonCaster = { ...KAEL, spells: undefined }
    const { container } = renderWithI18n(<SpellHeader character={nonCaster} />, 'en')
    expect(container.firstChild).toBeNull()
  })

  it('shows WIS as ability and Druid as class', () => {
    const druid = {
      ...KAEL,
      classes: [{ name: 'Druid', level: 5, hitDie: 8 }],
      spells: { ...KAEL.spells!, ability: 'wis' as const, saveDC: 14, attackBonus: 6 },
    }
    renderWithI18n(<SpellHeader character={druid} />, 'en')
    expect(screen.getByText('WIS')).toBeDefined()
    expect(screen.getByText('Druid')).toBeDefined()
  })

  it('shows INT as ability for Wizard', () => {
    const wizard = {
      ...KAEL,
      classes: [{ name: 'Wizard', level: 5, hitDie: 6 }],
      spells: { ...KAEL.spells!, ability: 'int' as const },
    }
    renderWithI18n(<SpellHeader character={wizard} />, 'en')
    expect(screen.getByText('INT')).toBeDefined()
  })

  it('negative attack bonus shows without "+"', () => {
    const weak = { ...KAEL, spells: { ...KAEL.spells!, attackBonus: -1 } }
    renderWithI18n(<SpellHeader character={weak} />, 'en')
    expect(screen.getByText('-1')).toBeDefined()
  })

  // ── i18n dual-lang tests ──────────────────────────────────────────

  it('renders PT cell labels: CLASSE / HABILIDADE / DC DE SALVAGUARDA / BÔNUS DE ATAQUE', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'pt')
    expect(screen.getByText('CLASSE')).toBeDefined()
    expect(screen.getByText('HABILIDADE')).toBeDefined()
    expect(screen.getByText('DC DE SALVAGUARDA')).toBeDefined()
    expect(screen.getByText('BÔNUS DE ATAQUE')).toBeDefined()
  })

  it('renders EN cell labels: CLASS / ABILITY / SAVE DC / ATTACK BONUS', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('CLASS')).toBeDefined()
    expect(screen.getByText('ABILITY')).toBeDefined()
    expect(screen.getByText('SAVE DC')).toBeDefined()
    expect(screen.getByText('ATTACK BONUS')).toBeDefined()
  })

  it('uses CAR abbreviation for CHA ability in PT', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'pt')
    expect(screen.getByText('CAR')).toBeDefined()
  })

  it('uses SAB abbreviation for WIS ability in PT', () => {
    const druid = {
      ...KAEL,
      classes: [{ name: 'Druid', level: 5, hitDie: 8 }],
      spells: { ...KAEL.spells!, ability: 'wis' as const },
    }
    renderWithI18n(<SpellHeader character={druid} />, 'pt')
    expect(screen.getByText('SAB')).toBeDefined()
  })
})
