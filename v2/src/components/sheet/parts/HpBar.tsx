interface HpBarProps {
  current: number
  max: number
  temp?: number
  size?: 'sm' | 'md' | 'lg'
}

export function HpBar({ current, max, temp = 0, size = 'md' }: HpBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const low = pct < 30
  const tempPct = max > 0 ? Math.min(100 - pct, (temp / max) * 100) : 0
  const barH = size === 'sm' ? 10 : size === 'lg' ? 20 : 14

  const color = low ? '#E24B4A' : pct < 60 ? '#D4A017' : '#5DCAA5'

  return (
    <div
      data-testid="hp-bar"
      style={{
        position: 'relative',
        height: barH,
        background: '#0F0D14',
        borderRadius: 999,
        border: '1px solid #2A2537',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
      }}
    >
      {/* HP fill */}
      <div
        data-testid="hp-bar-fill"
        data-low={low ? 'true' : 'false'}
        style={{
          position: 'absolute',
          inset: 0,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          borderRadius: 999,
          transition: 'width 400ms ease',
          boxShadow: low
            ? `0 0 14px ${color}90`
            : 'inset 0 1px 0 rgba(255,255,255,0.2)',
          animation: low ? 'hp-pulse-low 1.8s ease-in-out infinite' : 'none',
        }}
      />
      {/* Temp HP stripe */}
      {temp > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct}%`,
            width: `${tempPct}%`,
            background:
              'repeating-linear-gradient(45deg, #5B3FA8, #5B3FA8 4px, #6F4DC9 4px, #6F4DC9 8px)',
            opacity: 0.85,
          }}
        />
      )}
    </div>
  )
}
