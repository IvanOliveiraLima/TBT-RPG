import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { DeleteCharacterError } from '@/services/delete-character'

// ── mock @/lib/supabase so the service import doesn't crash ──────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: null,
  getSession: vi.fn().mockResolvedValue(null),
}))

// ── helpers ───────────────────────────────────────────────────────────────────

function render(
  onConfirm: () => Promise<void> = vi.fn().mockResolvedValue(undefined),
  onCancel = vi.fn(),
  lang: 'pt' | 'en' = 'pt',
  characterName = 'Eira',
) {
  return renderWithI18n(
    <ConfirmDeleteModal
      characterName={characterName}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
    lang,
  )
}

// ── rendering ─────────────────────────────────────────────────────────────────

describe('ConfirmDeleteModal — rendering', () => {
  it('renders the modal', () => {
    render()
    expect(screen.getByTestId('confirm-delete-modal')).toBeDefined()
  })

  it('shows warning text with character name (PT)', () => {
    render(vi.fn().mockResolvedValue(undefined), vi.fn(), 'pt', 'Eira')
    expect(screen.getByText(/excluir "Eira"/i)).toBeDefined()
  })

  it('shows warning text with character name (EN)', () => {
    render(vi.fn().mockResolvedValue(undefined), vi.fn(), 'en', 'Eira')
    expect(screen.getByText(/want to delete "Eira"/i)).toBeDefined()
  })

  it('renders Cancel button (PT)', () => {
    render()
    expect(screen.getByTestId('delete-modal-cancel')).toBeDefined()
    expect(screen.getByTestId('delete-modal-cancel').textContent).toContain('Cancelar')
  })

  it('renders Delete/Confirm button (PT)', () => {
    render()
    expect(screen.getByTestId('delete-modal-confirm').textContent).toContain('Excluir')
  })

  it('renders Cancel and Delete in EN', () => {
    render(vi.fn().mockResolvedValue(undefined), vi.fn(), 'en')
    expect(screen.getByTestId('delete-modal-cancel').textContent).toContain('Cancel')
    expect(screen.getByTestId('delete-modal-confirm').textContent).toContain('Delete')
  })

  it('modal has role=dialog and aria-modal=true', () => {
    render()
    const modal = screen.getByTestId('confirm-delete-modal')
    expect(modal.getAttribute('role')).toBe('dialog')
    expect(modal.getAttribute('aria-modal')).toBe('true')
  })

  it('does not show error message initially', () => {
    render()
    expect(screen.queryByTestId('delete-error-message')).toBeNull()
  })
})

// ── cancel ────────────────────────────────────────────────────────────────────

describe('ConfirmDeleteModal — cancel', () => {
  it('calls onCancel when Cancel button is clicked', async () => {
    const onCancel = vi.fn()
    render(vi.fn().mockResolvedValue(undefined), onCancel)
    fireEvent.click(screen.getByTestId('delete-modal-cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when X button is clicked', async () => {
    const onCancel = vi.fn()
    render(vi.fn().mockResolvedValue(undefined), onCancel)
    // The close button is the ✕ with aria-label cancel_delete
    const closeBtn = screen.getAllByRole('button').find(
      b => b.getAttribute('aria-label')?.includes('cancel') ||
           b.getAttribute('aria-label')?.includes('Cancelar')
    )
    if (closeBtn) fireEvent.click(closeBtn)
    expect(onCancel).toHaveBeenCalled()
  })
})

// ── deleting state ────────────────────────────────────────────────────────────

describe('ConfirmDeleteModal — deleting state', () => {
  it('disables both buttons while deleting', async () => {
    let resolveDelete!: () => void
    const slowDelete = new Promise<void>(res => { resolveDelete = res })
    render(() => slowDelete)

    fireEvent.click(screen.getByTestId('delete-modal-confirm'))

    await waitFor(() => {
      expect(screen.getByTestId('delete-modal-confirm').hasAttribute('disabled')).toBe(true)
      expect(screen.getByTestId('delete-modal-cancel').hasAttribute('disabled')).toBe(true)
    })

    resolveDelete()
  })

  it('shows "Excluindo…" (PT) during delete', async () => {
    let resolveDelete!: () => void
    const slowDelete = new Promise<void>(res => { resolveDelete = res })
    render(() => slowDelete)

    fireEvent.click(screen.getByTestId('delete-modal-confirm'))

    await waitFor(() =>
      expect(screen.getByTestId('delete-modal-confirm').textContent).toContain('Excluindo')
    )

    resolveDelete()
  })

  it('calls onConfirm when Delete button clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(onConfirm)
    fireEvent.click(screen.getByTestId('delete-modal-confirm'))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())
  })
})

// ── error handling ────────────────────────────────────────────────────────────

describe('ConfirmDeleteModal — error handling', () => {
  it('shows error message when onConfirm rejects with DeleteCharacterError', async () => {
    const err = new DeleteCharacterError('local_delete_failed', {
      localOk: false, cloudOk: false, storageOk: false, errors: [],
    })
    render(() => Promise.reject(err))

    fireEvent.click(screen.getByTestId('delete-modal-confirm'))

    await waitFor(() =>
      expect(screen.getByTestId('delete-error-message')).toBeDefined()
    )
  })

  it('error message has role=alert', async () => {
    const err = new DeleteCharacterError('local_delete_failed', {
      localOk: false, cloudOk: false, storageOk: false, errors: [],
    })
    render(() => Promise.reject(err))
    fireEvent.click(screen.getByTestId('delete-modal-confirm'))
    await waitFor(() => {
      const alert = screen.getByTestId('delete-error-message')
      expect(alert.getAttribute('role')).toBe('alert')
    })
  })

  it('re-enables buttons after error so user can retry', async () => {
    const err = new DeleteCharacterError('local_delete_failed', {
      localOk: false, cloudOk: false, storageOk: false, errors: [],
    })
    render(() => Promise.reject(err))
    fireEvent.click(screen.getByTestId('delete-modal-confirm'))
    await waitFor(() => screen.getByTestId('delete-error-message'))

    // After error, buttons should be enabled again (status is 'error', not 'deleting')
    expect(screen.getByTestId('delete-modal-confirm').hasAttribute('disabled')).toBe(false)
    expect(screen.getByTestId('delete-modal-cancel').hasAttribute('disabled')).toBe(false)
  })

  it('shows translated error for local_delete_failed (PT)', async () => {
    const err = new DeleteCharacterError('local_delete_failed', {
      localOk: false, cloudOk: false, storageOk: false, errors: [],
    })
    render(() => Promise.reject(err))
    fireEvent.click(screen.getByTestId('delete-modal-confirm'))
    await waitFor(() =>
      expect(screen.getByTestId('delete-error-message').textContent).toContain('Não foi possível')
    )
  })

  it('shows translated error for unknown code (PT)', async () => {
    render(() => Promise.reject(new Error('generic')))
    fireEvent.click(screen.getByTestId('delete-modal-confirm'))
    await waitFor(() =>
      expect(screen.getByTestId('delete-error-message').textContent).toContain('erro inesperado')
    )
  })
})
