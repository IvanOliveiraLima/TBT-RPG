import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Spell } from '@/domain/character'
import { SpellList } from '@/components/sheet/parts/SpellList'
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

const EMPTY_SPELLS: Character = {
  ...KAEL,
  spells: [],
  spellSlots: {},
}

describe('SpellList', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders spell-list testid', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByTestId('spell-list')).toBeDefined()
  })

  it('shows CANTRIPS section (data-testid="spell-section-0") in EN', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByTestId('spell-section-0')).toBeDefined()
    expect(screen.getByText('CANTRIPS')).toBeDefined()
  })

  it('shows TRUQUES section (data-testid="spell-section-0") in PT', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'pt')
    expect(screen.getByTestId('spell-section-0')).toBeDefined()
    expect(screen.getByText('TRUQUES')).toBeDefined()
  })

  it('shows spell names as text spans in compact (non-expanded) mode', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByText('Vicious Mockery')).toBeDefined()
    expect(screen.getByText('Minor Illusion')).toBeDefined()
    expect(screen.getByText('Healing Word')).toBeDefined()
    expect(screen.getByText('Faerie Fire')).toBeDefined()
  })

  it('shows empty state when spells is empty array', () => {
    renderWithI18n(<SpellList character={EMPTY_SPELLS} />, 'en')
    expect(screen.getByTestId('spell-empty-state')).toBeDefined()
    expect(screen.getByText('No spells registered.')).toBeDefined()
  })

  it('shows empty state in PT', () => {
    renderWithI18n(<SpellList character={EMPTY_SPELLS} />, 'pt')
    expect(screen.getByTestId('spell-empty-state')).toBeDefined()
    expect(screen.getByText('Nenhuma magia cadastrada.')).toBeDefined()
  })

  it('shows add cantrip button (testid="add-cantrip") in editable mode', () => {
    renderWithI18n(<SpellList character={KAEL} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('add-cantrip')).toBeDefined()
  })

  it('shows add level-1 spell button when spellSlots["1"].max > 0 (editable mode)', () => {
    renderWithI18n(<SpellList character={KAEL} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('add-spell-level-1')).toBeDefined()
  })

  it('add-cantrip button not present in read-only mode', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.queryByTestId('add-cantrip')).toBeNull()
  })

  it('calling add cantrip button calls onUpdate with new spell appended', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SpellList character={KAEL} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-cantrip'))
    expect(onUpdate).toHaveBeenCalledOnce()
    const call = onUpdate.mock.calls[0]![0] as { spells: Spell[] }
    expect(call.spells).toHaveLength(KAEL.spells.length + 1)
    expect(call.spells[call.spells.length - 1]!.level).toBe(0)
  })

  it('calling add level-1 spell button calls onUpdate with new level-1 spell appended', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SpellList character={KAEL} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-spell-level-1'))
    expect(onUpdate).toHaveBeenCalledOnce()
    const call = onUpdate.mock.calls[0]![0] as { spells: Spell[] }
    expect(call.spells[call.spells.length - 1]!.level).toBe(1)
  })

  it('remove calls onUpdate without the spell after two-step confirmation', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<SpellList character={KAEL} onUpdate={onUpdate} />, 'en')
    const removeBtn = screen.getByTestId('spell-remove-s1')
    // First click → confirming state
    fireEvent.click(removeBtn)
    expect(onUpdate).not.toHaveBeenCalled()
    // Second click → confirm and remove
    fireEvent.click(removeBtn)
    expect(onUpdate).toHaveBeenCalledOnce()
    const call = onUpdate.mock.calls[0]![0] as { spells: Spell[] }
    expect(call.spells.find(s => s.id === 's1')).toBeUndefined()
  })

  it('school pip is present for each spell (data-testid="spell-school-pip-{id}")', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByTestId('spell-school-pip-s1')).toBeDefined()
    expect(screen.getByTestId('spell-school-pip-s2')).toBeDefined()
    expect(screen.getByTestId('spell-school-pip-s3')).toBeDefined()
    expect(screen.getByTestId('spell-school-pip-s4')).toBeDefined()
  })

  it('prepared checkbox is present for non-cantrips (data-testid="spell-prepared-{id}")', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByTestId('spell-prepared-s3')).toBeDefined()
    expect(screen.getByTestId('spell-prepared-s4')).toBeDefined()
  })

  it('prepared checkbox is NOT present for cantrips', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.queryByTestId('spell-prepared-s1')).toBeNull()
    expect(screen.queryByTestId('spell-prepared-s2')).toBeNull()
  })

  it('count label shows (4) for KAEL fixture (4 total spells)', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    const list = screen.getByTestId('spell-list')
    expect(list.textContent).toContain('(4)')
  })

  it('count label shows (0) when spells is empty', () => {
    renderWithI18n(<SpellList character={EMPTY_SPELLS} />, 'en')
    const list = screen.getByTestId('spell-list')
    expect(list.textContent).toContain('(0)')
  })

  // ── i18n section header tests ──────────────────────────────────────

  it('renders CANTRIPS section title in EN', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByText('CANTRIPS')).toBeDefined()
  })

  it('renders TRUQUES section title in PT', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'pt')
    expect(screen.getByText('TRUQUES')).toBeDefined()
  })

  it('renders LEVEL 1 section title in EN', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByText('LEVEL 1')).toBeDefined()
  })

  it('renders NÍVEL 1 section title in PT', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'pt')
    expect(screen.getByText('NÍVEL 1')).toBeDefined()
  })

  it('spell-card testid is present for each spell', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.getByTestId('spell-card-s1')).toBeDefined()
    expect(screen.getByTestId('spell-card-s2')).toBeDefined()
    expect(screen.getByTestId('spell-card-s3')).toBeDefined()
    expect(screen.getByTestId('spell-card-s4')).toBeDefined()
  })

  it('remove button (spell-remove-{id}) present in editable mode', () => {
    renderWithI18n(<SpellList character={KAEL} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('spell-remove-s1')).toBeDefined()
    expect(screen.getByTestId('spell-remove-s4')).toBeDefined()
  })

  it('remove button not present in read-only mode', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    expect(screen.queryByTestId('spell-remove-s1')).toBeNull()
  })

  it('prepared checkbox is checked for prepared spells', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    const checkbox = screen.getByTestId('spell-prepared-s3') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('prepared checkbox is unchecked for unprepared spells', () => {
    renderWithI18n(<SpellList character={KAEL} />, 'en')
    const checkbox = screen.getByTestId('spell-prepared-s4') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('level select has alignment-select class when SpellCard is expanded', () => {
    renderWithI18n(<SpellList character={KAEL} onUpdate={vi.fn()} />, 'en')
    // Click the spell name span to expand s1 card
    fireEvent.click(screen.getByText('Vicious Mockery'))
    const levelSelect = screen.getByTestId('spell-level-s1')
    expect((levelSelect as HTMLElement).classList.contains('alignment-select')).toBe(true)
  })

  it('school select has alignment-select class when SpellCard is expanded', () => {
    renderWithI18n(<SpellList character={KAEL} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByText('Vicious Mockery'))
    const schoolSelect = screen.getByTestId('spell-school-s1')
    expect((schoolSelect as HTMLElement).classList.contains('alignment-select')).toBe(true)
  })
})
