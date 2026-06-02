import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { upsertMyProfile, UserProfileServiceError } from '@/services/user-profile'

const T = {
  bg:           '#0F0D14',
  surface:      '#15121C',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  danger:       '#E24B4A',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

interface ProfileSetupModalProps {
  onComplete: () => void
  onCancel: () => void
}

export function ProfileSetupModal({ onComplete, onCancel }: ProfileSetupModalProps) {
  const { t } = useTranslation()
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = displayName.trim()
    if (trimmed.length === 0) {
      setStatus('error')
      setErrorCode('empty_display_name')
      return
    }

    setStatus('saving')
    setErrorCode(null)
    try {
      await upsertMyProfile(trimmed)
      onComplete()
    } catch (err) {
      setStatus('error')
      setErrorCode(err instanceof UserProfileServiceError ? err.code : 'unknown')
    }
  }

  const isSaving = status === 'saving'

  return (
    <div
      data-testid="profile-setup-modal"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 400,
        background: T.surface,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 16,
        padding: '32px 24px',
        fontFamily: T.sans,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontFamily: T.serif, fontSize: 18, fontWeight: 700,
            color: T.textPrimary, marginBottom: 8,
          }}>
            {t('profile_setup.title')}
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
            {t('profile_setup.description')}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1,
            color: T.textMuted, marginBottom: 6,
          }}>
            {t('profile_setup.display_name_label')}
          </label>
          <input
            data-testid="display-name-input"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isSaving) void handleSubmit() }}
            placeholder={t('profile_setup.display_name_placeholder')}
            maxLength={50}
            disabled={isSaving}
            autoFocus
            style={{
              width: '100%',
              background: T.elevated,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              color: T.textPrimary,
              outline: 'none',
              fontFamily: T.sans,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {status === 'error' && errorCode && (
          <div
            role="alert"
            data-testid="profile-setup-error"
            style={{
              background: 'rgba(226,75,74,0.12)',
              border: '1px solid rgba(226,75,74,0.35)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
              color: T.danger,
              marginBottom: 16,
            }}
          >
            {t(`profile_setup.error_${errorCode}` as Parameters<typeof t>[0]) ?? t('profile_setup.error_unknown')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="profile-setup-cancel"
            onClick={onCancel}
            disabled={isSaving}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 500,
              color: T.textMuted,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            data-testid="profile-setup-submit"
            onClick={() => void handleSubmit()}
            disabled={isSaving || displayName.trim().length === 0}
            style={{
              flex: 1,
              background: isSaving || displayName.trim().length === 0 ? '#3A3450' : T.purple,
              border: 'none',
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 600,
              color: isSaving || displayName.trim().length === 0 ? T.textMuted : T.textPrimary,
              cursor: isSaving || displayName.trim().length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {isSaving ? t('profile_setup.saving') : t('profile_setup.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
