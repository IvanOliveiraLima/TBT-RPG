import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CampaignInitiativePanel } from '@/components/campaigns/CampaignInitiativePanel'
import type { InitiativeTracker } from '@/domain/initiative'

function makeTracker(overrides: Partial<InitiativeTracker> = {}): InitiativeTracker {
  return {
    combatants: [],
    activeCombatantId: null,
    round: 1,
    active: false,
    ...overrides,
  }
}

const noOp = vi.fn()

beforeEach(() => { localStorage.clear() })

describe('CampaignInitiativePanel — auto-initiative HelpHint', () => {
  it('renders HelpHint trigger when owner and toggle available', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={vi.fn()}
      />,
      'en',
    )
    expect(screen.getByTestId('help-hint-trigger')).toBeDefined()
  })

  it('does NOT render HelpHint trigger when not owner', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster={false}
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={vi.fn()}
      />,
      'en',
    )
    expect(screen.queryByTestId('help-hint-trigger')).toBeNull()
  })

  it('does NOT render HelpHint trigger when onToggleAutoInitiative not provided', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
      />,
      'en',
    )
    expect(screen.queryByTestId('help-hint-trigger')).toBeNull()
  })

  it('clicking HelpHint trigger shows the hint text in EN', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={vi.fn()}
      />,
      'en',
    )
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    const tooltip = document.body.querySelector('[role="tooltip"]')
    expect(tooltip).not.toBeNull()
    expect(tooltip!.textContent).toContain("player's initiative roll")
  })

  it('clicking HelpHint trigger shows the hint text in PT', () => {
    renderWithI18n(
      <CampaignInitiativePanel
        isMaster
        tracker={makeTracker()}
        linkedChars={[]}
        onUpdate={noOp}
        autoInitiative={false}
        onToggleAutoInitiative={vi.fn()}
      />,
      'pt',
    )
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    const tooltip = document.body.querySelector('[role="tooltip"]')
    expect(tooltip).not.toBeNull()
    expect(tooltip!.textContent).toContain('rolagem de iniciativa')
  })
})
