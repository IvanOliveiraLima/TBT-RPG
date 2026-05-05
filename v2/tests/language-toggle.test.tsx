import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/sheet/Sidebar'
import { MobileShell } from '@/components/sheet/MobileShell'
import type { Character } from '@/domain/character'
import { renderWithI18n } from './helpers/render'

const CHAR: Character = {
  id: 'toggle_test',
  name: 'Eira Thornwood',
  race: 'Wood Elf',
  background: 'Outlander',
  alignment: 'Neutral Good',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  totalLevel: 5,
  experience: 6500,
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
  notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

function SidebarWrapper() {
  return (
    <MemoryRouter>
      <Sidebar character={CHAR} activeTab="status" onTabChange={() => undefined} />
    </MemoryRouter>
  )
}

function MobileWrapper() {
  return (
    <MemoryRouter>
      <MobileShell character={CHAR} activeTab="status" onTabChange={() => undefined}>
        <div>content</div>
      </MobileShell>
    </MemoryRouter>
  )
}

describe('Sidebar language toggle', () => {
  beforeEach(() => { localStorage.clear() })

  it('marks PT as active (aria-pressed=true) when lang is PT', () => {
    renderWithI18n(<SidebarWrapper />, 'pt')
    const ptBtn = screen.getByRole('button', { name: 'PT' })
    const enBtn = screen.getByRole('button', { name: 'EN' })
    expect(ptBtn.getAttribute('aria-pressed')).toBe('true')
    expect(enBtn.getAttribute('aria-pressed')).toBe('false')
  })

  it('marks EN as active (aria-pressed=true) when lang is EN', () => {
    renderWithI18n(<SidebarWrapper />, 'en')
    const ptBtn = screen.getByRole('button', { name: 'PT' })
    const enBtn = screen.getByRole('button', { name: 'EN' })
    expect(ptBtn.getAttribute('aria-pressed')).toBe('false')
    expect(enBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('switches UI to EN and persists to localStorage when clicking EN', async () => {
    const user = userEvent.setup()
    renderWithI18n(<SidebarWrapper />, 'pt')
    expect(screen.getAllByText('Atributos').length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getAllByText('Attributes').length).toBeGreaterThanOrEqual(1)
    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('en')
  })

  it('switches UI to PT and persists to localStorage when clicking PT', async () => {
    const user = userEvent.setup()
    renderWithI18n(<SidebarWrapper />, 'en')
    expect(screen.getAllByText('Attributes').length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('button', { name: 'PT' }))

    expect(screen.getAllByText('Atributos').length).toBeGreaterThanOrEqual(1)
    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('pt')
  })

  it('does not break when clicking the already-active button', async () => {
    const user = userEvent.setup()
    renderWithI18n(<SidebarWrapper />, 'pt')

    await user.click(screen.getByRole('button', { name: 'PT' }))

    expect(screen.getByRole('button', { name: 'PT' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText('Atributos').length).toBeGreaterThanOrEqual(1)
  })
})

describe('MobileShell language toggle', () => {
  beforeEach(() => { localStorage.clear() })

  it('marks PT as active in drawer when lang is PT', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MobileWrapper />, 'pt')

    await user.click(screen.getByLabelText('Abrir menu'))

    const ptBtn = screen.getByRole('button', { name: 'PT' })
    expect(ptBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('switches language to EN from drawer and persists', async () => {
    const user = userEvent.setup()
    renderWithI18n(<MobileWrapper />, 'pt')

    await user.click(screen.getByLabelText('Abrir menu'))
    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('en')
    expect(screen.getByRole('button', { name: 'EN' }).getAttribute('aria-pressed')).toBe('true')
  })
})
