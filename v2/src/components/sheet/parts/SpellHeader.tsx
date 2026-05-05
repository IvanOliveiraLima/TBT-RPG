import type { Character } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const T = {
  textPrimary: '#F4EFE0',
  gold:        '#D4A017',
  serif:       "'Cinzel', Georgia, serif",
} as const

interface SpellHeaderProps {
  character: Character
}

export function SpellHeader({ character }: SpellHeaderProps) {
  const { t } = useTranslation()

  if (!character.spells) return null

  const { spells, classes } = character
  const casterClass = classes[0]?.name ?? '—'
  const abilityAbbrev = t(`ability.${spells.ability}` as TranslationKey)

  const cells: { key: string; label: string; value: string; gold?: boolean }[] = [
    { key: 'class',        label: t('spells.header.class'),        value: casterClass },
    { key: 'ability',      label: t('spells.header.ability'),      value: abilityAbbrev },
    { key: 'save_dc',      label: t('spells.header.save_dc'),      value: String(spells.saveDC), gold: true },
    { key: 'attack_bonus', label: t('spells.header.attack_bonus'), value: formatSigned(spells.attackBonus) },
  ]

  return (
    <div data-testid="spell-header">
      <Card padding="md">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
          className="sm:grid-cols-4"
        >
          {cells.map(({ key, label, value, gold }) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <Label>{label}</Label>
              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: 18,
                  fontWeight: 600,
                  color: gold ? T.gold : T.textPrimary,
                  textShadow: gold ? `0 0 8px ${T.gold}40` : undefined,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
