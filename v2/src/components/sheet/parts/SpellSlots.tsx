import type { Character } from '@/domain/character'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { Pip } from '../ui/Pip'
import { useTranslation } from '@/i18n'

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
  const { t } = useTranslation()

  if (!character.spells) return null

  const activeSlots = character.spells.slots.filter((s) => s.max > 0)
  if (activeSlots.length === 0) return null

  return (
    <div data-testid="spell-slots">
      <Card padding="md">
        <Label style={{ marginBottom: 10 }}>{t('spell_slots.section_title')}</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeSlots.map((s) => (
            <div
              key={s.level}
              data-testid={`spell-slot-level-${s.level}`}
              role="group"
              aria-label={t('spell_slots.pip_aria', {
                level:   String(s.level),
                current: String(s.current),
                max:     String(s.max),
              })}
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
                {t('spell_slots.level_label', { level: String(s.level) })}
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
                {t('spell_slots.count_label', { current: String(s.current), max: String(s.max) })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
