/**
 * MemberRowMenu — contextual kebab (⋮) for a member row in CampaignDetail.
 *
 * Visibility rules:
 *   - Shows on own row (player: Edit name + Leave; owner: Edit name + Delete campaign)
 *   - Owner sees menu on other-player rows (action: Remove member)
 *   - No menu on other-master rows (owner is single, so only edge case is 2 masters — not supported)
 *   - No menu when there are no valid actions
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/i18n'
import type { CampaignMember, UserProfile } from '@/domain/campaign'

const T = {
  surface:      '#15121C',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  borderDefault:'#3A3450',
  textMuted:    '#7A7788',
  danger:       '#E24B4A',
  sans:         "'Inter', system-ui, sans-serif",
} as const

export type EnrichedMember = CampaignMember & { profile: UserProfile | null }

interface MemberRowMenuProps {
  member: EnrichedMember
  currentUserId: string
  isCurrentUserOwner: boolean
  onEditName: () => void
  onLeaveCampaign: () => void
  onDeleteCampaign: () => void
  onRemoveMember: () => void
}

export function MemberRowMenu({
  member,
  currentUserId,
  isCurrentUserOwner,
  onEditName,
  onLeaveCampaign,
  onDeleteCampaign,
  onRemoveMember,
}: MemberRowMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isSelf = member.userId === currentUserId
  const isMemberMaster = member.role === 'master'

  // Show menu only when there are actionable items
  const showMenu = isSelf || (isCurrentUserOwner && !isMemberMaster)
  if (!showMenu) return null

  const memberName = member.profile?.displayName ?? '?'

  function handleOutside(e: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!open) return
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div
      ref={menuRef}
      data-testid={`member-row-menu-${member.userId}`}
      onClick={e => e.stopPropagation()}
      style={{ position: 'relative', flexShrink: 0 }}
    >
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        aria-label={t('aria.member_row_menu').replace('{name}', memberName)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid={`member-menu-trigger-${member.userId}`}
        style={{
          background:   'transparent',
          border:       'none',
          color:        T.textMuted,
          cursor:       'pointer',
          width:        28,
          height:       28,
          borderRadius: 6,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     16,
          lineHeight:   1,
          padding:      0,
        }}
      >
        ⋮
      </button>

      {open && (
        <div
          role="menu"
          data-testid={`member-menu-dropdown-${member.userId}`}
          style={{
            position:   'absolute',
            top:        '100%',
            right:      0,
            minWidth:   170,
            background: T.elevated,
            border:     `1px solid ${T.borderDefault}`,
            borderRadius: 8,
            boxShadow:  '0 4px 16px rgba(0,0,0,0.4)',
            padding:    4,
            zIndex:     20,
          }}
        >
          {/* Edit display name — own row only */}
          {isSelf && (
            <button
              role="menuitem"
              data-testid={`member-edit-name-${member.userId}`}
              onClick={e => { e.stopPropagation(); setOpen(false); onEditName() }}
              style={menuItemStyle()}
            >
              {t('member_menu.edit_name')}
            </button>
          )}

          {/* Leave campaign — own row, non-owner */}
          {isSelf && !isCurrentUserOwner && (
            <button
              role="menuitem"
              data-testid={`member-leave-${member.userId}`}
              onClick={e => { e.stopPropagation(); setOpen(false); onLeaveCampaign() }}
              style={menuItemStyle(true)}
            >
              {t('campaigns.leave')}
            </button>
          )}

          {/* Delete campaign — own row, owner */}
          {isSelf && isCurrentUserOwner && (
            <button
              role="menuitem"
              data-testid={`member-delete-campaign-${member.userId}`}
              onClick={e => { e.stopPropagation(); setOpen(false); onDeleteCampaign() }}
              style={menuItemStyle(true)}
            >
              {t('delete_campaign.confirm')}
            </button>
          )}

          {/* Remove member — other player row, viewed by owner */}
          {!isSelf && isCurrentUserOwner && (
            <button
              role="menuitem"
              data-testid={`member-remove-${member.userId}`}
              onClick={e => { e.stopPropagation(); setOpen(false); onRemoveMember() }}
              style={menuItemStyle(true)}
            >
              {t('member_menu.remove_member')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function menuItemStyle(danger = false): React.CSSProperties {
  return {
    display:     'flex',
    alignItems:  'center',
    width:       '100%',
    padding:     '8px 12px',
    background:  'transparent',
    border:      'none',
    borderRadius: 6,
    color:       danger ? T.danger : '#C8C4D6',
    cursor:      'pointer',
    textAlign:   'left',
    fontSize:    13,
    fontFamily:  T.sans,
  }
}
