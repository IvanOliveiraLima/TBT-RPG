import type React from 'react'
import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { Label } from '../ui/Label'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 18,
}

const PERSONALITY_FIELDS: { key: keyof Character['personality']; labelKey: TranslationKey }[] = [
  { key: 'traits', labelKey: 'personality.traits_label' },
  { key: 'ideals', labelKey: 'personality.ideals_label' },
  { key: 'bonds',  labelKey: 'personality.bonds_label' },
  { key: 'flaws',  labelKey: 'personality.flaws_label' },
]

function PersonalityField({ testId, label, value }: { testId: string; label: string; value: string }) {
  return (
    <div data-testid={`personality-field-${testId}`}>
      <h4
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#7A7788',
          margin: '0 0 5px 0',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {label}
      </h4>
      {value ? (
        <p
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            color: '#B8B4C8',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {value}
        </p>
      ) : (
        <p style={{ color: '#7A7788', margin: 0, fontSize: 13 }}>—</p>
      )}
    </div>
  )
}

export function PersonalityBlock({ character }: { character: Character }) {
  const { t } = useTranslation()
  return (
    <div style={CARD} data-testid="personality-block">
      <Label style={{ marginBottom: 14 }}>{t('personality.section_title')}</Label>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 16 }}>
        {PERSONALITY_FIELDS.map((f) => (
          <PersonalityField
            key={f.key}
            testId={f.key}
            label={t(f.labelKey)}
            value={character.personality[f.key]}
          />
        ))}
      </div>
    </div>
  )
}
