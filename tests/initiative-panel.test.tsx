/**
 * CampaignInitiativePanel — role-based rendering tests
 *
 * Covers:
 *  - Empty state shown when no combatants
 *  - Owner sees start/end button, add-monster button, quick-add buttons, remove buttons
 *  - Member sees none of those controls
 *  - Combatant rows rendered with initiative value
 *  - Active combatant highlighted (gold ▶ indicator)
 *  - PT / EN titles
 */
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignInitiativePanel } from '@/components/campaigns/CampaignInitiativePanel'
import type { InitiativeTracker } from '@/domain/initiative'

// Silence jsdom "not implemented" warnings for number input steppers
vi.stubGlobal('window', { ...window, HTMLInputElement: { ...window.HTMLInputElement } })

function makeTracker(overrides: Partial<InitiativeTracker> = {}): InitiativeTracker {
  return {
    combatants:        [],
    activeCombatantId: null,
    round:             1,
    active:            false,
    ...overrides,
  }
}

const noOp = vi.fn()

describe('CampaignInitiativePanel — empty state', () => {
  it('shows empty message in PT', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'pt',
    )
    expect(screen.getByTestId('initiative-empty')).toBeDefined()
    expect(screen.getByTestId('initiative-empty').textContent).toContain('Nenhum combatente ainda')
  })

  it('shows empty message in EN', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('initiative-empty').textContent).toContain('No combatants yet')
  })
})

describe('CampaignInitiativePanel — owner controls', () => {
  it('shows start combat button when inactive', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('initiative-start-btn')).toBeDefined()
  })

  it('shows end combat button when active', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ active: true, combatants: [{ id: 'a', name: 'Goblin', initiative: 10 }], activeCombatantId: 'a' })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('initiative-end-btn')).toBeDefined()
  })

  it('shows add-monster button', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('show-monster-form')).toBeDefined()
  })

  it('shows quick-add buttons for linked chars', () => {
    const linkedChars = [
      { characterId: 'char1', name: 'Aragorn' },
      { characterId: 'char2', name: 'Gimli' },
    ]
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={linkedChars} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('quick-add-char1')).toBeDefined()
    expect(screen.getByTestId('quick-add-char2')).toBeDefined()
  })

  it('shows remove button for each combatant', () => {
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Fighter', initiative: 15 }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('remove-combatant-c1')).toBeDefined()
  })

  it('shows prev/next buttons when active and combatants present', () => {
    const tracker = makeTracker({
      active:            true,
      combatants:        [{ id: 'a', name: 'Fighter', initiative: 15 }],
      activeCombatantId: 'a',
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('initiative-prev')).toBeDefined()
    expect(screen.getByTestId('initiative-next')).toBeDefined()
  })
})

describe('CampaignInitiativePanel — member (read-only)', () => {
  const trackerWithCombatant = makeTracker({
    combatants: [{ id: 'c1', name: 'Fighter', initiative: 15 }],
  })
  const linkedChars = [{ characterId: 'char1', name: 'Aragorn' }]

  it('does NOT show start/end button', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={trackerWithCombatant} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('initiative-start-btn')).toBeNull()
    expect(screen.queryByTestId('initiative-end-btn')).toBeNull()
  })

  it('does NOT show add-monster button', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={trackerWithCombatant} linkedChars={linkedChars} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('show-monster-form')).toBeNull()
  })

  it('does NOT show quick-add buttons', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={makeTracker()} linkedChars={linkedChars} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('quick-add-char1')).toBeNull()
  })

  it('does NOT show remove buttons', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={trackerWithCombatant} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('remove-combatant-c1')).toBeNull()
  })

  it('does NOT show prev/next buttons even when active', () => {
    const tracker = makeTracker({
      active:            true,
      combatants:        [{ id: 'a', name: 'Fighter', initiative: 15 }],
      activeCombatantId: 'a',
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('initiative-prev')).toBeNull()
    expect(screen.queryByTestId('initiative-next')).toBeNull()
  })

  it('renders combatant row with initiative value', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={trackerWithCombatant} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('combatant-row-c1')).toBeDefined()
    expect(screen.getByTestId('initiative-value-c1').textContent).toContain('15')
  })
})

