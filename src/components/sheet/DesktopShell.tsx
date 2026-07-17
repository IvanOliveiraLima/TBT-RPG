import { type ReactNode } from 'react'
import type { Character } from '@/domain/character'
import { formatClassesShort } from '@/domain/derived'
import { classLabel } from '@/utils/classLabel'
import type { TabKey } from './types'
import { Sidebar } from './Sidebar'
import { useTranslation } from '@/i18n'
import { StatusBadge } from '@/components/primitives/StatusBadge'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { useCharactersStore } from '@/store/characters'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'
import { DicePanel } from '@/components/dice/DicePanel'
import { useDiceStore } from '@/store/useDiceStore'

const T = {
  borderSubtle: '#2A2537',
  borderDefault:'#3A3450',
  textPrimary:  '#F4EFE0',
  textTertiary: '#A09DB0',
  textSecondary:'#C8C4D6',
  ruby:         '#8B1A2E',
  rubyHover:    '#A32D42',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface DesktopShellProps {
  character: Character
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

export function DesktopShell({ character, activeTab, onTabChange, children }: DesktopShellProps) {
  const { t } = useTranslation()
  const authStatus = useAuthStatus()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  const locked = useCharacterLocked(character.id)
  const isOpen = useDiceStore(s => s.isOpen)
  const toggle = useDiceStore(s => s.toggle)
  const close = useDiceStore(s => s.close)
  const rollMode = useDiceStore(s => s.rollMode)
  const setRollMode = useDiceStore(s => s.setRollMode)
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
              {formatClassesShort(character, name => classLabel(name, t))}
              {character.background ? ` · ${character.background}` : ''}
              {character.alignment ? ` · ${character.alignment}` : ''}
            </div>
          </div>

          <div style={{ flex: 1 }} />

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

          <button
            data-testid="lock-btn"
            onClick={() => void updateCharacter(character.id, { locked: !locked })}
            style={{
              background: locked ? 'rgba(244, 67, 54, 0.15)' : T.ruby,
              border: `1px solid ${locked ? 'rgba(244, 67, 54, 0.8)' : T.rubyHover}`,
              color: locked ? 'rgba(244, 67, 54, 0.8)' : '#fff',
              borderRadius: 8,
              padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {locked ? `🔓 ${t('chrome.unlock')}` : `🔒 ${t('drawer.lock')}`}
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, padding: 20 }}>
          {children}
        </div>
      </div>

      {/* Dice panel: separate fixed layer so it can be bounded by viewport height */}
      {isOpen && (
        <div style={{ position: 'fixed', top: 12, bottom: 128, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <DicePanel onClose={close} />
        </div>
      )}

      {/* Dice FAB + mode selector */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {/* Roll mode selector */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['normal', 'advantage', 'disadvantage'] as const).map(m => {
            const active = rollMode === m
            const label = m === 'normal' ? t('dice.normal')[0] : m === 'advantage' ? t('dice.advantage')[0] : t('dice.disadvantage')[0]
            const activeColor = m === 'advantage' ? '#27AE60' : m === 'disadvantage' ? '#C0392B' : '#5B3FA8'
            return (
              <button
                key={m}
                data-testid={`roll-mode-${m}`}
                onClick={() => setRollMode(m)}
                title={m === 'normal' ? t('dice.normal') : m === 'advantage' ? t('dice.advantage') : t('dice.disadvantage')}
                style={{
                  width: 28, height: 28,
                  borderRadius: 6,
                  border: `1px solid ${active ? activeColor : '#3A3450'}`,
                  background: active ? activeColor : 'rgba(255,255,255,0.06)',
                  color: active ? '#fff' : '#7A7788',
                  fontSize: 10, fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <button
          data-testid="dice-fab"
          onClick={toggle}
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
    </div>
  )
}
