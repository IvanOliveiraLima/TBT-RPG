import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const PADDING_MAP = { none: 0, sm: 10, md: 14, lg: 20 } as const

export function Card({ children, padding = 'md', className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: '#15121C',
        border: '1px solid #2A2537',
        borderRadius: 14,
        padding: PADDING_MAP[padding],
      }}
    >
      {children}
    </div>
  )
}
