import { useState } from 'react'
import type React from 'react'
import { useTranslation } from '@/i18n'
import { useAuthStore } from '@/store/auth'

interface Props {
  userEmail: string
  onClose: () => void
}

const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
}

const MODAL: React.CSSProperties = {
  background: '#1A1727',
  border: '1px solid #2A2537',
  borderRadius: 12,
  padding: 24,
  width: '100%',
  maxWidth: 400,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid #2A2537',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#F4EFE0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const DANGER_BTN: React.CSSProperties = {
  width: '100%',
  background: 'rgba(226,75,74,0.15)',
  border: '1px solid rgba(226,75,74,0.5)',
  borderRadius: 8,
  padding: '11px',
  fontSize: 13,
  fontWeight: 600,
  color: '#E24B4A',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const DANGER_BTN_DISABLED: React.CSSProperties = {
  ...DANGER_BTN,
  opacity: 0.4,
  cursor: 'not-allowed',
}

const CANCEL_BTN: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid #2A2537',
  borderRadius: 8,
  padding: '11px',
  fontSize: 13,
  fontWeight: 500,
  color: '#7A7788',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export function DeleteAccountModal({ userEmail, onClose }: Props) {
  const { t } = useTranslation()
  const deleteAccount = useAuthStore(s => s.deleteAccount)

  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [errorVisible, setErrorVisible] = useState(false)

  const emailMatches = confirmEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()
  const canDelete = emailMatches && !deleting

  async function handleDelete() {
    if (!canDelete) return
    setErrorVisible(false)
    setDeleting(true)
    try {
      await deleteAccount()
      // SIGNED_OUT propagates via onAuthStateChange — no manual close needed
    } catch {
      setDeleting(false)
      setErrorVisible(true)
    }
  }

  return (
    <div style={OVERLAY} data-testid="delete-account-modal">
      <div style={MODAL} role="dialog" aria-modal="true">
        {/* Title */}
        <div style={{ fontSize: 16, fontWeight: 700, color: '#E24B4A' }}>
          {t('account.delete_title')}
        </div>

        {/* Warning */}
        <div
          data-testid="delete-account-warning"
          style={{
            background: 'rgba(226,75,74,0.08)',
            border: '1px solid rgba(226,75,74,0.3)',
            borderRadius: 8,
            padding: '12px',
            fontSize: 13,
            color: '#C8C4D6',
            lineHeight: 1.6,
          }}
        >
          {t('account.delete_warning')}
        </div>

        {/* Email confirm */}
        <div>
          <label
            style={{ fontSize: 11, fontWeight: 600, color: '#7A7788', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            {t('account.delete_confirm_label')}
          </label>
          <input
            data-testid="delete-account-email-input"
            type="email"
            value={confirmEmail}
            onChange={e => setConfirmEmail(e.target.value)}
            disabled={deleting}
            autoComplete="off"
            style={INPUT_STYLE}
          />
        </div>

        {/* Error */}
        {errorVisible && (
          <div
            data-testid="delete-account-error"
            role="alert"
            style={{ fontSize: 13, color: '#E24B4A' }}
          >
            {t('account.delete_error')}
          </div>
        )}

        {/* Delete button */}
        <button
          type="button"
          data-testid="delete-account-confirm-btn"
          disabled={!canDelete}
          onClick={() => void handleDelete()}
          style={canDelete ? DANGER_BTN : DANGER_BTN_DISABLED}
        >
          {deleting ? t('account.delete_in_progress') : t('account.delete_button')}
        </button>

        {/* Cancel */}
        <button
          type="button"
          data-testid="delete-account-cancel-btn"
          onClick={onClose}
          disabled={deleting}
          style={CANCEL_BTN}
        >
          {t('account.delete_cancel')}
        </button>
      </div>
    </div>
  )
}