describe('CampaignInitiativePanel — title i18n', () => {
  it('shows PT title "Combate" when inactive', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'pt',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Combate')
  })

  it('shows EN title "Combat" when inactive', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Combat')
  })

  it('shows round label when active (PT)', () => {
    const tracker = makeTracker({
      active: true,
      round:  3,
      combatants: [{ id: 'a', name: 'F', initiative: 10 }],
      activeCombatantId: 'a',
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'pt',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Rodada 3')
  })
})

// ── auto-initiative toggle ────────────────────────────────────────────────────

describe('CampaignInitiativePanel — auto-initiative toggle', () => {
  it('renders toggle for owner when onToggleAutoInitiative is provided', () => {
    const onToggle = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={onToggle}
      />,
      'en',
    )
    const toggle = screen.getByTestId('auto-initiative-toggle') as HTMLInputElement
    expect(toggle).toBeDefined()
    expect(toggle.checked).toBe(false)
  })

  it('renders toggle checked when autoInitiative=true', () => {
    const onToggle = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={true}
        onToggleAutoInitiative={onToggle}
      />,
      'en',
    )
    const toggle = screen.getByTestId('auto-initiative-toggle') as HTMLInputElement
    expect(toggle.checked).toBe(true)
  })

  it('does NOT render toggle when onToggleAutoInitiative is absent (member view)', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.queryByTestId('auto-initiative-toggle')).toBeNull()
  })

  it('does NOT render toggle for non-owner even when callback provided', () => {
    const onToggle = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={onToggle}
      />,
      'en',
    )
    expect(screen.queryByTestId('auto-initiative-toggle')).toBeNull()
  })

  it('calls onToggleAutoInitiative(true) when checkbox clicked from false', () => {
    const onToggle = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={onToggle}
      />,
      'en',
    )
    fireEvent.click(screen.getByTestId('auto-initiative-toggle'))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('calls onToggleAutoInitiative(false) when checkbox clicked from true', () => {
    const onToggle = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={true}
        onToggleAutoInitiative={onToggle}
      />,
      'en',
    )
    fireEvent.click(screen.getByTestId('auto-initiative-toggle'))
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('shows "Auto initiative" label in EN', () => {
    const onToggle = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={onToggle}
      />,
      'en',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Auto initiative')
  })

  it('shows "Auto-iniciativa" label in PT', () => {
    const onToggle = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={onToggle}
      />,
      'pt',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Auto-iniciativa')
  })
})

// ── HP controls ───────────────────────────────────────────────────────────────

