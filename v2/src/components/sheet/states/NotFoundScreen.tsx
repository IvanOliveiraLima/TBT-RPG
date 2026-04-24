import { useNavigate } from 'react-router-dom'

const T = {
  bg:          '#0F0D14',
  textPrimary: '#F4EFE0',
  textMuted:   '#7A7788',
  ruby:        '#8B1A2E',
  rubyHover:   '#A32D42',
  serif:       "'Cinzel', Georgia, serif",
  sans:        "'Inter', system-ui, sans-serif",
} as const

export function NotFoundScreen() {
  const navigate = useNavigate()
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: T.bg,
      fontFamily: T.sans,
      gap: 16,
      padding: 24,
    }}>
      <p style={{ fontFamily: T.serif, fontSize: 20, color: T.textPrimary }}>
        ?
      </p>
      <p style={{ fontFamily: T.serif, fontSize: 16, color: T.textPrimary, textAlign: 'center' }}>
        Personagem não encontrado
      </p>
      <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center' }}>
        Este personagem não existe ou foi removido.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 8,
          background: T.ruby,
          border: `1px solid ${T.rubyHover}`,
          color: '#fff',
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Voltar para lista
      </button>
    </div>
  )
}
