import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { getCanonicalClass, getHitDie } from '@/domain/classes'
import { classLabel } from '@/utils/classLabel'
import { ClassSelect } from '@/components/sheet/parts/ClassSelect'
import { ClassEditor } from '@/components/sheet/parts/ClassEditor'
import { formatClassesShort } from '@/domain/derived'
import { renderWithI18n } from './helpers/render'
import type { Character } from '@/domain/character'

// ── getCanonicalClass ─────────────────────────────────────────────────────────

describe('getCanonicalClass', () => {
  it('resolves PT-BR synonym Bruxo → Warlock', () => {
    expect(getCanonicalClass('Bruxo')).toBe('Warlock')
  })

  it('resolves accent-stripped PT-BR clerigo → Cleric', () => {
    expect(getCanonicalClass('clerigo')).toBe('Cleric')
  })

  it('resolves Clérigo (accented) → Cleric', () => {
    expect(getCanonicalClass('Clérigo')).toBe('Cleric')
  })

  it('resolves canonical Wizard → Wizard (self)', () => {
    expect(getCanonicalClass('Wizard')).toBe('Wizard')
  })

  it('resolves lowercase canonical ranger → Ranger', () => {
    expect(getCanonicalClass('ranger')).toBe('Ranger')
  })

  it('resolves PT-BR Patrulheiro → Ranger', () => {
    expect(getCanonicalClass('Patrulheiro')).toBe('Ranger')
  })

  it('resolves PT-BR Feiticeiro → Sorcerer', () => {
    expect(getCanonicalClass('Feiticeiro')).toBe('Sorcerer')
  })

  it('resolves PT-BR Artífice → Artificer', () => {
    expect(getCanonicalClass('Artífice')).toBe('Artificer')
  })

  it('resolves Blood Hunter → Blood Hunter (two-word canonical)', () => {
    expect(getCanonicalClass('Blood Hunter')).toBe('Blood Hunter')
  })

  it('resolves Gunslinger → Gunslinger', () => {
    expect(getCanonicalClass('Gunslinger')).toBe('Gunslinger')
  })

  it('returns null for unknown / homebrew class', () => {
    expect(getCanonicalClass('MyHomebrew')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getCanonicalClass('')).toBeNull()
  })

  it('is case-insensitive for canonical name', () => {
    expect(getCanonicalClass('BARBARIAN')).toBe('Barbarian')
    expect(getCanonicalClass('barbarian')).toBe('Barbarian')
  })
})

// ── classLabel ────────────────────────────────────────────────────────────────

describe('classLabel', () => {
  // Use a minimal t() that mimics the real i18n behavior for class keys
  const tEN = (key: string) => {
    const map: Record<string, string> = {
      'class.wizard': 'Wizard',
      'class.ranger': 'Ranger',
      'class.warlock': 'Warlock',
      'class.barbarian': 'Barbarian',
      'class.blood_hunter': 'Blood Hunter',
      'class.gunslinger': 'Gunslinger',
    }
    return map[key] ?? key
  }
  const tPT = (key: string) => {
    const map: Record<string, string> = {
      'class.wizard': 'Mago',
      'class.ranger': 'Patrulheiro',
      'class.warlock': 'Bruxo',
      'class.barbarian': 'Bárbaro',
      'class.blood_hunter': 'Caçador de Sangue',
      'class.gunslinger': 'Pistoleiro',
    }
    return map[key] ?? key
  }

  it('translates canonical Wizard to EN label', () => {
    expect(classLabel('Wizard', tEN)).toBe('Wizard')
  })

  it('translates canonical Wizard to PT label (Mago)', () => {
    expect(classLabel('Wizard', tPT)).toBe('Mago')
  })

  it('translates canonical Ranger to PT label (Patrulheiro)', () => {
    expect(classLabel('Ranger', tPT)).toBe('Patrulheiro')
  })

  it('recognizes PT-BR synonym Bruxo and translates to Bruxo in PT', () => {
    // Bruxo → Warlock → class.warlock → 'Bruxo' (in PT)
    expect(classLabel('Bruxo', tPT)).toBe('Bruxo')
  })

  it('recognizes PT-BR synonym Bruxo and translates to Warlock in EN', () => {
    expect(classLabel('Bruxo', tEN)).toBe('Warlock')
  })

  it('returns raw string for unknown / homebrew class', () => {
    expect(classLabel('MyBrew', tEN)).toBe('MyBrew')
    expect(classLabel('MyBrew', tPT)).toBe('MyBrew')
  })

  it('handles Blood Hunter two-word key correctly in EN', () => {
    expect(classLabel('Blood Hunter', tEN)).toBe('Blood Hunter')
  })

  it('translates Blood Hunter to PT label', () => {
    expect(classLabel('Blood Hunter', tPT)).toBe('Caçador de Sangue')
  })
})

