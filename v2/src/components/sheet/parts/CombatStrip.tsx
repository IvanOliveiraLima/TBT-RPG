import type { Character } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'
import { useTranslation } from '@/i18n'

interface CombatStripProps {
  character: Character
  cols?: 2 | 3 | 6
}

export function CombatStrip({ character, cols = 3 }: CombatStripProps) {
  const { t } = useTranslation()
  const items: { key: string; label: string; value: string }[] = [
    { key: 'ac',   label: t('combat.ac'),                 value: String(character.ac) },
    { key: 'init', label: t('combat.initiative'),          value: formatSigned(character.initiative) },
    { key: 'spd',  label: t('combat.speed'),               value: `${character.speed} ft` },
    { key: 'pp',   label: t('combat.passive_perception'),  value: String(character.passivePerception) },
    ...(character.spellSaveDC > 0
      ? [{ key: 'dc', label: t('combat.spell_save_dc'), value: String(character.spellSaveDC) }]
      : []),
    { key: 'prof', label: t('combat.proficiency_bonus'),   value: formatSigned(character.proficiencyBonus) },
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
          key={it.key}
          data-testid={`combat-stat-${it.key}`}
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
