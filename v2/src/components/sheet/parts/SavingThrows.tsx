import type { Character, AbilityKey } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'
import { Pip } from '../ui/Pip'

interface SavingThrowsProps {
  character: Character
}

const ABILITY_ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export function SavingThrows({ character }: SavingThrowsProps) {
  const saveMap = new Map(character.savingThrows.map((st) => [st.ability, st]))

  return (
    <div
      data-testid="saving-throws"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}
    >
      {ABILITY_ORDER.map((k) => {
        const st = saveMap.get(k)
        const proficient = st?.proficient ?? false
        const bonus = st?.bonus ?? 0

        return (
          <div
            key={k}
            data-testid={`save-${k}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              borderRadius: 8,
            }}
          >
            <Pip state={proficient ? 'filled' : 'empty'} color="gold" size="sm" />
            <span style={{ flex: 1, fontSize: 12, color: '#C8C4D6' }}>
              {ABILITY_LABELS[k]}
            </span>
            <span
              data-testid={`save-${k}-bonus`}
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 600,
                color: proficient ? '#D4A017' : '#F4EFE0',
                fontSize: 14,
                fontVariantNumeric: 'tabular-nums',
                minWidth: 24,
                textAlign: 'right',
              }}
            >
              {formatSigned(bonus)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
