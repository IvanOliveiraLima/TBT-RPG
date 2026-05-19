import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { IdentityBlock } from '@/components/sheet/parts/IdentityBlock'
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
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 4, speed: 35,
  passivePerception: 16, spellSaveDC: 14, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [], inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 20, cp: 5 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('IdentityBlock', () => {
  beforeEach(() => { localStorage.clear() })

  // ── render ────────────────────────────────────────────────────────────────

  it('renders the identity block', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('identity-block')).toBeDefined()
  })

  // ── i18n labels ──────────────────────────────────────────────────────────

  it('shows race label in PT', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Raça')).toBeDefined()
  })

  it('shows race label in EN', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('Race')).toBeDefined()
  })

  it('shows background label in PT', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Antecedente')).toBeDefined()
  })

  it('shows alignment label in PT', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Alinhamento')).toBeDefined()
  })

  it('shows classes label in PT', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Classes')).toBeDefined()
  })

  it('shows inspiration label in PT', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByText('Inspiração')).toBeDefined()
  })

  it('shows inspiration label in EN', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByText('Inspiration')).toBeDefined()
  })

  // ── initial values ───────────────────────────────────────────────────────

  it('race input shows character.race', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('identity-race-input') as HTMLInputElement
    expect(input.value).toBe('Wood Elf')
  })

  it('background input shows character.background', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('identity-background-input') as HTMLInputElement
    expect(input.value).toBe('Outlander')
  })

  it('alignment select shows character.alignment', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const sel = screen.getByTestId('identity-alignment-select') as HTMLSelectElement
    expect(sel.value).toBe('Neutral Good')
  })

  it('class name input shows character.classes[0].name', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('identity-class-name-0') as HTMLInputElement
    expect(input.value).toBe('Ranger')
  })

  it('class level input shows character.classes[0].level', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const input = screen.getByTestId('identity-class-level-0') as HTMLInputElement
    expect(input.value).toBe('5')
  })

  it('inspiration checkbox reflects character.inspiration=false', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const cb = screen.getByTestId('identity-inspiration-checkbox') as HTMLInputElement
    expect(cb.checked).toBe(false)
  })

  it('inspiration checkbox reflects character.inspiration=true', () => {
    renderWithI18n(
      <IdentityBlock character={{ ...BASE, inspiration: true }} onUpdate={vi.fn()} />, 'pt'
    )
    const cb = screen.getByTestId('identity-inspiration-checkbox') as HTMLInputElement
    expect(cb.checked).toBe(true)
  })

  // ── race editing ─────────────────────────────────────────────────────────

  it('calls onUpdate with new race when race input changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-race-input'), { target: { value: 'Dragonborn' } })
    expect(onUpdate).toHaveBeenCalledWith({ race: 'Dragonborn' })
  })

  it('accepts non-canonical race values (free-text)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-race-input'), { target: { value: 'Half-Elf Variant' } })
    expect(onUpdate).toHaveBeenCalledWith({ race: 'Half-Elf Variant' })
  })

  it('preserves non-canonical race from character', () => {
    renderWithI18n(
      <IdentityBlock character={{ ...BASE, race: 'Custom Homebrew Race' }} onUpdate={vi.fn()} />, 'pt'
    )
    const input = screen.getByTestId('identity-race-input') as HTMLInputElement
    expect(input.value).toBe('Custom Homebrew Race')
  })

  // ── background editing ───────────────────────────────────────────────────

  it('calls onUpdate with new background when input changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-background-input'), { target: { value: 'Sage' } })
    expect(onUpdate).toHaveBeenCalledWith({ background: 'Sage' })
  })

  it('accepts non-canonical background values', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-background-input'), { target: { value: 'Custom Guild' } })
    expect(onUpdate).toHaveBeenCalledWith({ background: 'Custom Guild' })
  })

  // ── alignment editing ─────────────────────────────────────────────────────

  it('calls onUpdate with new alignment when select changes', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-alignment-select'), { target: { value: 'Chaotic Good' } })
    expect(onUpdate).toHaveBeenCalledWith({ alignment: 'Chaotic Good' })
  })

  it('alignment select has 10 options (9 canonical + unselected)', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const sel = screen.getByTestId('identity-alignment-select') as HTMLSelectElement
    expect(sel.options.length).toBe(10)
  })

  it('shows custom alignment as disabled option when value is non-canonical', () => {
    renderWithI18n(
      <IdentityBlock character={{ ...BASE, alignment: 'Lawful Awesome' }} onUpdate={vi.fn()} />, 'pt'
    )
    const customOpt = screen.getByTestId('identity-alignment-custom-option')
    expect(customOpt.textContent).toContain('Lawful Awesome')
    expect((customOpt as HTMLOptionElement).disabled).toBe(true)
  })

  it('custom alignment select has 11 options (9 canonical + unselected + custom)', () => {
    renderWithI18n(
      <IdentityBlock character={{ ...BASE, alignment: 'Lawful Awesome' }} onUpdate={vi.fn()} />, 'pt'
    )
    const sel = screen.getByTestId('identity-alignment-select') as HTMLSelectElement
    expect(sel.options.length).toBe(11)
  })

  it('does not call onUpdate when disabled custom option is selected', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <IdentityBlock character={{ ...BASE, alignment: 'Lawful Awesome' }} onUpdate={onUpdate} />, 'pt'
    )
    fireEvent.change(screen.getByTestId('identity-alignment-select'), { target: { value: '__custom__' } })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  // ── classes editing ──────────────────────────────────────────────────────

  it('renders one class row per class', () => {
    const multiclass = {
      ...BASE,
      classes: [
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
    }
    renderWithI18n(<IdentityBlock character={multiclass} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('identity-class-row-0')).toBeDefined()
    expect(screen.getByTestId('identity-class-row-1')).toBeDefined()
  })

  it('updating class name calls onUpdate with updated classes array', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-name-0'), { target: { value: 'Druid' } })
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Druid', level: 5, hitDie: 10 }],
    })
  })

  it('updating class level calls onUpdate with updated classes array', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-level-0'), { target: { value: '8' } })
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Ranger', level: 8, hitDie: 10 }],
    })
  })

  it('adding a class increases classes array length', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: unknown[] }
    expect(call.classes).toHaveLength(2)
  })

  it('removing a class calls onUpdate with filtered classes array', () => {
    const onUpdate = vi.fn()
    const multiclass = {
      ...BASE,
      classes: [
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
    }
    renderWithI18n(<IdentityBlock character={multiclass} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-remove-class-1'))
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Fighter', level: 3, hitDie: 10 }],
    })
  })

  it('remove button is disabled when only one class exists', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    const removeBtn = screen.getByTestId('identity-remove-class-0') as HTMLButtonElement
    expect(removeBtn.disabled).toBe(true)
  })

  it('remove button is enabled when more than one class exists', () => {
    const multiclass = {
      ...BASE,
      classes: [
        { name: 'Fighter', level: 3, hitDie: 10 },
        { name: 'Wizard', level: 2, hitDie: 6 },
      ],
    }
    renderWithI18n(<IdentityBlock character={multiclass} onUpdate={vi.fn()} />, 'pt')
    expect((screen.getByTestId('identity-remove-class-0') as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByTestId('identity-remove-class-1') as HTMLButtonElement).disabled).toBe(false)
  })

  it('add class button label in PT', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'pt')
    expect(screen.getByTestId('identity-add-class').textContent).toBe('+ Adicionar classe')
  })

  it('add class button label in EN', () => {
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('identity-add-class').textContent).toBe('+ Add class')
  })

  it('class level clamps to minimum 1 on invalid input', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-level-0'), { target: { value: '' } })
    const call = onUpdate.mock.calls[0]![0] as { classes: Array<{ level: number }> }
    expect(call.classes[0]!.level).toBe(1)
  })

  // ── inspiration toggle ────────────────────────────────────────────────────

  it('toggling inspiration calls onUpdate with inspiration:true', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-inspiration-checkbox'))
    expect(onUpdate).toHaveBeenCalledWith({ inspiration: true })
  })

  it('toggling inspiration off calls onUpdate with inspiration:false', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <IdentityBlock character={{ ...BASE, inspiration: true }} onUpdate={onUpdate} />, 'pt'
    )
    fireEvent.click(screen.getByTestId('identity-inspiration-checkbox'))
    expect(onUpdate).toHaveBeenCalledWith({ inspiration: false })
  })
})
