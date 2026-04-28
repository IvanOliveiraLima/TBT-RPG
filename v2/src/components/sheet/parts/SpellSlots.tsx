import type { Character } from '@/domain/character'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { Pip } from '../ui/Pip'

const T = {
  textMuted:    '#7A7788',
  textTertiary: '#4E4B5A',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface SpellSlotsProps {
  character: Character
}

export function SpellSlots({ character }: SpellSlotsProps) {
  if (!character.spells) return null

  const activeSlots = character.spells.slots.filter((s) => s.max > 0)
  if (activeSlots.length === 0) return null

  return (
    <div data-testid="spell-slots">
      <Card padding="md">
        <Label style={{ marginBottom: 10 }}>ESPAÇOS DE MAGIA</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeSlots.map((s) => (
            <div
              key={s.level}
              data-testid={`spell-slot-level-${s.level}`}
              role="group"
              aria-label={`Slot de nível ${s.level} (${s.current} de ${s.max} disponíveis)`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                background: T.elevated,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: T.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontFamily: T.sans,
                  minWidth: 52,
                }}
              >
                NÍVEL {s.level}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {Array.from({ length: s.max }).map((_, i) => (
                  <span key={i} data-filled={i < s.current ? 'true' : 'false'}>
                    <Pip
                      state={i < s.current ? 'filled' : 'empty'}
                      color="gold"
                      size="md"
                    />
                  </span>
                ))}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.textTertiary,
                  fontFamily: T.sans,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {s.current}/{s.max}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
