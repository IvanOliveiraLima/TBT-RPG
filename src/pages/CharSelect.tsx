import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharactersStore } from '@/store/characters'
import { useAuthStore } from '@/store/auth'
import type { Character } from '@/domain/character'
import type { Campaign } from '@/domain/campaign'
import { deriveTotalLevel, formatClassesShort } from '@/domain/derived'
import { createEmptyCharacter } from '@/domain/factories'
import { useTranslation, pluralKey } from '@/i18n'
import { useCampaignsStore } from '@/store/campaigns'
import { getMyProfile } from '@/services/user-profile'
import { ProfileSetupModal } from '@/components/campaigns/ProfileSetupModal'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { JoinCampaignModal } from '@/components/campaigns/JoinCampaignModal'
import { AIGenerationModal } from '@/components/AIGenerationModal'
import { CharacterCardMenu } from '@/components/CharacterCardMenu'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { ChooseImportModeModal } from '@/components/import-export/ChooseImportModeModal'
import { ImportSuccessModal } from '@/components/import-export/ImportSuccessModal'
import { ImportErrorModal } from '@/components/import-export/ImportErrorModal'
import { CharCardVisual } from '@/components/character/CharCardVisual'
import { DismissibleBanner } from '@/components/DismissibleBanner'
import { DeleteAccountModal } from '@/components/account/DeleteAccountModal'
import {
  buildExportBlob,
  triggerDownload,
  parseImportFile,
  applyImport,
  ImportError,
} from '@/services/import-export'
import type { ExportPayload } from '@/services/import-export'

