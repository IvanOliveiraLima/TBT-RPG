import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { getCampaign, listCampaignMembers, removeMember, transferCampaignOwnership, setCampaignMemberRole } from '@/services/campaign'
import { listProfilesByIds } from '@/services/user-profile'
import { unlinkCharacterFromCampaign } from '@/services/campaign-characters'
import { fetchLinkedCharactersDetails } from '@/services/campaign-view'
import type { LinkedCharacterDetails } from '@/services/campaign-view'
import { subscribeCharacterChanges } from '@/services/realtime'
import { LinkedCharCard } from '@/components/campaigns/LinkedCharCard'
import { useTranslation } from '@/i18n'
import { InviteCodeBlock } from '@/components/campaigns/InviteCodeBlock'
import { LinkCharacterModal } from '@/components/campaigns/LinkCharacterModal'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { ConfirmDeleteCampaignModal } from '@/components/campaigns/ConfirmDeleteCampaignModal'
import { ConfirmLeaveCampaignModal } from '@/components/campaigns/ConfirmLeaveCampaignModal'
import { MemberRowMenu } from '@/components/campaigns/MemberRowMenu'
import { EditDisplayNameModal } from '@/components/campaigns/EditDisplayNameModal'
import { ConfirmRemoveMemberModal } from '@/components/campaigns/ConfirmRemoveMemberModal'
import { ConfirmTransferOwnershipModal } from '@/components/campaigns/ConfirmTransferOwnershipModal'
import { CampaignMapsSection } from '@/components/campaigns/CampaignMapsSection'
import { TokenPresetsSection } from '@/components/campaigns/TokenPresetsSection'
import { CampaignRollLog } from '@/components/campaigns/CampaignRollLog'
import { HelpHint } from '@/components/HelpHint'
import { DicePanel } from '@/components/dice/DicePanel'
import { useDiceStore } from '@/store/useDiceStore'
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
  const [editCampaignOpen, setEditCampaignOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [pendingRemoveMember, setPendingRemoveMember] = useState<EnrichedMember | null>(null)
  const [pendingTransfer, setPendingTransfer] = useState<EnrichedMember | null>(null)
  const [diceOpen, setDiceOpen] = useState(false)
  const [realtimeActive, setRealtimeActive] = useState(false)
  // Stable ref to current linked-char ids for the realtime callback (avoids stale closure).
  const linkedIdsRef = useRef<Set<string>>(new Set())
  const rtRefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setCampaignContext   = useDiceStore(s => s.setCampaignContext)
  const clearCampaignContext = useDiceStore(s => s.clearCampaignContext)

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

  // Keep the ref in sync so the realtime callback always sees the current linked-char ids.
  useEffect(() => {
    linkedIdsRef.current = new Set(linkedDetails.map(d => d.characterId))
  }, [linkedDetails])

  // Realtime subscription: subscribe on mount, clean up on unmount.
  // Notify-and-fetch: use the event as trigger only; ignore payload content.
  useEffect(() => {
    if (!id || !user || authLoading) return
    const cleanup = subscribeCharacterChanges(
      (charId) => {
        if (!linkedIdsRef.current.has(charId)) return
        // Debounce: coalesce bursts of events into a single refetch.
        if (rtRefetchTimer.current !== null) clearTimeout(rtRefetchTimer.current)
        rtRefetchTimer.current = setTimeout(() => {
          void loadLinkedDetails(id)
          rtRefetchTimer.current = null
        }, 300)
      },
      (status) => { setRealtimeActive(status === 'active') },
    )
    return () => {
      if (rtRefetchTimer.current !== null) {
        clearTimeout(rtRefetchTimer.current)
        rtRefetchTimer.current = null
      }
      cleanup()
    }
  }, [id, user, authLoading])

  // Poll linked characters' live data as fallback.
  // Interval: 30 s when realtime is active (secondary), 5 s otherwise (primary).
  useEffect(() => {
    if (!id || !user || authLoading) return
    const interval = realtimeActive ? 30_000 : 5_000
    const t = setInterval(() => { void loadLinkedDetails(id) }, interval)
    return () => { clearInterval(t) }
  }, [id, user, authLoading, realtimeActive])

  // Set campaign context so GM rolls on this page are logged as "Mestre" (master only —
  // includes co-masters who also get secret rolls and the master badge).
  const isMasterForContext = !loading && !authLoading && campaign != null &&
    (user?.id === campaign.ownerId ||
     members.find(m => m.userId === user?.id)?.role === 'master')
  useEffect(() => {
    if (!isMasterForContext || !id) return
    setCampaignContext({ campaignTargets: [id], actorName: t('dice_log.master'), isMaster: true })
    return () => { clearCampaignContext() }
  }, [isMasterForContext, id, setCampaignContext, clearCampaignContext, t])

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

  async function handlePromoteToMaster(member: EnrichedMember) {
    if (!id) return
    const result = await setCampaignMemberRole(id, member.userId, 'master')
    if (!result.ok) {
      alert(t('campaign_detail.role_change_error'))
      return
    }
    await loadCampaignData(id)
  }

  async function handleDemoteToPlayer(member: EnrichedMember) {
    if (!id) return
    const result = await setCampaignMemberRole(id, member.userId, 'player')
    if (!result.ok) {
      alert(t('campaign_detail.role_change_error'))
      return
    }
    await loadCampaignData(id)
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
  const myRole = members.find(m => m.userId === user?.id)?.role
  const isMaster = isOwner || myRole === 'master'

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
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* Brand block — home shortcut */}
        <div
          data-testid="campaign-detail-home"
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 7, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.purple}, ${T.ruby})`,
            boxShadow: `0 0 12px ${T.purple}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.serif, fontWeight: 700, color: '#fff', fontSize: 16,
          }}>T</div>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 600, color: T.textPrimary, letterSpacing: 1 }}>
              TBT-RPG
            </div>
            <div style={{ fontSize: 10, color: T.textMuted }}>{`v${__APP_VERSION__}`}</div>
          </div>
        </div>

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

        {/* Campaign header — full width */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
          }}>
            <div style={{
              fontFamily: T.serif, fontSize: 24, fontWeight: 700,
              color: T.textPrimary,
            }}>
              {campaign.name}
            </div>
            {isMaster && (
              <button
                type="button"
                data-testid="edit-campaign-btn"
                onClick={() => setEditCampaignOpen(true)}
                aria-label={t('campaign_detail.edit')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: T.textMuted,
                  padding: '2px 4px',
                  fontSize: 16,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >✏️</button>
            )}
            {/* Realtime status indicator — visible to master only */}
            {isMaster && (
              <div
                data-testid="rt-status-dot"
                title={t(realtimeActive ? 'campaign_detail.rt_active' : 'campaign_detail.rt_inactive')}
                style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: realtimeActive ? '#4CAF50' : T.textMuted,
                  boxShadow: realtimeActive ? '0 0 6px #4CAF5080' : 'none',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              />
            )}
            {isMaster && (
              <HelpHint textKey="campaign_detail.rt_help" />
            )}
          </div>
          {campaign.description && (
            <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6 }}>
              {campaign.description}
            </div>
          )}
        </div>

        {/* Responsive 2-column grid on desktop, stacked on mobile */}
        <div
          data-testid="campaign-detail-grid"
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
            alignItems: 'start',
          }}
        >

        {/* Invite code — master (and owner) */}
        <InviteCodeBlock
          campaign={campaign}
          isMaster={isMaster}
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
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 14,
          }}>
            <div style={{
              fontFamily: T.serif, fontSize: 11, fontWeight: 600,
              letterSpacing: 2, textTransform: 'uppercase',
              color: T.textMuted,
            }}>
              {t('campaign_detail.members')} ({members.length})
            </div>
            <HelpHint textKey="campaign_detail.members_help" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => {
              const isRowOwner = m.userId === campaign.ownerId
              return (
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
                    {isRowOwner
                      ? t('campaign_detail.role_owner')
                      : m.role === 'master'
                        ? t('campaign_detail.role_comaster')
                        : t('campaign_detail.role_player')}
                  </div>

                  <MemberRowMenu
                    member={m}
                    currentUserId={user?.id ?? ''}
                    isCurrentUserOwner={isOwner}
                    isCurrentUserMaster={isMaster}
                    onEditName={() => setEditNameOpen(true)}
                    onLeaveCampaign={() => setLeaveModalOpen(true)}
                    onDeleteCampaign={() => setDeleteModalOpen(true)}
                    onRemoveMember={() => setPendingRemoveMember(m)}
                    onTransferOwnership={() => setPendingTransfer(m)}
                    onPromoteToMaster={() => { void handlePromoteToMaster(m) }}
                    onDemoteToPlayer={() => { void handleDemoteToPlayer(m) }}
                  />
                </div>
              </div>
            )})}

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
            alignSelf: 'start',
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
                  isMaster={isMaster}
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

        {/* Token presets section — master (and owner) */}
        {id && isMaster && (
          <TokenPresetsSection campaignId={id} isMaster={isMaster} />
        )}

        {/* Maps section — full width */}
        {id && (
          <div style={{ gridColumn: '1 / -1' }}>
            <CampaignMapsSection campaignId={id} isMaster={isMaster} />
          </div>
        )}

        {/* Dice roll log — full width, visible to all members */}
        {id && (
          <div style={{ gridColumn: '1 / -1' }}>
            <CampaignRollLog campaignId={id} isMaster={isMaster} />
          </div>
        )}

        </div>{/* end grid */}
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

      {editCampaignOpen && campaign && (
        <CreateCampaignModal
          campaign={campaign}
          onCreated={(updated) => {
            setCampaign(updated)
            setEditCampaignOpen(false)
          }}
          onCancel={() => setEditCampaignOpen(false)}
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

      {pendingTransfer && id && (
        <ConfirmTransferOwnershipModal
          member={pendingTransfer}
          onConfirm={async () => {
            const result = await transferCampaignOwnership(id, pendingTransfer.userId)
            if (!result.ok) {
              throw new Error(result.error)
            }
            setPendingTransfer(null)
            const [c] = await Promise.all([
              getCampaign(id),
              loadCampaignData(id),
            ])
            if (c) setCampaign(c)
          }}
          onCancel={() => setPendingTransfer(null)}
        />
      )}

      {/* GM dice panel — fixed (no backdrop-filter above this level) */}
      {isMaster && diceOpen && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, zIndex: 40,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <DicePanel onClose={() => setDiceOpen(false)} />
        </div>
      )}

      {/* GM dice FAB — master (and owner) */}
      {isMaster && (
        <button
          type="button"
          data-testid="campaign-detail-dice-fab"
          data-dice-ui
          onClick={() => setDiceOpen(v => !v)}
          title={t('dice.title')}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 40,
            width: 48, height: 48,
            borderRadius: '50%',
            background: '#5B3FA8',
            border: '2px solid #7B5FC8',
            color: '#fff',
            fontSize: 22, lineHeight: 1,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ⚄
        </button>
      )}
    </div>
  )
}