// ── ClassSelect component ─────────────────────────────────────────────────────

describe('ClassSelect', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders all canonical classes as options (PT labels)', () => {
    renderWithI18n(
      <ClassSelect value="" onChange={vi.fn()} />,
      'pt',
    )
    const sel = screen.getByRole('combobox') as HTMLSelectElement
    const optionTexts = Array.from(sel.options).map(o => o.text)
    expect(optionTexts).toContain('Bárbaro')
    expect(optionTexts).toContain('Clérigo')
    expect(optionTexts).toContain('Mago')
    expect(optionTexts).toContain('Bruxo')
    expect(optionTexts).toContain('Feiticeiro')
  })

  it('renders all canonical classes as options (EN labels)', () => {
    renderWithI18n(
      <ClassSelect value="" onChange={vi.fn()} />,
      'en',
    )
    const sel = screen.getByRole('combobox') as HTMLSelectElement
    const optionTexts = Array.from(sel.options).map(o => o.text)
    expect(optionTexts).toContain('Barbarian')
    expect(optionTexts).toContain('Cleric')
    expect(optionTexts).toContain('Wizard')
    expect(optionTexts).toContain('Warlock')
    expect(optionTexts).toContain('Sorcerer')
    expect(optionTexts).toContain('Blood Hunter')
    expect(optionTexts).toContain('Gunslinger')
  })

  it('shows placeholder when value is empty', () => {
    renderWithI18n(
      <ClassSelect value="" onChange={vi.fn()} />,
      'pt',
    )
    const sel = screen.getByRole('combobox') as HTMLSelectElement
    expect(sel.value).toBe('')
    const firstOption = sel.options[0]!
    expect(firstOption.text).toBe('Selecione uma classe…')
  })

  it('shows EN placeholder when value is empty', () => {
    renderWithI18n(
      <ClassSelect value="" onChange={vi.fn()} />,
      'en',
    )
    const sel = screen.getByRole('combobox') as HTMLSelectElement
    expect(sel.options[0]!.text).toBe('Select class…')
  })

  it('selects the canonical class option when value matches', () => {
    renderWithI18n(
      <ClassSelect value="Wizard" onChange={vi.fn()} />,
      'pt',
    )
    const sel = screen.getByRole('combobox') as HTMLSelectElement
    expect(sel.value).toBe('Wizard')
  })

  it('shows __custom__ disabled option for unrecognised value', () => {
    renderWithI18n(
      <ClassSelect value="MyHomebrew" onChange={vi.fn()} />,
      'pt',
    )
    const sel = screen.getByRole('combobox') as HTMLSelectElement
    expect(sel.value).toBe('__custom__')
    const customOption = sel.querySelector('[data-testid="class-custom-option"]') as HTMLOptionElement
    expect(customOption).not.toBeNull()
    expect(customOption.disabled).toBe(true)
  })

  it('shows custom label text for unrecognised value (PT)', () => {
    renderWithI18n(
      <ClassSelect value="MyHomebrew" onChange={vi.fn()} />,
      'pt',
    )
    const customOption = screen.getByTestId('class-custom-option') as HTMLOptionElement
    expect(customOption.text).toBe('Customizado: MyHomebrew')
  })

  it('calls onChange with canonical class key on selection', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <ClassSelect value="" onChange={onChange} />,
      'pt',
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Cleric' } })
    expect(onChange).toHaveBeenCalledWith('Cleric')
  })

  it('does NOT call onChange when __custom__ is selected', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <ClassSelect value="MyHomebrew" onChange={onChange} />,
      'pt',
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__custom__' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('recognises PT-BR legacy value (Bruxo) as canonical — no __custom__', () => {
    // Bruxo is a known synonym → resolves to Warlock → select shows Warlock option
    renderWithI18n(
      <ClassSelect value="Bruxo" onChange={vi.fn()} />,
      'pt',
    )
    const sel = screen.getByRole('combobox') as HTMLSelectElement
    expect(sel.value).toBe('Warlock')
    expect(sel.querySelector('[data-testid="class-custom-option"]')).toBeNull()
  })

  it('is disabled when disabled prop is true', () => {
    renderWithI18n(
      <ClassSelect value="Wizard" onChange={vi.fn()} disabled />,
      'pt',
    )
    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true)
  })
})

