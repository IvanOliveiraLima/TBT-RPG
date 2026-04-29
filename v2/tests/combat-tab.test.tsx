import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CombatTab } from '@/components/sheet/tabs/CombatTab'
import { useCharacterStore } from '@/store/character'
import type { Character, Attack } from '@/domain/character'

function makeAttack(overrides: Pick<Attack, 'id' | 'name'> & Partial<Attack>): Attack {
  return {
    baseStat:   'str',
    bonus:      '+0',
    damage:     '',
    damageType: '',
    rollType:   'attack',
    proficient: false,
    ...overrides,
  }
}

const KAEL: Character = {
  id: 'kael_01',
  name: 'Kael Brightweave',
  race: 'Half-Elf',
  background: 'Entertainer',
  alignment: 'Chaotic Good',
  classes: [{ name: 'Bard', level: 5, hitDie: 8 }],
  totalLevel: 5,
  experience: 6500,
  abilities: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
  proficiencyBonus: 3,
  hp: { current: 35, max: 35, temp: 0 },
  hitDice: [{ current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14,
  initiative: 2,
  speed: 30,
  passivePerception: 13,
  spellSaveDC: 15,
  inspiration: false,
  savingThrows: [],
  skills: [],
  proficiencies: { weaponsAndArmor: '', tools: '', languages: '', other: '' },
  attacks: [
    makeAttack({ id: 'atk_0', name: 'Rapier', baseStat: 'dex', bonus: '+5', damage: '1d8+2', damageType: 'Piercing', rollType: 'attack' }),
    makeAttack({ id: 'atk_1', name: 'Vicious Mockery', baseStat: 'cha', bonus: 'DC 14', damage: '2d4', damageType: 'Psychic', rollType: 'dc' }),
  ],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('CombatTab integration', () => {
  afterEach(() => {
    useCharacterStore.setState({ character: null, loading: false, error: null })
  })

  it('renders nothing when character store is empty', () => {
    const { container } = render(<CombatTab />)
    expect(container.firstChild).toBeNull()
  })

  it('renders CombatStrip when character is in store', () => {
    useCharacterStore.setState({ character: KAEL, loading: false, error: null })
    render(<CombatTab />)
    const strips = screen.getAllByTestId('combat-strip')
    expect(strips.length).toBeGreaterThanOrEqual(1)
  })

  it('renders AttacksList when character is in store', () => {
    useCharacterStore.setState({ character: KAEL, loading: false, error: null })
    render(<CombatTab />)
    const lists = screen.getAllByTestId('attacks-list')
    expect(lists.length).toBeGreaterThanOrEqual(1)
  })

  it('CombatStrip shows correct AC value', () => {
    useCharacterStore.setState({ character: KAEL, loading: false, error: null })
    render(<CombatTab />)
    const acStats = screen.getAllByTestId('combat-stat-ac')
    expect(acStats[0]!.textContent).toContain('14')
  })

  it('CombatStrip shows correct initiative', () => {
    useCharacterStore.setState({ character: KAEL, loading: false, error: null })
    render(<CombatTab />)
    const initStats = screen.getAllByTestId('combat-stat-init')
    expect(initStats[0]!.textContent).toContain('+2')
  })

  it('CombatStrip shows DC for spellcaster', () => {
    useCharacterStore.setState({ character: KAEL, loading: false, error: null })
    render(<CombatTab />)
    const dcStats = screen.getAllByTestId('combat-stat-dc')
    expect(dcStats[0]!.textContent).toContain('15')
  })

  it('renders both Rapier and Vicious Mockery in AttacksList', () => {
    useCharacterStore.setState({ character: KAEL, loading: false, error: null })
    render(<CombatTab />)
    expect(screen.getAllByText('Rapier').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Vicious Mockery').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty attack state for character with no attacks', () => {
    useCharacterStore.setState({ character: { ...KAEL, attacks: [] }, loading: false, error: null })
    render(<CombatTab />)
    const emptyStates = screen.getAllByTestId('attacks-empty-state')
    expect(emptyStates.length).toBeGreaterThanOrEqual(1)
  })
})
