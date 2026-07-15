import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Character } from '@/domain/character'
import type { TabKey } from './types'
import { MobileHeader } from './MobileHeader'
import { BottomTabBar } from './BottomTabBar'
import { useTranslation } from '@/i18n'
import { StatusBadge } from '@/components/primitives/StatusBadge'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { useCharactersStore } from '@/store/characters'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'
import { useAuthStore } from '@/store/auth'
import { DicePanel } from '@/components/dice/DicePanel'

const T = {
  surface:      '#15121C',
  borderSubtle: '#2A2537',
  borderStrong: '#4A3A6B',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface MobileShellProps {
  character: Character
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

export function MobileShell({ character, activeTab, onTabChange, children }: MobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [diceOpen, setDiceOpen] = useState(false)
  const navigate = useNavigate()
  const { t, lang, setLang } = useTranslation()
  const authStatus = useAuthStatus()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  const locked = useCharacterLocked(character.id)
  const authUser = useAuthStore(s => s.user)

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

      {/* Dice FAB + panel */}
      <div style={{ position: 'fixed', bottom: 70, right: 16, zIndex: 50 }}>
        {diceOpen && (
          <div style={{ position: 'absolute', bottom: 56, right: 0 }}>
            <DicePanel onClose={() => setDiceOpen(false)} />
          </div>
        )}
        <button
          data-testid="dice-fab"
          onClick={() => setDiceOpen(prev => !prev)}
          title={t('dice.title')}
          style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: '#5B3FA8',
            border: '2px solid #7B5FC8',
            color: '#fff',
            fontSize: 22, lineHeight: 1,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ⚄
        </button>
      </div>

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
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14,
            }}>
              <div style={{
                fontFamily: T.serif, fontSize: 16, fontWeight: 600,
                color: T.textPrimary,
              }}>
                TBT-RPG
              </div>
              {authStatus === 'authenticated_idle' && (
                <StatusBadge variant="success">{t('auth.connected')}</StatusBadge>
              )}
              {authStatus === 'authenticated_syncing' && (
                <StatusBadge variant="success">{t('auth.syncing')}</StatusBadge>
              )}
              {authStatus === 'authenticated_offline' && (
                <StatusBadge variant="neutral">{t('auth.offline')}</StatusBadge>
              )}
              {authStatus === 'authenticated_error' && (
                <StatusBadge variant="neutral">{t('auth.sync_error')}</StatusBadge>
              )}
              {authStatus === 'unauthenticated' && (
                <StatusBadge variant="neutral">{t('auth.signin_prompt')}</StatusBadge>
              )}
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
              {t('nav.my_characters')}
            </button>

            {/* Campaigns link */}
            <button
              data-testid="mobile-campaigns-btn"
              onClick={() => {
                navigate(authUser ? '/campaigns' : '/login?redirectTo=/campaigns')
                setDrawerOpen(false)
              }}
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('chrome.my_campaigns')}
            </button>


            {/* Lock / Unlock button */}
            <button
              data-testid="mobile-lock-btn"
              onClick={() => { void updateCharacter(character.id, { locked: !locked }); setDrawerOpen(false) }}
              style={{
                background: locked ? 'rgba(244, 67, 54, 0.15)' : 'transparent',
                border: 'none',
                color: locked ? 'rgba(244, 67, 54, 0.8)' : T.textSecondary,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13, fontWeight: locked ? 600 : 500,
                textAlign: 'left', cursor: 'pointer',
                fontFamily: T.sans,
              }}
            >
              {locked ? `🔓 ${t('chrome.unlock')}` : `🔒 ${t('drawer.lock')}`}
            </button>

            <div style={{ marginTop: 'auto' }}>
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
