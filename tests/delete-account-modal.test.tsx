import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteAccountModal } from '@/components/account/DeleteAccountModal'
import { renderWithI18n } from './helpers/render'

// ── Mock auth store ───────────────────────────────────────────────────────────

const mockDeleteAccount = vi.fn()

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: { deleteAccount: typeof mockDeleteAccount }) => unknown) => {
    const state = { deleteAccount: mockDeleteAccount }
    return selector ? selector(state) : state
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const USER_EMAIL = 'user@example.com'

function renderModal(lang: 'pt' | 'en' = 'pt', onClose = vi.fn()) {
  return renderWithI18n(<DeleteAccountModal userEmail={USER_EMAIL} onClose={onClose} />, lang)
}

function emailInput() { return screen.getByTestId('delete-account-email-input') }
function confirmBtn() { return screen.getByTestId('delete-account-confirm-btn') as HTMLButtonElement }
function cancelBtn() { return screen.getByTestId('delete-account-cancel-btn') as HTMLButtonElement }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DeleteAccountModal — structure', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders the modal overlay', () => {
    renderModal()
    expect(screen.getByTestId('delete-account-modal')).toBeDefined()
  })

  it('shows the warning text in PT', () => {
    renderModal('pt')
    expect(screen.getByTestId('delete-account-warning').textContent).toContain('apaga permanentemente')
  })

  it('shows the warning text in EN', () => {
    renderModal('en')
    expect(screen.getByTestId('delete-account-warning').textContent).toContain('permanently deletes')
  })

  it('confirm button label is "Excluir conta permanentemente" (PT)', () => {
    renderModal('pt')
    expect(confirmBtn().textContent).toBe('Excluir conta permanentemente')
  })

  it('confirm button label is "Delete account permanently" (EN)', () => {
    renderModal('en')
    expect(confirmBtn().textContent).toBe('Delete account permanently')
  })

  it('cancel button label is "Cancelar" (PT)', () => {
    renderModal('pt')
    expect(cancelBtn().textContent).toBe('Cancelar')
  })

  it('cancel button label is "Cancel" (EN)', () => {
    renderModal('en')
    expect(cancelBtn().textContent).toBe('Cancel')
  })
})

describe('DeleteAccountModal — confirmation gate', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('confirm button is disabled when email field is empty', () => {
    renderModal()
    expect(confirmBtn().disabled).toBe(true)
  })

  it('confirm button is disabled when email does not match', () => {
    renderModal()
    fireEvent.change(emailInput(), { target: { value: 'wrong@email.com' } })
    expect(confirmBtn().disabled).toBe(true)
  })

  it('confirm button is enabled when email matches exactly', () => {
    renderModal()
    fireEvent.change(emailInput(), { target: { value: USER_EMAIL } })
    expect(confirmBtn().disabled).toBe(false)
  })

  it('confirm button is enabled with leading/trailing whitespace', () => {
    renderModal()
    fireEvent.change(emailInput(), { target: { value: `  ${USER_EMAIL}  ` } })
    expect(confirmBtn().disabled).toBe(false)
  })

  it('confirm button is enabled with different case', () => {
    renderModal()
    fireEvent.change(emailInput(), { target: { value: USER_EMAIL.toUpperCase() } })
    expect(confirmBtn().disabled).toBe(false)
  })
})

describe('DeleteAccountModal — actions', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('clicking cancel calls onClose', () => {
    const onClose = vi.fn()
    renderModal('pt', onClose)
    fireEvent.click(cancelBtn())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls deleteAccount when confirm is clicked with matching email', async () => {
    mockDeleteAccount.mockResolvedValue(undefined)
    renderModal()
    fireEvent.change(emailInput(), { target: { value: USER_EMAIL } })
    fireEvent.click(confirmBtn())
    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalled())
  })

  it('shows error message when deleteAccount throws', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('rpc failed'))
    renderModal()
    fireEvent.change(emailInput(), { target: { value: USER_EMAIL } })
    fireEvent.click(confirmBtn())
    await waitFor(() => expect(screen.getByTestId('delete-account-error')).toBeDefined())
    expect(screen.getByTestId('delete-account-error').textContent).toContain('possível excluir')
  })

  it('re-enables confirm button after failure', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('rpc failed'))
    renderModal()
    fireEvent.change(emailInput(), { target: { value: USER_EMAIL } })
    fireEvent.click(confirmBtn())
    await waitFor(() => expect(confirmBtn().disabled).toBe(false))
  })

  it('confirm button disabled after cancel with mismatched email', () => {
    renderModal()
    fireEvent.change(emailInput(), { target: { value: 'wrong@x.com' } })
    expect(confirmBtn().disabled).toBe(true)
  })
})
