import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { getCampaign, listCampaignMembers, removeMember } from '@/services/campaign'
import { listProfilesByIds } from '@/services/user-profile'
import { unlinkCharacterFromCampaign } from '@/services/campaign-characters'
import { fetchLinkedCharactersDetails } from '@/services/campaign-view'
import type { LinkedCharacterDetails } from '@/services/campaign-view'
import { LinkedCharCard } from '@/components/campaigns/LinkedCharCard'
import { useTranslation } from '@/i18n'
import { InviteCodeBlock } from '@/components/campaigns/InviteCodeBlock'
import { LinkCharacterModal } from '@/components/campaigns/LinkCharacterModal'
import { ConfirmDeleteCampaignModal } from '@/components/campaigns/ConfirmDeleteCampaignModal'
import { ConfirmLeaveCampaignModal } from '@/components/campaigns/ConfirmLeaveCampaignModal'
import { MemberRowMenu } from '@/components/campaigns/MemberRowMenu'
import { EditDisplayNameModal } from '@/components/campaigns/EditDisplayNameModal'
import { ConfirmRemoveMemberModal } from '@/components/campaigns/ConfirmRemoveMemberModal'
import type { Campaign, CampaignMember, UserProfile } from '@/domain/campaign'

const T = {
  bg:           '#0F0D14',
  surface:      '#15121C',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  gold:         '#D4A017',
  ruby:         '#8B1A2E',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

type EnrichedMember = CampaignMember & { profile: UserProfile | null }

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [members, setMembers] = useState<EnrichedMember[]>([])
  const [loading, setLoading] = useState(true)
  const [linkedDetails, setLinkedDetails] = useState<LinkedCharacterDetails[]>([])
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [pendingRemoveMember, setPendingRemoveMember] = useState<EnrichedMember | null>(null)

  async function loadCampaignData(campaignId: string) {
    const m = await listCampaignMembers(campaignId)
    const profiles = await listProfilesByIds(m.map(x => x.userId))
    const enriched = m.map(member => ({
      ...member,
      profile: profiles.find(p => p.userId === member.userId) ?? null,
    }))
    setMembers(enriched)
  }

  async function loadLinkedDetails(campaignId: string) {
    const details = await fetchLinkedCharactersDetails(campaignId).catch(() => [])
    setLinkedDetails(details)
  }

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

    const campaignId = id
    getCampaign(campaignId).then(async (c) => {
      if (!c) return
      setCampaign(c)
      await Promise.all([
        loadCampaignData(campaignId),
        loadLinkedDetails(campaignId),
      ])
    }).catch(() => {
      // show "not found" state
    }).finally(() => {
      setLoading(false)
    })
  }, [id, user, authLoading, navigate])

  async function handleUnlink(characterId: string) {
    if (!id) return
    if (!confirm(t('campaign_chars.unlink_confirm'))) return
    try {
      await unlinkCharacterFromCampaign({ campaignId: id, characterId })
      setLinkedDetails(prev => prev.filter(d => d.characterId !== characterId))
    } catch {
      alert(t('campaign_chars.unlink_failed'))
    }
  }

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

  const isOwner = user?.id === campaign.ownerId

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
        <div style={{ marginBottom: 24 }}>
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

        {/* Invite code — owner only */}
        <InviteCodeBlock
          campaign={campaign}
          isOwner={isOwner}
          onCodeRegenerated={(newCode) => {
            setCampaign(prev => prev ? { ...prev, inviteCode: newCode } : prev)
          }}
        />

        {/* Members list */}
        <div
          data-testid="campaign-detail-members"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderSubtle}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{
            fontFamily: T.serif, fontSize: 11, fontWeight: 600,
            letterSpacing: 2, textTransform: 'uppercase',
            color: T.textMuted, marginBottom: 14,
          }}>
            {t('campaign_detail.members')} ({members.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <div
                key={m.userId}
                data-testid={`member-row-${m.userId}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: T.elevated,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: m.role === 'master'
                      ? `linear-gradient(135deg, ${T.gold}, #8B5E05)`
                      : `linear-gradient(135deg, ${T.purple}, #2A1F3D)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.serif, fontSize: 12, fontWeight: 700,
                    color: T.textPrimary,
                  }}>
                    {(m.profile?.displayName ?? '?')[0]?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                    {m.profile?.displayName ?? t('campaign_detail.unknown_member')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                    color: m.role === 'master' ? T.gold : T.textMuted,
                    textTransform: 'uppercase',
                  }}>
                    {m.role === 'master'
                      ? t('campaign_detail.role_master')
                      : t('campaign_detail.role_player')}
                  </div>

                  <MemberRowMenu
                    member={m}
                    currentUserId={user?.id ?? ''}
                    isCurrentUserOwner={isOwner}
                    onEditName={() => setEditNameOpen(true)}
                    onLeaveCampaign={() => setLeaveModalOpen(true)}
                    onDeleteCampaign={() => setDeleteModalOpen(true)}
                    onRemoveMember={() => setPendingRemoveMember(m)}
                  />
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: 12 }}>
                …
              </div>
            )}
          </div>
        </div>

        {/* Linked characters section */}
        <div
          data-testid="campaign-detail-linked-chars"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderSubtle}`,
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <div style={{
              fontFamily: T.serif, fontSize: 11, fontWeight: 600,
              letterSpacing: 2, textTransform: 'uppercase',
              color: T.textMuted,
            }}>
              {t('campaign_chars.title')} ({linkedDetails.length})
            </div>
            <button
              onClick={() => setLinkModalOpen(true)}
              data-testid="link-char-open-btn"
              style={{
                background: 'transparent',
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: 8, padding: '5px 12px',
                color: T.textSecondary, fontFamily: T.sans,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              + {t('campaign_chars.link_button')}
            </button>
          </div>

          {linkedDetails.length === 0 && (
            <div
              data-testid="linked-chars-empty"
              style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: 12 }}
            >
              {t('campaign_chars.empty_state')}
            </div>
          )}

          {linkedDetails.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {linkedDetails.map(detail => (
                <LinkedCharCard
                  key={detail.characterId}
                  detail={detail}
                  campaignId={id!}
                  isCurrentUserOwner={isOwner}
                  currentUserId={user?.id ?? null}
                  onUnlink={() => handleUnlink(detail.characterId)}
                />
              ))}
            </div>
          )}
        </div>

        {linkModalOpen && id && (
          <LinkCharacterModal
            campaignId={id}
            alreadyLinkedIds={linkedDetails.filter(d => d.ownerUserId === user?.id).map(d => d.characterId)}
            onLinked={() => {
              setLinkModalOpen(false)
              void loadLinkedDetails(id)
            }}
            onCancel={() => setLinkModalOpen(false)}
          />
        )}
      </div>

      {/* Modals — outside maxWidth container */}
      {deleteModalOpen && campaign && (
        <ConfirmDeleteCampaignModal
          campaign={campaign}
          onDeleted={() => navigate('/campaigns')}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}

      {leaveModalOpen && campaign && (
        <ConfirmLeaveCampaignModal
          campaign={campaign}
          onLeft={() => navigate('/campaigns')}
          onCancel={() => setLeaveModalOpen(false)}
        />
      )}

      {editNameOpen && (
        <EditDisplayNameModal
          currentName={members.find(m => m.userId === user?.id)?.profile?.displayName ?? ''}
          onSaved={() => {
            setEditNameOpen(false)
            if (id) void loadCampaignData(id)
          }}
          onCancel={() => setEditNameOpen(false)}
        />
      )}

      {pendingRemoveMember && id && (
        <ConfirmRemoveMemberModal
          member={pendingRemoveMember}
          onConfirm={async () => {
            await removeMember({ campaignId: id, userId: pendingRemoveMember.userId })
            setPendingRemoveMember(null)
            await loadCampaignData(id)
          }}
          onCancel={() => setPendingRemoveMember(null)}
        />
      )}
    </div>
  )
}
