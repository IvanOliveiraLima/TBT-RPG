import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const T = {
  surface:       '#15121C',
  borderDefault: '#3A3450',
  borderSubtle:  '#2A2537',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textMuted:     '#7A7788',
  danger:        '#E24B4A',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

interface Props {
  errorCode: string
  onClose: () => void
}

export function ImportErrorModal({ errorCode, onClose }: Props) {
  const { t } = useTranslation()

  const errorKey = `import.error_${errorCode}` as TranslationKey

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         1000,
        padding:        16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid="import-error-modal"
        style={{
          background:   T.surface,
          border:       `1px solid ${T.borderDefault}`,
          borderRadius: 16,
          width:        '100%',
          maxWidth:     380,
          boxShadow:    '0 24px 60px rgba(0,0,0,0.6)',
          fontFamily:   T.sans,
          overflow:     'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          padding:      '18px 20px 14px',
          borderBottom: `1px solid ${T.borderSubtle}`,
        }}>
          <span style={{ color: T.danger, fontSize: 18 }}>⚠</span>
          <h2 style={{
            fontFamily: T.serif, fontSize: 15, fontWeight: 600,
            color: T.textPrimary, margin: 0, flex: 1,
          }}>
            {t('import.error_title')}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <p
            data-testid="import-error-message"
            style={{ margin: 0, fontSize: 13, color: T.danger, lineHeight: 1.5 }}
          >
            {t(errorKey)}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display:        'flex',
          justifyContent: 'flex-end',
          padding:        '14px 20px 18px',
          borderTop:      `1px solid ${T.borderSubtle}`,
        }}>
          <button
            data-testid="import-error-close"
            onClick={onClose}
            style={{
              background:   'transparent',
              border:       `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: '9px 18px',
              color:        T.textSecondary, fontFamily: T.sans,
              fontSize:     13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('import.success_close')}
          </button>
        </div>
      </div>
    </div>
  )
}
