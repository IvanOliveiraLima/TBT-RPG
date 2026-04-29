import type { Character, AbilityKey } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

const ABILITY_LABEL: Record<AbilityKey, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
}

const T = {
  textPrimary: '#F4EFE0',
  gold:        '#D4A017',
  serif:       "'Cinzel', Georgia, serif",
} as const

interface SpellHeaderProps {
  character: Character
}

export function SpellHeader({ character }: SpellHeaderProps) {
  if (!character.spells) return null

  const { spells, classes } = character
  const casterClass = classes[0]?.name ?? '—'

  const cells: { label: string; value: string; gold?: boolean }[] = [
    { label: 'CLASSE',            value: casterClass },
    { label: 'HABILIDADE',        value: ABILITY_LABEL[spells.ability] },
    { label: 'DC DE SALVAGUARDA', value: String(spells.saveDC), gold: true },
    { label: 'BÔNUS DE ATAQUE',   value: formatSigned(spells.attackBonus) },
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
          {cells.map(({ label, value, gold }) => (
            <div key={label} style={{ textAlign: 'center' }}>
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
