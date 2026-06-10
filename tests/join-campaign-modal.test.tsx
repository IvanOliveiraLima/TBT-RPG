/**
 * Tests for JoinCampaignModal — lookup, preview, join flow, errors.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import { JoinCampaignModal } from '@/components/campaigns/JoinCampaignModal'

// ── Mock campaign service ─────────────────────────────────────────────────────

const mockLookupCampaignByCode = vi.fn()
const mockAcceptCampaignInvite = vi.fn()

vi.mock('@/services/campaign', () => ({
  lookupCampaignByCode: (...args: unknown[]) => mockLookupCampaignByCode(...args),
  acceptCampaignInvite: (...args: unknown[]) => mockAcceptCampaignInvite(...args),
  CampaignServiceError: class CampaignServiceError extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── helpers ───────────────────────────────────────────────────────────────────

function renderModal(props: { onJoined?: (id: string, status: 'joined' | 'already_member') => void; onCancel?: () => void } = {}) {
  const onJoined = props.onJoined ?? vi.fn()
  const onCancel = props.onCancel ?? vi.fn()
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return {
    ...render(
      <MemoryRouter>
        <I18nProvider>
          <JoinCampaignModal onJoined={onJoined} onCancel={onCancel} />
        </I18nProvider>
      </MemoryRouter>
    ),
    onJoined,
    onCancel,
  }
}

const PREVIEW_DATA = { id: 'c1', name: 'Test Campaign', description: 'A description' }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('JoinCampaignModal — render', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders the modal', () => {
    renderModal()
    expect(screen.getByTestId('join-campaign-modal')).toBeDefined()
  })

  it('shows PT title', () => {
    renderModal()
    expect(screen.getByText('Entrar em campanha com código')).toBeDefined()
  })

  it('has code input with placeholder XXXX-XXXX', () => {
    renderModal()
    const input = screen.getByTestId('join-code-input') as HTMLInputElement
    expect(input.placeholder).toBe('XXXX-XXXX')
  })

  it('join button is disabled initially', () => {
    renderModal()
    const btn = screen.getByTestId('join-campaign-submit') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('cancel button calls onCancel', () => {
    const onCancel = vi.fn()
    renderModal({ onCancel })
    fireEvent.click(screen.getByTestId('join-campaign-cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

describe('JoinCampaignModal — lookup flow', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('triggers lookup when 8 chars entered (without hyphen)', async () => {
    mockLookupCampaignByCode.mockResolvedValue(PREVIEW_DATA)
    renderModal()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD1234' } })
    await waitFor(() => expect(mockLookupCampaignByCode).toHaveBeenCalledWith('ABCD1234'))
  })

  it('accepts XXXX-XXXX format and strips hyphen', async () => {
    mockLookupCampaignByCode.mockResolvedValue(PREVIEW_DATA)
    renderModal()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD-1234' } })
    await waitFor(() => expect(mockLookupCampaignByCode).toHaveBeenCalledWith('ABCD1234'))
  })

  it('shows campaign preview when lookup succeeds', async () => {
    mockLookupCampaignByCode.mockResolvedValue(PREVIEW_DATA)
    renderModal()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD1234' } })
    await waitFor(() => expect(screen.getByTestId('join-campaign-preview')).toBeDefined())
    expect(screen.getByText('Test Campaign')).toBeDefined()
  })

  it('enables join button after preview loads', async () => {
    mockLookupCampaignByCode.mockResolvedValue(PREVIEW_DATA)
    renderModal()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD1234' } })
    await waitFor(() => {
      const btn = screen.getByTestId('join-campaign-submit') as HTMLButtonElement
      expect(btn.disabled).toBe(false)
    })
  })

  it('shows not_found error when code is invalid', async () => {
    mockLookupCampaignByCode.mockResolvedValue(null)
    renderModal()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ZZZZ9999' } })
    await waitFor(() => expect(screen.getByTestId('join-campaign-error')).toBeDefined())
    expect(screen.getByText('Código não encontrado. Verifique e tente novamente.')).toBeDefined()
  })

  it('shows lookup_failed error on RPC error', async () => {
    mockLookupCampaignByCode.mockRejectedValue(new Error('network'))
    renderModal()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD1234' } })
    await waitFor(() => expect(screen.getByTestId('join-campaign-error')).toBeDefined())
    expect(screen.getByText('Não foi possível buscar o código. Tente novamente.')).toBeDefined()
  })

  it('does not trigger lookup for 7 chars', async () => {
    renderModal()
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD123' } })
    await new Promise(r => setTimeout(r, 50))
    expect(mockLookupCampaignByCode).not.toHaveBeenCalled()
  })
})

describe('JoinCampaignModal — join flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLookupCampaignByCode.mockResolvedValue(PREVIEW_DATA)
  })

  async function openPreview() {
    renderModal({ onJoined: vi.fn() })
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD1234' } })
    await waitFor(() => expect(screen.getByTestId('join-campaign-preview')).toBeDefined())
  }

  it('calls onJoined with campaignId and "joined" on success', async () => {
    mockAcceptCampaignInvite.mockResolvedValue({ campaignId: 'c1', status: 'joined' })
    const onJoined = vi.fn()
    localStorage.setItem('tbt-rpg-v2-lang', 'pt')
    render(
      <MemoryRouter>
        <I18nProvider>
          <JoinCampaignModal onJoined={onJoined} onCancel={vi.fn()} />
        </I18nProvider>
      </MemoryRouter>
    )
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD1234' } })
    await waitFor(() => expect(screen.getByTestId('join-campaign-preview')).toBeDefined())
    fireEvent.click(screen.getByTestId('join-campaign-submit'))
    await waitFor(() => expect(onJoined).toHaveBeenCalledWith('c1', 'joined'))
  })

  it('calls onJoined with "already_member" status', async () => {
    mockAcceptCampaignInvite.mockResolvedValue({ campaignId: 'c1', status: 'already_member' })
    const onJoined = vi.fn()
    localStorage.setItem('tbt-rpg-v2-lang', 'pt')
    render(
      <MemoryRouter>
        <I18nProvider>
          <JoinCampaignModal onJoined={onJoined} onCancel={vi.fn()} />
        </I18nProvider>
      </MemoryRouter>
    )
    fireEvent.change(screen.getByTestId('join-code-input'), { target: { value: 'ABCD1234' } })
    await waitFor(() => expect(screen.getByTestId('join-campaign-preview')).toBeDefined())
    fireEvent.click(screen.getByTestId('join-campaign-submit'))
    await waitFor(() => expect(onJoined).toHaveBeenCalledWith('c1', 'already_member'))
  })

  it('shows not_found error when accept returns not_found', async () => {
    mockAcceptCampaignInvite.mockResolvedValue({ campaignId: '', status: 'not_found' })
    await openPreview()
    fireEvent.click(screen.getByTestId('join-campaign-submit'))
    await waitFor(() => expect(screen.getByTestId('join-campaign-error')).toBeDefined())
  })

  it('shows error on accept failure', async () => {
    const { CampaignServiceError } = await import('@/services/campaign')
    mockAcceptCampaignInvite.mockRejectedValue(new CampaignServiceError('accept_failed'))
    await openPreview()
    fireEvent.click(screen.getByTestId('join-campaign-submit'))
    await waitFor(() => expect(screen.getByTestId('join-campaign-error')).toBeDefined())
    expect(screen.getByText('Não foi possível entrar na campanha. Tente novamente.')).toBeDefined()
  })
})
