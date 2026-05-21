import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Character, SkillState } from '@/domain/character'
import { SkillsBlock } from '@/components/sheet/parts/SkillsBlock'
import { I18nProvider } from '@/i18n'
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
  experience: 0,
  abilities: { str: 12, dex: 15, con: 13, int: 10, wis: 12, cha: 8 },
  proficiencyBonus: 2,
  hp: { current: 21, max: 21, temp: 0 },
  hitDice: [{ className: 'Rogue', current: 3, max: 3, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 2, speed: 30,
  passivePerception: 13, spellSaveDC: 0, inspiration: false,
  savingThrows: [],
  skills: SKILLS,
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('SkillsBlock', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders all 18 skills', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const container = screen.getByTestId('skills-block')
    expect(container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"]):not([data-testid$="-toggle"])')).toHaveLength(18)
  })

  it('renders skills in alphabetical order by EN label in EN mode', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'en')
    const container = screen.getByTestId('skills-block')
    const ids = Array.from(
      container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"]):not([data-testid$="-toggle"])'),
    ).map((el) => el.getAttribute('data-testid')?.replace('skill-', ''))
    const sorted = [...ids].sort((a, b) => (a ?? '').localeCompare(b ?? ''))
    expect(ids).toEqual(sorted)
  })

  it('renders two toggle buttons per skill row', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('skill-Acrobatics-prof-toggle')).toBeDefined()
    expect(screen.getByTestId('skill-Acrobatics-exp-toggle')).toBeDefined()
  })

  it('proficiency pip filled when proficient', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const btn = screen.getByTestId('skill-Acrobatics-prof-toggle')
    const pip = btn.querySelector('[role="presentation"]') as HTMLElement
    expect(pip.style.background).not.toBe('transparent')
  })

  it('expertise pip filled when expertise', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const profBtn = screen.getByTestId('skill-Insight-prof-toggle')
    const expBtn  = screen.getByTestId('skill-Insight-exp-toggle')
    expect((profBtn.querySelector('[role="presentation"]') as HTMLElement).style.background).not.toBe('transparent')
    expect((expBtn.querySelector('[role="presentation"]') as HTMLElement).style.background).not.toBe('transparent')
  })

  it('both pips empty when neither proficient nor expertise', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    const profBtn = screen.getByTestId('skill-Arcana-prof-toggle')
    const expBtn  = screen.getByTestId('skill-Arcana-exp-toggle')
    expect((profBtn.querySelector('[role="presentation"]') as HTMLElement).style.background).toBe('transparent')
    expect((expBtn.querySelector('[role="presentation"]') as HTMLElement).style.background).toBe('transparent')
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
      container.querySelectorAll('[data-testid^="skill-"]:not([data-testid$="-bonus"]):not([data-testid$="-toggle"])'),
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

// ── Toggle — proficient ───────────────────────────────────────────────────────

describe('SkillsBlock — toggle proficient', () => {
  beforeEach(() => { localStorage.clear() })

  it('enables proficient when toggled on', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SkillsBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // Arcana: proficient=false
    fireEvent.click(screen.getByTestId('skill-Arcana-prof-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { skills: SkillState[] }
    const arcana = call.skills.find(s => s.name === 'Arcana')!
    expect(arcana.proficient).toBe(true)
    expect(arcana.expertise).toBe(false)
  })

  it('disables proficient when toggled off', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SkillsBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // Acrobatics: proficient=true, expertise=false
    fireEvent.click(screen.getByTestId('skill-Acrobatics-prof-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { skills: SkillState[] }
    const acro = call.skills.find(s => s.name === 'Acrobatics')!
    expect(acro.proficient).toBe(false)
    expect(acro.expertise).toBe(false)
  })

  it('disabling proficient also disables expertise (D&D invariant)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SkillsBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // Insight: proficient=true, expertise=true
    fireEvent.click(screen.getByTestId('skill-Insight-prof-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { skills: SkillState[] }
    const insight = call.skills.find(s => s.name === 'Insight')!
    expect(insight.proficient).toBe(false)
    expect(insight.expertise).toBe(false)
  })

  it('preserves all other skills when one is toggled (spread invariant)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SkillsBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('skill-Arcana-prof-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { skills: SkillState[] }
    const acro    = call.skills.find(s => s.name === 'Acrobatics')!
    const insight = call.skills.find(s => s.name === 'Insight')!
    expect(acro.proficient).toBe(true)
    expect(acro.expertise).toBe(false)
    expect(insight.proficient).toBe(true)
    expect(insight.expertise).toBe(true)
  })

  it('does not call onUpdate when no onUpdate prop (read-only)', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    // Should not throw
    fireEvent.click(screen.getByTestId('skill-Arcana-prof-toggle'))
  })

  it('has correct aria-label in PT', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('skill-Acrobatics-prof-toggle').getAttribute('aria-label'))
      .toBe('Alternar proficiência em Acrobacia')
  })

  it('has correct aria-label in EN', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'en')
    expect(screen.getByTestId('skill-Acrobatics-prof-toggle').getAttribute('aria-label'))
      .toBe('Toggle Acrobatics proficiency')
  })
})

