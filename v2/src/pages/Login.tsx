import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export default function Login() {
  const navigate   = useNavigate()
  const { signIn } = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse at top, rgba(91,63,168,0.18), transparent 55%),
        #0F0D14
      `,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: '#15121C',
        border: '1px solid #2A2537',
        borderRadius: 16,
        padding: '32px 24px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 20, fontWeight: 700,
            color: '#F4EFE0',
            letterSpacing: '3px',
            marginBottom: 6,
          }}>
            TBT<span style={{ color: '#D4A017' }}>·</span>RPG
          </div>
          <div style={{ fontSize: 13, color: '#7A7788' }}>
            Entrar na conta
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 1,
              color: '#7A7788',
              marginBottom: 6,
            }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                background: '#1B1725',
                border: '1px solid #2A2537',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                color: '#F4EFE0',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 1,
              color: '#7A7788',
              marginBottom: 6,
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                background: '#1B1725',
                border: '1px solid #2A2537',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                color: '#F4EFE0',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(226,75,74,0.12)',
              border: '1px solid rgba(226,75,74,0.35)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
              color: '#E24B4A',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#3A3450' : '#5B3FA8',
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontSize: 14, fontWeight: 600,
              color: loading ? '#7A7788' : '#F4EFE0',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 200ms',
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 13,
              color: '#7A7788',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
