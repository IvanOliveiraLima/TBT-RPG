import { useNavigate } from 'react-router-dom'
import type { CampaignCharacter } from '@/domain/campaign'
import type { TabKey } from './types'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const T = {
  surface:      '#15121C',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textTertiary: '#A09DB0',
  textMuted:    '#7A7788',
  ruby:         '#8B1A2E',
  purple:       '#5B3FA8',
  purpleDim:    'rgba(91,63,168,0.15)',
  purpleBorder: 'rgba(91,63,168,0.35)',
  gold:         '#D4A017',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

const NAV_TABS: { k: TabKey; n: TranslationKey }[] = [
  { k: 'status', n: 'nav.attributes' },
  { k: 'combat', n: 'nav.combat' },
  { k: 'spells', n: 'nav.spells' },
  { k: 'inv',    n: 'nav.inventory' },
  { k: 'lore',   n: 'nav.lore' },
]

interface CampaignSidebarProps {
  campaignId: string
  activeCharId: string
  linkedChars: CampaignCharacter[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function CampaignSidebar({
  campaignId, activeCharId, linkedChars, activeTab, onTabChange,
}: CampaignSidebarProps) {
  const navigate = useNavigate()
  const { t, lang, setLang } = useTranslation()

  return (
    <div style={{
      width: 240, background: T.surface,
      borderRight: `1px solid ${T.borderSubtle}`,
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px 16px',
      flexShrink: 0,
      height: '100%',
      fontFamily: T.sans,
    }}>
      {/* Brand block — home shortcut */}
      <div
        data-testid="campaign-sidebar-home"
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '4px 8px 18px',
          borderBottom: `1px solid ${T.borderSubtle}`,
          marginBottom: 10,
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.purple}, ${T.ruby})`,
          boxShadow: `0 0 12px ${T.purple}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.serif, fontWeight: 700, color: '#fff', fontSize: 16,
        }}>
          T
        </div>
        <div>
          <div style={{
            fontFamily: T.serif, fontSize: 13, fontWeight: 600,
            color: T.textPrimary, letterSpacing: 1,
          }}>
            TBT-RPG
          </div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{`v${__APP_VERSION__}`}</div>
        </div>
      </div>

      {/* Back to campaign */}
      <button
        data-testid="campaign-sidebar-back"
        onClick={() => navigate(`/campaigns/${campaignId}`)}
        style={{
          background: 'transparent', border: 'none',
          color: T.textMuted,
          padding: '6px 10px',
          fontSize: 12, fontWeight: 500,
          textAlign: 'left', cursor: 'pointer',
          borderRadius: 6, marginBottom: 16,
          fontFamily: T.sans,
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M19 12H5M5 12l7 7M5 12l7-7"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{t('campaign_view.back_to_campaign')}</span>
      </button>

      {/* Linked characters section label */}
      <div style={{
        fontSize: 9, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: 1.5,
        padding: '0 10px 6px', fontWeight: 600,
      }}>
        {t('campaign_view.linked_characters')}
      </div>

      {/* Linked chars nav */}
      <nav
        data-testid="campaign-view-char-list"
        style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}
      >
        {linkedChars.map(lc => {
          const isActive = lc.characterId === activeCharId
          return (
            <button
              key={lc.characterId}
              onClick={() => navigate(`/campaigns/${campaignId}/characters/${lc.characterId}`)}
              data-testid={`char-nav-${lc.characterId}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={t('aria.campaign_char_nav', { name: lc.characterName })}
              style={{
                background: isActive ? T.purpleDim : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? T.purple : 'transparent'}`,
                color: isActive ? T.textPrimary : T.textTertiary,
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '0 6px 6px 0',
                marginBottom: 2,
                fontFamily: T.sans,
                transition: 'all 150ms',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 500 }}>
                {lc.characterName}
              </div>
              {lc.characterSummary && (
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>
                  {lc.characterSummary}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Pages section label */}
      <div style={{
        fontSize: 9, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: 1.5,
        padding: '0 10px 6px', fontWeight: 600,
      }}>
        {t('nav.pages')}
      </div>

      {/* Tab nav items */}
      {NAV_TABS.map(tab => {
        const isActive = activeTab === tab.k
        return (
          <button
            key={tab.k}
            data-testid={`campaign-view-tab-${tab.k}`}
            onClick={() => onTabChange(tab.k)}
            style={{
              background: isActive ? T.elevated : 'transparent',
              border: 'none',
              borderLeft: `2px solid ${isActive ? T.gold : 'transparent'}`,
              color: isActive ? T.textPrimary : T.textTertiary,
              padding: '9px 12px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '0 6px 6px 0',
              marginBottom: 2,
              fontFamily: T.sans,
              transition: 'all 150ms',
            }}
          >
            {t(tab.n)}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* Master badge */}
      <div
        data-testid="campaign-view-master-badge"
        style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
          color: T.purple,
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '8px 10px',
          marginBottom: 6,
        }}
      >
        {t('campaign_view.viewing_as_master')}
      </div>

      {/* Language toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['pt', 'en'] as const).map(l => {
          const isActive = lang === l
          return (
            <button
              key={l}
              aria-pressed={isActive}
              onClick={() => { if (!isActive) setLang(l) }}
              style={{
                flex: 1,
                background: isActive ? T.elevated : 'transparent',
                color: isActive ? T.textPrimary : T.textMuted,
                border: `1px solid ${isActive ? T.gold : T.borderSubtle}`,
                borderRadius: 6, padding: 6,
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {l.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
