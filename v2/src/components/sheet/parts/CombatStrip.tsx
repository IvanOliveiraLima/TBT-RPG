import type { Character } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'

interface CombatStripProps {
  character: Character
  cols?: 2 | 3 | 6
}

export function CombatStrip({ character, cols = 3 }: CombatStripProps) {
  const items: { label: string; value: string }[] = [
    { label: 'AC', value: String(character.ac) },
    { label: 'INIT', value: formatSigned(character.initiative) },
    { label: 'SPD', value: `${character.speed} ft` },
    { label: 'PP', value: String(character.passivePerception) },
    ...(character.spellSaveDC > 0
      ? [{ label: 'DC', value: String(character.spellSaveDC) }]
      : []),
    { label: 'PROF', value: formatSigned(character.proficiencyBonus) },
  ]

  return (
    <div
      data-testid="combat-strip"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 6,
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          data-testid={`combat-stat-${it.label.toLowerCase()}`}
          style={{
            background: '#15121C',
            border: '1px solid #2A2537',
            borderRadius: 10,
            padding: '8px 6px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#7A7788',
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {it.label}
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: 22,
              fontWeight: 600,
              color: '#F4EFE0',
              marginTop: 2,
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  )
}