describe('CampaignInitiativePanel — HP controls', () => {
  it('shows HP input in the monster form', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    expect(screen.getByTestId('monster-hp-input')).toBeDefined()
  })

  it('combatant without hp: no HP control in row', () => {
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5 }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('combatant-hp-c1')).toBeNull()
    expect(screen.queryByTestId('hp-minus-c1')).toBeNull()
  })

  it('combatant with hp: master sees HP control', () => {
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 8, max: 15 } }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('combatant-hp-c1')).toBeDefined()
    expect(screen.getByTestId('hp-minus-c1')).toBeDefined()
    expect(screen.getByTestId('hp-plus-c1')).toBeDefined()
  })

  it('player (isMaster=false) does NOT see HP controls', () => {
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 8, max: 15 } }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('combatant-hp-c1')).toBeNull()
    expect(screen.queryByTestId('hp-minus-c1')).toBeNull()
    expect(screen.queryByTestId('hp-plus-c1')).toBeNull()
  })

  it('HP − button calls onUpdate with decremented current', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 8, max: 15 } }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('hp-minus-c1'))
    expect(onUpdate).toHaveBeenCalledOnce()
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    expect(updated.combatants[0]!.hp).toEqual({ current: 7, max: 15 })
  })

  it('HP − button clamps at 0', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 0, max: 15 } }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('hp-minus-c1'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    expect(updated.combatants[0]!.hp!.current).toBe(0)
  })

  it('HP + button calls onUpdate with incremented current', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 8, max: 15 } }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('hp-plus-c1'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    expect(updated.combatants[0]!.hp).toEqual({ current: 9, max: 15 })
  })

  it('HP + button clamps at max', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 15, max: 15 } }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('hp-plus-c1'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    expect(updated.combatants[0]!.hp!.current).toBe(15)
  })

  it('adding monster with HP > 0 creates combatant with hp field', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Troll' } })
    fireEvent.change(screen.getByTestId('monster-hp-input'), { target: { value: '30' } })
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    const added = updated.combatants.find(c => c.name === 'Troll')
    expect(added?.hp).toEqual({ current: 30, max: 30 })
  })

  it('adding monster without HP leaves hp undefined', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Rat' } })
    // leave HP empty
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    const added = updated.combatants.find(c => c.name === 'Rat')
    expect(added?.hp).toBeUndefined()
  })
})

// ── Auto-numbering ────────────────────────────────────────────────────────────

describe('CampaignInitiativePanel — auto-numbering', () => {
  it('first monster with unique name: name unchanged', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Orc' } })
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    expect(updated.combatants.map(c => c.name)).toContain('Orc')
  })

  it('second same name: existing renamed to "X 1", new gets "X 2"', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5 }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Goblin' } })
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    const names = updated.combatants.map(c => c.name)
    expect(names).toContain('Goblin 1')
    expect(names).toContain('Goblin 2')
    expect(names).not.toContain('Goblin')
  })

  it('third same name: gets "X 3", no rename', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [
        { id: 'c1', name: 'Goblin 1', initiative: 5 },
        { id: 'c2', name: 'Goblin 2', initiative: 3 },
      ],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Goblin' } })
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    const names = updated.combatants.map(c => c.name)
    expect(names).toContain('Goblin 3')
    expect(names).toContain('Goblin 1')
    expect(names).toContain('Goblin 2')
  })

  it('different base names do not collide', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Orc', initiative: 5 }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Goblin' } })
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    const names = updated.combatants.map(c => c.name)
    expect(names).toContain('Orc')    // unchanged
    expect(names).toContain('Goblin') // added as-is
    expect(names).not.toContain('Orc 1')
    expect(names).not.toContain('Goblin 1')
  })

  it('"Goblin" and "Goblina" do not collide (anchored regex)', () => {
    const onUpdate = vi.fn()
    const tracker = makeTracker({
      combatants: [{ id: 'c1', name: 'Goblin', initiative: 5 }],
    })
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={tracker} linkedChars={[]} onUpdate={onUpdate} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Goblina' } })
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0] as InitiativeTracker
    const names = updated.combatants.map(c => c.name)
    expect(names).toContain('Goblin')  // unchanged
    expect(names).toContain('Goblina') // added as-is, no numbering
    expect(names).not.toContain('Goblin 1')
  })
})

// ── Monster form field labels ─────────────────────────────────────────────────

describe('CampaignInitiativePanel — monster form field labels', () => {
  it('shows Name, Init and HP labels in EN', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    expect(screen.getByTestId('monster-name-label').textContent).toBe('Name')
    expect(screen.getByTestId('monster-init-label').textContent).toBe('Init')
    expect(screen.getByTestId('monster-hp-label').textContent).toBe('HP')
  })

  it('shows Nome, Init and PV labels in PT', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'pt',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    expect(screen.getByTestId('monster-name-label').textContent).toBe('Nome')
    expect(screen.getByTestId('monster-init-label').textContent).toBe('Init')
    expect(screen.getByTestId('monster-hp-label').textContent).toBe('PV')
  })
})

