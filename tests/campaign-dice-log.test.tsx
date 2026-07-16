/**
 * Dice.3a — campaign dice log tests
 *
 * Covers:
 *  Store:
 *  - setCampaignContext / clearCampaignContext
 *  - addRoll calls logRoll when campaignTargets is non-empty
 *  - addRoll does NOT call logRoll when campaignTargets is empty
 *
 *  CampaignRollLog panel:
 *  - renders title in EN/PT
 *  - shows empty state when no rolls
 *  - shows dice-log-entry for each roll
 *  - clear button shown only to owner when rolls exist
 *  - clicking clear calls clearCampaignRolls and re-fetches
 *  - clear button hidden from non-owner
 *  - clear button hidden when no rolls
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { useDiceStore } from '@/store/useDiceStore'

// ── Mock dice log service ─────────────────────────────────────────────────────

vi.mock('@/services/campaign-dice-log', () => ({
  logRoll: vi.fn().mockResolvedValue(undefined),
  listCampaignRolls: vi.fn().mockResolvedValue([]),
  clearCampaignRolls: vi.fn().mockResolvedValue(undefined),
}))

import {
  logRoll,
  listCampaignRolls,
  clearCampaignRolls,
} from '@/services/campaign-dice-log'

const mockLogRoll         = vi.mocked(logRoll)
const mockListRolls       = vi.mocked(listCampaignRolls)
const mockClearRolls      = vi.mocked(clearCampaignRolls)

import { CampaignRollLog } from '@/components/campaigns/CampaignRollLog'
import type { RollResult } from '@/domain/dice'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<RollResult> = {}): RollResult {
  return {
    id: 'r1',
    notation: 'd20',
    dice: [{ sides: 20, value: 15, kept: true }],
    modifier: 0,
    total: 15,
    mode: 'normal',
    crit: null,
    at: Date.now(),
    ...overrides,
  }
}

function makeCampaignRoll(overrides = {}) {
  return {
    id: 'row1',
    campaignId: 'c1',
    userId: 'u1',
    actorName: 'Aragorn',
    result: makeResult(),
    createdAt: Date.now() - 5000,
    ...overrides,
  }
}

// ── Store: campaign context ───────────────────────────────────────────────────

describe('useDiceStore — campaignContext', () => {
  beforeEach(() => {
    useDiceStore.setState({ campaignTargets: [], actorName: '' })
    mockLogRoll.mockClear()
  })

  it('starts with empty context', () => {
    expect(useDiceStore.getState().campaignTargets).toEqual([])
    expect(useDiceStore.getState().actorName).toBe('')
  })

  it('setCampaignContext stores targets and actorName', () => {
    useDiceStore.getState().setCampaignContext({ campaignTargets: ['c1', 'c2'], actorName: 'Legolas' })
    expect(useDiceStore.getState().campaignTargets).toEqual(['c1', 'c2'])
    expect(useDiceStore.getState().actorName).toBe('Legolas')
  })

  it('clearCampaignContext resets to empty', () => {
    useDiceStore.getState().setCampaignContext({ campaignTargets: ['c1'], actorName: 'Gimli' })
    useDiceStore.getState().clearCampaignContext()
    expect(useDiceStore.getState().campaignTargets).toEqual([])
    expect(useDiceStore.getState().actorName).toBe('')
  })
})

// ── Store: addRoll fires logRoll when campaignTargets non-empty ───────────────

describe('useDiceStore — addRoll + logRoll', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null, campaignTargets: [], actorName: '' })
    mockLogRoll.mockClear()
  })

  it('does NOT call logRoll when campaignTargets is empty', async () => {
    useDiceStore.setState({ campaignTargets: [] })
    useDiceStore.getState().addRoll(makeResult())
    // logRoll is fire-and-forget; give a tick for the dynamic import to resolve
    await new Promise(r => setTimeout(r, 10))
    expect(mockLogRoll).not.toHaveBeenCalled()
  })

  it('calls logRoll with targets and actorName when campaignTargets is set', async () => {
    useDiceStore.setState({ campaignTargets: ['c1', 'c2'], actorName: 'Boromir' })
    const result = makeResult({ total: 18 })
    useDiceStore.getState().addRoll(result)
    await new Promise(r => setTimeout(r, 20))
    expect(mockLogRoll).toHaveBeenCalledOnce()
    expect(mockLogRoll).toHaveBeenCalledWith(['c1', 'c2'], 'Boromir', result)
  })

  it('logRoll is fire-and-forget: addRoll still updates history even if logRoll rejects', async () => {
    mockLogRoll.mockRejectedValueOnce(new Error('network'))
    useDiceStore.setState({ campaignTargets: ['c1'], actorName: 'Frodo' })
    useDiceStore.getState().addRoll(makeResult())
    await new Promise(r => setTimeout(r, 20))
    expect(useDiceStore.getState().history).toHaveLength(1)
  })
})

// ── CampaignRollLog panel ─────────────────────────────────────────────────────

describe('CampaignRollLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListRolls.mockResolvedValue([])
    mockClearRolls.mockResolvedValue(undefined)
  })

  it('renders title in EN', async () => {
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'en')
    await waitFor(() => {
      expect(screen.getByText('Roll log')).toBeDefined()
    })
  })

  it('renders title in PT', async () => {
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'pt')
    await waitFor(() => {
      expect(screen.getByText('Log de rolagens')).toBeDefined()
    })
  })

  it('shows empty state when no rolls in EN', async () => {
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'en')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-empty')).toBeDefined()
      expect(screen.getByText('No rolls yet')).toBeDefined()
    })
  })

  it('shows empty state in PT', async () => {
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'pt')
    await waitFor(() => {
      expect(screen.getByText('Nenhuma rolagem ainda')).toBeDefined()
    })
  })

  it('shows dice-log-entry for each roll', async () => {
    mockListRolls.mockResolvedValue([makeCampaignRoll(), makeCampaignRoll({ id: 'row2' })])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'en')
    await waitFor(() => {
      expect(screen.getAllByTestId('dice-log-entry')).toHaveLength(2)
    })
  })

  it('shows actor name in each entry', async () => {
    mockListRolls.mockResolvedValue([makeCampaignRoll({ actorName: 'Gandalf' })])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'en')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-actor').textContent).toBe('Gandalf')
    })
  })

  it('shows roll total in each entry', async () => {
    mockListRolls.mockResolvedValue([makeCampaignRoll({ result: makeResult({ total: 19 }) })])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'en')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-total').textContent).toBe('19')
    })
  })

  it('clear button shown to owner when rolls exist', async () => {
    mockListRolls.mockResolvedValue([makeCampaignRoll()])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={true} />, 'en')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-clear-btn')).toBeDefined()
    })
  })

  it('clear button hidden from non-owner', async () => {
    mockListRolls.mockResolvedValue([makeCampaignRoll()])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={false} />, 'en')
    await waitFor(() => {
      expect(screen.getAllByTestId('dice-log-entry')).toHaveLength(1)
    })
    expect(screen.queryByTestId('dice-log-clear-btn')).toBeNull()
  })

  it('clear button hidden when no rolls (owner)', async () => {
    mockListRolls.mockResolvedValue([])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={true} />, 'en')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-empty')).toBeDefined()
    })
    expect(screen.queryByTestId('dice-log-clear-btn')).toBeNull()
  })

  it('clicking clear calls clearCampaignRolls and re-fetches', async () => {
    mockListRolls
      .mockResolvedValueOnce([makeCampaignRoll()])
      .mockResolvedValueOnce([])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={true} />, 'en')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-clear-btn')).toBeDefined()
    })
    fireEvent.click(screen.getByTestId('dice-log-clear-btn'))
    await waitFor(() => {
      expect(mockClearRolls).toHaveBeenCalledWith('c1')
      expect(screen.getByTestId('dice-log-empty')).toBeDefined()
    })
  })

  it('clear button label in EN', async () => {
    mockListRolls.mockResolvedValue([makeCampaignRoll()])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={true} />, 'en')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-clear-btn').textContent).toBe('Clear log')
    })
  })

  it('clear button label in PT', async () => {
    mockListRolls.mockResolvedValue([makeCampaignRoll()])
    renderWithI18n(<CampaignRollLog campaignId="c1" isOwner={true} />, 'pt')
    await waitFor(() => {
      expect(screen.getByTestId('dice-log-clear-btn').textContent).toBe('Limpar log')
    })
  })
})
