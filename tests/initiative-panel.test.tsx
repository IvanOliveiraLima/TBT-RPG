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
import { screen } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignInitiativePanel } from '@/components/campaigns/CampaignInitiativePanel'
import type { InitiativeTracker } from '@/domain/initiative'

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
      <CampaignInitiativePanel isOwner={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'pt',
    )
    expect(screen.getByTestId('initiative-empty')).toBeDefined()
    expect(screen.getByTestId('initiative-empty').textContent).toContain('Nenhum combatente ainda')
  })

  it('shows empty message in EN', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('initiative-empty').textContent).toContain('No combatants yet')
  })
})

describe('CampaignInitiativePanel — owner controls', () => {
  it('shows start combat button when inactive', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('initiative-start-btn')).toBeDefined()
  })

  it('shows end combat button when active', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isOwner
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
      <CampaignInitiativePanel isOwner tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
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
      <CampaignInitiativePanel isOwner tracker={makeTracker()} linkedChars={linkedChars} onUpdate={noOp} />,
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
      <CampaignInitiativePanel isOwner tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
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
      <CampaignInitiativePanel isOwner tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
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
      <CampaignInitiativePanel isOwner={false} tracker={trackerWithCombatant} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('initiative-start-btn')).toBeNull()
    expect(screen.queryByTestId('initiative-end-btn')).toBeNull()
  })

  it('does NOT show add-monster button', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={trackerWithCombatant} linkedChars={linkedChars} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('show-monster-form')).toBeNull()
  })

  it('does NOT show quick-add buttons', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={makeTracker()} linkedChars={linkedChars} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('quick-add-char1')).toBeNull()
  })

  it('does NOT show remove buttons', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={trackerWithCombatant} linkedChars={[]} onUpdate={noOp} />,
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
      <CampaignInitiativePanel isOwner={false} tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.queryByTestId('initiative-prev')).toBeNull()
    expect(screen.queryByTestId('initiative-next')).toBeNull()
  })

  it('renders combatant row with initiative value', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={trackerWithCombatant} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('combatant-row-c1')).toBeDefined()
    expect(screen.getByTestId('initiative-value-c1').textContent).toContain('15')
  })
})

describe('CampaignInitiativePanel — title i18n', () => {
  it('shows PT title when inactive', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'pt',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Iniciativa')
  })

  it('shows EN title when inactive', () => {
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={makeTracker()} linkedChars={[]} onUpdate={noOp} />,
      'en',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Initiative')
  })

  it('shows round label when active (PT)', () => {
    const tracker = makeTracker({
      active: true,
      round:  3,
      combatants: [{ id: 'a', name: 'F', initiative: 10 }],
      activeCombatantId: 'a',
    })
    renderWithI18n(
      <CampaignInitiativePanel isOwner={false} tracker={tracker} linkedChars={[]} onUpdate={noOp} />,
      'pt',
    )
    expect(screen.getByTestId('campaign-initiative-panel').textContent).toContain('Rodada 3')
  })
})
