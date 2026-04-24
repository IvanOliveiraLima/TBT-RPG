import type { TabKey } from './types'

const T = {
  gold:     '#D4A017',
  textMuted:'#7A7788',
  sans:     "'Inter', system-ui, sans-serif",
} as const

const TABS: { k: TabKey; n: string; icon: React.ReactNode }[] = [
  {
    k: 'status',
    n: 'Status',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-5.5-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 11-7 11l-2 0-2 0z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    k: 'combat',
    n: 'Combate',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14.5 3.5 3.5 14.5 9.5 20.5 20.5 9.5 14.5 3.5z M6.5 17.5 8.5 19.5 M11 13 14 10"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    k: 'spells',
    n: 'Magias',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M5 19l2.5-2.5M16.5 7.5 19 5"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    k: 'inv',
    n: 'Inv',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 7h16v12H4z M4 7l2-3h12l2 3 M10 11h4"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    k: 'lore',
    n: 'Lore',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h10l6 6v10H4z M14 4v6h6 M8 14h8 M8 18h8"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
]

interface BottomTabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 10,
      background: 'rgba(15,13,20,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid #2A2537',
      padding: '6px 4px 10px',
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
    }}>
      {TABS.map(t => {
        const active_ = active === t.k
        return (
          <button
            key={t.k}
            onClick={() => onChange(t.k)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 4px 4px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              cursor: 'pointer',
              color: active_ ? T.gold : T.textMuted,
              position: 'relative',
              transition: 'color 200ms',
              fontFamily: T.sans,
            }}
          >
            {active_ && (
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 24, height: 2, borderRadius: 2,
                background: T.gold,
                boxShadow: `0 0 8px ${T.gold}80`,
              }} />
            )}
            {t.icon}
            <span style={{
              fontSize: 10,
              fontWeight: active_ ? 600 : 500,
              letterSpacing: 0.3,
            }}>{t.n}</span>
          </button>
        )
      })}
    </div>
  )
}
