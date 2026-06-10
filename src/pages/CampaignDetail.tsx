import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { getCampaign, listCampaignMembers, removeMember } from '@/services/campaign'
import { listProfilesByIds } from '@/services/user-profile'
import { listCampaignCharacters, unlinkCharacterFromCampaign } from '@/services/campaign-characters'
import { useTranslation } from '@/i18n'
import { InviteCodeBlock } from '@/components/campaigns/InviteCodeBlock'
import { LinkCharacterModal } from '@/components/campaigns/LinkCharacterModal'
import { ConfirmDeleteCampaignModal } from '@/components/campaigns/ConfirmDeleteCampaignModal'
import { ConfirmLeaveCampaignModal } from '@/components/campaigns/ConfirmLeaveCampaignModal'
import { MemberRowMenu } from '@/components/campaigns/MemberRowMenu'
import { EditDisplayNameModal } from '@/components/campaigns/EditDisplayNameModal'
import { ConfirmRemoveMemberModal } from '@/components/campaigns/ConfirmRemoveMemberModal'
import type { Campaign, CampaignMember, UserProfile, CampaignCharacter } from '@/domain/campaign'

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
  const [linkedChars, setLinkedChars] = useState<CampaignCharacter[]>([])
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [pendingRemoveMember, setPendingRemoveMember] = useState<EnrichedMember | null>(null)

  async function loadCampaignData(campaignId: string) {
    const [m, chars] = await Promise.all([
      listCampaignMembers(campaignId),
      listCampaignCharacters(campaignId).catch(() => [] as CampaignCharacter[]),
    ])
    const profiles = await listProfilesByIds(m.map(x => x.userId))
    const enriched = m.map(member => ({
      ...member,
      profile: profiles.find(p => p.userId === member.userId) ?? null,
    }))
    setMembers(enriched)
    setLinkedChars(chars)
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
      await loadCampaignData(campaignId)
    }).catch(() => {
      // show "not found" state
    }).finally(() => {
      setLoading(false)
    })
  }, [id, user, authLoading, navigate])

  const ownerNameById = useMemo(() => {
    const map = new Map<string, string>()
    members.forEach(m => {
      if (m.profile?.displayName) map.set(m.userId, m.profile.displayName)
    })
    return map
  }, [members])

  async function handleUnlink(characterId: string) {
    if (!id) return
    if (!confirm(t('campaign_chars.unlink_confirm'))) return
    setUnlinking(characterId)
    try {
      await unlinkCharacterFromCampaign({ campaignId: id, characterId })
      setLinkedChars(prev => prev.filter(c => c.characterId !== characterId))
    } catch {
      alert(t('campaign_chars.unlink_failed'))
    } finally {
      setUnlinking(null)
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
              {t('campaign_chars.title')} ({linkedChars.length})
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

          {linkedChars.length === 0 && (
            <div
              data-testid="linked-chars-empty"
              style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: 12 }}
            >
              {t('campaign_chars.empty_state')}
            </div>
          )}

          {linkedChars.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {linkedChars.map(char => {
                const ownerName = ownerNameById.get(char.userId) ?? t('campaign_detail.unknown_member')
                const isCharOwner = char.userId === user?.id
                return (
                  <div
                    key={char.characterId}
                    data-testid={`linked-char-${char.characterId}`}
                    onClick={() => navigate(`/campaigns/${id}/characters/${char.characterId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ')
                        navigate(`/campaigns/${id}/characters/${char.characterId}`)
                    }}
                    aria-label={t('aria.linked_char_view', { name: char.characterName })}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: T.elevated,
                      border: `1px solid ${T.borderSubtle}`,
                      borderRadius: 10,
                      gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                        {char.characterName}
                      </div>
                      {char.characterSummary && (
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          {char.characterSummary}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        {t('campaign_chars.owner_label')}: {ownerName}
                      </div>
                    </div>

                    {(isCharOwner || isOwner) && (
                      <button
                        onClick={e => { e.stopPropagation(); void handleUnlink(char.characterId) }}
                        disabled={unlinking === char.characterId}
                        data-testid={`unlink-char-${char.characterId}`}
                        aria-label={t('aria.unlink_character', { name: char.characterName })}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${T.borderSubtle}`,
                          borderRadius: 8, padding: '5px 10px',
                          color: T.textMuted, fontFamily: T.sans,
                          fontSize: 11, cursor: unlinking === char.characterId ? 'default' : 'pointer',
                          opacity: unlinking === char.characterId ? 0.5 : 1,
                          flexShrink: 0,
                        }}
                      >
                        {unlinking === char.characterId
                          ? t('campaign_chars.unlinking')
                          : t('campaign_chars.unlink')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {linkModalOpen && id && (
          <LinkCharacterModal
            campaignId={id}
            alreadyLinkedIds={linkedChars.filter(c => c.userId === user?.id).map(c => c.characterId)}
            onLinked={(newLink) => {
              setLinkModalOpen(false)
              setLinkedChars(prev => [...prev, newLink])
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
