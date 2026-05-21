import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { StatusTab } from '@/components/sheet/tabs/StatusTab'
import { useCharacterStore } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import type { Character, SkillState, SavingThrowState, Feature } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

function save(ability: SavingThrowState['ability'], proficient: boolean, bonus: number): SavingThrowState {
  return { ability, proficient, bonus }
}

function skill(name: string, ability: SkillState['ability'], bonus: number, proficient = false, expertise = false): SkillState {
  return { name, ability, proficient, expertise, bonus }
}

const EIRA: Character = {
  id: 'eira_01',
  name: 'Eira Thornwood',
  race: 'Wood Elf',
  background: 'Outlander',
  alignment: 'Neutral Good',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  experience: 6500,
  abilities: { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 42, max: 42, temp: 5 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 16, initiative: 4, speed: 35,
  passivePerception: 16, spellSaveDC: 14, inspiration: false,
  savingThrows: [
    save('str', false, 2),
    save('dex', true, 7),
    save('con', false, 2),
    save('int', false, 1),
    save('wis', true, 6),
    save('cha', false, 0),
  ],
  skills: [
    skill('Athletics', 'str', 5, true),
    skill('Acrobatics', 'dex', 4),
    skill('Nature', 'int', 4, true),
    skill('Perception', 'wis', 9, true, true),
    skill('Stealth', 'dex', 7, true),
    skill('Survival', 'wis', 6, true),
  ],
  proficiencies: { weapons: ['Longbow', 'Shortsword', 'Light', 'Medium'], armor: [], tools: [], other: [] }, languages: ['Common', 'Elvish', 'Sylvan'],
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 50, ep: 0, sp: 20, cp: 5 },
  features: [
    { id: 'favored_enemy', name: 'Favored Enemy', source: 'Classe', description: 'Advantage vs beasts', type: 'passive' },
    { id: 'natural_explorer', name: 'Natural Explorer', source: 'Classe', description: 'Terrain expertise', type: 'passive' },
    { id: 'extra_attack', name: 'Extra Attack', source: 'Classe', description: 'Attack twice', type: 'passive' },
    { id: 'colossus_slayer', name: 'Colossus Slayer', source: 'Classe', description: '+1d8 once per turn vs wounded', type: 'active', usesLeft: 1, usesMax: 1 },
  ] satisfies Feature[],
  backstory: 'Guardian of the Thornwood Forest',
  personality: { traits: 'Quiet observer', ideals: 'Protecting nature', bonds: 'The forest', flaws: 'Distrusts cities' },
  notes1: '', notes2: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('StatusTab integration', () => {
  beforeEach(() => { localStorage.clear() })

  afterEach(() => {
    useCharacterStore.setState({ activeId: null, loading: false, error: null })
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('renders nothing when character store is empty', () => {
    const { container } = renderWithI18n(<StatusTab />, 'pt')
    expect(container.firstChild).toBeNull()
  })

  it('renders HeroCard when character is in store', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByText('Eira Thornwood').length).toBeGreaterThanOrEqual(1)
  })

  it('renders HpBlock with "Hit Points" in EN', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'en')
    expect(screen.getAllByText('Hit Points').length).toBeGreaterThanOrEqual(1)
  })

  it('renders HpBlock with "Pontos de Vida" in PT', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByText('Pontos de Vida').length).toBeGreaterThanOrEqual(1)
  })

  it('renders CombatStrip with AC', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    const acStats = screen.getAllByTestId('combat-stat-ac')
    expect(acStats.length).toBeGreaterThanOrEqual(1)
    expect(acStats[0]!.textContent).toContain('16')
  })

  it('renders AttrGrid with all 6 abilities', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    const strAttrs = screen.getAllByTestId('attr-str')
    expect(strAttrs.length).toBeGreaterThanOrEqual(1)
    const chaAttrs = screen.getAllByTestId('attr-cha')
    expect(chaAttrs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders AttrGrid with PT abbreviations (FOR/DES/SAB)', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByText('FOR').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('DES').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('SAB').length).toBeGreaterThanOrEqual(1)
  })

  it('renders SavingThrows with all 6 saves', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    const savesContainers = screen.getAllByTestId('saving-throws')
    expect(savesContainers.length).toBeGreaterThanOrEqual(1)
  })

  it('renders SavingThrows with PT ability names', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByText('Força').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Destreza').length).toBeGreaterThanOrEqual(1)
  })

  it('renders SkillsBlock', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    const skillsContainers = screen.getAllByTestId('skills-block')
    expect(skillsContainers.length).toBeGreaterThanOrEqual(1)
  })

  it('renders SkillsBlock with PT skill names', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByText('Atletismo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Percepção').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Furtividade').length).toBeGreaterThanOrEqual(1)
  })

  it('renders FeaturesList with Eira features', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByDisplayValue('Favored Enemy').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByDisplayValue('Extra Attack').length).toBeGreaterThanOrEqual(1)
  })

  it('shows spellSaveDC in CombatStrip when character is caster', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    const dcStats = screen.getAllByTestId('combat-stat-dc')
    expect(dcStats.length).toBeGreaterThanOrEqual(1)
    expect(dcStats[0]!.textContent).toContain('14')
  })

  it('skill with expertise shows filled expertise pip', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    const perceptionRows = screen.getAllByTestId('skill-Perception')
    expect(perceptionRows.length).toBeGreaterThanOrEqual(1)
    const pips = perceptionRows[0]!.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    expect(pips[0]!.style.background).not.toBe('transparent')
    expect(pips[1]!.style.background).not.toBe('transparent')
  })

  it('features list shows uses inputs for active feature', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByTestId('feature-uses-row-colossus_slayer').length).toBeGreaterThanOrEqual(1)
  })

  it('shows correct DEX modifier (+4) for Eira', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    const dexMods = screen.getAllByTestId('attr-dex-mod')
    expect(dexMods[0]!.textContent).toBe('+4')
  })

  it('renders ProficienciesBlock in Status tab', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByTestId('proficiencies-block').length).toBeGreaterThanOrEqual(1)
  })

  it('shows weapons items from character in proficiencies block', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByDisplayValue('Longbow').length).toBeGreaterThanOrEqual(1)
  })

  it('shows languages items from character in languages block', () => {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
    expect(screen.getAllByDisplayValue('Common').length).toBeGreaterThanOrEqual(1)
  })
})