// ── Column header ─────────────────────────────────────────────────────────────

describe('CampaignInitiativePanel — column header', () => {
  const combatant = { id: 'c1', name: 'Orc', initiative: 8 }

  it('column header absent when list is empty', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('combat-columns-header')).toBeNull()
  })

  it('column header present when 1+ combatants (owner)', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('combat-columns-header')).toBeDefined()
  })

  it('column header present for member with 1+ combatants', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('combat-columns-header')).toBeDefined()
  })

  it('HP column shown in header for owner (EN)', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('combat-columns-header').textContent).toContain('HP')
  })

  it('HP column NOT shown in header for member', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    // Header exists but should not include "HP"
    expect(screen.getByTestId('combat-columns-header').textContent).not.toContain('HP')
  })

  it('HP column shows "PV" for owner in PT', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'pt',
    )
    expect(screen.getByTestId('combat-columns-header').textContent).toContain('PV')
  })

  it('HP column appears before INIC in header (owner)', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    const header = screen.getByTestId('combat-columns-header')
    const text = header.textContent ?? ''
    expect(text.indexOf('HP')).toBeLessThan(text.indexOf('Init'))
  })
})

// ── Column alignment — HP placeholder ────────────────────────────────────────

describe('CampaignInitiativePanel — HP placeholder alignment', () => {
  it('master: combatant without HP gets a placeholder (no hp-minus)', () => {
    const c = { id: 'c1', name: 'Linked', initiative: 12 }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [c] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('hp-placeholder-c1')).toBeDefined()
    expect(screen.queryByTestId('hp-minus-c1')).toBeNull()
  })

  it('master: combatant with HP gets controls, not placeholder', () => {
    const c = { id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 8, max: 10 } }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [c] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('hp-minus-c1')).toBeDefined()
    expect(screen.queryByTestId('hp-placeholder-c1')).toBeNull()
  })

  it('member: no HP placeholder rendered (column absent)', () => {
    const c = { id: 'c1', name: 'Goblin', initiative: 5, hp: { current: 8, max: 10 } }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker({ combatants: [c] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.queryByTestId('hp-placeholder-c1')).toBeNull()
    expect(screen.queryByTestId('hp-minus-c1')).toBeNull()
  })
})

// ── Linked character HP — read-only display ───────────────────────────────────

describe('CampaignInitiativePanel — linked character HP (read-only)', () => {
  const linkedCharId = 'char-1'
  const combatant = { id: 'c1', name: 'Aragorn', initiative: 15, linkedCharacterId: linkedCharId }
  const linkedCharWithHp = { characterId: linkedCharId, name: 'Aragorn', hp: { current: 28, max: 40, temp: 0 } }

  it('shows read-only HP for linked combatant with hp data', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[linkedCharWithHp]}
        onUpdate={noOp}
      />,
      'en',
    )
    const cell = screen.getByTestId('combatant-hp-linked-c1')
    expect(cell).toBeDefined()
    expect(cell.textContent).toContain('28')
    expect(cell.textContent).toContain('40')
  })

  it('linked combatant shows no −/+ edit buttons', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[linkedCharWithHp]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.queryByTestId('hp-minus-c1')).toBeNull()
    expect(screen.queryByTestId('hp-plus-c1')).toBeNull()
  })

  it('monster (c.hp set) still shows editable controls — not the linked display (regression)', () => {
    const monster = { id: 'c2', name: 'Goblin', initiative: 5, hp: { current: 8, max: 15 } }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [monster] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('hp-minus-c2')).toBeDefined()
    expect(screen.getByTestId('hp-plus-c2')).toBeDefined()
    expect(screen.queryByTestId('combatant-hp-linked-c2')).toBeNull()
  })

  it('temp > 0 shows a +N badge next to the read-only HP', () => {
    const linkedCharWithTemp = { characterId: linkedCharId, name: 'Aragorn', hp: { current: 28, max: 40, temp: 5 } }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[linkedCharWithTemp]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('combatant-hp-temp-c1').textContent).toContain('+5')
  })

  it('temp === 0 does not render a temp badge', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[linkedCharWithHp]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.queryByTestId('combatant-hp-temp-c1')).toBeNull()
  })

  it('linked combatant with no hp in linkedChars gets a placeholder (data not loaded yet)', () => {
    const linkedCharNoHp = { characterId: linkedCharId, name: 'Aragorn' }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[linkedCharNoHp]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('hp-placeholder-c1')).toBeDefined()
    expect(screen.queryByTestId('combatant-hp-linked-c1')).toBeNull()
  })

  it('linked combatant absent from linkedChars list gets a placeholder', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.getByTestId('hp-placeholder-c1')).toBeDefined()
    expect(screen.queryByTestId('combatant-hp-linked-c1')).toBeNull()
  })

  it('member (isMaster=false) sees no HP column for a linked combatant', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker({ combatants: [combatant] })}
        linkedChars={[linkedCharWithHp]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.queryByTestId('combatant-hp-linked-c1')).toBeNull()
    expect(screen.queryByTestId('hp-placeholder-c1')).toBeNull()
  })
})

