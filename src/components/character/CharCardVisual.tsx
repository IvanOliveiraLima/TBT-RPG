/**
 * Purely presentational character card visual.
 * No actions — wrap with your own handlers per context.
 */

const T = {
  bg:            '#0F0D14',
  borderDefault: '#3A3450',
  borderSubtle:  '#2A2537',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textTertiary:  '#A09DB0',
  textMuted:     '#7A7788',
  ruby:          '#8B1A2E',
  gold:          '#D4A017',
  success:       '#5DCAA5',
  danger:        '#E24B4A',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

interface CharCardVisualProps {
  name: string
  raceLabel?: string | null
  classLabel?: string | null
  totalLevel?: number | null
  portraitData?: string | null
  hpCurrent?: number | null
  hpMax?: number | null
  ownerLabel?: string | null
  isLoading?: boolean
  selected?: boolean
  /** Extra right padding on the name (e.g. to leave room for a kebab menu overlay). */
  namePaddingRight?: number
}

export function CharCardVisual({
  name,
  raceLabel,
  classLabel,
  totalLevel,
  portraitData,
  hpCurrent,
  hpMax,
  ownerLabel,
  isLoading,
  selected = false,
  namePaddingRight = 0,
}: CharCardVisualProps) {
  const showHp = hpCurrent != null && hpMax != null
  const hpPct = showHp && hpMax > 0
    ? Math.min(100, Math.round((hpCurrent / hpMax) * 100))
    : 0
  const hpColor = hpPct < 30 ? T.danger : hpPct < 60 ? T.gold : T.success

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
      {/* Portrait */}
      <div
        data-testid="char-card-visual-portrait"
        style={{
          width: 56, height: 56, borderRadius: 12, flexShrink: 0,
          background: portraitData
            ? `url(${portraitData}) center/cover`
            : `
              radial-gradient(circle at 40% 35%, #8B6FC5 0%, transparent 55%),
              radial-gradient(circle at 60% 65%, ${T.ruby} 0%, transparent 55%),
              linear-gradient(135deg, #2A1F3D, #1A0F2A)
            `,
          border: `1.5px solid ${selected ? T.gold : T.borderDefault}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.serif, fontSize: 22, fontWeight: 600,
          color: selected ? T.gold : T.textSecondary,
          boxShadow: selected ? `0 0 14px ${T.gold}30` : 'none',
          position: 'relative',
        }}
      >
        {!portraitData && (name || 'X')[0]}

        {totalLevel != null && (
          <div
            data-testid="char-card-visual-level-badge"
            style={{
              position: 'absolute', bottom: -5, right: -5,
              background: T.ruby, color: T.textPrimary,
              fontFamily: T.serif, fontWeight: 700,
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${T.bg}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10,
            }}
          >
            {totalLevel || '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.serif, fontSize: 15, fontWeight: 600,
          color: T.textPrimary, lineHeight: 1.15,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          paddingRight: namePaddingRight,
        }}>
          {name}
        </div>

        {(raceLabel || classLabel) && (
          <div style={{
            fontSize: 11, color: T.textTertiary, marginTop: 3,
            display: 'flex', gap: 5, alignItems: 'center',
          }}>
            {raceLabel && <span>{raceLabel}</span>}
            {raceLabel && classLabel && <span style={{ color: T.borderDefault }}>·</span>}
            {classLabel && <span style={{ color: T.textSecondary }}>{classLabel}</span>}
          </div>
        )}

        {ownerLabel && (
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
            {ownerLabel}
          </div>
        )}

        {showHp && (
          <div
            data-testid="char-card-visual-hp-bar"
            style={{
              marginTop: 6, height: 4,
              background: T.bg, borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${T.borderSubtle}`,
            }}
          >
            <div style={{
              width: `${hpPct}%`, height: '100%',
              background: hpColor,
              borderRadius: 2,
              transition: 'width 300ms',
            }} />
          </div>
        )}

        {isLoading && !showHp && (
          <div
            data-testid="char-card-visual-hp-skeleton"
            style={{
              marginTop: 6, height: 4,
              background: T.borderSubtle, borderRadius: 2, opacity: 0.4,
            }}
            aria-label="Carregando HP"
          />
        )}
      </div>

      {/* HP text — shown when HP data available */}
      {showHp && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 9, color: T.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600,
          }}>
            HP
          </div>
          <div style={{
            fontFamily: T.serif, fontWeight: 600,
            color: T.textPrimary, fontSize: 14,
            fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, marginTop: 2,
          }}>
            {hpCurrent}
            <span style={{ color: T.textMuted, fontSize: 11 }}>/{hpMax}</span>
          </div>
        </div>
      )}
    </div>
  )
}
