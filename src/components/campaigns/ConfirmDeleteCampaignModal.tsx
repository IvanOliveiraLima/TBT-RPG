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
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  ruby:         '#8B1A2E',
  rubyHover:    '#A32D42',
  danger:       '#E24B4A',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

interface ConfirmDeleteCampaignModalProps {
  campaign: Campaign
  onDeleted: () => void
  onCancel: () => void
}

export function ConfirmDeleteCampaignModal({ campaign, onDeleted, onCancel }: ConfirmDeleteCampaignModalProps) {
  const { t } = useTranslation()
  const deleteCampaign = useCampaignsStore(s => s.deleteCampaign)
  const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  async function handleDelete() {
    setStatus('deleting')
    setErrorCode(null)
    try {
      await deleteCampaign(campaign.id)
      onDeleted()
    } catch (err) {
      setStatus('error')
      setErrorCode(err instanceof CampaignServiceError ? err.code : 'delete_failed')
    }
  }

  const isDeleting = status === 'deleting'

  return (
    <div
      data-testid="confirm-delete-campaign-modal"
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
        padding: '28px 24px',
        fontFamily: T.sans,
      }}>
        <div style={{
          fontFamily: T.serif, fontSize: 16, fontWeight: 700,
          color: T.textPrimary, marginBottom: 12,
        }}>
          {t('delete_campaign.title')}
        </div>

        <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
          {t('delete_campaign.warning').replace('{name}', campaign.name)}
        </div>

        <div style={{
          fontSize: 12, color: T.textMuted, marginBottom: 20, lineHeight: 1.5,
        }}>
          {t('delete_campaign.note')}
        </div>

        {status === 'error' && errorCode && (
          <div
            role="alert"
            data-testid="delete-campaign-error"
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
            {t(`delete_campaign.error_${errorCode}` as Parameters<typeof t>[0]) ?? t('delete_campaign.error_delete_failed')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="delete-campaign-cancel"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 500,
              color: T.textMuted,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            data-testid="delete-campaign-confirm"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            style={{
              flex: 1,
              background: isDeleting ? '#3A3450' : T.ruby,
              border: 'none',
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 600,
              color: isDeleting ? T.textMuted : T.textPrimary,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {isDeleting ? t('delete_campaign.deleting') : t('delete_campaign.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
