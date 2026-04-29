import type React from 'react'
import type { Character } from '@/domain/character'
import { Label } from '../ui/Label'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 18,
}

const PERSONALITY_FIELDS: { key: keyof Character['personality']; label: string }[] = [
  { key: 'traits', label: 'Traços' },
  { key: 'ideals', label: 'Ideais' },
  { key: 'bonds',  label: 'Vínculos' },
  { key: 'flaws',  label: 'Defeitos' },
]

function PersonalityField({ label, value }: { label: string; value: string }) {
  return (
    <div data-testid={`personality-field-${label.toLowerCase()}`}>
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
  return (
    <div style={CARD} data-testid="personality-block">
      <Label style={{ marginBottom: 14 }}>Personalidade</Label>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 16 }}>
        {PERSONALITY_FIELDS.map((f) => (
          <PersonalityField
            key={f.key}
            label={f.label}
            value={character.personality[f.key]}
          />
        ))}
      </div>
    </div>
  )
}