/* ── Token constants (avoid Tailwind for inline styles — matches prototype) */
const T = {
  bg:            '#0F0D14',
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textTertiary:  '#A09DB0',
  textMuted:     '#7A7788',
  ruby:          '#8B1A2E',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  success:       '#5DCAA5',
  danger:        '#E24B4A',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

/* ── D20 logo SVG ─────────────────────────────────────────────────────── */
function D20Logo() {
  return (
    <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
      <svg viewBox="0 0 48 48" width="46" height="46" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="d20g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#8B6FC5" />
            <stop offset="55%"  stopColor={T.purple} />
            <stop offset="100%" stopColor={T.ruby} />
          </linearGradient>
        </defs>
        <polygon
          points="24,3 44,15 44,33 24,45 4,33 4,15"
          fill="url(#d20g)"
          stroke={T.gold}
          strokeWidth="1.2"
          style={{ filter: `drop-shadow(0 0 10px ${T.purple}80)` }}
        />
        <polygon
          points="24,3 44,15 24,26 4,15"
          fill="rgba(255,255,255,0.08)"
        />
        <text
          x="24" y="30"
          textAnchor="middle"
          fontFamily="'Cinzel', serif"
          fontSize="14"
          fontWeight="700"
          fill={T.gold}
        >
          T
        </text>
      </svg>
    </div>
  )
}

/* ── Character card ────────────────────────────────────────────────────── */
interface CharCardProps {
  ch: Character
  selected: boolean
  onRequestDelete: (id: string, name: string) => void
}

function CharCard({ ch, selected, onRequestDelete }: CharCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleClick() {
    navigate(`/character/${ch.id}`)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        data-testid={`char-card-${ch.id}`}
        style={{
          padding: 12, borderRadius: 14,
          background: selected
            ? `linear-gradient(135deg, rgba(212,160,23,0.08), ${T.surface} 55%)`
            : T.surface,
          border: `1px solid ${selected ? 'rgba(212,160,23,0.4)' : T.borderSubtle}`,
          display: 'flex', gap: 12, alignItems: 'center',
          cursor: 'pointer', textAlign: 'left',
          transition: 'all 200ms',
          width: '100%',
          boxShadow: selected ? `0 4px 14px rgba(0,0,0,0.35), 0 0 0 0.5px ${T.gold}22` : 'none',
        }}
      >
        <CharCardVisual
          name={ch.name}
          raceLabel={ch.race || '—'}
          classLabel={formatClassesShort(ch) || '—'}
          totalLevel={deriveTotalLevel(ch)}
          portraitData={ch.images.character ?? null}
          hpCurrent={ch.hp.current}
          hpMax={ch.hp.max}
          selected={selected}
          namePaddingRight={28}
        />
      </button>

      {/* Kebab menu — overlaid in top-right corner, outside the card button */}
      <CharacterCardMenu
        characterId={ch.id}
        characterName={ch.name || t('characters.unnamed')}
        onDelete={onRequestDelete}
      />
    </div>
  )
}

/* ── Compact campaign card ─────────────────────────────────────────────── */
interface CompactCampaignCardProps {
  campaign: Campaign
  onClick: () => void
}

function CompactCampaignCard({ campaign, onClick }: CompactCampaignCardProps) {
  const { t } = useTranslation()
  return (
    <button
      data-testid={`compact-campaign-card-${campaign.id}`}
      onClick={onClick}
      aria-label={t('aria.compact_campaign_card').replace('{name}', campaign.name)}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        background: T.elevated,
        border: `1px solid ${T.borderSubtle}`,
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', textAlign: 'left',
        transition: 'border-color 200ms',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(135deg, ${T.purple}, #2A1F3D)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.serif, fontSize: 14, fontWeight: 700, color: T.gold,
      }}>
        {(campaign.name[0] ?? '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: T.textPrimary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {campaign.name}
        </div>
        {campaign.description && (
          <div style={{
            fontSize: 11, color: T.textTertiary,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {campaign.description}
          </div>
        )}
      </div>
    </button>
  )
}

/* ── Campaigns section ──────────────────────────────────────────────────── */
function CampaignsSection() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const campaigns = useCampaignsStore(s => s.campaigns)
  const loading = useCampaignsStore(s => s.loading)
  const fetchCampaigns = useCampaignsStore(s => s.fetchCampaigns)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [profileSetupOpen, setProfileSetupOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  useEffect(() => {
    if (user) void fetchCampaigns()
  }, [user, fetchCampaigns])

  async function handleCreateClick() {
    if (!user) {
      navigate('/login?redirectTo=/campaigns')
      return
    }
    const profile = await getMyProfile()
    if (!profile) {
      setProfileSetupOpen(true)
    } else {
      setCreateModalOpen(true)
    }
  }

  async function handleJoinClick() {
    if (!user) {
      navigate('/login?redirectTo=/campaigns')
      return
    }
    const profile = await getMyProfile()
    if (!profile) {
      setProfileSetupOpen(true)
    } else {
      setJoinModalOpen(true)
    }
  }

  return (
    <>
      <div style={{
        marginTop: 14,
        paddingTop: 14,
        borderTop: `1px solid ${T.borderSubtle}`,
      }}>
        <div style={{
          fontFamily: T.serif,
          fontSize: 11, fontWeight: 600,
          letterSpacing: 2, textTransform: 'uppercase',
          color: T.textMuted,
          marginBottom: 8,
        }}>
          {t('characters_screen.my_campaigns')}
        </div>

        {!user && (
          <div
            data-testid="campaigns-login-prompt"
            style={{ fontSize: 13, color: T.textMuted, marginBottom: 8, lineHeight: 1.55 }}
          >
            {t('characters_screen.campaigns_login_prompt')}
          </div>
        )}

        {user && loading && (
          <div style={{ padding: '12px 0', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            {t('charselect.loading')}
          </div>
        )}

        {user && !loading && campaigns.length === 0 && (
          <div
            data-testid="campaigns-empty-charselect"
            style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}
          >
            {t('characters_screen.campaigns_empty')}
          </div>
        )}

        {user && !loading && campaigns.length > 0 && (
          <div
            data-testid="compact-campaign-list"
            style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}
          >
            {campaigns.map(c => (
              <CompactCampaignCard
                key={c.id}
                campaign={c}
                onClick={() => navigate(`/campaigns/${c.id}`)}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: campaigns.length > 0 ? 0 : 6 }}>
          <button
            data-testid="charselect-create-campaign-btn"
            onClick={() => void handleCreateClick()}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 8,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textSecondary,
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >
            + {t('campaigns.create')}
          </button>
          <button
            data-testid="charselect-join-campaign-btn"
            onClick={() => void handleJoinClick()}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 8,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textSecondary,
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >
            {t('campaigns.join_with_code')}
          </button>
        </div>
      </div>

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

      {profileSetupOpen && (
        <ProfileSetupModal
          onComplete={() => {
            setProfileSetupOpen(false)
            setCreateModalOpen(true)
          }}
          onCancel={() => setProfileSetupOpen(false)}
        />
      )}
    </>
  )
}

/* ── Auth strip ────────────────────────────────────────────────────────── */
function AuthStrip() {
  const navigate                   = useNavigate()
  const { user, loading, signOut } = useAuthStore()
  const { t }                      = useTranslation()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  if (loading) return null

  if (user) {
    return (
      <>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          marginTop: 14, paddingTop: 14,
          borderTop: `1px solid ${T.borderSubtle}`,
          fontSize: 12, color: T.textMuted,
        }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 11, fontWeight: 600,
              color: T.textTertiary,
              cursor: 'pointer',
            }}
          >
            {t('auth.sign_out')}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            data-testid="delete-account-link"
            onClick={() => setDeleteModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 11,
              color: 'rgba(226,75,74,0.7)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('account.delete_link')}
          </button>
        </div>
        {deleteModalOpen && (
          <DeleteAccountModal
            userEmail={user.email ?? ''}
            onClose={() => setDeleteModalOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <div style={{
      display: 'flex', gap: 6, marginTop: 14,
      paddingTop: 14,
      borderTop: `1px solid ${T.borderSubtle}`,
    }}>
      <button
        onClick={() => navigate('/login')}
        style={{
          flex: 1,
          background: T.purple,
          border: 'none',
          borderRadius: 8,
          padding: '9px',
          fontSize: 11, fontWeight: 600,
          color: T.textPrimary,
          cursor: 'pointer',
        }}
      >
        {t('auth.sign_in')}
      </button>
      <button
        onClick={() => navigate('/login?mode=signup')}
        style={{
          flex: 1, background: 'transparent',
          border: `1px solid ${T.borderSubtle}`,
          color: T.textSecondary, borderRadius: 8,
          padding: '9px', fontSize: 11, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {t('auth.create_account')}
      </button>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function CharSelect() {
  const { characters, loading, fetchCharacters, addCharacter, deleteCharacter } = useCharactersStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const authCallbackType    = useAuthStore(s => s.authCallbackType)
  const authCallbackError   = useAuthStore(s => s.authCallbackError)
  const passwordResetSuccess = useAuthStore(s => s.passwordResetSuccess)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  // Import flow
  const [importPayload, setImportPayload] = useState<ExportPayload | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'choosing_mode' | 'importing' | 'done' | 'error'>('idle')
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; replaced: number } | null>(null)

  useEffect(() => {
    void fetchCharacters()
  }, [fetchCharacters])

  async function handleCreateFromScratch() {
    const newChar = createEmptyCharacter()
    await addCharacter(newChar)
    navigate(`/character/${newChar.id}`)
  }

  async function handleCharacterGenerated(char: Character) {
    await addCharacter(char)
    navigate(`/character/${char.id}`)
  }

  function handleRequestDelete(id: string, name: string) {
    setPendingDelete({ id, name })
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteCharacter(pendingDelete.id)
    setPendingDelete(null)
  }

  function handleExport() {
    const chars = useCharactersStore.getState().characters
    if (chars.length === 0) {
      alert(t('export.empty_warning'))
      return
    }
    const { blob, filename } = buildExportBlob(chars)
    triggerDownload(blob, filename)
  }

  async function handleImportFile(file: File) {
    setImportError(null)
    setImportPayload(null)
    try {
      const payload = await parseImportFile(file)
      setImportPayload(payload)
      setImportStatus('choosing_mode')
    } catch (err) {
      setImportStatus('error')
      setImportError(err instanceof ImportError ? err.code : 'unknown')
    }
  }

  async function handleConfirmImport(mode: 'merge' | 'replace') {
    if (!importPayload) return
    setImportStatus('importing')
    try {
      const result = await applyImport(importPayload.characters, mode)
      setImportResult(result)
      setImportStatus('done')
    } catch {
      setImportStatus('error')
      setImportError('apply_failed')
    }
  }

  function resetImport() {
    setImportPayload(null)
    setImportStatus('idle')
    setImportError(null)
    setImportResult(null)
  }

  return (
    <div style={{
      background: `
        radial-gradient(ellipse at top, rgba(91,63,168,0.18), transparent 55%),
        radial-gradient(ellipse at 80% 90%, rgba(139,26,46,0.12), transparent 55%),
        ${T.bg}
      `,
      minHeight: '100dvh',
      color: T.textPrimary,
      fontFamily: T.sans,
    }}>
      {/* ── Hero ── */}
      <div style={{
        padding: '74px 18px 22px',
        position: 'relative',
        overflow: 'hidden',
      }} className="noise-grain">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <D20Logo />
          <div>
            <div style={{
              fontFamily: T.serif,
              fontSize: 22, fontWeight: 700,
              color: T.textPrimary,
              letterSpacing: '3px', lineHeight: 1,
            }}>
              TBT<span style={{ color: T.gold }}>·</span>RPG
            </div>
            <div style={{
              fontSize: 10, color: T.textMuted,
              letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4,
            }}>
              {t('charselect.tagline')}
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{
          fontFamily: T.serif,
          fontSize: 28, fontWeight: 600,
          lineHeight: 1.15,
          color: T.textPrimary,
          letterSpacing: 0.3,
          marginBottom: 10,
        }}>
          {t('charselect.hero_line1')}<br />
          <span style={{
            background: `linear-gradient(90deg, ${T.gold}, #F2D06B)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {t('charselect.hero_line2')}
          </span>
        </div>
        <div style={{
          fontSize: 13, color: T.textTertiary,
          lineHeight: 1.55, maxWidth: 320,
        }}>
          {t('charselect.subline')}{' '}
          {t('charselect.feature_hint')}
        </div>

        {/* Ornament */}
        <div style={{
          position: 'absolute', top: 10, right: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.purple}40, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Auth banners ── */}
      {authCallbackType === 'signup' && (
        <div style={{ padding: '0 14px 4px' }}>
          <DismissibleBanner
            title={t('auth.email_confirmed_title')}
            message={t('auth.email_confirmed_message')}
            onDismiss={() => useAuthStore.setState({ authCallbackType: null })}
          />
        </div>
      )}
      {passwordResetSuccess && (
        <div style={{ padding: '0 14px 4px' }}>
          <DismissibleBanner
            title={t('auth.password_reset_title')}
            message={t('auth.password_reset_message')}
            onDismiss={() => useAuthStore.setState({ passwordResetSuccess: false })}
          />
        </div>
      )}
      {authCallbackError && (
        <div style={{ padding: '0 14px 4px' }}>
          <DismissibleBanner
            tone="error"
            title={t('auth.link_error_title')}
            message={t('auth.link_error_message')}
            actionLabel={t('auth.link_error_action')}
            onAction={() => navigate('/login?mode=forgot')}
            onDismiss={() => useAuthStore.setState({ authCallbackError: null })}
            autoDismissMs={0}
          />
        </div>
      )}

      {/* ── Character list ── */}
      <div style={{ padding: '0 14px 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          marginBottom: 10, paddingTop: 16,
          borderTop: `1px solid ${T.borderSubtle}`,
        }}>
          <div>
            <div style={{
              fontFamily: T.serif,
              fontSize: 11, fontWeight: 600,
              letterSpacing: 2, textTransform: 'uppercase',
              color: T.textMuted,
            }}>
              {t('charselect.my_characters')}
            </div>
            <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>
              {loading
                ? t('charselect.loading')
                : t(pluralKey('charselect.saved_count', characters.length), { n: characters.length })}
            </div>
          </div>
          <span style={{ flex: 1 }} />
          <button
            onClick={() => void fetchCharacters()}
            style={{
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textTertiary,
              fontSize: 11, fontWeight: 600,
              padding: '6px 10px', borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            ↺
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && (
            <div style={{
              padding: 20, textAlign: 'center',
              color: T.textMuted, fontSize: 13,
            }}>
              {t('charselect.loading_characters')}
            </div>
          )}

          {!loading && characters.length === 0 && (
            <div style={{
              padding: 24, textAlign: 'center',
              color: T.textMuted, fontSize: 13,
              border: `1px dashed ${T.borderSubtle}`,
              borderRadius: 14,
            }}>
              {t('charselect.empty')}
            </div>
          )}

          {!loading && characters.map((ch, i) => (
            <CharCard key={ch.id} ch={ch} selected={i === 0} onRequestDelete={handleRequestDelete} />
          ))}

          {/* Create buttons — side by side on desktop, stacked on narrow screens */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button
              onClick={() => void handleCreateFromScratch()}
              data-testid="create-from-scratch"
              aria-label={t('aria.create_from_scratch')}
              style={{
                flex: '1 1 140px',
                padding: '14px 12px', borderRadius: 14,
                background: 'transparent',
                border: `2px dashed ${T.borderDefault}`,
                color: T.textTertiary,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 150ms',
              }}
            >
              <span style={{ fontSize: 18, color: T.gold }}>＋</span>
              {t('charselect.create_from_scratch')}
            </button>

            <button
              onClick={() => setAiModalOpen(true)}
              data-testid="create-with-ai"
              aria-label={t('aria.create_with_ai')}
              style={{
                flex: '1 1 140px',
                padding: '14px 12px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(212,160,23,0.08), rgba(91,63,168,0.08))',
                border: `1px solid rgba(212,160,23,0.35)`,
                color: T.textSecondary,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 150ms',
              }}
            >
              <span style={{ color: T.gold }}>✦</span>
              {t('charselect.create_with_ai')}
            </button>
          </div>
        </div>

        {/* Secondary actions */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 14,
          paddingTop: 14, borderTop: `1px solid ${T.borderSubtle}`,
        }}>
          <input
            id="import-file-input"
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImportFile(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => document.getElementById('import-file-input')?.click()}
            disabled={importStatus === 'importing'}
            style={{
              flex: 1, background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textSecondary, borderRadius: 8,
              padding: '9px', fontSize: 11, fontWeight: 600,
              cursor: importStatus === 'importing' ? 'default' : 'pointer',
              letterSpacing: 0.3,
              opacity: importStatus === 'importing' ? 0.5 : 1,
            }}
          >
            {t('charselect.import')}
          </button>
          <button
            onClick={handleExport}
            style={{
              flex: 1, background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textSecondary, borderRadius: 8,
              padding: '9px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >
            {t('charselect.export')}
          </button>
        </div>

        {/* Campaigns */}
        <CampaignsSection />

        {/* Auth */}
        <AuthStrip />
      </div>

      {aiModalOpen && (
        <AIGenerationModal
          onClose={() => setAiModalOpen(false)}
          onCharacterGenerated={char => void handleCharacterGenerated(char)}
        />
      )}

      {pendingDelete && (
        <ConfirmDeleteModal
          characterName={pendingDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {importStatus === 'choosing_mode' && importPayload && (
        <ChooseImportModeModal
          payload={importPayload}
          onConfirm={mode => void handleConfirmImport(mode)}
          onCancel={resetImport}
        />
      )}

      {importStatus === 'done' && importResult && (
        <ImportSuccessModal
          result={importResult}
          onClose={resetImport}
        />
      )}

      {importStatus === 'error' && importError && (
        <ImportErrorModal
          errorCode={importError}
          onClose={resetImport}
        />
      )}
    </div>
  )
}
