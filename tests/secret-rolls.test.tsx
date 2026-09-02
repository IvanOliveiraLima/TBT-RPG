/**
 * Secret master rolls — store + DicePanel UI tests
 *
 * Covers:
 *  - addRoll with secretMode: never calls logRoll or registerInitiative
 *  - addRoll without secretMode: normal logging preserved
 *  - History entry marked with secret: true when secretMode is on
 *  - clearCampaignContext resets secretMode and isMaster to false
 *  - setCampaignContext stores isMaster flag
 *  - DicePanel: toggle hidden from non-masters, visible to master (EN/PT)
 *  - DicePanel: activating toggle shows SEGREDO badge (EN/PT)
 *  - DicePanel: secret roll in history shows marker; public roll shows none
 *  - DicePanel: HelpHint present for master and shows help text (EN/PT)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { DicePanel } from '@/components/dice/DicePanel'
import { useDiceStore } from '@/store/useDiceStore'

// ── Mock dice domain so panel rolls are deterministic ─────────────────────────
vi.mock('@/domain/dice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/dice')>()
  return { ...actual, roll: vi.fn() }
})

// ── Mock campaign services to capture calls ───────────────────────────────────
const mockLogRoll = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/campaign-dice-log', () => ({
  logRoll: (...args: unknown[]) => mockLogRoll(...args),
}))

const mockRegisterInitiative = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/campaign-initiative', () => ({
  registerInitiative: (...args: unknown[]) => mockRegisterInitiative(...args),
}))

import { roll } from '@/domain/dice'
const mockRoll = vi.mocked(roll)

let nextResultId = 0

function makeResult(overrides: Partial<import('@/domain/dice').RollResult> = {}): import('@/domain/dice').RollResult {
  return {
    id: `test-id-${++nextResultId}`,
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

// ── useDiceStore — secretMode skips logging ───────────────────────────────────

describe('useDiceStore — secretMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDiceStore.setState({
      history: [],
      lastResult: null,
      campaignTargets: ['camp-1'],
      actorName: 'Mestre',
      characterId: 'char-001',
      isMaster: true,
      secretMode: false,
    })
  })

  it('secretMode false: logRoll IS called when campaignTargets is set', async () => {
    useDiceStore.getState().addRoll(makeResult())
    await new Promise<void>(r => setTimeout(r, 0))
    expect(mockLogRoll).toHaveBeenCalledOnce()
  })

  it('secretMode true: logRoll is NOT called', async () => {
    useDiceStore.setState({ secretMode: true })
    useDiceStore.getState().addRoll(makeResult())
    await new Promise<void>(r => setTimeout(r, 0))
    expect(mockLogRoll).not.toHaveBeenCalled()
  })

  it('secretMode true: registerInitiative is NOT called for initiative roll', async () => {
    useDiceStore.setState({ secretMode: true })
    useDiceStore.getState().addRoll(makeResult({ kind: 'initiative', total: 14 }))
    await new Promise<void>(r => setTimeout(r, 0))
    expect(mockRegisterInitiative).not.toHaveBeenCalled()
  })

  it('secretMode true: history entry gets secret: true', () => {
    useDiceStore.setState({ secretMode: true })
    useDiceStore.getState().addRoll(makeResult({ id: 'sec-1' }))
    expect(useDiceStore.getState().history[0].secret).toBe(true)
  })

  it('secretMode false: history entry does NOT have secret flag', () => {
    useDiceStore.getState().addRoll(makeResult({ id: 'pub-1' }))
    expect(useDiceStore.getState().history[0].secret).toBeUndefined()
  })

  it('toggleSecretMode flips secretMode', () => {
    expect(useDiceStore.getState().secretMode).toBe(false)
    useDiceStore.getState().toggleSecretMode()
    expect(useDiceStore.getState().secretMode).toBe(true)
    useDiceStore.getState().toggleSecretMode()
    expect(useDiceStore.getState().secretMode).toBe(false)
  })
})

// ── useDiceStore — clearCampaignContext resets secret state ───────────────────

describe('useDiceStore — clearCampaignContext resets secret state', () => {
  it('resets secretMode to false', () => {
    useDiceStore.setState({
      secretMode: true,
      isMaster: true,
      campaignTargets: ['c1'],
      actorName: 'Mestre',
      characterId: '',
    })
    useDiceStore.getState().clearCampaignContext()
    expect(useDiceStore.getState().secretMode).toBe(false)
  })

  it('resets isMaster to false', () => {
    useDiceStore.setState({
      isMaster: true,
      campaignTargets: ['c1'],
      actorName: 'Mestre',
      characterId: '',
    })
    useDiceStore.getState().clearCampaignContext()
    expect(useDiceStore.getState().isMaster).toBe(false)
  })
})

// ── useDiceStore — setCampaignContext stores isMaster ─────────────────────────

describe('useDiceStore — setCampaignContext isMaster', () => {
  it('stores isMaster: true when provided', () => {
    useDiceStore.setState({ isMaster: false })
    useDiceStore.getState().setCampaignContext({
      campaignTargets: ['c1'],
      actorName: 'Mestre',
      isMaster: true,
    })
    expect(useDiceStore.getState().isMaster).toBe(true)
  })

  it('defaults isMaster to false when omitted', () => {
    useDiceStore.setState({ isMaster: true })
    useDiceStore.getState().setCampaignContext({ campaignTargets: ['c1'], actorName: 'Player' })
    expect(useDiceStore.getState().isMaster).toBe(false)
  })
})

// ── DicePanel — secret toggle visibility ─────────────────────────────────────

describe('DicePanel — secret toggle visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDiceStore.setState({
      history: [],
      lastResult: null,
      isMaster: false,
      secretMode: false,
      critContext: null,
    })
    mockRoll.mockReturnValue(makeResult())
  })

  it('toggle NOT shown when isMaster is false', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.queryByTestId('dice-secret-toggle')).toBeNull()
  })

  it('toggle shown when isMaster is true (EN: contains "Secret")', () => {
    useDiceStore.setState({ isMaster: true })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByTestId('dice-secret-toggle').textContent).toContain('Secret')
  })

  it('toggle shown when isMaster is true (PT: contains "Segredo")', () => {
    useDiceStore.setState({ isMaster: true })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    expect(screen.getByTestId('dice-secret-toggle').textContent).toContain('Segredo')
  })
})

// ── DicePanel — secret badge ──────────────────────────────────────────────────

describe('DicePanel — secret badge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDiceStore.setState({
      history: [],
      lastResult: null,
      isMaster: true,
      secretMode: false,
      critContext: null,
    })
    mockRoll.mockReturnValue(makeResult())
  })

  it('badge not shown when secretMode is off', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.queryByTestId('dice-secret-badge')).toBeNull()
  })

  it('clicking toggle shows badge (EN: "SECRET")', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('dice-secret-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('dice-secret-badge').textContent).toBe('SECRET')
    })
  })

  it('clicking toggle shows badge (PT: "SEGREDO")', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    fireEvent.click(screen.getByTestId('dice-secret-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('dice-secret-badge').textContent).toBe('SEGREDO')
    })
  })

  it('clicking toggle twice hides badge', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('dice-secret-toggle'))
    await waitFor(() => expect(screen.getByTestId('dice-secret-badge')).toBeDefined())
    fireEvent.click(screen.getByTestId('dice-secret-toggle'))
    await waitFor(() => {
      expect(screen.queryByTestId('dice-secret-badge')).toBeNull()
    })
  })
})

// ── DicePanel — history secret marker ────────────────────────────────────────

describe('DicePanel — history secret marker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDiceStore.setState({
      history: [],
      lastResult: null,
      isMaster: true,
      secretMode: false,
      critContext: null,
    })
    mockRoll.mockReturnValue(makeResult())
  })

  it('secret roll in history shows marker', async () => {
    useDiceStore.setState({ secretMode: true })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('history-secret-marker')).toBeDefined()
    })
  })

  it('public roll in history shows no marker', async () => {
    useDiceStore.setState({ secretMode: false })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('roll-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('history-entry')).toBeDefined()
    })
    expect(screen.queryByTestId('history-secret-marker')).toBeNull()
  })
})

// ── DicePanel — HelpHint for secret toggle ────────────────────────────────────

describe('DicePanel — HelpHint secret help', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDiceStore.setState({
      history: [],
      lastResult: null,
      isMaster: true,
      secretMode: false,
      critContext: null,
    })
    mockRoll.mockReturnValue(makeResult())
  })

  it('HelpHint trigger present when isMaster is true', () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.getByTestId('help-hint-trigger')).toBeDefined()
  })

  it('HelpHint not present when isMaster is false', () => {
    useDiceStore.setState({ isMaster: false })
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    expect(screen.queryByTestId('help-hint-trigger')).toBeNull()
  })

  it('clicking HelpHint shows EN secret help text', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'en')
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    await waitFor(() => {
      expect(screen.getByRole('tooltip').textContent).toContain('not sent to the campaign log')
    })
  })

  it('clicking HelpHint shows PT secret help text', async () => {
    renderWithI18n(<DicePanel onClose={() => {}} />, 'pt')
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    await waitFor(() => {
      expect(screen.getByRole('tooltip').textContent).toContain('log da campanha')
    })
  })
})
