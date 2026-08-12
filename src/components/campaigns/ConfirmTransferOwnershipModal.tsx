import { useState } from 'react'
import { useTranslation } from '@/i18n'
import type { EnrichedMember } from '@/components/campaigns/MemberRowMenu'

const T = {
  bg:           'rgba(0,0,0,0.7)',
  surface:      '#1B1725',
  border:       '#2A2537',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  danger:       '#E24B4A',
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface Props {
  member: EnrichedMember
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function ConfirmTransferOwnershipModal({ member, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'transferring' | 'error'>('idle')
  const memberName = member.profile?.displayName ?? t('campaign_detail.unknown_member')

  async function handleConfirm() {
    setStatus('transferring')
    try {
      await onConfirm()
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      data-testid="confirm-transfer-ownership-modal"
      onClick={status === 'transferring' ? undefined : onCancel}
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
          marginBottom: 12,
        }}>
          {t('campaign_detail.transfer_title')}
        </div>

        <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>
          {t('campaign_detail.transfer_warning').replace('{name}', memberName)}
        </div>

        {status === 'error' && (
          <div
            data-testid="transfer-ownership-error"
            role="alert"
            style={{ fontSize: 13, color: T.danger, marginBottom: 16 }}
          >
            {t('campaign_detail.transfer_error')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            data-testid="transfer-ownership-cancel"
            onClick={onCancel}
            disabled={status === 'transferring'}
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
            data-testid="transfer-ownership-confirm"
            onClick={() => void handleConfirm()}
            disabled={status === 'transferring'}
            style={{
              background: 'transparent',
              border: `1px solid rgba(226,75,74,0.4)`,
              borderRadius: 8,
              padding: '9px 18px',
              color: T.danger,
              fontSize: 13, fontWeight: 600,
              cursor: status === 'transferring' ? 'default' : 'pointer',
              opacity: status === 'transferring' ? 0.6 : 1,
              fontFamily: T.sans,
            }}
          >
            {status === 'transferring' ? t('campaign_detail.transfer_confirm') + '…' : t('campaign_detail.transfer_confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
