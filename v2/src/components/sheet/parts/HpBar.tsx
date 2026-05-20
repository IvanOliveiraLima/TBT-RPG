interface HpBarProps {
  current: number
  max: number
  temp?: number
  size?: 'sm' | 'md' | 'lg'
}

export function HpBar({ current, max, temp = 0, size = 'md' }: HpBarProps) {
  // Low detection is based on current / max (temp HP is a buffer, not true health)
  const healthPct = max > 0 ? (current / max) * 100 : 0
  const low = healthPct < 30

  // Visual widths use effectiveMax so the bar always shows the full HP+temp capacity
  const effectiveMax = max + temp
  const hpWidthPct = effectiveMax > 0 ? Math.max(0, Math.min(100, (current / effectiveMax) * 100)) : 0
  const tempWidthPct = effectiveMax > 0 ? (temp / effectiveMax) * 100 : 0

  const barH = size === 'sm' ? 10 : size === 'lg' ? 20 : 14
  const color = low ? '#E24B4A' : healthPct < 60 ? '#D4A017' : '#5DCAA5'

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
          width: `${hpWidthPct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          borderRadius: 999,
          transition: 'width 400ms ease',
          boxShadow: low
            ? `0 0 14px ${color}90`
            : 'inset 0 1px 0 rgba(255,255,255,0.2)',
          animation: low ? 'hp-pulse-low 1.8s ease-in-out infinite' : 'none',
        }}
      />
      {/* Temp HP stripe — starts immediately after the HP fill */}
      {temp > 0 && (
        <div
          data-testid="hp-bar-temp"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${hpWidthPct}%`,
            width: `${tempWidthPct}%`,
            background:
              'repeating-linear-gradient(45deg, #5B3FA8, #5B3FA8 4px, #6F4DC9 4px, #6F4DC9 8px)',
            opacity: 0.85,
          }}
        />
      )}
    </div>
  )
}
