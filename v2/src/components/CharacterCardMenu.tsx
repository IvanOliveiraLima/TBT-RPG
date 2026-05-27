/**
 * CharacterCardMenu — kebab (⋮) menu overlay on a character card.
 *
 * Renders a trigger button in the top-right corner of the card.
 * The dropdown contains a single "Delete" action.
 * All clicks stopPropagation so they don't navigate the parent card.
 * Closes on outside mousedown.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const T = {
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  danger:        '#E24B4A',
} as const

interface CharacterCardMenuProps {
  characterId:   string
  characterName: string
  onDelete: (id: string, name: string) => void
}

export function CharacterCardMenu({ characterId, characterName, onDelete }: CharacterCardMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(prev => !prev)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(false)
    onDelete(characterId, characterName)
  }

  return (
    <div
      ref={menuRef}
      data-testid="character-card-menu"
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-label={t('characters.options_for' as TranslationKey, { name: characterName })}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="character-card-menu-trigger"
        style={{
          background:   'transparent',
          border:       'none',
          color:        T.textMuted,
          cursor:       'pointer',
          width:        28,
          height:       28,
          borderRadius: '50%',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     18,
          lineHeight:   1,
          padding:      0,
          transition:   'all 150ms',
        }}
      >
        ⋮
      </button>

      {open && (
        <div
          role="menu"
          data-testid="character-card-menu-dropdown"
          style={{
            position:   'absolute',
            top:        '100%',
            right:      0,
            minWidth:   140,
            background: T.surface,
            border:     `1px solid ${T.borderSubtle}`,
            borderRadius: 8,
            boxShadow:  '0 4px 16px rgba(0,0,0,0.4)',
            padding:    4,
          }}
        >
          <button
            role="menuitem"
            onClick={handleDelete}
            data-testid="character-card-menu-delete"
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         8,
              width:       '100%',
              padding:     '8px 12px',
              background:  'transparent',
              border:      'none',
              borderRadius: 6,
              color:       T.danger,
              cursor:      'pointer',
              textAlign:   'left',
              fontSize:    13,
              fontFamily:  "'Inter', system-ui, sans-serif",
            }}
          >
            🗑 {t('characters.delete' as TranslationKey)}
          </button>
        </div>
      )}
    </div>
  )
}
