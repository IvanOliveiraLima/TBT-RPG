import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { useCampaignsStore } from '@/store/campaigns'
import { CampaignServiceError } from '@/services/campaign'
import type { Campaign } from '@/domain/campaign'

const T = {
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

interface CreateCampaignModalProps {
  onCreated: (campaign: Campaign) => void
  onCancel: () => void
}

export function CreateCampaignModal({ onCreated, onCancel }: CreateCampaignModalProps) {
  const { t } = useTranslation()
  const createCampaign = useCampaignsStore(s => s.createCampaign)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'creating' | 'error'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmedName = name.trim()
    if (trimmedName.length === 0) return

    setStatus('creating')
    setErrorCode(null)
    try {
      const campaign = await createCampaign({ name: trimmedName, description })
      onCreated(campaign)
    } catch (err) {
      setStatus('error')
      setErrorCode(err instanceof CampaignServiceError ? err.code : 'create_failed')
    }
  }

  const isCreating = status === 'creating'
  const canSubmit = name.trim().length > 0 && !isCreating

  return (
    <div
      data-testid="create-campaign-modal"
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440,
          background: T.surface,
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: 16,
          padding: '28px 24px',
          fontFamily: T.sans,
        }}
      >
        <div style={{
          fontFamily: T.serif, fontSize: 16, fontWeight: 700,
          color: T.textPrimary, marginBottom: 20,
        }}>
          {t('create_campaign.title')}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: 'block',
            fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1,
            color: T.textMuted, marginBottom: 6,
          }}>
            {t('create_campaign.name_label')}
          </label>
          <input
            data-testid="campaign-name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && canSubmit) void handleSubmit() }}
            placeholder={t('create_campaign.name_placeholder')}
            maxLength={100}
            disabled={isCreating}
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

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1,
            color: T.textMuted, marginBottom: 6,
          }}>
            {t('create_campaign.description_label')}
          </label>
          <textarea
            data-testid="campaign-description-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('create_campaign.description_placeholder')}
            maxLength={500}
            disabled={isCreating}
            rows={3}
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
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {status === 'error' && errorCode && (
          <div
            role="alert"
            data-testid="create-campaign-error"
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
            {t(`create_campaign.error_${errorCode}` as Parameters<typeof t>[0]) ?? t('create_campaign.error_create_failed')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="create-campaign-cancel"
            onClick={onCancel}
            disabled={isCreating}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 500,
              color: T.textMuted,
              cursor: isCreating ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            data-testid="create-campaign-submit"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            style={{
              flex: 1,
              background: canSubmit ? T.purple : '#3A3450',
              border: 'none',
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 600,
              color: canSubmit ? T.textPrimary : T.textMuted,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: T.sans,
            }}
          >
            {isCreating ? t('create_campaign.creating') : t('create_campaign.create_button')}
          </button>
        </div>
      </div>
    </div>
  )
}
