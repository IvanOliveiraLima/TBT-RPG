import type React from 'react'
import { useTranslation } from '@/i18n'
import { NumberField } from '@/components/primitives/NumberField'

interface HitDiceEntry {
  className: string
  current: number
  max: number
  dieSize: number
}

interface HitDicePoolProps {
  hitDice: HitDiceEntry[]
  onUpdate?: (updated: HitDiceEntry[]) => void
}

const NUMBER_INPUT: React.CSSProperties = {
  width: 36,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  textAlign: 'center',
  fontFamily: "'Cinzel', Georgia, serif",
  fontSize: 22,
  fontWeight: 600,
  color: '#F4EFE0',
  fontVariantNumeric: 'tabular-nums',
  MozAppearance: 'textfield',
}

export function HitDicePool({ hitDice, onUpdate }: HitDicePoolProps) {
  const { t } = useTranslation()

  function updateEntry(className: string, current: number) {
    if (!onUpdate) return
    onUpdate(hitDice.map(hd => hd.className === className ? { ...hd, current } : hd))
  }

  const totalCurrent = hitDice.reduce((s, hd) => s + hd.current, 0)
  const totalMax = hitDice.reduce((s, hd) => s + hd.max, 0)

  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: '#7A7788',
          marginBottom: 6,
        }}
      >
        {t('hit_dice.section_title')}
      </div>

      {hitDice.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            fontFamily: "'Cinzel', Georgia, serif",
            color: '#7A7788',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600 }}>—</span>
          <span style={{ fontSize: 12, color: '#7A7788' }}>/ — d8</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hitDice.map((hd) => (
            <div
              key={hd.className || hd.dieSize}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
              }}
            >
              {/* className shown when multiclass or when editable */}
              {(hitDice.length > 1 || onUpdate) && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#7A7788',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    minWidth: 44,
                  }}
                >
                  {hd.className}
                </span>
              )}
              {onUpdate ? (
                <NumberField
                  value={hd.current}
                  min={0}
                  max={hd.max}
                  onChange={n => updateEntry(hd.className, n)}
                  aria-label={t('aria.hitdice_class_input', { className: hd.className })}
                  data-testid={`hitdice-${hd.className}-current`}
                  style={NUMBER_INPUT}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: '#F4EFE0',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {hd.current > 0 ? hd.current : hd.max > 0 ? hd.max : '—'}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#7A7788' }}>
                / {hd.max > 0 ? hd.max : '—'} d{hd.dieSize}
              </span>
            </div>
          ))}

          {/* Aggregate total when multiclass */}
          {hitDice.length > 1 && (
            <div
              style={{
                fontSize: 10,
                color: '#7A7788',
                fontWeight: 500,
                marginTop: 2,
                letterSpacing: 0.5,
              }}
            >
              {t('hit_dice.total_label', {
                current: String(totalCurrent),
                max: String(totalMax),
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
