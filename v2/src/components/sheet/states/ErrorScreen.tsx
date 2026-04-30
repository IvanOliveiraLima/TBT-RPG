import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/i18n'

const T = {
  bg:          '#0F0D14',
  surface:     '#15121C',
  borderSubtle:'#2A2537',
  textPrimary: '#F4EFE0',
  textMuted:   '#7A7788',
  danger:      '#E24B4A',
  ruby:        '#8B1A2E',
  rubyHover:   '#A32D42',
  serif:       "'Cinzel', Georgia, serif",
  sans:        "'Inter', system-ui, sans-serif",
} as const

interface ErrorScreenProps {
  message: string
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      <div style={{
        fontSize: 32,
        color: T.danger,
      }}>✕</div>
      <p style={{ fontFamily: T.serif, fontSize: 16, color: T.textPrimary, textAlign: 'center' }}>
        {t('screens.error_title')}
      </p>
      <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center' }}>
        {message}
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
        {t('screens.back_to_list')}
      </button>
    </div>
  )
}
