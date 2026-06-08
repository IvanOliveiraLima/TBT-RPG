import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from '@/i18n'

// ── Style constants ───────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: `radial-gradient(ellipse at top, rgba(91,63,168,0.18), transparent 55%), #0F0D14`,
  padding: '24px',
  fontFamily: "'Inter', system-ui, sans-serif",
}

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 360,
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 16,
  padding: '32px 24px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: 1,
  color: '#7A7788', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1B1725',
  border: '1px solid #2A2537',
  borderRadius: 8, padding: '10px 12px',
  fontSize: 14, color: '#F4EFE0',
  outline: 'none', boxSizing: 'border-box',
}

const linkBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none',
  fontSize: 13, color: '#7A7788',
  cursor: 'pointer', textDecoration: 'underline',
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: disabled ? '#3A3450' : '#5B3FA8',
    border: 'none', borderRadius: 10, padding: '12px',
    fontSize: 14, fontWeight: 600,
    color: disabled ? '#7A7788' : '#F4EFE0',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 200ms',
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type AuthMode = 'signin' | 'signup'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const initialMode: AuthMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  const { t } = useTranslation()
  const signIn = useAuthStore(s => s.signIn)
  const signUp = useAuthStore(s => s.signUp)

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'awaiting_confirmation'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const validation = useMemo(() => {
    if (mode === 'signin') return { valid: true, errorKey: null as string | null }
    if (!isValidEmail(email)) return { valid: false, errorKey: 'invalid_email_format' as string | null }
    if (password.length < 6) return { valid: false, errorKey: 'password_too_short' as string | null }
    if (password !== passwordConfirm) return { valid: false, errorKey: 'passwords_do_not_match' as string | null }
    return { valid: true, errorKey: null as string | null }
  }, [mode, email, password, passwordConfirm])

  async function handleSubmit() {
    setErrorCode(null)
    setStatus('submitting')

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

  const submitting = status === 'submitting'
  const submitDisabled = submitting

  // ── Awaiting confirmation ────────────────────────────────────────────────

  if (status === 'awaiting_confirmation') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#F4EFE0', letterSpacing: '3px', marginBottom: 6 }}>
              TBT<span style={{ color: '#D4A017' }}>·</span>RPG
            </div>
          </div>

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
            data-testid="back-to-signin-btn"
            onClick={() => {
              setStatus('idle')
              setMode('signin')
              setPassword('')
              setPasswordConfirm('')
            }}
            style={primaryBtnStyle(false)}
          >
            {t('auth.back_to_signin')}
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#F4EFE0', letterSpacing: '3px', marginBottom: 6 }}>
            TBT<span style={{ color: '#D4A017' }}>·</span>RPG
          </div>
          <div style={{ fontSize: 13, color: '#7A7788' }}>
            {mode === 'signin' ? t('auth.sign_in_title') : t('auth.signup_title')}
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

        {/* Password */}
        <div style={{ marginBottom: mode === 'signup' ? 14 : 20 }}>
          <label style={labelStyle}>{t('auth.password')}</label>
          <input
            data-testid="login-password-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            disabled={submitting}
            style={inputStyle}
          />
        </div>

        {/* Confirm password — signup only */}
        {mode === 'signup' && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('auth.password_confirm')}</label>
            <input
              data-testid="login-password-confirm-input"
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={submitting}
              style={inputStyle}
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
          data-testid="login-submit-btn"
          onClick={() => void handleSubmit()}
          disabled={submitDisabled}
          style={primaryBtnStyle(submitDisabled)}
        >
          {submitting
            ? t('auth.submitting')
            : mode === 'signin' ? t('auth.sign_in') : t('auth.signup')}
        </button>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            data-testid="login-toggle-mode-btn"
            onClick={handleToggleMode}
            disabled={submitting}
            style={linkBtnStyle}
          >
            {mode === 'signin' ? t('auth.no_account_yet') : t('auth.already_have_account')}
          </button>
        </div>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            data-testid="login-back-btn"
            onClick={() => navigate('/')}
            style={linkBtnStyle}
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    </div>
  )
}
