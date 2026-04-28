import { Link } from 'react-router-dom'
import type { Character } from '@/domain/character'
import type { TabKey } from './types'

const T = {
  surface:      '#15121C',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  textPrimary:  '#F4EFE0',
  textTertiary: '#A09DB0',
  textMuted:    '#7A7788',
  ruby:         '#8B1A2E',
  purple:       '#5B3FA8',
  gold:         '#D4A017',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

const NAV_TABS: { k: TabKey; n: string }[] = [
  { k: 'status', n: 'Atributos' },
  { k: 'combat', n: 'Combate' },
  { k: 'spells', n: 'Magias' },
  { k: 'inv',    n: 'Inventário' },
  { k: 'lore',   n: 'História' },
  { k: 'notes',  n: 'Notas' },
]

interface SidebarProps {
  character: Character
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function Sidebar({ character, activeTab, onTabChange }: SidebarProps) {
  const portrait = character.images.character
  const firstClass = character.classes[0]

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
      {/* Logo — entire block is a link back to char select */}
      <Link
        to="/"
        className="hover:opacity-80 transition-opacity"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '4px 8px 18px',
          borderBottom: `1px solid ${T.borderSubtle}`,
          marginBottom: 10,
          textDecoration: 'none',
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
          <div style={{ fontSize: 10, color: T.textMuted }}>v2 · beta</div>
        </div>
      </Link>

      {/* Back-to-list link */}
      <Link
        to="/"
        className="flex items-center gap-2 hover:text-text-primary transition-colors"
        style={{
          color: T.textMuted,
          textDecoration: 'none',
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 500,
          marginBottom: 12,
          borderRadius: 6,
        }}
      >
        {/* Arrow left */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M19 12H5M5 12l7 7M5 12l7-7"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Meus personagens</span>
      </Link>

      {/* Character mini-card */}
      <div style={{
        padding: 10, background: T.elevated,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 10, marginBottom: 14,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: portrait
            ? `url(${portrait}) center/cover`
            : `radial-gradient(circle at 40% 35%, #8B6FC5 0%, transparent 55%),
               radial-gradient(circle at 60% 65%, ${T.ruby} 0%, transparent 55%),
               linear-gradient(135deg, #2A1F3D, #1A0F2A)`,
          border: `1px solid ${T.gold}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.serif, color: T.gold, fontWeight: 600, fontSize: 16,
        }}>
          {!portrait && (character.name[0] ?? '?')}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: T.serif, fontSize: 13, fontWeight: 600,
            color: T.textPrimary,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {character.name}
          </div>
          <div style={{ fontSize: 10, color: T.textTertiary }}>
            {firstClass?.name ?? ''} {character.totalLevel}
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{
        fontSize: 9, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: 1.5,
        padding: '0 10px 6px', fontWeight: 600,
      }}>
        Páginas
      </div>

      {/* Nav items */}
      {NAV_TABS.map(t => {
        const isActive = activeTab === t.k
        return (
          <button
            key={t.k}
            onClick={() => onTabChange(t.k)}
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
            {t.n}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* AI button */}
      <div
        onClick={() => alert('Gerar com IA — não implementado nesta fase.')}
        style={{
          padding: '10px 12px',
          background: 'linear-gradient(135deg, rgba(212,160,23,0.12), rgba(91,63,168,0.08))',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 10,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{ color: T.gold }}>✦</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>Gerar com IA</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>Backstory, items, magias</div>
        </div>
      </div>

      {/* Language toggle (visual only) */}
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        <button style={{
          flex: 1, background: T.purple, color: '#fff',
          border: 'none', borderRadius: 6, padding: 6,
          fontSize: 10, fontWeight: 700, cursor: 'pointer',
        }}>
          PT
        </button>
        <button style={{
          flex: 1, background: 'transparent', color: T.textMuted,
          border: `1px solid ${T.borderSubtle}`, borderRadius: 6,
          padding: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
        }}>
          EN
        </button>
      </div>
    </div>
  )
}
