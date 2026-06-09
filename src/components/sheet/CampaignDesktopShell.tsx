import type { ReactNode } from 'react'
import type { Character } from '@/domain/character'
import type { CampaignCharacter } from '@/domain/campaign'
import { formatClassesShort } from '@/domain/derived'
import type { TabKey } from './types'
import { CampaignSidebar } from './CampaignSidebar'
import { useTranslation } from '@/i18n'

const T = {
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textTertiary: '#A09DB0',
  purple:       '#5B3FA8',
  purpleDim:    'rgba(91,63,168,0.15)',
  purpleBorder: 'rgba(91,63,168,0.35)',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

export interface CampaignDesktopShellProps {
  character: Character
  campaignId: string
  activeCharId: string
  linkedChars: CampaignCharacter[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

export function CampaignDesktopShell({
  character, campaignId, activeCharId, linkedChars, activeTab, onTabChange, children,
}: CampaignDesktopShellProps) {
  const { t } = useTranslation()
  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      background: '#0F0D14',
      color: T.textPrimary,
      fontFamily: T.sans,
      fontSize: 14,
      overflow: 'hidden',
    }}>
      <CampaignSidebar
        campaignId={campaignId}
        activeCharId={activeCharId}
        linkedChars={linkedChars}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div style={{
        flex: 1, overflowY: 'auto', minWidth: 0,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Topbar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${T.borderSubtle}`,
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(15,13,20,0.7)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: T.serif, fontSize: 22, fontWeight: 600,
              color: T.textPrimary,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {character.name}
            </div>
            <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 2 }}>
              {character.race}
              {' · '}
              {formatClassesShort(character)}
              {character.background ? ` · ${character.background}` : ''}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Master badge */}
          <div
            data-testid="campaign-view-master-badge"
            style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              color: T.purple, textTransform: 'uppercase',
              padding: '3px 8px', background: T.purpleDim, borderRadius: 20,
              border: `1px solid ${T.purpleBorder}`,
            }}
          >
            {t('campaign_view.viewing_as_master')}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
