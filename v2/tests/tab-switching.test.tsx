import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SheetLayout } from '@/components/sheet/SheetLayout'
import type { TabKey } from '@/components/sheet/types'
import { StatusTab } from '@/components/sheet/tabs/StatusTab'
import { useCharacterStore } from '@/store/character'
import { CombatTab } from '@/components/sheet/tabs/CombatTab'
import { SpellsTab } from '@/components/sheet/tabs/SpellsTab'
import { InventoryTab } from '@/components/sheet/tabs/InventoryTab'
import { LoreTab } from '@/components/sheet/tabs/LoreTab'
import { NotesTab } from '@/components/sheet/tabs/NotesTab'
import type { Character } from '@/domain/character'

const MOCK_CHARACTER: Character = {
  id: 'char_tab_test',
  name: 'Mestre Kanaan',
  race: 'Humano',
  background: 'Hermit',
  alignment: 'Neutro e Bom',
  classes: [{ name: 'Druid', level: 7, hitDie: 8 }],
  totalLevel: 7,
  experience: 23000,
  abilities: { str: 8, dex: 12, con: 14, int: 14, wis: 20, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 56, max: 56, temp: 0 },
  hitDice: [{ current: 7, max: 7, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 1, speed: 30,
  passivePerception: 18, spellSaveDC: 16, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: '', armor: '', tools: '', languages: '', other: '' },
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 30, ep: 0, sp: 10, cp: 5 },
  features: [],
  backstory: 'Raised in the wilderness',
  personality: { traits: 'Calm', ideals: 'Balance', bonds: 'The forest', flaws: 'Secretive' },
  allies: 'Circle of the Moon', notes: '',
  images: {},
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

function TabContent({ tabKey }: { tabKey: TabKey }) {
  switch (tabKey) {
    case 'status':  return <StatusTab />
    case 'combat':  return <CombatTab />
    case 'spells':  return <SpellsTab />
    case 'inv':     return <InventoryTab />
    case 'lore':    return <LoreTab />
    case 'notes':   return <NotesTab />
  }
}

function TabSwitcher() {
  const [activeTab, setActiveTab] = useState<TabKey>('status')
  return (
    <MemoryRouter>
      <SheetLayout
        character={MOCK_CHARACTER}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <TabContent tabKey={activeTab} />
      </SheetLayout>
    </MemoryRouter>
  )
}

describe('tab switching', () => {
  afterEach(() => {
    useCharacterStore.setState({ character: null, loading: false, error: null })
  })

  it('starts on the Status tab and renders HpBlock when store is populated', () => {
    useCharacterStore.setState({ character: MOCK_CHARACTER, loading: false, error: null })
    render(<TabSwitcher />)
    // HpBlock renders "Hit Points" label
    expect(screen.getAllByText('Hit Points').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking Combate in the bottom tab bar shows Combat placeholder', () => {
    render(<TabSwitcher />)
    // Mobile bottom tab bar - find "Combate" buttons and click the first
    const combateBtns = screen.getAllByText('Combate')
    fireEvent.click(combateBtns[0]!)
    expect(screen.getAllByText('Combate & Skills').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking Magias shows Spells placeholder', () => {
    render(<TabSwitcher />)
    const magiasBtns = screen.getAllByText('Magias')
    fireEvent.click(magiasBtns[0]!)
    expect(screen.getAllByText('Magias').length).toBeGreaterThanOrEqual(1)
    // Spell-specific sub-text confirms the tab rendered
    expect(screen.getAllByText(/Slots, magias conhecidas/i).length).toBeGreaterThanOrEqual(1)
  })

  it('clicking Inv shows Inventory placeholder', () => {
    render(<TabSwitcher />)
    const invBtns = screen.getAllByText('Inv')
    fireEvent.click(invBtns[0]!)
    expect(screen.getAllByText('Inventário').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking Lore shows Lore placeholder', () => {
    render(<TabSwitcher />)
    const loreBtns = screen.getAllByText('Lore')
    fireEvent.click(loreBtns[0]!)
    expect(screen.getAllByText('Lore & História').length).toBeGreaterThanOrEqual(1)
  })

  it('clicking Notas in desktop sidebar switches to Notes placeholder', () => {
    render(<TabSwitcher />)
    // Desktop sidebar has "Notas" nav button
    const notasBtns = screen.getAllByText('Notas')
    fireEvent.click(notasBtns[0]!)
    expect(screen.getAllByText(/Disponível apenas no desktop/i).length).toBeGreaterThanOrEqual(1)
  })

  it('character name is visible in the rendered shell', () => {
    render(<TabSwitcher />)
    expect(screen.getAllByText('Mestre Kanaan').length).toBeGreaterThanOrEqual(1)
  })

  it('switching tabs back to Status shows HpBlock content again', () => {
    useCharacterStore.setState({ character: MOCK_CHARACTER, loading: false, error: null })
    render(<TabSwitcher />)
    // Go to Combat
    const combateBtns = screen.getAllByText('Combate')
    fireEvent.click(combateBtns[0]!)
    // Then go back to Status via bottom tab bar
    const statusBtns = screen.getAllByText('Status')
    fireEvent.click(statusBtns[0]!)
    // HpBlock is visible again
    expect(screen.getAllByText('Hit Points').length).toBeGreaterThanOrEqual(1)
  })
})
