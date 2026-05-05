import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'

const T = {
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textTertiary: '#A09DB0',
  textSecondary:'#C8C4D6',
  gold:         '#D4A017',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface MobileHeaderProps {
  character: Character
  onMenu: () => void
}

export function MobileHeader({ character, onMenu }: MobileHeaderProps) {
  const { t } = useTranslation()
  const firstClass = character.classes[0]
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(15,13,20,0.9)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${T.borderSubtle}`,
      padding: '56px 14px 10px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: T.sans,
    }}>
      <button
        onClick={onMenu}
        aria-label={t('aria.open_menu')}
        style={{
          width: 34, height: 34, borderRadius: 8,
          background: T.elevated,
          border: `1px solid ${T.borderSubtle}`,
          color: T.textSecondary,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, padding: 0, flexShrink: 0,
        }}
      >
        ☰
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.serif, fontSize: 14,
          fontWeight: 600, color: T.textPrimary,
          lineHeight: 1.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {character.name}
        </div>
        <div style={{
          fontSize: 10, color: T.textTertiary, marginTop: 2, letterSpacing: 0.3,
        }}>
          {firstClass?.name ?? ''} {character.totalLevel} · {character.race}
        </div>
      </div>

      <button
        aria-label={t('aria.generate_ai')}
        style={{
          width: 34, height: 34, borderRadius: 8,
          background: 'transparent',
          border: `1px solid ${T.borderSubtle}`,
          color: T.gold,
          cursor: 'pointer',
          fontSize: 14, padding: 0, flexShrink: 0,
        }}
        onClick={() => alert(t('phase_c.ai_unavailable'))}
      >
        ✦
      </button>
    </div>
  )
}
