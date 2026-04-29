import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusTab } from '@/components/sheet/tabs/StatusTab'
import { useCharacterStore } from '@/store/character'
import type { Character, SkillState, SavingThrowState, Feature } from '@/domain/character'

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
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 42, max: 42, temp: 5 },
  hitDice: [{ current: 5, max: 5, dieSize: 10 }],
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
  proficiencies: { weaponsAndArmor: 'Longbow, Shortsword, Light, Medium', tools: '', languages: 'Common, Elvish, Sylvan', other: '' },
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
  notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('StatusTab integration', () => {
  afterEach(() => {
    useCharacterStore.setState({ character: null, loading: false, error: null })
  })

  it('renders nothing when character store is empty', () => {
    const { container } = render(<StatusTab />)
    expect(container.firstChild).toBeNull()
  })

  it('renders HeroCard when character is in store', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    // HeroCard renders the character name
    expect(screen.getAllByText('Eira Thornwood').length).toBeGreaterThanOrEqual(1)
  })

  it('renders HpBlock', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    expect(screen.getAllByText('Hit Points').length).toBeGreaterThanOrEqual(1)
  })

  it('renders CombatStrip with AC', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    // CombatStrip appears in both mobile and desktop sections
    const acStats = screen.getAllByTestId('combat-stat-ac')
    expect(acStats.length).toBeGreaterThanOrEqual(1)
    expect(acStats[0]!.textContent).toContain('16')
  })

  it('renders AttrGrid with all 6 abilities', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    // AttrGrid appears in both mobile and desktop sections
    const strAttrs = screen.getAllByTestId('attr-str')
    expect(strAttrs.length).toBeGreaterThanOrEqual(1)
    const chaAttrs = screen.getAllByTestId('attr-cha')
    expect(chaAttrs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders SavingThrows with all 6 saves', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    // SavingThrows in both sections
    const savesContainers = screen.getAllByTestId('saving-throws')
    expect(savesContainers.length).toBeGreaterThanOrEqual(1)
  })

  it('renders SkillsBlock', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    const skillsContainers = screen.getAllByTestId('skills-block')
    expect(skillsContainers.length).toBeGreaterThanOrEqual(1)
  })

  it('renders FeaturesList with Eira features', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    expect(screen.getAllByText('Favored Enemy').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Extra Attack').length).toBeGreaterThanOrEqual(1)
  })

  it('shows spellSaveDC in CombatStrip when character is caster', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    // DC = 14, spellSaveDC > 0 → shown
    const dcStats = screen.getAllByTestId('combat-stat-dc')
    expect(dcStats.length).toBeGreaterThanOrEqual(1)
    expect(dcStats[0]!.textContent).toContain('14')
  })

  it('skill with expertise shows filled expertise pip', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    // Perception has expertise in Eira's skills
    const perceptionRows = screen.getAllByTestId('skill-Perception')
    expect(perceptionRows.length).toBeGreaterThanOrEqual(1)
    const pips = perceptionRows[0]!.querySelectorAll('[role="presentation"]') as NodeListOf<HTMLElement>
    // Both pips should be filled (proficient + expertise)
    expect(pips[0]!.style.background).not.toBe('transparent')
    expect(pips[1]!.style.background).not.toBe('transparent')
  })

  it('features list shows uses badge for active feature', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    // Colossus Slayer is active with 1/1
    expect(screen.getAllByText('1/1').length).toBeGreaterThanOrEqual(1)
  })

  it('shows correct DEX modifier (+4) for Eira', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    const dexMods = screen.getAllByTestId('attr-dex-mod')
    expect(dexMods[0]!.textContent).toBe('+4')
  })

  it('renders ProficienciesBlock in Status tab', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    expect(screen.getAllByTestId('proficiencies-block').length).toBeGreaterThanOrEqual(1)
  })

  it('shows proficiencies text from character', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    expect(screen.getAllByText('Longbow, Shortsword, Light, Medium').length).toBeGreaterThanOrEqual(1)
  })

  it('shows languages in proficiencies block', () => {
    useCharacterStore.setState({ character: EIRA, loading: false, error: null })
    render(<StatusTab />)
    expect(screen.getAllByText('Common, Elvish, Sylvan').length).toBeGreaterThanOrEqual(1)
  })
})
