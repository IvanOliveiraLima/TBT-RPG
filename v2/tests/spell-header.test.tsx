import { describe, it, expect, beforeEach, vi } from 'vitest'
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
  experience: 6500,
  abilities: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
  proficiencyBonus: 3,
  hp: { current: 35, max: 35, temp: 0 },
  hitDice: [{ className: 'Bard', current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 13,
  spellSaveDC: 15,
  inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  spells: [
    { id: 's1', name: 'Vicious Mockery', level: 0, school: 'enchantment', castingTime: '1 action', range: '60 ft', description: '', prepared: false },
    { id: 's2', name: 'Minor Illusion', level: 0, school: 'illusion', castingTime: '1 action', range: '30 ft', description: '', prepared: false },
    { id: 's3', name: 'Healing Word', level: 1, school: 'evocation', castingTime: '1 bonus action', range: '60 ft', description: '', prepared: true },
    { id: 's4', name: 'Faerie Fire', level: 1, school: 'evocation', castingTime: '1 action', range: '60 ft', description: '', prepared: false },
  ],
  spellSlots: {
    '1': { current: 4, max: 4 },
    '2': { current: 3, max: 3 },
    '3': { current: 2, max: 2 },
  },
  spellcastingAbility: 'cha',
  spellcastingClass: 'Bard',
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
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
}

describe('SpellHeader', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders testid spell-header', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByTestId('spell-header')).toBeDefined()
  })

  it('shows class name from spellcastingClass', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('Bard')).toBeDefined()
  })

  it('shows ability abbreviation CHA in EN (read-only)', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('CHA')).toBeDefined()
  })

  it('shows save DC = 15 for KAEL (cha 18, profBonus 3)', () => {
    // 8 + 3 + floor((18-10)/2) = 8 + 3 + 4 = 15
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('15')).toBeDefined()
  })

  it('shows attack bonus +7 for KAEL', () => {
    // profBonus 3 + floor((18-10)/2) = 3 + 4 = 7
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    expect(screen.getByText('+7')).toBeDefined()
  })

  it('+7 attack bonus is present in header content', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'en')
    const header = screen.getByTestId('spell-header')
    expect(header.textContent).toContain('+7')
  })

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

  it('shows — for save DC when spellcastingAbility is empty', () => {
    const noCaster = { ...KAEL, spellcastingAbility: '' as const }
    renderWithI18n(<SpellHeader character={noCaster} />, 'en')
    // Both save DC and attack bonus should show — when no ability
    const header = screen.getByTestId('spell-header')
    const dashes = [...header.querySelectorAll('*')].filter(el => el.textContent?.trim() === '—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('uses CAR abbreviation for cha in PT (read-only)', () => {
    renderWithI18n(<SpellHeader character={KAEL} />, 'pt')
    expect(screen.getByText('CAR')).toBeDefined()
  })

  it('uses SAB for WIS in PT (read-only)', () => {
    const druid = {
      ...KAEL,
      spellcastingAbility: 'wis' as const,
      spellcastingClass: 'Druid',
    }
    renderWithI18n(<SpellHeader character={druid} />, 'pt')
    expect(screen.getByText('SAB')).toBeDefined()
  })

  it('in editable mode: class input is present', () => {
    renderWithI18n(<SpellHeader character={KAEL} onUpdate={vi.fn()} />, 'en')
    // <input list="..."> gets role=combobox (not textbox) when a datalist is attached
    const input = screen.getByRole('combobox', { name: /spellcasting class/i })
    expect(input).toBeDefined()
  })

  it('in editable mode: ability select is present', () => {
    renderWithI18n(<SpellHeader character={KAEL} onUpdate={vi.fn()} />, 'en')
    const select = screen.getByRole('combobox', { name: /spellcasting ability/i })
    expect(select).toBeDefined()
  })

  it('shows WIS and Druid in read-only EN', () => {
    const druid = {
      ...KAEL,
      spellcastingAbility: 'wis' as const,
      spellcastingClass: 'Druid',
    }
    renderWithI18n(<SpellHeader character={druid} />, 'en')
    expect(screen.getByText('WIS')).toBeDefined()
    expect(screen.getByText('Druid')).toBeDefined()
  })

  it('shows INT for int ability in EN read-only', () => {
    const wizard = {
      ...KAEL,
      spellcastingAbility: 'int' as const,
      spellcastingClass: 'Wizard',
    }
    renderWithI18n(<SpellHeader character={wizard} />, 'en')
    expect(screen.getByText('INT')).toBeDefined()
  })
})
