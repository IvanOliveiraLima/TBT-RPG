import type React from 'react'
import type { Character, SkillState } from '@/domain/character'
import { skillBonus, proficiencyBonus, formatSigned } from '@/domain/calculations'
import { deriveTotalLevel } from '@/domain/derived'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { Pip } from '../ui/Pip'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'

interface SkillsBlockProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
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

const PIP_BUTTON: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '8px',
  margin: '-8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
}

export function SkillsBlock({ character, onUpdate }: SkillsBlockProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  const profBonus = proficiencyBonus(deriveTotalLevel(character))

  function skillLabel(name: string): string {
    const k = SKILL_DISPLAY_TO_KEY[name]
    return k !== undefined ? t(`skills.${k}` as TranslationKey) : name
  }

  function handleToggleProficient(s: SkillState) {
    if (!onUpdate) return
    const newProficient = !s.proficient
    // D&D invariant: disabling proficient also disables expertise
    const newExpertise = newProficient ? s.expertise : false
    onUpdate({
      skills: character.skills.map(sk =>
        sk.name === s.name ? { ...sk, proficient: newProficient, expertise: newExpertise } : sk,
      ),
    })
  }

  function handleToggleExpertise(s: SkillState) {
    if (!onUpdate) return
    const newExpertise = !s.expertise
    // D&D invariant: enabling expertise also enables proficient
    const newProficient = newExpertise ? true : s.proficient
    onUpdate({
      skills: character.skills.map(sk =>
        sk.name === s.name ? { ...sk, proficient: newProficient, expertise: newExpertise } : sk,
      ),
    })
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
        const bonus = skillBonus(character.abilities[s.ability], s.proficient, s.expertise, profBonus)
        const active = s.proficient || s.expertise
        const valueColor = s.expertise ? '#8B1A2E' : s.proficient ? '#D4A017' : '#F4EFE0'
        const label = skillLabel(s.name)

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
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                data-testid={`skill-${s.name}-prof-toggle`}
                disabled={!onUpdate || locked}
                aria-pressed={s.proficient}
                aria-label={t('aria.skill_proficient_toggle', { skill: label })}
                onClick={() => { handleToggleProficient(s) }}
                style={{ ...PIP_BUTTON, cursor: (onUpdate && !locked) ? 'pointer' : 'default' }}
              >
                <Pip
                  state={s.proficient ? 'filled' : 'empty'}
                  color="gold"
                  size="sm"
                />
              </button>
              <button
                type="button"
                data-testid={`skill-${s.name}-exp-toggle`}
                disabled={!onUpdate || locked}
                aria-pressed={s.expertise}
                aria-label={t('aria.skill_expertise_toggle', { skill: label })}
                onClick={() => { handleToggleExpertise(s) }}
                style={{ ...PIP_BUTTON, cursor: (onUpdate && !locked) ? 'pointer' : 'default' }}
              >
                <Pip
                  state={s.expertise ? 'filled' : 'empty'}
                  color="ruby"
                  size="sm"
                />
              </button>
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 12.5,
                color: active ? '#F4EFE0' : '#C8C4D6',
                fontWeight: active ? 500 : 400,
              }}
            >
              {label}
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
              {formatSigned(bonus)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
