import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { HpBar } from './HpBar'
import { HitDicePool } from './HitDicePool'
import { DeathSaves } from './DeathSaves'

interface HpBlockProps {
  character: Character
}

export function HpBlock({ character }: HpBlockProps) {
  const { t } = useTranslation()
  const { hp, deathSaves, hitDice } = character
  const current = hp.current
  const max = hp.max
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  const low = pct < 30

  return (
    <Card>
      {/* Header: label + percentage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: '#7A7788',
          }}
        >
          {t('hp.section_title')}
        </div>
        <div
          style={{
            fontSize: 11,
            color: low ? '#E24B4A' : '#7A7788',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {max > 0 ? `${pct}%` : '—'}
        </div>
      </div>

      {/* Big HP numbers */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div
          data-testid="hp-current"
          data-low={low ? 'true' : 'false'}
          style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 42,
            fontWeight: 600,
            color: low ? '#E24B4A' : '#F4EFE0',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: low
              ? '0 0 18px rgba(226,75,74,0.6)'
              : '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {max > 0 ? current : '—'}
        </div>
        <div style={{ color: '#7A7788', fontSize: 18 }}>/ {max > 0 ? max : '—'}</div>
        {hp.temp > 0 && (
          <div style={{ marginLeft: 'auto' }}>
            <Badge variant="purple">{t('hp.temp_label', { n: String(hp.temp) })}</Badge>
          </div>
        )}
      </div>

      <HpBar current={current} max={max} temp={hp.temp} size="lg" />

      {/* Heal / Damage buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => alert('Edição virá na Fase C')}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid #2A2537',
            color: '#5DCAA5',
            borderRadius: 8,
            padding: '8px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          ＋ {t('hp.heal_button')}
        </button>
        <button
          onClick={() => alert('Edição virá na Fase C')}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid #2A2537',
            color: '#E24B4A',
            borderRadius: 8,
            padding: '8px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          − {t('hp.damage_button')}
        </button>
      </div>

      {/* Hit Dice + Death Saves grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{
          gap: 10,
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid #2A2537',
        }}
      >
        <HitDicePool hitDice={hitDice} />
        <DeathSaves successes={deathSaves.successes} failures={deathSaves.failures} />
      </div>
    </Card>
  )
}
