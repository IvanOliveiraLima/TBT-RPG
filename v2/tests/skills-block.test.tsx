import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character, SkillState } from '@/domain/character'
import { SkillsBlock } from '@/components/sheet/parts/SkillsBlock'

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
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  allies: '',
  notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('SkillsBlock', () => {
  it('renders all 18 skills', () => {
    render(<SkillsBlock character={BASE} />)
    const container = screen.getByTestId('skills-block')
    // exclude bonus spans (data-testid ends with "-bonus")
    expect(container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"])')).toHaveLength(18)
  })

  it('renders skills in alphabetical order', () => {
    render(<SkillsBlock character={BASE} />)
    const container = screen.getByTestId('skills-block')
    const names = Array.from(
      container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"])'),
    ).map((el) => el.getAttribute('data-testid')?.replace('skill-', ''))
    const sorted = [...names].sort((a, b) => (a ?? '').localeCompare(b ?? ''))
    expect(names).toEqual(sorted)
  })

  it('renders two pips per skill row', () => {
    render(<SkillsBlock character={BASE} />)
    const acroRow = screen.getByTestId('skill-Acrobatics')
    expect(acroRow.querySelectorAll('[role="presentation"]')).toHaveLength(2)
  })

  it('proficiency pip filled when proficient', () => {
    render(<SkillsBlock character={BASE} />)
    const acroRow = screen.getByTestId('skill-Acrobatics')
    const pips = acroRow.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    // first pip is gold proficiency pip
    expect(pips[0]!.style.background).not.toBe('transparent')
  })

  it('expertise pip filled when expertise', () => {
    render(<SkillsBlock character={BASE} />)
    const insightRow = screen.getByTestId('skill-Insight')
    const pips = insightRow.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    // both pips filled (proficient and expertise)
    expect(pips[0]!.style.background).not.toBe('transparent')
    expect(pips[1]!.style.background).not.toBe('transparent')
  })

  it('both pips empty when neither proficient nor expertise', () => {
    render(<SkillsBlock character={BASE} />)
    const arcanaRow = screen.getByTestId('skill-Arcana')
    const pips = arcanaRow.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    expect(pips[0]!.style.background).toBe('transparent')
    expect(pips[1]!.style.background).toBe('transparent')
  })

  it('formats bonus with + sign for proficient skill', () => {
    render(<SkillsBlock character={BASE} />)
    expect(screen.getByTestId('skill-Acrobatics-bonus').textContent).toBe('+4')
  })

  it('formats negative bonus correctly', () => {
    render(<SkillsBlock character={BASE} />)
    expect(screen.getByTestId('skill-Deception-bonus').textContent).toBe('-1')
  })

  it('formats zero bonus as +0', () => {
    render(<SkillsBlock character={BASE} />)
    expect(screen.getByTestId('skill-Arcana-bonus').textContent).toBe('+0')
  })

  it('uses ruby text color for expertise skills', () => {
    render(<SkillsBlock character={BASE} />)
    const insightBonus = screen.getByTestId('skill-Insight-bonus') as HTMLElement
    expect(insightBonus.style.color).toBe('rgb(139, 26, 46)')
  })

  it('uses gold text color for proficient-only skills', () => {
    render(<SkillsBlock character={BASE} />)
    const acroBonus = screen.getByTestId('skill-Acrobatics-bonus') as HTMLElement
    expect(acroBonus.style.color).toBe('rgb(212, 160, 23)')
  })

  it('renders empty block when no skills', () => {
    render(<SkillsBlock character={{ ...BASE, skills: [] }} />)
    const container = screen.getByTestId('skills-block')
    expect(container.querySelectorAll('[data-testid^="skill-"]')).toHaveLength(0)
  })
})
