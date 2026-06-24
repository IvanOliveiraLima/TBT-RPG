import { useEffect } from 'react'

interface Props {
  title: string
  message: string
  onDismiss: () => void
  autoDismissMs?: number
}

export function DismissibleBanner({ title, message, onDismiss, autoDismissMs = 10000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [onDismiss, autoDismissMs])

  return (
    <div
      role="status"
      onClick={onDismiss}
      style={{
        background: 'rgba(76,175,125,0.12)',
        border: '1px solid rgba(76,175,125,0.35)',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✓</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#4CAF7D', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#4CAF7D', opacity: 0.85 }}>
          {message}
        </div>
      </div>
    </div>
  )
}
