const COLOR_MAP = {
  gold:    '#D4A017',
  ruby:    '#8B1A2E',
  success: '#5DCAA5',
  purple:  '#5B3FA8',
} as const

type PipColor = keyof typeof COLOR_MAP

interface PipProps {
  state: 'empty' | 'filled' | 'doubled'
  color?: PipColor
  size?: 'sm' | 'md'
}

export function Pip({ state, color = 'gold', size = 'md' }: PipProps) {
  const px = size === 'sm' ? 8 : 10
  const hex = COLOR_MAP[color]
  const filled = state === 'filled' || state === 'doubled'

  return (
    <div
      role="presentation"
      style={{
        width: px,
        height: px,
        minWidth: px,
        borderRadius: '50%',
        background: filled ? hex : 'transparent',
        border: `1.5px solid ${filled ? hex : '#3A3450'}`,
        boxShadow: filled ? `0 0 8px ${hex}80` : 'none',
        flexShrink: 0,
        ...(state === 'doubled'
          ? { outline: `2px solid ${hex}`, outlineOffset: 1 }
          : {}),
      }}
    />
  )
}