// ── Toggle — expertise ────────────────────────────────────────────────────────

describe('SkillsBlock — toggle expertise', () => {
  beforeEach(() => { localStorage.clear() })

  it('enables expertise when toggled on', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SkillsBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // Acrobatics: proficient=true, expertise=false
    fireEvent.click(screen.getByTestId('skill-Acrobatics-exp-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { skills: SkillState[] }
    const acro = call.skills.find(s => s.name === 'Acrobatics')!
    expect(acro.proficient).toBe(true)
    expect(acro.expertise).toBe(true)
  })

  it('enabling expertise also enables proficient (D&D invariant)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SkillsBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // Arcana: proficient=false, expertise=false
    fireEvent.click(screen.getByTestId('skill-Arcana-exp-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { skills: SkillState[] }
    const arcana = call.skills.find(s => s.name === 'Arcana')!
    expect(arcana.proficient).toBe(true)
    expect(arcana.expertise).toBe(true)
  })

  it('disabling expertise keeps proficient on', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SkillsBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // Insight: proficient=true, expertise=true
    fireEvent.click(screen.getByTestId('skill-Insight-exp-toggle'))
    const call = onUpdate.mock.calls[0]![0] as { skills: SkillState[] }
    const insight = call.skills.find(s => s.name === 'Insight')!
    expect(insight.proficient).toBe(true)
    expect(insight.expertise).toBe(false)
  })

  it('has correct aria-label in PT', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('skill-Acrobatics-exp-toggle').getAttribute('aria-label'))
      .toBe('Alternar especialização em Acrobacia')
  })

  it('has correct aria-label in EN', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'en')
    expect(screen.getByTestId('skill-Acrobatics-exp-toggle').getAttribute('aria-label'))
      .toBe('Toggle Acrobatics expertise')
  })
})

// ── Bonus cascade with live derivation ───────────────────────────────────────

describe('SkillsBlock — bonus derived live', () => {
  beforeEach(() => { localStorage.clear() })

  // Rogue 3: profBonus = +2, DEX 15 → mod +2
  // Acrobatics proficient → bonus = +2 + 2 = +4 ✓ (already in BASE)
  // Insight expertise → bonus = +2 + 2*2 = +6 ✓ (already in BASE)

  it('derives proficient bonus from ability + profBonus', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    expect(screen.getByTestId('skill-Acrobatics-bonus').textContent).toBe('+4')
  })

  it('derives expertise bonus as ability + 2×profBonus', () => {
    renderWithI18n(<SkillsBlock character={BASE} />, 'pt')
    // Insight: WIS 12 (+1) + 2×2 = +5
    expect(screen.getByTestId('skill-Insight-bonus').textContent).toBe('+5')
  })

  it('updates displayed bonus when character abilities change externally', () => {
    const { rerender } = render(<I18nProvider><SkillsBlock character={BASE} /></I18nProvider>)
    // Bump DEX 15 → 20 (+5 mod), Acrobatics proficient: +5 + 2 = +7
    const updated = { ...BASE, abilities: { ...BASE.abilities, dex: 20 } }
    rerender(<I18nProvider><SkillsBlock character={updated} /></I18nProvider>)
    expect(screen.getByTestId('skill-Acrobatics-bonus').textContent).toBe('+7')
  })
})
