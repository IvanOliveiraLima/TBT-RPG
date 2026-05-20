import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Character } from '@/domain/character'
import { AttrGrid } from '@/components/sheet/parts/AttrGrid'
import { I18nProvider } from '@/i18n'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Human',
  background: 'Soldier',
  alignment: 'LG',
  classes: [{ name: 'Fighter', level: 5, hitDie: 10 }],
  experience: 0,
  abilities: { str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
  proficiencyBonus: 3,
  hp: { current: 50, max: 50, temp: 0 },
  hitDice: [{ className: 'Fighter', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 18, initiative: 2, speed: 30,
  passivePerception: 11, spellSaveDC: 0, inspiration: false,
  savingThrows: [
    { ability: 'str', proficient: true, bonus: 7 },
    { ability: 'con', proficient: true, bonus: 6 },
    { ability: 'dex', proficient: false, bonus: 2 },
    { ability: 'int', proficient: false, bonus: 0 },
    { ability: 'wis', proficient: false, bonus: 1 },
    { ability: 'cha', proficient: false, bonus: -1 },
  ],
  skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
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

describe('AttrGrid', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders all 6 attributes', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str')).toBeDefined()
    expect(screen.getByTestId('attr-dex')).toBeDefined()
    expect(screen.getByTestId('attr-con')).toBeDefined()
    expect(screen.getByTestId('attr-int')).toBeDefined()
    expect(screen.getByTestId('attr-wis')).toBeDefined()
    expect(screen.getByTestId('attr-cha')).toBeDefined()
  })

  it('shows correct order: str, dex, con, int, wis, cha', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    const grid = screen.getByTestId('attr-grid')
    const attrs = Array.from(grid.children).map((el) => el.getAttribute('data-testid'))
    expect(attrs).toEqual(['attr-str', 'attr-dex', 'attr-con', 'attr-int', 'attr-wis', 'attr-cha'])
  })

  it('formats positive modifier with + sign (STR 18 → +4)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str-mod').textContent).toBe('+4')
  })

  it('formats negative modifier (CHA 8 → -1)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-cha-mod').textContent).toBe('-1')
  })

  it('formats zero modifier as +0 (INT 10 → +0)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-int-mod').textContent).toBe('+0')
  })

  it('shows raw score as input value', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect((screen.getByTestId('attr-str-score') as HTMLInputElement).value).toBe('18')
    expect((screen.getByTestId('attr-cha-score') as HTMLInputElement).value).toBe('8')
  })

  it('score field is an input element', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str-score').tagName).toBe('INPUT')
  })

  it('shows save proficiency dot when ability has save prof', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByTestId('attr-str-save-dot')).toBeDefined()
    expect(screen.getByTestId('attr-con-save-dot')).toBeDefined()
  })

  it('does not show save dot for non-proficient abilities', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.queryByTestId('attr-dex-save-dot')).toBeNull()
    expect(screen.queryByTestId('attr-int-save-dot')).toBeNull()
  })

  it('uses 3-col grid by default', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    const grid = screen.getByTestId('attr-grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })

  it('uses 6-col grid when cols=6', () => {
    renderWithI18n(<AttrGrid character={BASE} cols={6} />, 'pt')
    const grid = screen.getByTestId('attr-grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(6, 1fr)')
  })

  it('compact reduces modifier font size', () => {
    renderWithI18n(<AttrGrid character={BASE} compact />, 'pt')
    const mod = screen.getByTestId('attr-str-mod')
    expect(mod.style.fontSize).toBe('28px')
  })

  it('non-compact uses larger modifier font', () => {
    renderWithI18n(<AttrGrid character={BASE} compact={false} />, 'pt')
    const mod = screen.getByTestId('attr-str-mod')
    expect(mod.style.fontSize).toBe('32px')
  })

  it('renders PT ability abbreviations (FOR/DES/CON/INT/SAB/CAR)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    expect(screen.getByText('FOR')).toBeDefined()
    expect(screen.getByText('DES')).toBeDefined()
    expect(screen.getByText('SAB')).toBeDefined()
    expect(screen.getByText('CAR')).toBeDefined()
  })

  it('renders EN ability abbreviations (STR/DEX/WIS/CHA)', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'en')
    expect(screen.getByText('STR')).toBeDefined()
    expect(screen.getByText('DEX')).toBeDefined()
    expect(screen.getByText('WIS')).toBeDefined()
    expect(screen.getByText('CHA')).toBeDefined()
  })

  // ── Editing behaviour ────────────────────────────────────────────────────

  it('calls onUpdate with updated abilities when score changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttrGrid character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '20' } })
    expect(onUpdate).toHaveBeenCalledWith({
      abilities: { str: 20, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
    })
  })

  it('preserves all other abilities when one is updated (critical spread test)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttrGrid character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-dex-score'), { target: { value: '16' } })
    const call = onUpdate.mock.calls[0]![0] as { abilities: Record<string, number> }
    expect(call.abilities.str).toBe(18)
    expect(call.abilities.dex).toBe(16)
    expect(call.abilities.con).toBe(16)
    expect(call.abilities.int).toBe(10)
    expect(call.abilities.wis).toBe(12)
    expect(call.abilities.cha).toBe(8)
  })

  it('clamps score to 30 when value exceeds maximum', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttrGrid character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '35' } })
    const call = onUpdate.mock.calls[0]![0] as { abilities: { str: number } }
    expect(call.abilities.str).toBe(30)
  })

  it('clamps score to 1 when value is below minimum', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttrGrid character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '-3' } })
    const call = onUpdate.mock.calls[0]![0] as { abilities: { str: number } }
    expect(call.abilities.str).toBe(1)
  })

  it('allows empty input without calling onUpdate (intermediate state)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttrGrid character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '' } })
    expect(onUpdate).not.toHaveBeenCalled()
    // Input is visually empty
    expect((screen.getByTestId('attr-str-score') as HTMLInputElement).value).toBe('')
  })

  it('modifier keeps last valid domain value when input is empty', () => {
    renderWithI18n(<AttrGrid character={BASE} onUpdate={vi.fn()} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '' } })
    // STR 18 → modifier +4 still shown (not +0)
    expect(screen.getByTestId('attr-str-mod').textContent).toBe('+4')
  })

  it('restores domain value on blur when input is empty', () => {
    renderWithI18n(<AttrGrid character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('attr-str-score') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)
    expect(input.value).toBe('18')
  })

  it('accepts low value (8) after clearing and typing', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<AttrGrid character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '' } })
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '8' } })
    expect(onUpdate).toHaveBeenCalledWith({
      abilities: { str: 8, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
    })
  })

  it('does not call onUpdate when no onUpdate prop is provided', () => {
    // No error should be thrown — component renders as read-only
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    fireEvent.change(screen.getByTestId('attr-str-score'), { target: { value: '20' } })
    // No assertion needed — just verifying no exception is thrown
  })

  it('syncs to external domain score change', () => {
    const { rerender } = render(<I18nProvider><AttrGrid character={BASE} /></I18nProvider>)
    const updated = { ...BASE, abilities: { ...BASE.abilities, str: 20 } }
    rerender(<I18nProvider><AttrGrid character={updated} /></I18nProvider>)
    expect((screen.getByTestId('attr-str-score') as HTMLInputElement).value).toBe('20')
  })

  it('score input has aria-label with ability name in PT', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'pt')
    const input = screen.getByTestId('attr-str-score')
    expect(input.getAttribute('aria-label')).toBe('Pontuação de FOR')
  })

  it('score input has aria-label with ability name in EN', () => {
    renderWithI18n(<AttrGrid character={BASE} />, 'en')
    const input = screen.getByTestId('attr-str-score')
    expect(input.getAttribute('aria-label')).toBe('STR score')
  })

  it('modifier is always derived from score — str=20 renders +5', () => {
    const char = { ...BASE, abilities: { ...BASE.abilities, str: 20 } }
    renderWithI18n(<AttrGrid character={char} />, 'pt')
    expect(screen.getByTestId('attr-str-mod').textContent).toBe('+5')
  })
})
