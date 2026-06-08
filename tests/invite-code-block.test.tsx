/**
 * Tests for InviteCodeBlock — copy, regenerate, owner-only visibility.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import { InviteCodeBlock } from '@/components/campaigns/InviteCodeBlock'
import type { Campaign } from '@/domain/campaign'

// ── Mock campaign service ─────────────────────────────────────────────────────

const mockRegenerateInviteCode = vi.fn()

vi.mock('@/services/campaign', () => ({
  regenerateInviteCode: (...args: unknown[]) => mockRegenerateInviteCode(...args),
  CampaignServiceError: class CampaignServiceError extends Error {
    code: string
    constructor(code: string) { super(code); this.code = code }
  },
}))

// ── Mock clipboard ────────────────────────────────────────────────────────────

const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockClipboardWriteText },
  writable: true,
  configurable: true,
})

// ── helpers ───────────────────────────────────────────────────────────────────

const CAMPAIGN: Campaign = {
  id: 'c1',
  name: 'Test Campaign',
  description: null,
  ownerId: 'owner1',
  inviteCode: 'ABCD1234',
  createdAt: 0,
  updatedAt: 0,
}

function renderBlock(isOwner: boolean, onCodeRegenerated = vi.fn()) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return render(
    <MemoryRouter>
      <I18nProvider>
        <InviteCodeBlock campaign={CAMPAIGN} isOwner={isOwner} onCodeRegenerated={onCodeRegenerated} />
      </I18nProvider>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InviteCodeBlock — visibility', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('does not render when not owner', () => {
    const { container } = renderBlock(false)
    expect(container.firstChild).toBeNull()
  })

  it('renders when owner', () => {
    renderBlock(true)
    expect(screen.getByTestId('invite-code-block')).toBeDefined()
  })
})

describe('InviteCodeBlock — code display', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('shows formatted code as XXXX-XXXX', () => {
    renderBlock(true)
    expect(screen.getByTestId('invite-code-text').textContent).toBe('ABCD-1234')
  })

  it('shows PT title "Código de convite"', () => {
    renderBlock(true)
    expect(screen.getByText('Código de convite')).toBeDefined()
  })
})

describe('InviteCodeBlock — copy', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('calls navigator.clipboard.writeText with raw code on copy', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('invite-code-copy'))
    await waitFor(() => expect(mockClipboardWriteText).toHaveBeenCalledWith('ABCD1234'))
  })

  it('shows "Copiado!" immediately after copy', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('invite-code-copy'))
    await waitFor(() => expect(screen.getByTestId('invite-code-copy').textContent).toBe('Copiado!'))
  })

  it('shows "Copiar" initially', () => {
    renderBlock(true)
    expect(screen.getByTestId('invite-code-copy').textContent).toBe('Copiar')
  })
})

describe('InviteCodeBlock — regenerate', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('calls regenerateInviteCode and fires onCodeRegenerated on confirm', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockRegenerateInviteCode.mockResolvedValue('NEWCODE1')
    const onCodeRegenerated = vi.fn()
    renderBlock(true, onCodeRegenerated)
    fireEvent.click(screen.getByTestId('invite-code-regenerate'))
    await waitFor(() => expect(mockRegenerateInviteCode).toHaveBeenCalledWith('c1'))
    await waitFor(() => expect(onCodeRegenerated).toHaveBeenCalledWith('NEWCODE1'))
    vi.unstubAllGlobals()
  })

  it('does not regenerate when user cancels confirm', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
    const onCodeRegenerated = vi.fn()
    renderBlock(true, onCodeRegenerated)
    fireEvent.click(screen.getByTestId('invite-code-regenerate'))
    await new Promise(r => setTimeout(r, 50))
    expect(mockRegenerateInviteCode).not.toHaveBeenCalled()
    expect(onCodeRegenerated).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('shows error message when regeneration fails', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockRegenerateInviteCode.mockRejectedValue(new Error('not_owner'))
    renderBlock(true)
    fireEvent.click(screen.getByTestId('invite-code-regenerate'))
    await waitFor(() => expect(screen.getByTestId('invite-regenerate-error')).toBeDefined())
    vi.unstubAllGlobals()
  })

  it('shows "Regenerar código" button text initially', () => {
    renderBlock(true)
    expect(screen.getByTestId('invite-code-regenerate').textContent).toBe('Regenerar código')
  })
})