// ── Token link ────────────────────────────────────────────────────────────────

const TOKEN_LIST = [
  { id: 'tok-1', label: 'Goblin 1' },
  { id: 'tok-2', label: 'Goblin 2' },
]

const LINKED_COMBATANT = { id: 'c-link', name: 'Goblin 1', initiative: 5, tokenId: 'tok-1' }

describe('CampaignInitiativePanel — monster form token select', () => {
  it('token select not rendered when tokens prop is absent', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    expect(screen.queryByTestId('monster-token-select')).toBeNull()
  })

  it('token select not rendered when tokens list is empty', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={[]} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    expect(screen.queryByTestId('monster-token-select')).toBeNull()
  })

  it('token select lists available (unlinked) tokens', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={TOKEN_LIST} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    const select = screen.getByTestId('monster-token-select') as HTMLSelectElement
    const options = Array.from(select.options).map(o => o.value)
    expect(options).toContain('tok-1')
    expect(options).toContain('tok-2')
  })

  it('already-linked token is excluded from the select', () => {
    // tok-1 already linked to LINKED_COMBATANT
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [LINKED_COMBATANT] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
      />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    const select = screen.getByTestId('monster-token-select') as HTMLSelectElement
    const options = Array.from(select.options).map(o => o.value)
    expect(options).not.toContain('tok-1')
    expect(options).toContain('tok-2')
  })

  it('selecting a token pre-fills name when name field is empty', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={TOKEN_LIST} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-token-select'), { target: { value: 'tok-2' } })
    const nameInput = screen.getByTestId('monster-name-input') as HTMLInputElement
    expect(nameInput.value).toBe('Goblin 2')
  })

  it('selecting a token does NOT overwrite a name already typed', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={TOKEN_LIST} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-name-input'), { target: { value: 'Custom Name' } })
    fireEvent.change(screen.getByTestId('monster-token-select'), { target: { value: 'tok-1' } })
    const nameInput = screen.getByTestId('monster-name-input') as HTMLInputElement
    expect(nameInput.value).toBe('Custom Name')
  })

  it('adding a monster saves tokenId on the new combatant', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={onUpdate} tokens={TOKEN_LIST} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('show-monster-form'))
    fireEvent.change(screen.getByTestId('monster-token-select'), { target: { value: 'tok-1' } })
    // name was pre-filled; submit
    fireEvent.click(screen.getByTestId('monster-add-btn'))
    const updated = onUpdate.mock.calls[0]![0]
    const added = updated.combatants.at(-1)
    expect(added.tokenId).toBe('tok-1')
  })
})

