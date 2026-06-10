import { useState } from 'react'
import { useTranslation } from '@/i18n'
import type { ExportPayload } from '@/services/import-export'

const T = {
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textMuted:     '#7A7788',
  danger:        '#E24B4A',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

interface Props {
  payload: ExportPayload
  onConfirm: (mode: 'merge' | 'replace') => void
  onCancel: () => void
}

export function ChooseImportModeModal({ payload, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<'merge' | 'replace' | null>(null)

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      onClick={handleBackdropClick}
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
        data-testid="choose-import-mode-modal"
        style={{
          background:   T.surface,
          border:       `1px solid ${T.borderDefault}`,
          borderRadius: 16,
          width:        '100%',
          maxWidth:     420,
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
          <h2 style={{
            fontFamily: T.serif,
            fontSize:   15,
            fontWeight: 600,
            color:      T.textPrimary,
            margin:     0,
            flex:       1,
          }}>
            {t('import.choose_mode_title')}
          </h2>
          <button
            onClick={onCancel}
            aria-label={t('common.cancel')}
            style={{
              background: 'transparent', border: 'none',
              color: T.textMuted, fontSize: 18, cursor: 'pointer',
              padding: '2px 6px', borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
            {t('import.payload_summary', { count: String(payload.count) })}
          </p>

          {/* Merge option */}
          <button
            data-testid="import-mode-merge"
            onClick={() => setSelected('merge')}
            style={{
              background:    selected === 'merge' ? 'rgba(91,63,168,0.2)' : T.elevated,
              border:        `1px solid ${selected === 'merge' ? T.purple : T.borderSubtle}`,
              borderRadius:  10,
              padding:       '12px 14px',
              textAlign:     'left',
              cursor:        'pointer',
              display:       'flex',
              flexDirection: 'column',
              gap:           4,
              transition:    'border-color 150ms, background 150ms',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: T.textPrimary }}>
              {t('import.mode_merge_title')}
            </span>
            <span style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.45 }}>
              {t('import.mode_merge_description')}
            </span>
          </button>

          {/* Replace option */}
          <button
            data-testid="import-mode-replace"
            onClick={() => setSelected('replace')}
            style={{
              background:    selected === 'replace' ? 'rgba(226,75,74,0.15)' : T.elevated,
              border:        `1px solid ${selected === 'replace' ? T.danger : T.borderSubtle}`,
              borderRadius:  10,
              padding:       '12px 14px',
              textAlign:     'left',
              cursor:        'pointer',
              display:       'flex',
              flexDirection: 'column',
              gap:           4,
              transition:    'border-color 150ms, background 150ms',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: T.danger }}>
              {t('import.mode_replace_title')}
            </span>
            <span style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.45 }}>
              {t('import.mode_replace_description')}
            </span>
          </button>

          {/* Replace warning */}
          {selected === 'replace' && (
            <div
              data-testid="import-replace-warning"
              role="alert"
              style={{
                background:   'rgba(226,75,74,0.1)',
                border:       `1px solid rgba(226,75,74,0.35)`,
                borderRadius: 8,
                padding:      '10px 12px',
                fontSize:     12,
                color:        T.danger,
                lineHeight:   1.4,
              }}
            >
              {t('import.replace_warning')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display:        'flex',
          gap:            8,
          padding:        '14px 20px 18px',
          borderTop:      `1px solid ${T.borderSubtle}`,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border:     `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: '9px 18px',
              color: T.textSecondary, fontFamily: T.sans,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            data-testid="import-mode-confirm"
            onClick={() => { if (selected) onConfirm(selected) }}
            disabled={!selected}
            style={{
              background:   !selected ? T.elevated : selected === 'replace' ? T.danger : T.purple,
              border:       `1px solid ${!selected ? T.borderSubtle : selected === 'replace' ? T.danger : T.purple}`,
              borderRadius: 8, padding: '9px 20px',
              color:        !selected ? T.textMuted : T.textPrimary,
              fontFamily:   T.sans, fontSize: 13, fontWeight: 600,
              cursor:       !selected ? 'default' : 'pointer',
              transition:   'all 150ms',
            }}
          >
            {t('import.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
