import type { Character } from '@/domain/character'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

const T = {
  textSecondary: '#B8B4CC',
  textMuted:     '#7A7788',
  borderSubtle:  '#2A2537',
  sans:          "'Inter', system-ui, sans-serif",
} as const

const ROWS: { label: string; field: keyof Character['proficiencies'] }[] = [
  { label: 'ARMAS E ARMADURAS', field: 'weaponsAndArmor' },
  { label: 'FERRAMENTAS',       field: 'tools' },
  { label: 'IDIOMAS',           field: 'languages' },
  { label: 'OUTRAS',            field: 'other' },
]

function ProficiencyRow({
  label,
  value,
  divider = true,
}: {
  label: string
  value: string
  divider?: boolean
}) {
  return (
    <div
      style={
        divider
          ? { paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${T.borderSubtle}` }
          : undefined
      }
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: T.textMuted,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: value ? T.textSecondary : T.textMuted,
          fontFamily: T.sans,
          lineHeight: 1.5,
          fontStyle: value ? 'normal' : 'italic',
        }}
      >
        {value || '—'}
      </div>
    </div>
  )
}

interface ProficienciesBlockProps {
  character: Character
}

export function ProficienciesBlock({ character }: ProficienciesBlockProps) {
  const { proficiencies } = character

  return (
    <div data-testid="proficiencies-block">
      <Card padding="md">
        <Label>PROFICIÊNCIAS</Label>
        <div style={{ marginTop: 8 }}>
          {ROWS.map(({ label, field }, i) => (
            <div key={field} data-testid={`prof-row-${field}`}>
              <ProficiencyRow
                label={label}
                value={proficiencies[field]}
                divider={i < ROWS.length - 1}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