// ── Quick-add creatures ───────────────────────────────────────────────────────

const CREATURE_TOKENS = [
  { id: 'tok-g1', label: 'Goblin 1', hpMax: 7 },
  { id: 'tok-g2', label: 'Goblin 2', hpMax: 7 },
]

describe('CampaignInitiativePanel — quick-add creatures', () => {
  it('quick-add section is hidden when no tokens prop', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('quick-add-creatures-section')).toBeNull()
  })

  it('quick-add section is hidden when tokens list is empty', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={[]} />,
      'en',
    )
    expect(screen.queryByTestId('quick-add-creatures-section')).toBeNull()
  })

  it('quick-add section is hidden when all tokens are already linked to combatants', () => {
    const alreadyLinked = [
      { id: 'c1', name: 'Goblin 1', initiative: 0, tokenId: 'tok-g1' },
      { id: 'c2', name: 'Goblin 2', initiative: 0, tokenId: 'tok-g2' },
    ]
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: alreadyLinked })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={CREATURE_TOKENS}
      />,
      'en',
    )
    expect(screen.queryByTestId('quick-add-creatures-section')).toBeNull()
  })

  it('player (isMaster=false) does not see the quick-add section', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={CREATURE_TOKENS} />,
      'en',
    )
    expect(screen.queryByTestId('quick-add-creatures-section')).toBeNull()
  })

  it('quick-add section shows buttons for unlinked creature tokens', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={CREATURE_TOKENS} />,
      'en',
    )
    expect(screen.getByTestId('quick-add-token-tok-g1')).toBeDefined()
    expect(screen.getByTestId('quick-add-token-tok-g2')).toBeDefined()
  })

  it('only unlinked tokens appear as quick-add buttons', () => {
    const linked = [{ id: 'c1', name: 'Goblin 1', initiative: 0, tokenId: 'tok-g1' }]
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: linked })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={CREATURE_TOKENS}
      />,
      'en',
    )
    expect(screen.queryByTestId('quick-add-token-tok-g1')).toBeNull()
    expect(screen.getByTestId('quick-add-token-tok-g2')).toBeDefined()
  })

  it('clicking a quick-add button creates a combatant with the token name, tokenId and HP', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={onUpdate} tokens={CREATURE_TOKENS} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('quick-add-token-tok-g1'))
    const updated = onUpdate.mock.calls[0]![0]
    const added = updated.combatants.at(-1)
    expect(added.name).toBe('Goblin 1')
    expect(added.tokenId).toBe('tok-g1')
    expect(added.hp).toEqual({ current: 7, max: 7 })
    expect(added.initiative).toBe(0)
  })

  it('token without hpMax → combatant created without HP', () => {
    const noHpToken = [{ id: 'tok-sk', label: 'Skeleton' }]
    const onUpdate = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={onUpdate} tokens={noHpToken} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('quick-add-token-tok-sk'))
    const updated = onUpdate.mock.calls[0]![0]
    const added = updated.combatants.at(-1)
    expect(added.hp).toBeUndefined()
    expect(added.tokenId).toBe('tok-sk')
  })

  it('token with hpMax=null → combatant created without HP', () => {
    const nullHpToken = [{ id: 'tok-zb', label: 'Zombie', hpMax: null }]
    const onUpdate = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={onUpdate} tokens={nullHpToken} />,
      'en',
    )
    fireEvent.click(screen.getByTestId('quick-add-token-tok-zb'))
    const updated = onUpdate.mock.calls[0]![0]
    expect(updated.combatants.at(-1).hp).toBeUndefined()
  })

  it('quick-add label in PT', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={CREATURE_TOKENS} />,
      'pt',
    )
    const section = screen.getByTestId('quick-add-creatures-section')
    expect(section.textContent).toContain('Adicionar criatura')
  })

  it('quick-add label in EN', () => {
    renderWithI18n(
      <CampaignInitiativePanel isMaster tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} tokens={CREATURE_TOKENS} />,
      'en',
    )
    const section = screen.getByTestId('quick-add-creatures-section')
    expect(section.textContent).toContain('Add creature')
  })
})

