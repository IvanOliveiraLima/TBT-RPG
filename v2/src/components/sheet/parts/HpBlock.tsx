import type React from 'react'
import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Card } from '../ui/Card'
import { HpBar } from './HpBar'
import { HitDicePool } from './HitDicePool'
import { DeathSaves } from './DeathSaves'
import { NumberField } from '@/components/primitives/NumberField'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#7A7788',
  display: 'block',
  marginBottom: 3,
}

const HP_INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  textAlign: 'center',
  fontFamily: "'Cinzel', Georgia, serif",
  fontSize: 28,
  fontWeight: 600,
  color: '#F4EFE0',
  fontVariantNumeric: 'tabular-nums',
  MozAppearance: 'textfield',
}

const HP_INPUT_STYLE_LOW: React.CSSProperties = {
  ...HP_INPUT_STYLE,
  color: '#E24B4A',
  textShadow: '0 0 12px rgba(226,75,74,0.5)',
}

const TEMP_INPUT_STYLE: React.CSSProperties = {
  ...HP_INPUT_STYLE,
  fontSize: 22,
  color: '#A07FC8',
}

interface HpBlockProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function HpBlock({ character, onUpdate }: HpBlockProps) {
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

      {/* HP inputs row: Current | Max | Temp */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 10,
        }}
        data-low={low ? 'true' : 'false'}
        data-testid="hp-inputs"
      >
        {/* Current HP */}
        <div style={{ textAlign: 'center' }}>
          <span style={LABEL_STYLE}>{t('hp.current_label')}</span>
          <NumberField
            value={current}
            min={0}
            max={max > 0 ? max + hp.temp : 999}
            onChange={n => { if (onUpdate) onUpdate({ hp: { ...hp, current: n } }) }}
            aria-label={t('aria.hp_current_input')}
            data-testid="hp-current-input"
            style={low ? HP_INPUT_STYLE_LOW : HP_INPUT_STYLE}
            disabled={!onUpdate}
          />
        </div>

        {/* Max HP */}
        <div style={{ textAlign: 'center' }}>
          <span style={LABEL_STYLE}>{t('hp.max_label')}</span>
          <NumberField
            value={max}
            min={1}
            max={999}
            onChange={n => { if (onUpdate) onUpdate({ hp: { ...hp, max: n } }) }}
            aria-label={t('aria.hp_max_input')}
            data-testid="hp-max-input"
            style={HP_INPUT_STYLE}
            disabled={!onUpdate}
          />
        </div>

        {/* Temp HP */}
        <div style={{ textAlign: 'center' }}>
          <span style={LABEL_STYLE}>{t('hp.temp_input_label')}</span>
          <NumberField
            value={hp.temp}
            min={0}
            max={999}
            onChange={n => { if (onUpdate) onUpdate({ hp: { ...hp, temp: n } }) }}
            aria-label={t('aria.hp_temp_input')}
            data-testid="hp-temp-input"
            style={TEMP_INPUT_STYLE}
            disabled={!onUpdate}
          />
        </div>
      </div>

      <HpBar current={current} max={max} temp={hp.temp} size="lg" />

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
        <HitDicePool
          hitDice={hitDice}
          {...(onUpdate !== undefined
            ? { onUpdate: (updated) => onUpdate({ hitDice: updated }) }
            : {})}
        />
        <DeathSaves
          successes={deathSaves.successes}
          failures={deathSaves.failures}
          {...(onUpdate !== undefined
            ? {
                onUpdate: (ds) =>
                  onUpdate({ deathSaves: ds }),
              }
            : {})}
        />
      </div>
    </Card>
  )
}
