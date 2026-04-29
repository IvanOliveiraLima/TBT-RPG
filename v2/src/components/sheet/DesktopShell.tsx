import type { ReactNode } from 'react'
import type { Character } from '@/domain/character'
import type { TabKey } from './types'
import { Sidebar } from './Sidebar'

const T = {
  borderSubtle: '#2A2537',
  borderDefault:'#3A3450',
  textPrimary:  '#F4EFE0',
  textTertiary: '#A09DB0',
  textSecondary:'#C8C4D6',
  ruby:         '#8B1A2E',
  rubyHover:    '#A32D42',
  success:      '#5DCAA5',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

/* ── Tag pill (matches primitives.jsx) ──────────────────────────────── */
function Tag({ children, color = 'success' }: { children: ReactNode; color?: 'success' }) {
  const colors = {
    success: { bg: 'rgba(93,202,165,0.12)', fg: '#8FE0C4', br: 'rgba(93,202,165,0.3)' },
  }
  const c = colors[color]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.fg,
      border: `1px solid ${c.br}`, borderRadius: 999,
      padding: '4px 8px', fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
    }}>
      {children}
    </span>
  )
}

interface DesktopShellProps {
  character: Character
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

export function DesktopShell({ character, activeTab, onTabChange, children }: DesktopShellProps) {
  const firstClass = character.classes[0]
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
      <Sidebar character={character} activeTab={activeTab} onTabChange={onTabChange} />

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
              {firstClass?.name ?? ''}
              {firstClass?.subclass ? ` (${firstClass.subclass})` : ''}
              {' · Nv '}
              {character.totalLevel}
              {character.background ? ` · ${character.background}` : ''}
              {character.alignment ? ` · ${character.alignment}` : ''}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <Tag color="success">● Sincronizado</Tag>

          <button
            onClick={() => alert('Exportar — não implementado nesta fase.')}
            style={{
              background: 'transparent',
              border: `1px solid ${T.borderDefault}`,
              color: T.textSecondary, borderRadius: 8,
              padding: '6px 12px', fontSize: 12, cursor: 'pointer',
            }}
          >
            Exportar
          </button>

          <button
            onClick={() => alert('Destravar / Travar — não implementado nesta fase.')}
            style={{
              background: T.ruby,
              border: `1px solid ${T.rubyHover}`,
              color: '#fff', borderRadius: 8,
              padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            🔒 Destravar
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
