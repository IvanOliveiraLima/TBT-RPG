import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/i18n'
import type { Campaign } from '@/domain/campaign'

const T = {
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textTertiary:  '#A09DB0',
  textMuted:     '#7A7788',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  danger:        '#E24B4A',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

interface CampaignCardProps {
  campaign: Campaign
  currentUserId: string
  onOpen: () => void
  onRequestDelete: (id: string, name: string) => void
  onRequestLeave: (id: string, name: string) => void
}

export function CampaignCard({ campaign, currentUserId, onOpen, onRequestDelete, onRequestLeave }: CampaignCardProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOwner = campaign.ownerId === currentUserId

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div style={{ position: 'relative' }}>
      <button
        data-testid={`campaign-card-${campaign.id}`}
        onClick={onOpen}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 12,
          background: T.surface,
          border: `1px solid ${T.borderSubtle}`,
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', textAlign: 'left',
          transition: 'border-color 200ms',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.purple}, #2A1F3D)`,
          border: `1px solid ${T.borderDefault}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.gold,
        }}>
          {(campaign.name[0] ?? '?').toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.serif, fontSize: 14, fontWeight: 600,
            color: T.textPrimary,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            paddingRight: 28,
          }}>
            {campaign.name}
          </div>
          {campaign.description && (
            <div style={{
              fontSize: 11, color: T.textTertiary, marginTop: 3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {campaign.description}
            </div>
          )}
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
            {isOwner ? 'Mestre' : 'Jogador'}
          </div>
        </div>
      </button>

      {/* Kebab menu */}
      <div ref={menuRef} style={{ position: 'absolute', top: 10, right: 10 }}>
        <button
          data-testid={`campaign-menu-${campaign.id}`}
          aria-label={t('aria.campaign_options').replace('{name}', campaign.name)}
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          style={{
            background: 'transparent', border: 'none',
            color: T.textMuted, cursor: 'pointer',
            padding: '4px 6px', borderRadius: 6,
            fontSize: 16, lineHeight: 1,
          }}
        >
          ⋮
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 28, zIndex: 10,
            background: T.elevated,
            border: `1px solid ${T.borderDefault}`,
            borderRadius: 8,
            minWidth: 130,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            {isOwner ? (
              <button
                data-testid={`campaign-delete-${campaign.id}`}
                onClick={e => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onRequestDelete(campaign.id, campaign.name)
                }}
                style={{
                  width: '100%',
                  background: 'transparent', border: 'none',
                  color: T.danger,
                  padding: '10px 14px',
                  fontSize: 13, fontWeight: 500,
                  textAlign: 'left', cursor: 'pointer',
                  fontFamily: T.sans,
                }}
              >
                {t('delete_campaign.confirm')}
              </button>
            ) : (
              <button
                data-testid={`campaign-leave-${campaign.id}`}
                onClick={e => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onRequestLeave(campaign.id, campaign.name)
                }}
                style={{
                  width: '100%',
                  background: 'transparent', border: 'none',
                  color: T.danger,
                  padding: '10px 14px',
                  fontSize: 13, fontWeight: 500,
                  textAlign: 'left', cursor: 'pointer',
                  fontFamily: T.sans,
                }}
              >
                {t('campaigns.leave')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
