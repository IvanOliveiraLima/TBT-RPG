import type { ReactNode, CSSProperties } from 'react'

interface LabelProps {
  children: ReactNode
  style?: CSSProperties
}

export function Label({ children, style }: LabelProps) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: '#7A7788',
        marginBottom: 4,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