// ── hit die recalculation on class selection ──────────────────────────────────

describe('ClassEditor — hit die recalculation via ClassSelect', () => {
  beforeEach(() => { localStorage.clear() })

  const CHAR: Character = {
    id: 'char_test',
    name: 'Test',
    race: '',
    background: '',
    alignment: '',
    classes: [{ name: 'Fighter', level: 1, hitDie: 10 }],
    experience: 0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 2,
    hp: { current: 10, max: 10, temp: 0 },
    hitDice: [{ className: 'Fighter', current: 1, max: 1, dieSize: 10 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 10, initiative: 0, speed: 30,
    passivePerception: 10, spellSaveDC: 10, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks: [], inventory: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features: [], backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [], spellSlots: {},
    spellcastingAbility: '', spellcastingClass: '',
    images: {},
    createdAt: 0, updatedAt: 0,
  }

  it('selecting Barbarian gives d12', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={CHAR} onUpdate={onUpdate} />, 'en')
    fireEvent.change(screen.getByTestId('class-name-0'), { target: { value: 'Barbarian' } })
    const call = onUpdate.mock.calls[0]![0] as { classes: { hitDie: number }[] }
    expect(call.classes[0]!.hitDie).toBe(12)
  })

  it('selecting Wizard gives d6', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={CHAR} onUpdate={onUpdate} />, 'en')
    fireEvent.change(screen.getByTestId('class-name-0'), { target: { value: 'Wizard' } })
    const call = onUpdate.mock.calls[0]![0] as { classes: { hitDie: number }[] }
    expect(call.classes[0]!.hitDie).toBe(6)
  })

  it('selecting Cleric gives d8', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<ClassEditor character={CHAR} onUpdate={onUpdate} />, 'en')
    fireEvent.change(screen.getByTestId('class-name-0'), { target: { value: 'Cleric' } })
    const call = onUpdate.mock.calls[0]![0] as { classes: { hitDie: number }[] }
    expect(call.classes[0]!.hitDie).toBe(8)
  })

  it('getHitDie works for canonical keys from ClassSelect', () => {
    expect(getHitDie('Barbarian')).toBe(12)
    expect(getHitDie('Wizard')).toBe(6)
    expect(getHitDie('Cleric')).toBe(8)
    expect(getHitDie('Ranger')).toBe(10)
  })
})

// ── formatClassesShort with resolver ─────────────────────────────────────────

describe('formatClassesShort — localized resolver', () => {
  const tPT = (key: string) => {
    const map: Record<string, string> = {
      'class.ranger': 'Patrulheiro',
      'class.wizard': 'Mago',
    }
    return map[key] ?? key
  }
  const tEN = (key: string) => {
    const map: Record<string, string> = {
      'class.ranger': 'Ranger',
      'class.wizard': 'Wizard',
    }
    return map[key] ?? key
  }

  const CHAR_RANGER: Character = {
    id: 'c1', name: 'X', race: '', background: '', alignment: '',
    classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
    experience: 0, age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 2,
    hp: { current: 10, max: 10, temp: 0 },
    hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 10, initiative: 0, speed: 30,
    passivePerception: 10, spellSaveDC: 10, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks: [], inventory: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features: [], backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '', mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [], spellSlots: {},
    spellcastingAbility: '', spellcastingClass: '',
    images: {}, createdAt: 0, updatedAt: 0,
  }

  it('formats with resolver in PT (Patrulheiro 5)', () => {
    const result = formatClassesShort(CHAR_RANGER, name => classLabel(name, tPT))
    expect(result).toBe('Patrulheiro 5')
  })

  it('formats with resolver in EN (Ranger 5)', () => {
    const result = formatClassesShort(CHAR_RANGER, name => classLabel(name, tEN))
    expect(result).toBe('Ranger 5')
  })

  it('without resolver returns raw class name (backwards-compat)', () => {
    const result = formatClassesShort(CHAR_RANGER)
    expect(result).toBe('Ranger 5')
  })

  it('homebrew class passes through resolver unchanged', () => {
    const char = { ...CHAR_RANGER, classes: [{ name: 'MyBrew', level: 3, hitDie: 8 }] }
    const result = formatClassesShort(char, name => classLabel(name, tPT))
    expect(result).toBe('MyBrew 3')
  })
})
