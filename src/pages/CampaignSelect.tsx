import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useCampaignsStore } from '@/store/campaigns'
import { getMyProfile } from '@/services/user-profile'
import { useTranslation } from '@/i18n'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { ConfirmDeleteCampaignModal } from '@/components/campaigns/ConfirmDeleteCampaignModal'
import { ConfirmLeaveCampaignModal } from '@/components/campaigns/ConfirmLeaveCampaignModal'
import { ProfileSetupModal } from '@/components/campaigns/ProfileSetupModal'
import { JoinCampaignModal } from '@/components/campaigns/JoinCampaignModal'
import type { Campaign } from '@/domain/campaign'

const T = {
  bg:            '#0F0D14',
  surface:       '#15121C',
  borderSubtle:  '#2A2537',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textMuted:     '#7A7788',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

export default function CampaignSelect() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)
  const { campaigns, loading, fetchCampaigns } = useCampaignsStore()
  const [profileSetupOpen, setProfileSetupOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null)
  const [pendingLeave, setPendingLeave] = useState<Campaign | null>(null)
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/login?redirectTo=/campaigns')
      return
    }

    // Check if user has a display name set up
    getMyProfile().then(profile => {
      if (!profile) {
        setProfileSetupOpen(true)
      } else {
        void fetchCampaigns()
      }
      setProfileChecked(true)
    }).catch(() => {
      // If profile check fails, still proceed to campaigns
      void fetchCampaigns()
      setProfileChecked(true)
    })
  }, [user, authLoading, navigate, fetchCampaigns])

  if (authLoading || !user) return null

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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent', border: 'none',
              color: T.textMuted, cursor: 'pointer',
              padding: '6px 0', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: T.sans,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Meus Personagens
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
          <div style={{
            fontFamily: T.serif, fontSize: 22, fontWeight: 700, color: T.textPrimary,
          }}>
            {t('campaigns.my_campaigns')}
          </div>
          {!loading && campaigns.length > 0 && (
            <div style={{ fontSize: 12, color: T.textMuted }}>
              {campaigns.length === 1
                ? t('campaigns.count_one').replace('{count}', '1')
                : t('campaigns.count_other').replace('{count}', String(campaigns.length))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            data-testid="create-campaign-btn"
            aria-label={t('aria.create_campaign')}
            onClick={() => setCreateModalOpen(true)}
            style={{
              flex: 1,
              background: T.purple,
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontSize: 13, fontWeight: 600,
              color: T.textPrimary,
              cursor: 'pointer',
              fontFamily: T.sans,
            }}
          >
            + {t('campaigns.create')}
          </button>
          <button
            data-testid="join-campaign-btn"
            onClick={() => setJoinModalOpen(true)}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 10,
              padding: '12px',
              fontSize: 13, fontWeight: 600,
              color: T.textSecondary,
              cursor: 'pointer',
              fontFamily: T.sans,
            }}
          >
            {t('campaigns.join_with_code')}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div
            data-testid="campaigns-loading"
            style={{ textAlign: 'center', color: T.textMuted, padding: 40, fontSize: 13 }}
          >
            …
          </div>
        )}

        {/* Empty state */}
        {!loading && profileChecked && campaigns.length === 0 && (
          <div
            data-testid="campaigns-empty"
            style={{
              textAlign: 'center', padding: '48px 24px',
              color: T.textMuted, fontSize: 14, lineHeight: 1.6,
            }}
          >
            {t('campaigns.empty_state')}
          </div>
        )}

        {/* Campaign list */}
        {!loading && campaigns.length > 0 && (
          <div
            data-testid="campaign-list"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {campaigns.map(c => (
              <CampaignCard
                key={c.id}
                campaign={c}
                currentUserId={user.id}
                onOpen={() => navigate(`/campaigns/${c.id}`)}
                onRequestDelete={(id, name) => setPendingDelete(campaigns.find(x => x.id === id) ?? { id, name, description: null, ownerId: user.id, inviteCode: '', createdAt: 0, updatedAt: 0 })}
              onRequestLeave={(id, name) => setPendingLeave(campaigns.find(x => x.id === id) ?? { id, name, description: null, ownerId: '', inviteCode: '', createdAt: 0, updatedAt: 0 })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {profileSetupOpen && (
        <ProfileSetupModal
          onComplete={() => {
            setProfileSetupOpen(false)
            void fetchCampaigns()
          }}
          onCancel={() => navigate('/')}
        />
      )}

      {createModalOpen && (
        <CreateCampaignModal
          onCreated={(campaign) => {
            setCreateModalOpen(false)
            navigate(`/campaigns/${campaign.id}`)
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      )}

      {joinModalOpen && (
        <JoinCampaignModal
          onJoined={(campaignId) => {
            setJoinModalOpen(false)
            navigate(`/campaigns/${campaignId}`)
          }}
          onCancel={() => setJoinModalOpen(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmDeleteCampaignModal
          campaign={pendingDelete}
          onDeleted={() => setPendingDelete(null)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingLeave && (
        <ConfirmLeaveCampaignModal
          campaign={pendingLeave}
          onLeft={() => setPendingLeave(null)}
          onCancel={() => setPendingLeave(null)}
        />
      )}
    </div>
  )
}
