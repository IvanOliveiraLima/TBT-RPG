import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/domain/character'
import type { CampaignCharacter } from '@/domain/campaign'
import type { TabKey } from './types'
import { MobileHeader } from './MobileHeader'
import { BottomTabBar } from './BottomTabBar'
import { useTranslation } from '@/i18n'

const T = {
  surface:      '#15121C',
  borderSubtle: '#2A2537',
  borderStrong: '#4A3A6B',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  purpleDim:    'rgba(91,63,168,0.15)',
  purpleBorder: 'rgba(91,63,168,0.35)',
  sans:         "'Inter', system-ui, sans-serif",
} as const

export interface CampaignMobileShellProps {
  character: Character
  campaignId: string
  activeCharId: string
  linkedChars: CampaignCharacter[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

export function CampaignMobileShell({
  character, campaignId, activeCharId, linkedChars, activeTab, onTabChange, children,
}: CampaignMobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const { t, lang, setLang } = useTranslation()

  return (
    <div style={{
      background: '#0F0D14',
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      color: T.textPrimary,
      fontFamily: T.sans,
      fontSize: 14,
      position: 'relative',
    }}>
      <MobileHeader character={character} onMenu={() => setDrawerOpen(true)} />

      <div style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>
        {children}
      </div>

      <BottomTabBar active={activeTab} onChange={onTabChange} />

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          data-testid="campaign-mobile-drawer"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 260, height: '100%',
              background: T.surface,
              borderRight: `1px solid ${T.borderStrong}`,
              padding: '20px 16px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <div style={{
              fontFamily: T.sans, fontSize: 16, fontWeight: 600,
              color: T.textPrimary, marginBottom: 14,
            }}>
              TBT-RPG
            </div>

            {/* Back to campaign */}
            <button
              data-testid="campaign-mobile-drawer-back"
              onClick={() => { navigate(`/campaigns/${campaignId}`); setDrawerOpen(false) }}
              style={{
                background: 'transparent', border: 'none',
                color: T.textSecondary,
                padding: '10px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                textAlign: 'left', cursor: 'pointer',
                fontFamily: T.sans,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M19 12H5M5 12l7 7M5 12l7-7"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('campaign_view.back_to_campaign')}
            </button>

            {/* Linked characters label */}
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
              textTransform: 'uppercase', color: T.textMuted,
              padding: '8px 12px 4px',
            }}>
              {t('campaign_view.linked_characters')}
            </div>

            {/* Linked chars list */}
            <nav data-testid="campaign-view-char-list">
              {linkedChars.map(lc => {
                const isActive = lc.characterId === activeCharId
                return (
                  <button
                    key={lc.characterId}
                    onClick={() => {
                      navigate(`/campaigns/${campaignId}/characters/${lc.characterId}`)
                      setDrawerOpen(false)
                    }}
                    data-testid={`char-nav-${lc.characterId}`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={t('aria.campaign_char_nav', { name: lc.characterName })}
                    style={{
                      background: isActive ? T.purpleDim : 'transparent',
                      border: `1px solid ${isActive ? T.purpleBorder : 'transparent'}`,
                      color: isActive ? T.textPrimary : T.textSecondary,
                      padding: '8px 12px', borderRadius: 8,
                      fontSize: 12, fontWeight: isActive ? 600 : 500,
                      textAlign: 'left', cursor: 'pointer',
                      fontFamily: T.sans,
                      display: 'block', width: '100%', marginBottom: 2,
                    }}
                  >
                    <div>{lc.characterName}</div>
                    {lc.characterSummary && (
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>
                        {lc.characterSummary}
                      </div>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* My campaigns link */}
            <button
              data-testid="campaign-mobile-drawer-campaigns"
              onClick={() => { navigate('/campaigns'); setDrawerOpen(false) }}
              style={{
                background: 'transparent', border: 'none',
                color: T.textSecondary,
                padding: '10px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                textAlign: 'left', cursor: 'pointer',
                fontFamily: T.sans,
                display: 'flex', alignItems: 'center', gap: 8,
                marginTop: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('chrome.my_campaigns')}
            </button>

            {/* Language toggle */}
            <div style={{ marginTop: 12 }}>
              <div style={{
                display: 'flex', gap: 6,
                paddingTop: 10,
                borderTop: `1px solid ${T.borderSubtle}`,
              }}>
                {(['pt', 'en'] as const).map(l => {
                  const isActive = lang === l
                  return (
                    <button
                      key={l}
                      aria-pressed={isActive}
                      onClick={() => { if (!isActive) setLang(l) }}
                      style={{
                        flex: 1,
                        background: isActive ? '#1B1725' : 'transparent',
                        color: isActive ? T.textPrimary : T.textMuted,
                        border: `1px solid ${isActive ? '#D4A017' : T.borderSubtle}`,
                        borderRadius: 6, padding: '6px',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        fontFamily: T.sans,
                      }}
                    >
                      {l.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
