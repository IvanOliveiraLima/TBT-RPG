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

interface ConfirmLeaveCampaignModalProps {
  campaign: Campaign
  onLeft: () => void
  onCancel: () => void
}

export function ConfirmLeaveCampaignModal({ campaign, onLeft, onCancel }: ConfirmLeaveCampaignModalProps) {
  const { t } = useTranslation()
  const leaveCampaign = useCampaignsStore(s => s.leaveCampaign)
  const [status, setStatus] = useState<'idle' | 'leaving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleLeave() {
    setStatus('leaving')
    setErrorMsg(null)
    try {
      await leaveCampaign(campaign.id)
      onLeft()
    } catch (err) {
      setStatus('error')
      const code = err instanceof CampaignServiceError ? err.code : 'leave_failed'
      setErrorMsg(code === 'not_authenticated' ? t('campaign_view.error_not_authenticated') : t('leave_campaign.error'))
    }
  }

  const isLeaving = status === 'leaving'

  return (
    <div
      data-testid="confirm-leave-campaign-modal"
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
          {t('leave_campaign.title')}
        </div>

        <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
          {t('leave_campaign.warning').replace('{name}', campaign.name)}
        </div>

        <div style={{
          fontSize: 12, color: T.textMuted, marginBottom: 20, lineHeight: 1.5,
        }}>
          {t('leave_campaign.note')}
        </div>

        {status === 'error' && errorMsg && (
          <div
            role="alert"
            data-testid="leave-campaign-error"
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
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="leave-campaign-cancel"
            onClick={onCancel}
            disabled={isLeaving}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 500,
              color: T.textMuted,
              cursor: isLeaving ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            data-testid="leave-campaign-confirm"
            onClick={() => void handleLeave()}
            disabled={isLeaving}
            style={{
              flex: 1,
              background: isLeaving ? '#3A3450' : T.ruby,
              border: 'none',
              borderRadius: 8,
              padding: '10px',
              fontSize: 13, fontWeight: 600,
              color: isLeaving ? T.textMuted : T.textPrimary,
              cursor: isLeaving ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {isLeaving ? t('leave_campaign.leaving') : t('leave_campaign.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
