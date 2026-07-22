/**
 * Tests for InviteCodeBlock — copy link, copy code, regenerate, owner-only visibility.
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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAMPAIGN: Campaign = {
  id: 'c1',
  name: 'Test Campaign',
  description: null,
  ownerId: 'owner1',
  inviteCode: 'ABCD1234',
  autoInitiative: false,
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

// ── Tests — visibility ────────────────────────────────────────────────────────

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

// ── Tests — code display ──────────────────────────────────────────────────────

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

// ── Tests — copy link ─────────────────────────────────────────────────────────

describe('InviteCodeBlock — copy link', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders "Copiar link" as primary button', () => {
    renderBlock(true)
    expect(screen.getByTestId('copy-invite-link').textContent).toBe('Copiar link')
  })

  it('copy link writes full URL to clipboard', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-link'))
    await waitFor(() =>
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/join/ABCD1234')
      )
    )
  })

  it('copy link URL uses window.location.origin + BASE_URL', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-link'))
    await waitFor(() => {
      // Build expected URL from runtime values (origin includes port in test env)
      const base = import.meta.env.BASE_URL.replace(/\/$/, '')
      const expected = `${window.location.origin}${base}/join/ABCD1234`
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expected)
    })
  })

  it('shows "Link copiado!" on link button after copy', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-link'))
    await waitFor(() =>
      expect(screen.getByTestId('copy-invite-link').textContent).toBe('Link copiado!')
    )
  })

  it('does not show link feedback on code button when link is copied', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-link'))
    await waitFor(() =>
      expect(screen.getByTestId('copy-invite-link').textContent).toBe('Link copiado!')
    )
    expect(screen.getByTestId('copy-invite-code').textContent).toBe('Copiar código')
  })

  it('handles clipboard error gracefully on copy link', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new Error('denied'))
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-link'))
    await new Promise(r => setTimeout(r, 50))
    // button text unchanged — no crash
    expect(screen.getByTestId('copy-invite-link').textContent).toBe('Copiar link')
  })
})

// ── Tests — copy code ─────────────────────────────────────────────────────────

describe('InviteCodeBlock — copy code', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders "Copiar código" as secondary button', () => {
    renderBlock(true)
    expect(screen.getByTestId('copy-invite-code').textContent).toBe('Copiar código')
  })

  it('copy code writes raw code (no hyphen) to clipboard', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-code'))
    await waitFor(() => expect(mockClipboardWriteText).toHaveBeenCalledWith('ABCD1234'))
  })

  it('shows "Código copiado!" on code button after copy', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-code'))
    await waitFor(() =>
      expect(screen.getByTestId('copy-invite-code').textContent).toBe('Código copiado!')
    )
  })

  it('does not show code feedback on link button when code is copied', async () => {
    renderBlock(true)
    fireEvent.click(screen.getByTestId('copy-invite-code'))
    await waitFor(() =>
      expect(screen.getByTestId('copy-invite-code').textContent).toBe('Código copiado!')
    )
    expect(screen.getByTestId('copy-invite-link').textContent).toBe('Copiar link')
  })
})

// ── Tests — regenerate ────────────────────────────────────────────────────────

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
