import type { Character, AbilityKey } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'
import { Pip } from '../ui/Pip'

interface SkillsBlockProps {
  character: Character
}

const ABILITY_ABBR: Record<AbilityKey, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
}

export function SkillsBlock({ character }: SkillsBlockProps) {
  const sorted = [...character.skills].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div
      data-testid="skills-block"
      style={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {sorted.map((s) => {
        const active = s.proficient || s.expertise
        const valueColor = s.expertise ? '#8B1A2E' : s.proficient ? '#D4A017' : '#F4EFE0'

        return (
          <div
            key={s.name}
            data-testid={`skill-${s.name}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 3 }}>
              <Pip
                state={s.proficient ? 'filled' : 'empty'}
                color="gold"
                size="sm"
              />
              <Pip
                state={s.expertise ? 'filled' : 'empty'}
                color="ruby"
                size="sm"
              />
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 12.5,
                color: active ? '#F4EFE0' : '#C8C4D6',
                fontWeight: active ? 500 : 400,
              }}
            >
              {s.name}
            </span>
            <span
              style={{
                fontSize: 10,
                color: '#7A7788',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontWeight: 500,
              }}
            >
              {ABILITY_ABBR[s.ability] ?? s.ability.toUpperCase()}
            </span>
            <span
              data-testid={`skill-${s.name}-bonus`}
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 600,
                color: valueColor,
                fontSize: 14,
                fontVariantNumeric: 'tabular-nums',
                minWidth: 28,
                textAlign: 'right',
              }}
            >
              {formatSigned(s.bonus)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
