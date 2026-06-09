import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { useCampaignViewStore } from '@/store/campaign-view'
import { listCampaignCharacters } from '@/services/campaign-characters'
import { ForceReadOnlyContext, RemoteCharacterContext } from '@/contexts/CampaignViewContext'
import type { CampaignCharacter } from '@/domain/campaign'
import type { TabKey } from '@/components/sheet/types'
import { StatusTab } from '@/components/sheet/tabs/StatusTab'
import { CombatTab } from '@/components/sheet/tabs/CombatTab'
import { SpellsTab } from '@/components/sheet/tabs/SpellsTab'
import { InventoryTab } from '@/components/sheet/tabs/InventoryTab'
import { LoreTab } from '@/components/sheet/tabs/LoreTab'

const T = {
  bg:           '#0F0D14',
  surface:      '#15121C',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  purpleDim:    'rgba(91,63,168,0.15)',
  purpleBorder: 'rgba(91,63,168,0.35)',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

const TABS: TabKey[] = ['status', 'combat', 'spells', 'inv', 'lore']

function TabContent({ tabKey }: { tabKey: TabKey }) {
  switch (tabKey) {
    case 'status':  return <StatusTab />
    case 'combat':  return <CombatTab />
    case 'spells':  return <SpellsTab />
    case 'inv':     return <InventoryTab />
    case 'lore':    return <LoreTab />
  }
}

export default function CampaignCharacterView() {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const character   = useCampaignViewStore(s => s.character)
  const loading     = useCampaignViewStore(s => s.loading)
  const error       = useCampaignViewStore(s => s.error)
  const loadCharacter = useCampaignViewStore(s => s.loadCharacter)
  const startPolling  = useCampaignViewStore(s => s.startPolling)
  const clear         = useCampaignViewStore(s => s.clear)

  const [activeTab, setActiveTab] = useState<TabKey>('status')
  const [linkedChars, setLinkedChars] = useState<CampaignCharacter[]>([])

  // Load linked chars sidebar
  useEffect(() => {
    if (!campaignId) return
    listCampaignCharacters(campaignId).then(setLinkedChars).catch(console.error)
  }, [campaignId])

  // Load char + start polling; clear on unmount or when ids change
  useEffect(() => {
    if (!campaignId || !charId) return
    void loadCharacter(campaignId, charId)
    startPolling(campaignId, charId)
    return () => { clear() }
  }, [campaignId, charId, loadCharacter, startPolling, clear])

  // Redirect after char_not_found
  useEffect(() => {
    if (error !== 'char_not_found') return
    const timer = setTimeout(() => navigate(`/campaigns/${campaignId}`), 2000)
    return () => clearTimeout(timer)
  }, [error, campaignId, navigate])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && !character) {
    return (
      <div
        data-testid="campaign-view-loading"
        style={{
          minHeight: '100dvh', background: T.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.textMuted, fontFamily: T.sans, fontSize: 14,
        }}
      >
        …
      </div>
    )
  }

  // ── Char not found ────────────────────────────────────────────────────────
  if (error === 'char_not_found') {
    return (
      <div
        data-testid="campaign-view-not-found"
        style={{
          minHeight: '100dvh', background: T.bg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: T.textMuted, fontFamily: T.sans,
          gap: 12, textAlign: 'center', padding: 24,
        }}
      >
        <div style={{ fontSize: 14 }}>{t('campaign_view.char_not_found')}</div>
        <div style={{ fontSize: 12 }}>{t('campaign_view.redirecting')}</div>
      </div>
    )
  }

  // ── Other error ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        data-testid="campaign-view-error"
        style={{
          minHeight: '100dvh', background: T.bg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: T.textMuted, fontFamily: T.sans,
          gap: 16, textAlign: 'center', padding: 24,
        }}
      >
        <div style={{ fontSize: 14 }}>
          {t(`campaign_view.error_${error}` as TranslationKey)}
        </div>
        <button
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          data-testid="campaign-view-back-btn"
          style={{
            background: 'transparent', border: `1px solid ${T.borderSubtle}`,
            borderRadius: 8, padding: '8px 16px',
            color: T.textSecondary, fontSize: 13, cursor: 'pointer',
            fontFamily: T.sans,
          }}
        >
          {t('campaign_view.back_to_campaign')}
        </button>
      </div>
    )
  }

  if (!character) return null

  const TAB_LABELS: Record<TabKey, string> = {
    status: t('tab.status'),
    combat: t('tab.combat'),
    spells: t('tab.spells'),
    inv:    t('tab.inventory'),
    lore:   t('tab.lore'),
  }

  const tabBar = (
    <div
      data-testid="campaign-view-tab-bar"
      style={{
        display: 'flex',
        background: T.surface,
        borderBottom: `1px solid ${T.borderSubtle}`,
        overflowX: 'auto',
      }}
    >
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          data-testid={`campaign-view-tab-${tab}`}
          aria-current={activeTab === tab ? 'page' : undefined}
          style={{
            flex: 1, minWidth: 60,
            padding: '12px 10px',
            background: 'transparent', border: 'none',
            borderBottom: activeTab === tab
              ? `2px solid ${T.purple}`
              : '2px solid transparent',
            color: activeTab === tab ? T.textPrimary : T.textMuted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: T.sans, textTransform: 'uppercase', letterSpacing: 0.5,
            transition: 'all 150ms',
          }}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  )

  return (
    <RemoteCharacterContext.Provider value={character}>
      <ForceReadOnlyContext.Provider value={true}>

        {/* ── Mobile layout (< 1024px) ── */}
        <div
          className="lg:hidden"
          style={{ minHeight: '100dvh', background: T.bg, display: 'flex', flexDirection: 'column' }}
        >
          {/* Mobile header */}
          <div style={{
            padding: '12px 16px',
            background: T.surface,
            borderBottom: `1px solid ${T.borderSubtle}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <button
              onClick={() => navigate(`/campaigns/${campaignId}`)}
              data-testid="campaign-view-back"
              style={{
                background: 'transparent', border: 'none',
                color: T.textMuted, cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontFamily: T.sans,
              }}
              aria-label={t('campaign_view.back_to_campaign')}
            >
              ←
            </button>
            <div style={{
              fontFamily: T.serif, fontSize: 15, fontWeight: 600,
              color: T.textPrimary, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {character.name}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              color: T.purple, textTransform: 'uppercase',
              padding: '3px 8px', background: T.purpleDim, borderRadius: 20,
              border: `1px solid ${T.purpleBorder}`, flexShrink: 0,
            }}>
              {t('campaign_view.viewing_as_master')}
            </div>
          </div>

          {tabBar}

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
            <TabContent tabKey={activeTab} />
          </div>
        </div>

        {/* ── Desktop layout (>= 1024px) ── */}
        <div
          className="hidden lg:flex"
          style={{ minHeight: '100dvh', background: T.bg }}
        >
          {/* Sidebar */}
          <aside
            data-testid="campaign-view-sidebar"
            style={{
              width: 260, flexShrink: 0,
              background: T.surface,
              borderRight: `1px solid ${T.borderSubtle}`,
              display: 'flex', flexDirection: 'column',
              padding: '20px 16px',
              overflowY: 'auto',
            }}
          >
            {/* Back button */}
            <button
              onClick={() => navigate(`/campaigns/${campaignId}`)}
              data-testid="campaign-view-back"
              style={{
                background: 'transparent', border: 'none',
                color: T.textMuted, cursor: 'pointer',
                padding: '6px 0', fontSize: 12, marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: T.sans, textAlign: 'left',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M19 12H5M5 12l7 7M5 12l7-7"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('campaign_view.back_to_campaign')}
            </button>

            {/* Linked chars label */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase', color: T.textMuted, marginBottom: 10,
            }}>
              {t('campaign_view.linked_characters')}
            </div>

            {/* Char list */}
            <nav
              data-testid="campaign-view-char-list"
              style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
            >
              {linkedChars.map(lc => (
                <button
                  key={lc.characterId}
                  onClick={() => navigate(`/campaigns/${campaignId}/characters/${lc.characterId}`)}
                  data-testid={`char-nav-${lc.characterId}`}
                  aria-current={lc.characterId === charId ? 'page' : undefined}
                  aria-label={t('aria.campaign_char_nav', { name: lc.characterName })}
                  style={{
                    background: lc.characterId === charId ? T.purpleDim : 'transparent',
                    border: `1px solid ${lc.characterId === charId ? T.purpleBorder : 'transparent'}`,
                    borderRadius: 8, padding: '8px 10px',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 150ms',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>
                    {lc.characterName}
                  </div>
                  {lc.characterSummary && (
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                      {lc.characterSummary}
                    </div>
                  )}
                </button>
              ))}
            </nav>

            {/* Master badge */}
            <div
              data-testid="campaign-view-master-badge"
              style={{
                marginTop: 'auto', paddingTop: 16,
                fontSize: 10, fontWeight: 600, letterSpacing: 1,
                color: T.purple, textTransform: 'uppercase', textAlign: 'center',
              }}
            >
              {t('campaign_view.viewing_as_master')}
            </div>
          </aside>

          {/* Main area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {tabBar}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <TabContent tabKey={activeTab} />
            </div>
          </div>
        </div>

      </ForceReadOnlyContext.Provider>
    </RemoteCharacterContext.Provider>
  )
}
