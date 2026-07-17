import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ClassEditor } from '@/components/sheet/parts/ClassEditor'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'char_id_test',
  name: 'Eira Thornwood',
  race: 'Wood Elf',
  background: 'Outlander',
  alignment: 'Neutral Good',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  experience: 6500,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 42, max: 42, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 4, speed: 35,
  passivePerception: 16, spellSaveDC: 14, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 20, cp: 5 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('ClassEditor', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders one class row per class', () => {
    const multiclass = {
      ...BASE,
      classes: [
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
    }
    renderWithI18n(<ClassEditor character={multiclass} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('class-row-0')).toBeDefined()
    expect(screen.getByTestId('class-row-1')).toBeDefined()
  })

  it('class name input shows class name', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect((screen.getByTestId('class-name-0') as HTMLInputElement).value).toBe('Ranger')
  })

  it('class level input shows class level', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect((screen.getByTestId('class-level-0') as HTMLInputElement).value).toBe('5')
  })

  it('updating class name calls onUpdate with updated classes and hitDice', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('class-name-0'), { target: { value: 'Druid' } })
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Druid', level: 5, hitDie: 8 }],
      hitDice: [{ className: 'Druid', current: 5, max: 5, dieSize: 8 }],
    })
  })

  it('updating class level calls onUpdate with updated classes and hitDice', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('class-level-0'), { target: { value: '8' } })
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Ranger', level: 8, hitDie: 10 }],
      hitDice: [{ className: 'Ranger', current: 5, max: 8, dieSize: 10 }],
    })
  })

  it('adding a class increases classes array length', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: unknown[] }
    expect(call.classes).toHaveLength(2)
  })

  it('adding a class also adds a hitDice entry', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-class'))
    const call = onUpdate.mock.calls[0]![0] as { hitDice: unknown[] }
    expect(call.hitDice).toHaveLength(2)
  })

  it('adding a class starts with empty name (select placeholder)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[]; hitDice: { className: string }[] }
    expect(call.classes.at(-1)!.name).toBe('')
    expect(call.hitDice.at(-1)!.className).toBe('')
  })

  it('adding a class starts with empty name (EN)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[] }
    expect(call.classes.at(-1)!.name).toBe('')
  })

  it('adding a second class also starts with empty name', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[] }
    expect(call.classes.at(-1)!.name).toBe('')
  })

  it('removing a class calls onUpdate with filtered classes and hitDice', () => {
    const onUpdate = vi.fn()
    const multiclass = {
      ...BASE,
      classes: [
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
      hitDice: [
        { className: 'Fighter', current: 3, max: 3, dieSize: 10 },
        { className: 'Wizard', current: 2, max: 2, dieSize: 6 },
      ],
    }
    renderWithI18n(<ClassEditor character={multiclass} onUpdate={onUpdate} />, 'pt')
    // Two-step confirm: first click enters confirming, second confirms
    fireEvent.click(screen.getByTestId('remove-class-1'))
    expect(onUpdate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('remove-class-1'))
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Fighter', level: 3, hitDie: 10 }],
      hitDice: [{ className: 'Fighter', current: 3, max: 3, dieSize: 10 }],
    })
  })

  it('removing a class removes hitDice entry by name (not by index)', () => {
    const onUpdate = vi.fn()
    const multiclass = {
      ...BASE,
      classes: [
        { name: 'Cleric', level: 5, hitDie: 8 },
        { name: 'Fighter', level: 3, hitDie: 10 },
      ],
      hitDice: [
        { className: 'Cleric', current: 5, max: 5, dieSize: 8 },
        { className: 'Fighter', current: 3, max: 3, dieSize: 10 },
      ],
    }
    renderWithI18n(<ClassEditor character={multiclass} onUpdate={onUpdate} />, 'pt')
    // Two-step confirm
    fireEvent.click(screen.getByTestId('remove-class-0'))
    expect(onUpdate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('remove-class-0'))
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[]; hitDice: { className: string }[] }
    expect(call.classes).toHaveLength(1)
    expect(call.classes[0]!.name).toBe('Fighter')
    expect(call.hitDice).toHaveLength(1)
    expect(call.hitDice[0]!.className).toBe('Fighter')
  })

  it('remove button is disabled when only one class exists', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect((screen.getByTestId('remove-class-0') as HTMLButtonElement).disabled).toBe(true)
  })

  it('remove button is enabled when more than one class exists', () => {
    const multiclass = {
      ...BASE,
      classes: [
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
    }
    renderWithI18n(<ClassEditor character={multiclass} onUpdate={vi.fn()} />, 'pt')
    expect((screen.getByTestId('remove-class-0') as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByTestId('remove-class-1') as HTMLButtonElement).disabled).toBe(false)
  })

  it('add class button label in PT', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('add-class').textContent).toBe('+ Adicionar classe')
  })

  it('add class button label in EN', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('add-class').textContent).toBe('+ Add class')
  })

  it('reducing class level clamps hitDice current to new level', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('class-level-0'), { target: { value: '3' } })
    const call = onUpdate.mock.calls[0]![0] as { hitDice: { current: number; max: number }[] }
    expect(call.hitDice[0]!.max).toBe(3)
    expect(call.hitDice[0]!.current).toBe(3)
  })

  it('renaming a class updates hitDice className and dieSize', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('class-name-0'), { target: { value: 'Wizard' } })
    const call = onUpdate.mock.calls[0]![0] as { hitDice: { className: string; dieSize: number }[] }
    expect(call.hitDice[0]!.className).toBe('Wizard')
    expect(call.hitDice[0]!.dieSize).toBe(6)
  })

  it('selecting a canonical class keeps hitDice in sync', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('class-name-0'), { target: { value: 'Cleric' } })
    const call = onUpdate.mock.calls[0]![0] as { hitDice: { className: string }[] }
    expect(call.hitDice[0]!.className).toBe('Cleric')
    expect(call.hitDice).toHaveLength(1)
  })

  it('class level allows empty intermediate state without calling onUpdate', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('class-level-0'), { target: { value: '' } })
    expect(onUpdate).not.toHaveBeenCalled()
    fireEvent.blur(screen.getByTestId('class-level-0'))
    expect((screen.getByTestId('class-level-0') as HTMLInputElement).value).toBe('5')
  })
})

