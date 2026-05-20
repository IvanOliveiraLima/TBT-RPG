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
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
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

  it('updating class name calls onUpdate with updated classes and hitDice', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-name-0'), { target: { value: 'Druid' } })
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Druid', level: 5, hitDie: 8 }],  // hitDie updated via getHitDie('Druid')
      hitDice: [{ className: 'Druid', current: 5, max: 5, dieSize: 8 }],
    })
  })

  it('updating class level calls onUpdate with updated classes and hitDice', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-level-0'), { target: { value: '8' } })
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Ranger', level: 8, hitDie: 10 }],
      hitDice: [{ className: 'Ranger', current: 5, max: 8, dieSize: 10 }],
    })
  })

  it('adding a class increases classes array length', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: unknown[] }
    expect(call.classes).toHaveLength(2)
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
    renderWithI18n(<IdentityBlock character={multiclass} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-remove-class-1'))
    expect(onUpdate).toHaveBeenCalledWith({
      classes: [{ name: 'Fighter', level: 3, hitDie: 10 }],
      hitDice: [{ className: 'Fighter', current: 3, max: 3, dieSize: 10 }],
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

  it('class level allows intermediate empty state without calling onUpdate', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    // NumberField allows empty intermediate state — onChange is not called on empty input
    fireEvent.change(screen.getByTestId('identity-class-level-0'), { target: { value: '' } })
    expect(onUpdate).not.toHaveBeenCalled()
    // On blur, input restores to last valid value
    fireEvent.blur(screen.getByTestId('identity-class-level-0'))
    expect((screen.getByTestId('identity-class-level-0') as HTMLInputElement).value).toBe('5')
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

  // ── hitDice sync on class changes ────────────────────────────────────────

  it('adding a class also adds a hitDice entry', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-add-class'))
    const call = onUpdate.mock.calls[0]![0] as { hitDice: unknown[] }
    expect(call.hitDice).toHaveLength(2)
  })

  it('reducing class level clamps hitDice current to new level', () => {
    const onUpdate = vi.fn()
    const char = {
      ...BASE,
      classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
      hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
    }
    renderWithI18n(<IdentityBlock character={char} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-level-0'), { target: { value: '3' } })
    const call = onUpdate.mock.calls[0]![0] as { hitDice: { current: number; max: number }[] }
    expect(call.hitDice[0]!.max).toBe(3)
    expect(call.hitDice[0]!.current).toBe(3)  // clamped from 5 to new max 3
  })

  it('renaming a class updates hitDice className and dieSize', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-name-0'), { target: { value: 'Wizard' } })
    const call = onUpdate.mock.calls[0]![0] as {
      hitDice: { className: string; dieSize: number }[]
    }
    expect(call.hitDice[0]!.className).toBe('Wizard')
    expect(call.hitDice[0]!.dieSize).toBe(6)  // Wizard uses d6
  })
})

// ── Edge cases: className-based sync invariants ───────────────────────────────

describe('IdentityBlock — class/hitDice sync edge cases', () => {
  beforeEach(() => { localStorage.clear() })

  it('adding a class uses a non-empty default name (PT)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[]; hitDice: { className: string }[] }
    expect(call.classes.at(-1)!.name).not.toBe('')
    expect(call.hitDice.at(-1)!.className).not.toBe('')
  })

  it('adding a class uses a non-empty default name (EN)', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<IdentityBlock character={BASE} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('identity-add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[]; hitDice: { className: string }[] }
    expect(call.classes.at(-1)!.name).toBe('New class')
    expect(call.hitDice.at(-1)!.className).toBe('New class')
  })

  it('adding two classes generates distinct non-empty default names', () => {
    const onUpdate = vi.fn()
    // Simulate character that already has the first default ("Nova classe") as a class
    const charWithDefault = {
      ...BASE,
      classes: [{ name: 'Nova classe', level: 1, hitDie: 8 }],
      hitDice: [{ className: 'Nova classe', current: 1, max: 1, dieSize: 8 }],
    }
    renderWithI18n(<IdentityBlock character={charWithDefault} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('identity-add-class'))
    const call = onUpdate.mock.calls[0]![0] as { classes: { name: string }[] }
    // Second default must not collide with "Nova classe"
    expect(call.classes.at(-1)!.name).toBe('Nova classe 2')
  })

  it('removing a class removes its hitDice entry by name (not by index)', () => {
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
    renderWithI18n(<IdentityBlock character={multiclass} onUpdate={onUpdate} />, 'pt')
    // Remove Cleric (index 0)
    fireEvent.click(screen.getByTestId('identity-remove-class-0'))
    const call = onUpdate.mock.calls[0]![0] as {
      classes: { name: string }[]
      hitDice: { className: string }[]
    }
    expect(call.classes).toHaveLength(1)
    expect(call.classes[0]!.name).toBe('Fighter')
    expect(call.hitDice).toHaveLength(1)
    expect(call.hitDice[0]!.className).toBe('Fighter')
  })

  it('renaming a class during incremental typing keeps hitDice in sync', () => {
    // Simulates: type 'C' → 'Cl' → 'Cleric'. Each rename should track correctly.
    const onUpdate = vi.fn()
    const char = {
      ...BASE,
      classes: [{ name: 'C', level: 3, hitDie: 8 }],
      hitDice: [{ className: 'C', current: 3, max: 3, dieSize: 8 }],
    }
    renderWithI18n(<IdentityBlock character={char} onUpdate={onUpdate} />, 'pt')
    fireEvent.change(screen.getByTestId('identity-class-name-0'), { target: { value: 'Cl' } })
    const call = onUpdate.mock.calls[0]![0] as { hitDice: { className: string }[] }
    expect(call.hitDice[0]!.className).toBe('Cl')
    // No orphaned entries
    expect(call.hitDice).toHaveLength(1)
  })
})
