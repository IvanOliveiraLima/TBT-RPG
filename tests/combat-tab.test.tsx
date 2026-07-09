import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { CombatTab } from '@/components/sheet/tabs/CombatTab'
import { useCharacterStore } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import type { Character, Attack } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

vi.mock('@/data/db', () => ({
  listCharacters:  vi.fn().mockResolvedValue([]),
  saveCharacter:   vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
}))

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
  experience: 6500,
  abilities: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
  proficiencyBonus: 3,
  hp: { current: 35, max: 35, temp: 0 },
  hitDice: [{ className: 'Bard', current: 5, max: 5, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14,
  initiative: 2,
  speed: 30,
  passivePerception: 13,
  spellSaveDC: 15,
  inspiration: false,
  savingThrows: [],
  skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [
    makeAttack({ id: 'atk_0', name: 'Rapier', baseStat: 'dex', bonus: '+5', damage: '1d8+2', damageType: 'Piercing', rollType: 'attack' }),
    makeAttack({ id: 'atk_1', name: 'Vicious Mockery', baseStat: 'cha', bonus: 'DC 14', damage: '2d4', damageType: 'Psychic', rollType: 'dc' }),
  ],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: [],
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  spells: [],
  spellSlots: {},
  spellcastingAbility: '',
  spellcastingClass: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('CombatTab integration', () => {
  beforeEach(() => { localStorage.clear() })

  afterEach(() => {
    useCharacterStore.setState({ activeId: null, loading: false, error: null })
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('renders nothing when character store is empty', () => {
    const { container } = renderWithI18n(<CombatTab />, 'pt')
    expect(container.firstChild).toBeNull()
  })

  it('renders CombatStrip when character is in store', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const strips = screen.getAllByTestId('combat-strip')
    expect(strips.length).toBeGreaterThanOrEqual(1)
  })

  it('renders AttacksList when character is in store', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const lists = screen.getAllByTestId('attacks-list')
    expect(lists.length).toBeGreaterThanOrEqual(1)
  })

  it('CombatStrip shows correct AC value', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const acStats = screen.getAllByTestId('combat-stat-ac')
    const acInput = acStats[0]!.querySelector('input') as HTMLInputElement | null
    const acValue = acInput ? acInput.value : acStats[0]!.textContent
    expect(acValue).toContain('14')
  })

  it('CombatStrip shows correct initiative', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const initStats = screen.getAllByTestId('combat-stat-init')
    expect(initStats[0]!.textContent).toContain('+2')
  })

  it('CombatStrip shows DC for spellcaster', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const dcStats = screen.getAllByTestId('combat-stat-dc')
    expect(dcStats[0]!.textContent).toContain('15')
  })

  it('renders both Rapier and Vicious Mockery in AttacksList', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    expect(screen.getAllByText('Rapier').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Vicious Mockery').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty attack state for character with no attacks', () => {
    const KAEL_NO_ATTACKS = { ...KAEL, attacks: [] }
    useCharactersStore.setState({ characters: [KAEL_NO_ATTACKS], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL_NO_ATTACKS.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const emptyStates = screen.getAllByTestId('attacks-empty-state')
    expect(emptyStates.length).toBeGreaterThanOrEqual(1)
  })

  it('shows HpBlock on combat tab', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const hpInputs = screen.getAllByTestId('hp-inputs')
    expect(hpInputs.length).toBeGreaterThanOrEqual(1)
  })

  it('HpBlock on combat tab shows current HP value', () => {
    useCharactersStore.setState({ characters: [KAEL], loading: false, error: null })
    useCharacterStore.setState({ activeId: KAEL.id, loading: false, error: null })
    renderWithI18n(<CombatTab />, 'pt')
    const currentInputs = screen.getAllByTestId('hp-current-input') as HTMLInputElement[]
    expect(currentInputs[0]!.value).toBe('35')
  })
})