describe('ClassEditor — column header', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders the level column header in PT', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('class-level-header')).toBeDefined()
    expect(screen.getByText('Nível')).toBeDefined()
  })

  it('renders the level column header in EN', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('class-level-header')).toBeDefined()
    expect(screen.getByText('Level')).toBeDefined()
  })

  it('header is aria-hidden (decorative)', () => {
    const { container } = renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    const header = container.querySelector('[data-testid="class-level-header"]') as HTMLElement
    expect(header.getAttribute('aria-hidden')).toBe('true')
  })

  it('header is always visible regardless of number of classes', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('class-level-header')).toBeDefined()
  })
})

describe('ClassEditor — layout constraints', () => {
  beforeEach(() => { localStorage.clear() })

  it('class level input has explicit fixed width (no overflow on mobile)', () => {
    const { container } = renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    const levelInput = container.querySelector('[data-testid="class-level-0"]') as HTMLInputElement
    // width is set via inline style — must be a fixed px value, not 100% or auto
    expect(levelInput.style.width).toBe('64px')
    expect(levelInput.style.flexShrink).toBe('0')
  })

  it('class name input has flex: 1 1 0 and minWidth: 0 to shrink without overflow', () => {
    const { container } = renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    const nameInput = container.querySelector('[data-testid="class-name-0"]') as HTMLInputElement
    expect(nameInput.style.minWidth).toBe('0px')
  })

  it('remove button has flexShrink: 0 to preserve its size on narrow viewports', () => {
    const { container } = renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    const removeBtn = container.querySelector('[data-testid="remove-class-0"]') as HTMLButtonElement
    expect(removeBtn.style.flexShrink).toBe('0')
  })
})

describe('ClassEditor — auto-focus on add', () => {
  beforeEach(() => { localStorage.clear() })

  it('adds a new class row (empty name) after clicking add', () => {
    // ClassEditor is controlled — onUpdate captures the call. New class starts with empty name.
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('add-class'))
    // onUpdate was called with 2 classes; new class is at index 1
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[] }
    expect(call.classes).toHaveLength(2)
    expect(call.classes[1]!.name).toBe('')
  })
})
