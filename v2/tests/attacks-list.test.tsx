import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Character, Attack } from '@/domain/character'
import { AttacksList } from '@/components/sheet/parts/AttacksList'

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

const RAPIER = makeAttack({
  id:         'atk_0',
  name:       'Rapier',
  baseStat:   'dex',
  bonus:      '+5',
  damage:     '1d8+2',
  damageType: 'Piercing',
  rollType:   'attack',
})

const VICIOUS_MOCKERY = makeAttack({
  id:         'atk_1',
  name:       'Vicious Mockery',
  baseStat:   'cha',
  bonus:      'DC 14',
  damage:     '2d4',
  damageType: 'Psychic',
  rollType:   'dc',
})

const BASE: Character = {
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
  attacks: [RAPIER, VICIOUS_MOCKERY],
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

describe('AttacksList', () => {
  it('renders Rapier attack row', () => {
    render(<AttacksList character={BASE} />)
    expect(screen.getByText('Rapier')).toBeDefined()
  })

  it('renders Vicious Mockery attack row', () => {
    render(<AttacksList character={BASE} />)
    expect(screen.getByText('Vicious Mockery')).toBeDefined()
  })

  it('filters out attacks with empty name', () => {
    const char = {
      ...BASE,
      attacks: [
        makeAttack({ id: 'atk_0', name: '' }),
        makeAttack({ id: 'atk_1', name: 'Shortsword', bonus: '+4' }),
      ],
    }
    render(<AttacksList character={char} />)
    expect(screen.getByText('Shortsword')).toBeDefined()
    expect(screen.queryByTestId('attack-row-atk_0')).toBeNull()
  })

  it('shows empty state when attacks array is empty', () => {
    render(<AttacksList character={{ ...BASE, attacks: [] }} />)
    expect(screen.getByText('Nenhum ataque cadastrado.')).toBeDefined()
  })

  it('shows empty state when all attack names are blank', () => {
    const char = {
      ...BASE,
      attacks: [
        makeAttack({ id: 'atk_0', name: '' }),
        makeAttack({ id: 'atk_1', name: '   ' }),
      ],
    }
    render(<AttacksList character={char} />)
    expect(screen.getByText('Nenhum ataque cadastrado.')).toBeDefined()
  })

  it('Rapier badge shows "+5"', () => {
    render(<AttacksList character={BASE} />)
    const rapierRow = screen.getByTestId('attack-row-atk_0')
    const badge = rapierRow.querySelector('span') as HTMLElement
    expect(badge.textContent).toBe('+5')
  })

  it('Rapier badge is gold variant', () => {
    render(<AttacksList character={BASE} />)
    const rapierRow = screen.getByTestId('attack-row-atk_0')
    const badge = rapierRow.querySelector('span') as HTMLElement
    // gold fg = #E8C569 → jsdom normalises to rgb(232, 197, 105)
    expect(badge.style.color).toBe('rgb(232, 197, 105)')
  })

  it('Vicious Mockery badge shows "DC 14"', () => {
    render(<AttacksList character={BASE} />)
    const vmRow = screen.getByTestId('attack-row-atk_1')
    const badge = vmRow.querySelector('span') as HTMLElement
    expect(badge.textContent).toBe('DC 14')
  })

  it('Vicious Mockery badge is purple variant', () => {
    render(<AttacksList character={BASE} />)
    const vmRow = screen.getByTestId('attack-row-atk_1')
    const badge = vmRow.querySelector('span') as HTMLElement
    // purple fg = #B5A5E8 → jsdom normalises to rgb(181, 165, 232)
    expect(badge.style.color).toBe('rgb(181, 165, 232)')
  })

  it('Rapier meta line shows "DEX · 1d8+2 Piercing"', () => {
    render(<AttacksList character={BASE} />)
    expect(screen.getByTestId('attack-meta-atk_0').textContent).toBe('DEX · 1d8+2 Piercing')
  })

  it('Vicious Mockery meta line shows "CHA · 2d4 Psychic"', () => {
    render(<AttacksList character={BASE} />)
    expect(screen.getByTestId('attack-meta-atk_1').textContent).toBe('CHA · 2d4 Psychic')
  })

  it('meta line omits damage when empty', () => {
    const char = {
      ...BASE,
      attacks: [makeAttack({ id: 'atk_0', name: 'Punch', baseStat: 'str', damage: '', damageType: '' })],
    }
    render(<AttacksList character={char} />)
    expect(screen.getByTestId('attack-meta-atk_0').textContent).toBe('STR')
  })

  it('meta line omits damage type when empty', () => {
    const char = {
      ...BASE,
      attacks: [makeAttack({ id: 'atk_0', name: 'Punch', baseStat: 'str', damage: '1d4', damageType: '' })],
    }
    render(<AttacksList character={char} />)
    expect(screen.getByTestId('attack-meta-atk_0').textContent).toBe('STR · 1d4')
  })

  it('shows "+ Adicionar" button', () => {
    render(<AttacksList character={BASE} />)
    expect(screen.getByTestId('add-attack-btn')).toBeDefined()
  })

  it('shows remove button for each attack row', () => {
    render(<AttacksList character={BASE} />)
    expect(screen.getByTestId('remove-attack-atk_0')).toBeDefined()
    expect(screen.getByTestId('remove-attack-atk_1')).toBeDefined()
  })

  it('remove button has accessible aria-label', () => {
    render(<AttacksList character={BASE} />)
    const removeBtn = screen.getByRole('button', { name: 'Remover ataque Rapier' })
    expect(removeBtn).toBeDefined()
  })
})
