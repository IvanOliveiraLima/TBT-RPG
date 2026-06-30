import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from '@/i18n'
import {
  pageStyle, cardStyle, labelStyle, inputStyle, linkBtnStyle, primaryBtnStyle, isValidEmail,
} from './auth-styles'
import { PasswordInput } from '@/components/primitives/PasswordInput'

// ── Helpers ───────────────────────────────────────────────────────────────────

type AuthMode = 'signin' | 'signup' | 'forgot'

// ── Logo ─────────────────────────────────────────────────────────────────────

function TbtLogo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#F4EFE0', letterSpacing: '3px', marginBottom: 6 }}>
        TBT<span style={{ color: '#D4A017' }}>·</span>RPG
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const modeParam = searchParams.get('mode')
  const initialMode: AuthMode =
    modeParam === 'signup' ? 'signup' :
    modeParam === 'forgot' ? 'forgot' :
    'signin'

  const { t } = useTranslation()
  const signIn = useAuthStore(s => s.signIn)
  const signUp = useAuthStore(s => s.signUp)
  const requestPasswordReset = useAuthStore(s => s.requestPasswordReset)

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'awaiting_confirmation' | 'reset_email_sent'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const validation = useMemo(() => {
    if (mode === 'signin') return { valid: true, errorKey: null as string | null }
    if (mode === 'forgot') return { valid: isValidEmail(email), errorKey: 'invalid_email_format' as string | null }
    if (!isValidEmail(email)) return { valid: false, errorKey: 'invalid_email_format' as string | null }
    if (password.length < 6) return { valid: false, errorKey: 'password_too_short' as string | null }
    if (password !== passwordConfirm) return { valid: false, errorKey: 'passwords_do_not_match' as string | null }
    return { valid: true, errorKey: null as string | null }
  }, [mode, email, password, passwordConfirm])

  async function handleSubmit() {
    setErrorCode(null)
    setStatus('submitting')

    if (mode === 'forgot') {
      if (!isValidEmail(email)) {
        setStatus('idle')
        setErrorCode('invalid_email_format')
        return
      }
      // Anti-enumeration: always show the same screen regardless of result
      await requestPasswordReset(email)
      setStatus('reset_email_sent')
      return
    }

    if (mode === 'signin') {
      try {
        await signIn(email, password)
        navigate(redirectTo)
      } catch {
        setStatus('idle')
        setErrorCode('invalid_credentials')
      }
      return
    }

    // Signup
    if (!validation.valid) {
      setStatus('idle')
      setErrorCode(validation.errorKey)
      return
    }

    const result = await signUp(email, password)

    if (result.status === 'error') {
      setStatus('idle')
      setErrorCode(result.code)
      return
    }

    if (result.status === 'signed_in') {
      navigate(redirectTo)
      return
    }

    // email_confirmation_required
    setStatus('awaiting_confirmation')
  }

  function handleToggleMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setErrorCode(null)
    setPassword('')
    setPasswordConfirm('')
    setStatus('idle')
  }

  function handleGoForgot() {
    setMode('forgot')
    setErrorCode(null)
    setPassword('')
    setPasswordConfirm('')
    setStatus('idle')
  }

  function handleBackToSignin() {
    setMode('signin')
    setErrorCode(null)
    setPassword('')
    setPasswordConfirm('')
    setStatus('idle')
  }

  const submitting = status === 'submitting'

  // ── Awaiting confirmation ────────────────────────────────────────────────

  if (status === 'awaiting_confirmation') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <TbtLogo />

          <div
            data-testid="signup-confirmation-screen"
            style={{
              background: 'rgba(76,175,125,0.12)',
              border: '1px solid rgba(76,175,125,0.35)',
              borderRadius: 10,
              padding: '16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#4CAF7D', marginBottom: 6 }}>
              {t('auth.signup_success_title')}
            </div>
            <div style={{ fontSize: 13, color: '#C8C4D6', lineHeight: 1.6 }}>
              {t('auth.signup_success_message').replace('{email}', email)}
            </div>
            <div style={{ fontSize: 12, color: '#7A7788', marginTop: 8, lineHeight: 1.5 }}>
              {t('auth.signup_success_hint')}
            </div>
          </div>

          <button
            type="button"
            data-testid="back-to-signin-btn"
            onClick={handleBackToSignin}
            style={primaryBtnStyle(false)}
          >
            {t('auth.back_to_signin')}
          </button>
        </div>
      </div>
    )
  }

  // ── Reset email sent ─────────────────────────────────────────────────────

  if (status === 'reset_email_sent') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <TbtLogo />

          <div
            data-testid="forgot-sent-screen"
            style={{
              background: 'rgba(76,175,125,0.12)',
              border: '1px solid rgba(76,175,125,0.35)',
              borderRadius: 10,
              padding: '16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#4CAF7D', marginBottom: 6 }}>
              {t('auth.forgot_email_sent_title')}
            </div>
            <div style={{ fontSize: 13, color: '#C8C4D6', lineHeight: 1.6 }}>
              {t('auth.forgot_email_sent_message')}
            </div>
          </div>

          <button
            type="button"
            data-testid="forgot-back-to-signin-btn"
            onClick={handleBackToSignin}
            style={primaryBtnStyle(false)}
          >
            {t('auth.back_to_signin')}
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────

  const isForgot = mode === 'forgot'

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
            {isForgot
              ? t('auth.forgot_title')
              : mode === 'signin' ? t('auth.sign_in_title') : t('auth.signup_title')}
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>{t('auth.email')}</label>
          <input
            data-testid="login-email-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete={mode === 'signin' ? 'email' : 'username'}
            disabled={submitting}
            style={inputStyle}
          />
        </div>

        {/* Password — not in forgot mode */}
        {!isForgot && (
          <div style={{ marginBottom: mode === 'signup' ? 14 : 20 }}>
            <label style={labelStyle}>{t('auth.password')}</label>
            <PasswordInput
              data-testid="login-password-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              disabled={submitting}
              inputStyle={inputStyle}
            />
          </div>
        )}

        {/* Confirm password — signup only */}
        {mode === 'signup' && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('auth.password_confirm')}</label>
            <PasswordInput
              data-testid="login-password-confirm-input"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={submitting}
              inputStyle={inputStyle}
            />
          </div>
        )}

        {/* Error */}
        {errorCode && (
          <div
            data-testid="login-error"
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
          data-testid="login-submit-btn"
          disabled={submitting}
          style={primaryBtnStyle(submitting)}
        >
          {submitting
            ? t('auth.submitting')
            : isForgot
              ? t('auth.forgot_submit')
              : mode === 'signin' ? t('auth.sign_in') : t('auth.signup')}
        </button>

        {/* Forgot password link — signin mode only */}
        {mode === 'signin' && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button
              type="button"
              data-testid="forgot-password-link"
              onClick={handleGoForgot}
              disabled={submitting}
              style={linkBtnStyle}
            >
              {t('auth.forgot_password_link')}
            </button>
          </div>
        )}

        {/* Toggle mode / back */}
        <div style={{ textAlign: 'center', marginTop: isForgot ? 10 : 14 }}>
          {isForgot ? (
            <button
              type="button"
              data-testid="forgot-back-link"
              onClick={handleBackToSignin}
              disabled={submitting}
              style={linkBtnStyle}
            >
              {t('auth.back_to_signin')}
            </button>
          ) : (
            <button
              type="button"
              data-testid="login-toggle-mode-btn"
              onClick={handleToggleMode}
              disabled={submitting}
              style={linkBtnStyle}
            >
              {mode === 'signin' ? t('auth.no_account_yet') : t('auth.already_have_account')}
            </button>
          )}
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            type="button"
            data-testid="login-back-btn"
            onClick={() => navigate('/')}
            style={linkBtnStyle}
          >
            {t('common.back')}
          </button>
        </div>
      </form>
    </div>
  )
}
