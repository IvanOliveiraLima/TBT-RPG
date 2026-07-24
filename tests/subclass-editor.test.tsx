import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ClassEditor } from '@/components/sheet/parts/ClassEditor'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

const BASE: Character = {
  id: 'char_id_test',
  name: 'Test Character',
  race: 'Human',
  background: 'Soldier',
  alignment: 'Neutral Good',
  classes: [{ name: 'Warlock', level: 5, hitDie: 8 }],
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 30, max: 30, temp: 0 },
  hitDice: [{ className: 'Warlock', current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 12, initiative: 0, speed: 30,
  passivePerception: 10, spellSaveDC: 14, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
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

describe('ClassEditor — subclass input', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders a subclass input for each class row', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('class-subclass-0')).toBeDefined()
  })

  it('subclass input shows existing subclass value', () => {
    const char = {
      ...BASE,
      classes: [{ name: 'Warlock', level: 5, hitDie: 8, subclass: 'The Fiend' }],
    }
    renderWithI18n(<ClassEditor character={char} onUpdate={vi.fn()} />, 'en')
    expect((screen.getByTestId('class-subclass-0') as HTMLInputElement).value).toBe('The Fiend')
  })

  it('subclass input is empty when no subclass is set', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'en')
    expect((screen.getByTestId('class-subclass-0') as HTMLInputElement).value).toBe('')
  })

  it('typing into subclass input calls onUpdate with the subclass value', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.change(screen.getByTestId('class-subclass-0'), { target: { value: 'The Fiend' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        classes: [expect.objectContaining({ subclass: 'The Fiend' })],
      })
    )
  })

  it('clears subclass when emptied', () => {
    const onUpdate = vi.fn()
    const char = {
      ...BASE,
      classes: [{ name: 'Warlock', level: 5, hitDie: 8, subclass: 'The Fiend' }],
    }
    renderWithI18n(<ClassEditor character={char} onUpdate={onUpdate} />, 'en')
    fireEvent.change(screen.getByTestId('class-subclass-0'), { target: { value: '' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        classes: [expect.objectContaining({ subclass: '' })],
      })
    )
  })

  it('subclass input is readOnly when locked', () => {
    const char = { ...BASE, locked: true }
    const { container } = renderWithI18n(<ClassEditor character={char} onUpdate={vi.fn()} locked />, 'en')
    const input = container.querySelector('[data-testid="class-subclass-0"]') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('subclass input is not readOnly when unlocked', () => {
    const { container } = renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'en')
    const input = container.querySelector('[data-testid="class-subclass-0"]') as HTMLInputElement
    expect(input.readOnly).toBe(false)
  })
})

describe('ClassEditor — subclass datalist', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders a datalist for Warlock with The Fiend option', () => {
    const { container } = renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'en')
    const datalist = container.querySelector('#subclass-dl-0') as HTMLDataListElement
    expect(datalist).toBeDefined()
    const options = Array.from(datalist.querySelectorAll('option')).map(o => o.value)
    expect(options).toContain('The Fiend')
    expect(options).toContain('The Archfey')
  })

  it('renders Cleric datalist with Life Domain option', () => {
    const char = {
      ...BASE,
      classes: [{ name: 'Cleric', level: 3, hitDie: 8 }],
      hitDice: [{ className: 'Cleric', current: 3, max: 3, dieSize: 8 }],
    }
    const { container } = renderWithI18n(<ClassEditor character={char} onUpdate={vi.fn()} />, 'en')
    const datalist = container.querySelector('#subclass-dl-0') as HTMLDataListElement
    const options = Array.from(datalist.querySelectorAll('option')).map(o => o.value)
    expect(options).toContain('Life Domain')
    expect(options).toContain('War Domain')
  })

  it('renders independent datalists for multiclass rows', () => {
    const char = {
      ...BASE,
      classes: [
        { name: 'Warlock', level: 3, hitDie: 8 },
        { name: 'Cleric', level: 2, hitDie: 8 },
      ],
      hitDice: [
        { className: 'Warlock', current: 3, max: 3, dieSize: 8 },
        { className: 'Cleric', current: 2, max: 2, dieSize: 8 },
      ],
    }
    const { container } = renderWithI18n(<ClassEditor character={char} onUpdate={vi.fn()} />, 'en')
    const dl0 = container.querySelector('#subclass-dl-0') as HTMLDataListElement
    const dl1 = container.querySelector('#subclass-dl-1') as HTMLDataListElement
    const opts0 = Array.from(dl0.querySelectorAll('option')).map(o => o.value)
    const opts1 = Array.from(dl1.querySelectorAll('option')).map(o => o.value)
    expect(opts0).toContain('The Fiend')
    expect(opts1).toContain('Life Domain')
    expect(opts0).not.toContain('Life Domain')
    expect(opts1).not.toContain('The Fiend')
  })

  it('renders empty datalist for homebrew class', () => {
    const char = {
      ...BASE,
      classes: [{ name: 'HomeBrewer', level: 1, hitDie: 8 }],
      hitDice: [{ className: 'HomeBrewer', current: 1, max: 1, dieSize: 8 }],
    }
    const { container } = renderWithI18n(<ClassEditor character={char} onUpdate={vi.fn()} />, 'en')
    const datalist = container.querySelector('#subclass-dl-0') as HTMLDataListElement
    const options = datalist.querySelectorAll('option')
    expect(options.length).toBe(0)
  })
})

describe('ClassEditor — subclass column header', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders subclass column label in EN', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('Subclass')).toBeDefined()
  })

  it('renders subclass column label in PT', () => {
    renderWithI18n(<ClassEditor character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Subclasse')).toBeDefined()
  })
})