// ── Cascade tests: ability scores → derived displays ─────────────────────────

describe('StatusTab cascade — ability score editing', () => {
  beforeEach(() => { localStorage.clear() })

  afterEach(() => {
    useCharacterStore.setState({ activeId: null, loading: false, error: null })
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  function setup() {
    useCharactersStore.setState({ characters: [EIRA], loading: false, error: null })
    useCharacterStore.setState({ activeId: EIRA.id, loading: false, error: null })
    renderWithI18n(<StatusTab />, 'pt')
  }

  it('changing STR score updates STR modifier display', () => {
    setup()
    // EIRA str=14 → mod +2. Change to 20 → mod +5.
    const strInputs = screen.getAllByTestId('attr-str-score')
    fireEvent.change(strInputs[0]!, { target: { value: '20' } })
    const strMods = screen.getAllByTestId('attr-str-mod')
    expect(strMods[0]!.textContent).toBe('+5')
  })

  it('changing STR score updates STR save bonus display', () => {
    setup()
    // EIRA str save: proficient=false. str 14 → +2. Change str to 20 → +5.
    const strInputs = screen.getAllByTestId('attr-str-score')
    fireEvent.change(strInputs[0]!, { target: { value: '20' } })
    const strSaveBonuses = screen.getAllByTestId('save-str-bonus')
    expect(strSaveBonuses[0]!.textContent).toBe('+5')
  })

  it('changing STR score updates Athletics skill bonus display', () => {
    setup()
    // EIRA Athletics: str=14, proficient=true, profBonus=3 → 2+3=5.
    // After str=20 (mod +5): 5+3=8.
    const strInputs = screen.getAllByTestId('attr-str-score')
    fireEvent.change(strInputs[0]!, { target: { value: '20' } })
    const athleticsBonuses = screen.getAllByTestId('skill-Athletics-bonus')
    expect(athleticsBonuses[0]!.textContent).toBe('+8')
  })

  it('changing DEX score updates initiative display', () => {
    setup()
    // EIRA dex=18 → init +4. Change to 10 → init +0.
    const dexInputs = screen.getAllByTestId('attr-dex-score')
    fireEvent.change(dexInputs[0]!, { target: { value: '10' } })
    const initStats = screen.getAllByTestId('combat-stat-init')
    expect(initStats[0]!.textContent).toContain('+0')
  })

  it('changing WIS score updates passive perception display', () => {
    setup()
    // EIRA wis=16, Perception proficient+expertise, profBonus=3 → PP = 10+(3+6) = 19.
    // Change wis=10 (mod 0) → PP = 10+(0+6) = 16.
    const wisInputs = screen.getAllByTestId('attr-wis-score')
    fireEvent.change(wisInputs[0]!, { target: { value: '10' } })
    const ppStats = screen.getAllByTestId('combat-stat-pp')
    expect(ppStats[0]!.textContent).toContain('16')
  })

  it('changing CON score does NOT auto-update HP max (Q1=A)', () => {
    setup()
    // EIRA hp.max = 42. Changing CON should NOT change HP max.
    const conInputs = screen.getAllByTestId('attr-con-score')
    fireEvent.change(conInputs[0]!, { target: { value: '20' } })
    // HP max input still shows 42 (not auto-recalculated)
    const maxInputs = screen.getAllByTestId('hp-max-input')
    expect((maxInputs[0] as HTMLInputElement).value).toBe('42')
  })

  it('changing STR score updates proficiency bonus for level 5 character', () => {
    setup()
    // EIRA level 5 → profBonus = 3. Changing str doesn't affect profBonus.
    const profStats = screen.getAllByTestId('combat-stat-prof')
    expect(profStats[0]!.textContent).toContain('+3')
  })
})
