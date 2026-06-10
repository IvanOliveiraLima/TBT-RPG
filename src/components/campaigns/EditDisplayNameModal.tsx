import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { upsertMyProfile, UserProfileServiceError } from '@/services/user-profile'
import type { UserProfile } from '@/domain/campaign'

const T = {
  bg:           'rgba(0,0,0,0.7)',
  surface:      '#1B1725',
  border:       '#2A2537',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  danger:       '#E24B4A',
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface Props {
  currentName: string
  onSaved: (updated: UserProfile) => void
  onCancel: () => void
}

export function EditDisplayNameModal({ currentName, onSaved, onCancel }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState(currentName)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const trimmed = name.trim()
  const unchanged = trimmed === currentName
  const saveDisabled = status === 'saving' || trimmed.length === 0 || unchanged

  async function handleSave() {
    if (saveDisabled) return
    setStatus('saving')
    setErrorCode(null)
    try {
      const updated = await upsertMyProfile(trimmed)
      onSaved(updated)
    } catch (err) {
      setStatus('error')
      setErrorCode(err instanceof UserProfileServiceError ? err.code : 'unknown')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !saveDisabled) void handleSave()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      data-testid="edit-display-name-modal"
      onClick={status === 'saving' ? undefined : onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: 24,
          width: '100%', maxWidth: 400,
        }}
      >
        <div style={{
          fontSize: 18, fontWeight: 700,
          color: T.textPrimary,
          fontFamily: "'Cinzel', Georgia, serif",
          marginBottom: 8,
        }}>
          {t('edit_display_name.title')}
        </div>

        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
          {t('edit_display_name.description')}
        </div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {t('aria.edit_display_name_input')}
          </div>
          <input
            data-testid="edit-display-name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            disabled={status === 'saving'}
            autoFocus
            aria-label={t('aria.edit_display_name_input')}
            style={{
              width: '100%',
              background: '#0F0D14',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '10px 12px',
              color: T.textPrimary,
              fontSize: 14,
              fontFamily: T.sans,
              boxSizing: 'border-box',
            }}
          />
        </label>

        {status === 'error' && errorCode && (
          <div
            data-testid="edit-display-name-error"
            role="alert"
            style={{ fontSize: 13, color: T.danger, marginBottom: 16 }}
          >
            {t(`profile_setup.error_${errorCode}` as Parameters<typeof t>[0])}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            data-testid="edit-display-name-cancel"
            onClick={onCancel}
            disabled={status === 'saving'}
            style={{
              background: 'transparent',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '9px 18px',
              color: T.textSecondary,
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: T.sans,
            }}
          >
            {t('common.cancel')}
          </button>

          <button
            data-testid="edit-display-name-save"
            onClick={() => void handleSave()}
            disabled={saveDisabled}
            style={{
              background: saveDisabled ? '#2A2537' : T.purple,
              border: 'none',
              borderRadius: 8,
              padding: '9px 18px',
              color: saveDisabled ? T.textMuted : T.textPrimary,
              fontSize: 13, fontWeight: 600,
              cursor: saveDisabled ? 'default' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {status === 'saving' ? t('edit_display_name.saving') : t('edit_display_name.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