describe('CampaignInitiativePanel — token link icon', () => {
  it('link icon shown when combatant has tokenId matching a token in the list', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [LINKED_COMBATANT] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
      />,
      'en',
    )
    expect(screen.getByTestId('combatant-token-c-link')).toBeDefined()
  })

  it('link icon NOT shown when combatant has tokenId but token is absent from list', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [LINKED_COMBATANT] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={[{ id: 'tok-99', label: 'Other' }]}  // tok-1 not present
      />,
      'en',
    )
    expect(screen.queryByTestId('combatant-token-c-link')).toBeNull()
  })

  it('link icon NOT shown when tokenId is undefined', () => {
    const noToken = { id: 'c-no', name: 'Solo', initiative: 0 }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [noToken] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
      />,
      'en',
    )
    expect(screen.queryByTestId('combatant-token-c-no')).toBeNull()
  })

  it('member (isMaster=false) never sees the link icon', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker({ combatants: [LINKED_COMBATANT] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
      />,
      'en',
    )
    expect(screen.queryByTestId('combatant-token-c-link')).toBeNull()
  })

  it('clicking the link icon calls onHighlightToken with the combatant tokenId', () => {
    const onHighlightToken = vi.fn()
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [LINKED_COMBATANT] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
        onHighlightToken={onHighlightToken}
      />,
      'en',
    )
    fireEvent.click(screen.getByTestId('combatant-token-c-link'))
    expect(onHighlightToken).toHaveBeenCalledWith('tok-1')
  })

  it('active combatant shows ▶ in indicator slot, not the ↗ button', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ active: true, combatants: [LINKED_COMBATANT], activeCombatantId: 'c-link' })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
      />,
      'en',
    )
    expect(screen.queryByTestId('combatant-token-c-link')).toBeNull()
    expect(screen.getByTestId('combatant-row-c-link').textContent).toContain('▶')
  })

  it('non-active combatant with token shows ↗ in indicator slot', () => {
    const other = { id: 'c-other', name: 'Skeleton', initiative: 3 }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ active: true, combatants: [LINKED_COMBATANT, other], activeCombatantId: 'c-other' })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
      />,
      'en',
    )
    expect(screen.getByTestId('combatant-token-c-link')).toBeDefined()
  })

  it('combatant with no token shows empty indicator slot', () => {
    const noToken = { id: 'c-bare', name: 'Ghost', initiative: 7 }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [noToken] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
      />,
      'en',
    )
    expect(screen.queryByTestId('combatant-token-c-bare')).toBeNull()
  })
})

describe('CampaignInitiativePanel — highlightCombatantId', () => {
  it('highlighted combatant row gets a distinct background', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [LINKED_COMBATANT] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
        highlightCombatantId="c-link"
      />,
      'en',
    )
    const row = screen.getByTestId('combatant-row-c-link') as HTMLDivElement
    // highlighted row should have a blue-tinted background different from the default surface
    // (browser normalises rgba: spaces are added between values)
    expect(row.style.background.replace(/\s/g, '')).toContain('rgba(107,127,212')
  })

  it('non-highlighted rows keep default surface background', () => {
    const other = { id: 'c-other', name: 'Skeleton', initiative: 3 }
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker({ combatants: [LINKED_COMBATANT, other] })}
        linkedChars={[]}
        onUpdate={noOp}
        tokens={TOKEN_LIST}
        highlightCombatantId="c-link"
      />,
      'en',
    )
    const otherRow = screen.getByTestId('combatant-row-c-other') as HTMLDivElement
    expect(otherRow.style.background.replace(/\s/g, '')).not.toContain('rgba(107,127,212')
  })
})
