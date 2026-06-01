import type { ReactNode } from 'react'

export type BadgeVariant = 'purple' | 'gold' | 'ruby' | 'success' | 'muted'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  icon?: ReactNode
}

const VARIANTS: Record<BadgeVariant, { bg: string; fg: string; border: string }> = {
  purple:  { bg: 'rgba(91,63,168,0.18)',   fg: '#B5A5E8', border: 'rgba(91,63,168,0.35)' },
  gold:    { bg: 'rgba(212,160,23,0.15)',  fg: '#E8C569', border: 'rgba(212,160,23,0.35)' },
  ruby:    { bg: 'rgba(139,26,46,0.2)',    fg: '#E89BA8', border: 'rgba(139,26,46,0.4)' },
  success: { bg: 'rgba(93,202,165,0.12)', fg: '#8FE0C4', border: 'rgba(93,202,165,0.3)' },
  muted:   { bg: '#1B1725',               fg: '#A09DB0', border: '#2A2537' },
}

export function Badge({ variant, children, icon }: BadgeProps) {
  const c = VARIANTS[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        borderRadius: 999,
        padding: '4px 8px',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {icon}
      {children}
    </span>
  )
}
