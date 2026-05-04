import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

const T = {
  textSecondary: '#B8B4CC',
  textMuted:     '#7A7788',
  borderSubtle:  '#2A2537',
  sans:          "'Inter', system-ui, sans-serif",
} as const


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
  const { t } = useTranslation()
  const { proficiencies } = character
  const rows: { label: string; field: keyof Character['proficiencies'] }[] = [
    { label: t('proficiencies.weapons_armor'), field: 'weaponsAndArmor' },
    { label: t('proficiencies.tools'),         field: 'tools' },
    { label: t('proficiencies.languages'),     field: 'languages' },
    { label: t('proficiencies.other'),         field: 'other' },
  ]

  return (
    <div data-testid="proficiencies-block">
      <Card padding="md">
        <Label>{t('proficiencies.label')}</Label>
        <div style={{ marginTop: 8 }}>
          {rows.map(({ label, field }, i) => (
            <div key={field} data-testid={`prof-row-${field}`}>
              <ProficiencyRow
                label={label}
                value={proficiencies[field]}
                divider={i < rows.length - 1}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
