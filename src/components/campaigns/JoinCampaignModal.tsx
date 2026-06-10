import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n'
import { lookupCampaignByCode, acceptCampaignInvite, CampaignServiceError } from '@/services/campaign'

const T = {
  bg:            '#0F0D14',
  surface:       '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textMuted:     '#7A7788',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  danger:        '#E24B4A',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

interface JoinCampaignModalProps {
  onJoined: (campaignId: string, status: 'joined' | 'already_member') => void
  onCancel: () => void
  prefilledCode?: string
}

type Status = 'idle' | 'looking_up' | 'previewing' | 'joining' | 'error'

export function JoinCampaignModal({ onJoined, onCancel, prefilledCode }: JoinCampaignModalProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState(prefilledCode ?? '')
  const [preview, setPreview] = useState<{ id: string; name: string; description: string | null } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  useEffect(() => {
    const cleaned = code.replace(/-/g, '').trim().toUpperCase()

    const reset = () => Promise.resolve().then(() => {
      setPreview(null)
      setErrorCode(null)
      setStatus('idle')
    })

    if (cleaned.length !== 8) {
      void reset()
      return
    }

    void Promise.resolve().then(() => {
      setStatus('looking_up')
      setPreview(null)
      setErrorCode(null)
      return lookupCampaignByCode(cleaned)
    }).then((data) => {
      if (data) {
        setPreview(data)
        setStatus('previewing')
      } else {
        setStatus('error')
        setErrorCode('not_found')
      }
    }).catch(() => {
      setStatus('error')
      setErrorCode('lookup_failed')
    })
  }, [code])

  async function handleJoin() {
    if (!preview) return
    const cleaned = code.replace(/-/g, '').trim().toUpperCase()
    setStatus('joining')

    try {
      const result = await acceptCampaignInvite(cleaned)
      if (result.status === 'not_found') {
        setStatus('error')
        setErrorCode('not_found')
        return
      }
      onJoined(result.campaignId, result.status)
    } catch (err) {
      setStatus('error')
      setErrorCode(err instanceof CampaignServiceError ? err.code : 'unknown')
    }
  }

  const joinDisabled = !preview || status === 'joining' || status === 'looking_up'

  return (
    <div
      data-testid="join-campaign-modal"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: T.surface,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 18,
        padding: 28,
        width: '100%',
        maxWidth: 400,
        fontFamily: T.sans,
      }}>
        <div style={{
          fontFamily: T.serif, fontSize: 16, fontWeight: 700,
          color: T.textPrimary, marginBottom: 8,
        }}>
          {t('join_campaign.title')}
        </div>
        <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
          {t('join_campaign.description')}
        </div>

        {/* Code input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: T.textMuted, letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 6,
          }}>
            {t('join_campaign.code_label')}
          </label>
          <input
            data-testid="join-code-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
            aria-label={t('aria.invite_code_input')}
            autoFocus
            style={{
              width: '100%',
              background: T.bg,
              border: `1px solid ${T.borderDefault}`,
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 18,
              fontFamily: T.serif,
              fontWeight: 700,
              color: T.gold,
              letterSpacing: 4,
              textAlign: 'center',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Looking up indicator */}
        {status === 'looking_up' && (
          <div style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, marginBottom: 16 }}>
            …
          </div>
        )}

        {/* Campaign preview */}
        {preview && status === 'previewing' && (
          <div
            data-testid="join-campaign-preview"
            style={{
              background: T.bg,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 10, padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{
              fontFamily: T.serif, fontSize: 14, fontWeight: 700,
              color: T.textPrimary, marginBottom: preview.description ? 4 : 0,
            }}>
              {preview.name}
            </div>
            {preview.description && (
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.55 }}>
                {preview.description}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {status === 'error' && errorCode && (
          <div
            data-testid="join-campaign-error"
            role="alert"
            style={{ fontSize: 12, color: T.danger, marginBottom: 16 }}
          >
            {t(`join_campaign.error_${errorCode}` as Parameters<typeof t>[0])}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="join-campaign-cancel"
            onClick={onCancel}
            disabled={status === 'joining'}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: '10px',
              color: T.textSecondary, fontSize: 12, fontWeight: 600,
              cursor: status === 'joining' ? 'not-allowed' : 'pointer',
              opacity: status === 'joining' ? 0.5 : 1,
              fontFamily: T.sans,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            data-testid="join-campaign-submit"
            onClick={() => void handleJoin()}
            disabled={joinDisabled}
            style={{
              flex: 1,
              background: joinDisabled ? T.borderSubtle : T.purple,
              border: 'none',
              borderRadius: 8, padding: '10px',
              color: T.textPrimary, fontSize: 12, fontWeight: 600,
              cursor: joinDisabled ? 'not-allowed' : 'pointer',
              fontFamily: T.sans,
              transition: 'background 200ms',
            }}
          >
            {status === 'joining' ? t('join_campaign.joining') : t('join_campaign.join')}
          </button>
        </div>
      </div>
    </div>
  )
}
