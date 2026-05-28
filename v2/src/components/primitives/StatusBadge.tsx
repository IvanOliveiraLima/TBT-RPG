import type { ReactNode } from 'react'

interface StatusBadgeProps {
  variant: 'success' | 'neutral'
  children: ReactNode
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span
      data-testid={`status-badge-${variant}`}
      className={`status-badge status-badge-${variant}`}
    >
      <span className="status-badge-dot" aria-hidden="true" />
      {children}
    </span>
  )
}
