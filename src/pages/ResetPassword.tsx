import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from '@/i18n'
import {
  pageStyle, cardStyle, labelStyle, inputStyle, linkBtnStyle, primaryBtnStyle,
} from './auth-styles'
import { PasswordInput } from '@/components/primitives/PasswordInput'

export default function ResetPassword() {
  const { t } = useTranslation()
  const updatePassword = useAuthStore(s => s.updatePassword)
  const signOut = useAuthStore(s => s.signOut)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  async function handleSubmit() {
    setErrorCode(null)

    if (newPassword.length < 6) {
      setErrorCode('password_too_short')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorCode('passwords_do_not_match')
      return
    }

    setStatus('submitting')
    const result = await updatePassword(newPassword)
    if (result.status === 'error') {
      setStatus('idle')
      setErrorCode(result.code)
    }
    // On 'updated': authCallbackType is cleared in the store, gate in App.tsx
    // drops and CharSelect renders with passwordResetSuccess banner.
  }

  async function handleSignOut() {
    await signOut()
    useAuthStore.setState({ authCallbackType: null })
  }

  const submitting = status === 'submitting'

  return (
    <div style={pageStyle}>
      <form
        style={cardStyle}
        noValidate
        onSubmit={e => { e.preventDefault(); void handleSubmit() }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#F4EFE0', letterSpacing: '3px', marginBottom: 6 }}>
            TBT<span style={{ color: '#D4A017' }}>·</span>RPG
          </div>
          <div style={{ fontSize: 13, color: '#7A7788' }}>
            {t('auth.reset_title')}
          </div>
        </div>

        {/* New password */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>{t('auth.reset_new_password')}</label>
          <PasswordInput
            data-testid="reset-new-password-input"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            disabled={submitting}
            inputStyle={inputStyle}
          />
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{t('auth.reset_confirm_password')}</label>
          <PasswordInput
            data-testid="reset-confirm-password-input"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={submitting}
            inputStyle={inputStyle}
          />
        </div>

        {/* Error */}
        {errorCode && (
          <div
            data-testid="reset-error"
            role="alert"
            style={{
              background: 'rgba(226,75,74,0.12)',
              border: '1px solid rgba(226,75,74,0.35)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: 13, color: '#E24B4A', marginBottom: 16,
            }}
          >
            {t(`auth.error_${errorCode}` as Parameters<typeof t>[0])}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          data-testid="reset-submit-btn"
          disabled={submitting}
          style={primaryBtnStyle(submitting)}
        >
          {submitting ? t('auth.submitting') : t('auth.reset_submit')}
        </button>

        {/* Sign out escape */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            type="button"
            data-testid="reset-signout-btn"
            onClick={() => void handleSignOut()}
            disabled={submitting}
            style={linkBtnStyle}
          >
            {t('auth.reset_signout')}
          </button>
        </div>
      </form>
    </div>
  )
}
