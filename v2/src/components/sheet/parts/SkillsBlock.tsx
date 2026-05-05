import type { Character } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { Pip } from '../ui/Pip'

interface SkillsBlockProps {
  character: Character
}

// Maps English display names (from domain) to i18n key suffixes
const SKILL_DISPLAY_TO_KEY: Record<string, string> = {
  'Acrobatics':     'acrobatics',
  'Animal Handling':'animal_handling',
  'Arcana':         'arcana',
  'Athletics':      'athletics',
  'Deception':      'deception',
  'History':        'history',
  'Insight':        'insight',
  'Intimidation':   'intimidation',
  'Investigation':  'investigation',
  'Medicine':       'medicine',
  'Nature':         'nature',
  'Perception':     'perception',
  'Performance':    'performance',
  'Persuasion':     'persuasion',
  'Religion':       'religion',
  'Sleight of Hand':'sleight_of_hand',
  'Stealth':        'stealth',
  'Survival':       'survival',
}

export function SkillsBlock({ character }: SkillsBlockProps) {
  const { t } = useTranslation()

  function skillLabel(name: string): string {
    const k = SKILL_DISPLAY_TO_KEY[name]
    return k !== undefined ? t(`skills.${k}` as TranslationKey) : name
  }

  const sorted = [...character.skills].sort((a, b) =>
    skillLabel(a.name).localeCompare(skillLabel(b.name)),
  )

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
              {skillLabel(s.name)}
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
              {t(`ability.${s.ability}`)}
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
