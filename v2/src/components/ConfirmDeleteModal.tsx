/**
 * ConfirmDeleteModal — two-button confirmation dialog for character deletion.
 *
 * Shows warning text with the character name, Cancel and Delete buttons.
 * During deletion: both buttons disabled, Delete shows loading text.
 * On error: inline alert with translated message, user can retry or cancel.
 * Backdrop click and X button close the modal (blocked during deletion).
 */

import { useState } from 'react'
import { parseDeleteErrorCode } from '@/services/delete-character'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const T = {
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textTertiary:  '#A09DB0',
  textMuted:     '#7A7788',
  danger:        '#E24B4A',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

interface ConfirmDeleteModalProps {
  characterName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function ConfirmDeleteModal({ characterName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const { t } = useTranslation()
  const [status,    setStatus]    = useState<'idle' | 'deleting' | 'error'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const isDeleting = status === 'deleting'

  async function handleConfirm() {
    setStatus('deleting')
    setErrorCode(null)
    try {
      await onConfirm()
      // Parent closes the modal after success by removing it from the tree
    } catch (err) {
      setStatus('error')
      setErrorCode(parseDeleteErrorCode(err))
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isDeleting) onCancel()
  }

  return (
    /* Backdrop */
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
        padding:        '16px',
      }}
    >
      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('delete_modal.title' as TranslationKey)}
        data-testid="confirm-delete-modal"
        style={{
          background:   T.surface,
          border:       `1px solid ${T.borderDefault}`,
          borderRadius: 16,
          width:        '100%',
          maxWidth:     400,
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
            fontFamily: T.serif,
            fontSize:   15,
            fontWeight: 600,
            color:      T.textPrimary,
            margin:     0,
            flex:       1,
          }}>
            {t('delete_modal.title' as TranslationKey)}
          </h2>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            aria-label={t('aria.cancel_delete' as TranslationKey)}
            style={{
              background:   'transparent',
              border:       'none',
              color:        T.textMuted,
              fontSize:     18,
              cursor:       isDeleting ? 'default' : 'pointer',
              padding:      '2px 6px',
              borderRadius: 6,
              opacity:      isDeleting ? 0.4 : 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 14, color: T.textPrimary, lineHeight: 1.5 }}>
            {t('delete_modal.warning' as TranslationKey, { name: characterName })}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: T.textTertiary, lineHeight: 1.5 }}>
            {t('delete_modal.note' as TranslationKey)}
          </p>

          {status === 'error' && errorCode && (
            <div
              role="alert"
              data-testid="delete-error-message"
              style={{
                background:   'rgba(226,75,74,0.1)',
                border:       `1px solid rgba(226,75,74,0.35)`,
                borderRadius: 8,
                padding:      '10px 12px',
                fontSize:     13,
                color:        T.danger,
                lineHeight:   1.4,
              }}
            >
              {t(`delete_modal.error_${errorCode}` as TranslationKey)}
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
            disabled={isDeleting}
            aria-label={t('aria.cancel_delete' as TranslationKey)}
            data-testid="delete-modal-cancel"
            style={{
              background:   'transparent',
              border:       `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
              padding:      '9px 18px',
              color:        T.textSecondary,
              fontFamily:   T.sans,
              fontSize:     13,
              fontWeight:   600,
              cursor:       isDeleting ? 'default' : 'pointer',
              opacity:      isDeleting ? 0.4 : 1,
            }}
          >
            {t('common.cancel' as TranslationKey)}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            aria-label={t('aria.confirm_delete' as TranslationKey)}
            data-testid="delete-modal-confirm"
            style={{
              background:   isDeleting ? T.elevated : T.danger,
              border:       `1px solid ${isDeleting ? T.borderSubtle : T.danger}`,
              borderRadius: 8,
              padding:      '9px 20px',
              color:        isDeleting ? T.textMuted : T.textPrimary,
              fontFamily:   T.sans,
              fontSize:     13,
              fontWeight:   600,
              cursor:       isDeleting ? 'default' : 'pointer',
              transition:   'all 150ms',
              opacity:      isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting
              ? t('delete_modal.deleting' as TranslationKey)
              : t('delete_modal.confirm' as TranslationKey)}
          </button>
        </div>
      </div>
    </div>
  )
}
