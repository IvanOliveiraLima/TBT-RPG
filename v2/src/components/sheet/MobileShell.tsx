import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/domain/character'
import type { TabKey } from './types'
import { MobileHeader } from './MobileHeader'
import { BottomTabBar } from './BottomTabBar'

const T = {
  surface:      '#15121C',
  borderSubtle: '#2A2537',
  borderStrong: '#4A3A6B',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  gold:         '#D4A017',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

const DRAWER_ITEMS = [
  'Exportar JSON',
  'Importar JSON',
  'Nova ficha',
  'Bloquear',
  'Entrar para sincronizar',
]

interface MobileShellProps {
  character: Character
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

export function MobileShell({ character, activeTab, onTabChange, children }: MobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

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

      <div style={{
        flex: 1, padding: '14px 12px',
        overflowY: 'auto',
      }}>
        {children}
      </div>

      <BottomTabBar active={activeTab} onChange={onTabChange} />

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
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
              fontFamily: T.serif, fontSize: 16, fontWeight: 600,
              color: T.textPrimary, marginBottom: 14,
            }}>
              TBT-RPG
            </div>

            {/* Back to char select */}
            <button
              onClick={() => { navigate('/'); setDrawerOpen(false) }}
              style={{
                background: 'transparent',
                border: 'none',
                color: T.textSecondary,
                padding: '10px 12px',
                borderRadius: 8,
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
              Meus personagens
            </button>

            {DRAWER_ITEMS.map(item => (
              <button
                key={item}
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: T.textSecondary,
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  textAlign: 'left', cursor: 'pointer',
                  fontFamily: T.sans,
                }}
              >
                {item}
              </button>
            ))}

            <div style={{ marginTop: 'auto' }}>
              <div style={{
                display: 'flex', gap: 6,
                paddingTop: 10,
                borderTop: `1px solid ${T.borderSubtle}`,
              }}>
                <button style={{
                  flex: 1, background: T.purple, color: '#fff',
                  border: 'none', borderRadius: 6, padding: '6px',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: T.sans,
                }}>
                  PT
                </button>
                <button style={{
                  flex: 1, background: 'transparent', color: T.textMuted,
                  border: `1px solid ${T.borderSubtle}`, borderRadius: 6,
                  padding: '6px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: T.sans,
                }}>
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
