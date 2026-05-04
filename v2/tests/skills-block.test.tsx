import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import type { Character, SkillState } from '@/domain/character'
import { SkillsBlock } from '@/components/sheet/parts/SkillsBlock'
import { renderWithI18n } from './helpers/render'

function skill(
  name: string,
  ability: SkillState['ability'],
  bonus: number,
  proficient = false,
  expertise = false,
): SkillState {
  return { name, ability, proficient, expertise, bonus }
}

const SKILLS: SkillState[] = [
  skill('Acrobatics', 'dex', 4, true),
  skill('Animal Handling', 'wis', 1),
  skill('Arcana', 'int', 0),
  skill('Athletics', 'str', 1),
  skill('Deception', 'cha', -1),
  skill('History', 'int', 0),
  skill('Insight', 'wis', 3, true, true), // expertise
  skill('Intimidation', 'cha', -1),
  skill('Investigation', 'int', 0),
  skill('Medicine', 'wis', 1),
  skill('Nature', 'int', 0),
  skill('Perception', 'wis', 3, true),
  skill('Performance', 'cha', -1),
  skill('Persuasion', 'cha', -1),
  skill('Religion', 'int', 0),
  skill('Sleight of Hand', 'dex', 2),
  skill('Stealth', 'dex', 2),
  skill('Survival', 'wis', 1),
]

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Human',
  background: 'Criminal',
  alignment: 'CN',
  classes: [{ name: 'Rogue', level: 3, hitDie: 8 }],
  totalLevel: 3,
  experience: 0,
  abilities: { str: 12, dex: 15, con: 13, int: 10, wis: 12, cha: 8 },
  proficiencyBonus: 2,
  hp: { current: 21, max: 21, temp: 0 },
  hitDice: [{ current: 3, max: 3, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 13, spellSaveDC: 0, inspiration: false,
  savingThrows: [],
  skills: SKILLS,
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [],
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

describe('SkillsBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders all 18 skills', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const container = screen.getByTestId('skills-block')
    expect(container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"])')).toHaveLength(18)
  })

  it('renders skills in alphabetical order by EN label in EN mode', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'en')
    const container = screen.getByTestId('skills-block')
    const ids = Array.from(
      container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"])'),
    ).map((el) => el.getAttribute('data-testid')?.replace('skill-', ''))
    const sorted = [...ids].sort((a, b) => (a ?? '').localeCompare(b ?? ''))
    expect(ids).toEqual(sorted)
  })

  it('renders two pips per skill row', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const acroRow = screen.getByTestId('skill-Acrobatics')
    expect(acroRow.querySelectorAll('[role="presentation"]')).toHaveLength(2)
  })

  it('proficiency pip filled when proficient', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const acroRow = screen.getByTestId('skill-Acrobatics')
    const pips = acroRow.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    expect(pips[0]!.style.background).not.toBe('transparent')
  })

  it('expertise pip filled when expertise', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const insightRow = screen.getByTestId('skill-Insight')
    const pips = insightRow.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    expect(pips[0]!.style.background).not.toBe('transparent')
    expect(pips[1]!.style.background).not.toBe('transparent')
  })

  it('both pips empty when neither proficient nor expertise', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const arcanaRow = screen.getByTestId('skill-Arcana')
    const pips = arcanaRow.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    expect(pips[0]!.style.background).toBe('transparent')
    expect(pips[1]!.style.background).toBe('transparent')
  })

  it('formats bonus with + sign for proficient skill', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('skill-Acrobatics-bonus').textContent).toBe('+4')
  })

  it('formats negative bonus correctly', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('skill-Deception-bonus').textContent).toBe('-1')
  })

  it('formats zero bonus as +0', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('skill-Arcana-bonus').textContent).toBe('+0')
  })

  it('uses ruby text color for expertise skills', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const insightBonus = screen.getByTestId('skill-Insight-bonus') as HTMLElement
    expect(insightBonus.style.color).toBe('rgb(139, 26, 46)')
  })

  it('uses gold text color for proficient-only skills', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const acroBonus = screen.getByTestId('skill-Acrobatics-bonus') as HTMLElement
    expect(acroBonus.style.color).toBe('rgb(212, 160, 23)')
  })

  it('renders empty block when no skills', () => {
    renderWithI18n(<SkillsBlock character={{ ...BASE, skills: [] }} />, 'pt')
    const container = screen.getByTestId('skills-block')
    expect(container.querySelectorAll('[data-testid^="skill-"]')).toHaveLength(0)
  })

  it('renders skill names in PT (PHB-PT standard)', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByText('Acrobacia')).toBeDefined()
    expect(screen.getByText('Furtividade')).toBeDefined()
    expect(screen.getByText('Prestidigitação')).toBeDefined()
    expect(screen.getByText('Adestrar Animais')).toBeDefined()
    expect(screen.getByText('Atuação')).toBeDefined()
  })

  it('renders skill names in EN', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'en')
    expect(screen.getByText('Acrobatics')).toBeDefined()
    expect(screen.getByText('Stealth')).toBeDefined()
    expect(screen.getByText('Sleight of Hand')).toBeDefined()
    expect(screen.getByText('Animal Handling')).toBeDefined()
    expect(screen.getByText('Performance')).toBeDefined()
  })

  it('PT sort puts Atuação (Performance) before Enganação (Deception)', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const container = screen.getByTestId('skills-block')
    const rows = Array.from(
      container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"])'),
    )
    const perf = rows.findIndex((el) => el.getAttribute('data-testid') === 'skill-Performance')
    const decep = rows.findIndex((el) => el.getAttribute('data-testid') === 'skill-Deception')
    // 'Atuação' < 'Enganação' alphabetically in PT
    expect(perf).toBeLessThan(decep)
  })

  it('renders ability abbreviations in PT (DES for dex)', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    // Multiple DEX skills exist; DES should appear
    const desSpans = screen.getAllByText('DES')
    expect(desSpans.length).toBeGreaterThanOrEqual(1)
  })

  it('renders ability abbreviations in EN (DEX for dex)', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'en')
    const dexSpans = screen.getAllByText('DEX')
    expect(dexSpans.length).toBeGreaterThanOrEqual(1)
  })
})
