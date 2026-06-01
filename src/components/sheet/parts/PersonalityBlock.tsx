import type React from 'react'
import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { Label } from '../ui/Label'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 18,
}

const PERSONALITY_FIELDS: {
  key: keyof Character['personality']
  labelKey: TranslationKey
  placeholderKey: TranslationKey
}[] = [
  { key: 'traits', labelKey: 'personality.traits_label', placeholderKey: 'personality.traits.placeholder' },
  { key: 'ideals', labelKey: 'personality.ideals_label', placeholderKey: 'personality.ideals.placeholder' },
  { key: 'bonds',  labelKey: 'personality.bonds_label',  placeholderKey: 'personality.bonds.placeholder' },
  { key: 'flaws',  labelKey: 'personality.flaws_label',  placeholderKey: 'personality.flaws.placeholder' },
]

const TEXTAREA: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  resize: 'vertical',
  minHeight: 72,
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 13,
  color: '#B8B4C8',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
}

interface PersonalityFieldProps {
  testId: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  locked?: boolean
}

function PersonalityField({ testId, label, placeholder, value, onChange, locked }: PersonalityFieldProps) {
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        data-testid={`personality-textarea-${testId}`}
        style={TEXTAREA}
        readOnly={locked}
      />
    </div>
  )
}

interface PersonalityBlockProps {
  character: Character
  onUpdate: (partial: Partial<Character>) => void
}

export function PersonalityBlock({ character, onUpdate }: PersonalityBlockProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  return (
    <div style={CARD} data-testid="personality-block">
      <Label style={{ marginBottom: 14 }}>{t('personality.section_title')}</Label>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 16 }}>
        {PERSONALITY_FIELDS.map((f) => (
          <PersonalityField
            key={f.key}
            testId={f.key}
            label={t(f.labelKey)}
            placeholder={t(f.placeholderKey)}
            value={character.personality[f.key]}
            onChange={(value) => onUpdate({ personality: { ...character.personality, [f.key]: value } })}
            {...(locked ? { locked: true } : {})}
          />
        ))}
      </div>
    </div>
  )
}
