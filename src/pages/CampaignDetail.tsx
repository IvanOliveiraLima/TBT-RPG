import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { getCampaign } from '@/services/campaign'
import { useTranslation } from '@/i18n'
import type { Campaign } from '@/domain/campaign'

const T = {
  bg:           '#0F0D14',
  surface:      '#15121C',
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  gold:         '#D4A017',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login?redirectTo=/campaigns')
      return
    }
    if (!id) {
      navigate('/campaigns')
      return
    }

    getCampaign(id).then(c => {
      setCampaign(c)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [id, user, authLoading, navigate])

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100dvh', background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.textMuted, fontFamily: T.sans, fontSize: 14,
      }}>
        …
      </div>
    )
  }

  if (!campaign) {
    return (
      <div style={{
        minHeight: '100dvh', background: T.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: T.textMuted, fontFamily: T.sans, fontSize: 14, gap: 16,
      }}>
        <div>Campaign not found.</div>
        <button
          onClick={() => navigate('/campaigns')}
          style={{
            background: 'transparent',
            border: `1px solid ${T.borderSubtle}`,
            borderRadius: 8, padding: '8px 16px',
            color: T.textSecondary, fontSize: 13, cursor: 'pointer',
            fontFamily: T.sans,
          }}
        >
          {t('campaigns.my_campaigns')}
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: `
        radial-gradient(ellipse at top, rgba(91,63,168,0.12), transparent 55%),
        ${T.bg}
      `,
      padding: '24px 16px',
      fontFamily: T.sans,
      color: T.textPrimary,
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/campaigns')}
          style={{
            background: 'transparent', border: 'none',
            color: T.textMuted, cursor: 'pointer',
            padding: '6px 0', fontSize: 12, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: T.sans,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('campaigns.my_campaigns')}
        </button>

        {/* Campaign header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: T.serif, fontSize: 24, fontWeight: 700,
            color: T.textPrimary, marginBottom: 8,
          }}>
            {campaign.name}
          </div>
          {campaign.description && (
            <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6 }}>
              {campaign.description}
            </div>
          )}
        </div>

        {/* Placeholder content */}
        <div
          data-testid="campaign-detail-placeholder"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderSubtle}`,
            borderRadius: 14,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <div style={{
            fontSize: 32, marginBottom: 16,
            opacity: 0.4,
          }}>
            ⚔
          </div>
          <div style={{
            fontSize: 14, color: T.textSecondary, marginBottom: 8, fontWeight: 500,
          }}>
            {t('campaigns.detail_placeholder')}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            {t('campaigns.detail_placeholder_hint')}
          </div>
        </div>
      </div>
    </div>
  )
}
