import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HpBlock } from '@/components/sheet/parts/HpBlock'
import { HitDicePool } from '@/components/sheet/parts/HitDicePool'
import { DeathSaves } from '@/components/sheet/parts/DeathSaves'
import type { Character } from '@/domain/character'

const BASE: Character = {
  id: 'char_hp_test',
  name: 'Grimbold Ironfist',
  race: 'Anão',
  background: 'Outlander',
  alignment: 'Leal e Bom',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 18, dex: 10, con: 16, int: 8, wis: 12, cha: 6 },
  proficiencyBonus: 3,
  hp: { current: 45, max: 45, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 17, initiative: 0, speed: 25,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  allies: '', notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('HpBlock', () => {
  it('shows current HP number correctly', () => {
    render(<HpBlock character={BASE} />)
    expect(screen.getByTestId('hp-current').textContent).toBe('45')
  })

  it('shows max HP in the slash notation', () => {
    render(<HpBlock character={BASE} />)
    expect(screen.getByText('/ 45')).toBeDefined()
  })

  it('shows temp HP badge when temp > 0', () => {
    const char = { ...BASE, hp: { current: 45, max: 45, temp: 8 } }
    render(<HpBlock character={char} />)
    expect(screen.getByText('+8 temp')).toBeDefined()
  })

  it('does not show temp HP badge when temp is 0', () => {
    render(<HpBlock character={BASE} />)
    expect(screen.queryByText(/temp/)).toBeNull()
  })

  it('marks hp-current as low when HP < 30%', () => {
    // 5/45 ≈ 11% — well below 30%
    const char = { ...BASE, hp: { current: 5, max: 45, temp: 0 } }
    render(<HpBlock character={char} />)
    const el = screen.getByTestId('hp-current')
    expect(el.getAttribute('data-low')).toBe('true')
  })

  it('does not mark hp-current as low when HP >= 30%', () => {
    render(<HpBlock character={BASE} />)
    const el = screen.getByTestId('hp-current')
    expect(el.getAttribute('data-low')).toBe('false')
  })

  it('Heal button is present', () => {
    render(<HpBlock character={BASE} />)
    expect(screen.getByText('＋ Heal')).toBeDefined()
  })

  it('Damage button is present', () => {
    render(<HpBlock character={BASE} />)
    expect(screen.getByText('− Damage')).toBeDefined()
  })

  it('Heal button shows alert on click (stub behaviour)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    render(<HpBlock character={BASE} />)
    fireEvent.click(screen.getByText('＋ Heal'))
    expect(alertSpy).toHaveBeenCalledWith('Edição virá na Fase C')
    alertSpy.mockRestore()
  })

  it('Damage button shows alert on click (stub behaviour)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    render(<HpBlock character={BASE} />)
    fireEvent.click(screen.getByText('− Damage'))
    expect(alertSpy).toHaveBeenCalledWith('Edição virá na Fase C')
    alertSpy.mockRestore()
  })

  it('shows dashes when max HP is 0', () => {
    const char = { ...BASE, hp: { current: 0, max: 0, temp: 0 } }
    render(<HpBlock character={char} />)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })
})

describe('HitDicePool', () => {
  it('renders one row for a single class', () => {
    render(<HitDicePool hitDice={[{ current: 5, max: 5, dieSize: 10 }]} />)
    expect(screen.getByText(/d10/)).toBeDefined()
  })

  it('renders one row per class for multiclass', () => {
    render(
      <HitDicePool
        hitDice={[
          { current: 3, max: 3, dieSize: 8 },
          { current: 2, max: 2, dieSize: 6 },
        ]}
      />,
    )
    expect(screen.getByText(/d8/)).toBeDefined()
    expect(screen.getByText(/d6/)).toBeDefined()
  })

  it('shows fallback dashes when hitDice is empty', () => {
    render(<HitDicePool hitDice={[]} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('shows current / max values', () => {
    render(<HitDicePool hitDice={[{ current: 3, max: 5, dieSize: 8 }]} />)
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText(/\/ 5 d8/)).toBeDefined()
  })
})

describe('DeathSaves', () => {
  it('renders the success check mark', () => {
    render(<DeathSaves successes={0} failures={0} />)
    expect(screen.getByText('✓')).toBeDefined()
  })

  it('renders the failure cross mark', () => {
    render(<DeathSaves successes={0} failures={0} />)
    expect(screen.getByText('✗')).toBeDefined()
  })

  it('renders 3 success pips total', () => {
    const { container } = render(<DeathSaves successes={2} failures={0} />)
    // Each Pip renders as a role="presentation" div
    // 3 success pips + 3 failure pips = 6 total
    const pips = container.querySelectorAll('[role="presentation"]')
    expect(pips.length).toBe(6)
  })

  it('renders 3 failures pips total (character dying)', () => {
    const { container } = render(<DeathSaves successes={0} failures={3} />)
    const pips = container.querySelectorAll('[role="presentation"]')
    expect(pips.length).toBe(6)
  })
})
