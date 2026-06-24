import { useEffect } from 'react'

interface Props {
  title: string
  message: string
  onDismiss: () => void
  tone?: 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
  /** 0 = no auto-dismiss */
  autoDismissMs?: number
}

const TONES = {
  success: {
    bg:     'rgba(76,175,125,0.12)',
    border: 'rgba(76,175,125,0.35)',
    color:  '#4CAF7D',
    icon:   '✓',
  },
  error: {
    bg:     'rgba(239,159,39,0.12)',
    border: 'rgba(239,159,39,0.35)',
    color:  '#EF9F27',
    icon:   '⚠',
  },
} as const

export function DismissibleBanner({
  title,
  message,
  onDismiss,
  tone = 'success',
  actionLabel,
  onAction,
  autoDismissMs = 10000,
}: Props) {
  const { bg, border, color, icon } = TONES[tone]

  useEffect(() => {
    if (autoDismissMs === 0) return
    const timer = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [onDismiss, autoDismissMs])

  return (
    <div
      role="status"
      onClick={onDismiss}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color, opacity: 0.85 }}>
          {message}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction() }}
            style={{
              marginTop: 8,
              background: 'transparent',
              border: `1px solid ${border}`,
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              color,
              cursor: 'pointer',
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
