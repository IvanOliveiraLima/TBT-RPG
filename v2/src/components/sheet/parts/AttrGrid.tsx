import type React from 'react'
import type { Character, AbilityKey } from '@/domain/character'
import { abilityModifier, formatSigned } from '@/domain/calculations'
import { useTranslation } from '@/i18n'

interface AttrGridProps {
  character: Character
  cols?: 2 | 3 | 6
  compact?: boolean
  onUpdate?: (partial: Partial<Character>) => void
}

const ABILITY_ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const SCORE_INPUT: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  textAlign: 'center',
  fontFamily: 'inherit',
  fontSize: 11,
  color: '#A09DB0',
  fontVariantNumeric: 'tabular-nums',
  cursor: 'text',
  MozAppearance: 'textfield',
}

export function AttrGrid({ character, cols = 3, compact = false, onUpdate }: AttrGridProps) {
  const { t } = useTranslation()
  const saveProf = new Map(
    character.savingThrows.map((st) => [st.ability, st.proficient]),
  )

  function handleScoreChange(k: AbilityKey, raw: string) {
    if (!onUpdate) return
    const parsed = parseInt(raw, 10)
    if (Number.isNaN(parsed)) return
    const clamped = Math.max(1, Math.min(30, parsed))
    onUpdate({ abilities: { ...character.abilities, [k]: clamped } })
  }

  return (
    <div
      data-testid="attr-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
      }}
    >
      {ABILITY_ORDER.map((k) => {
        const score = character.abilities[k]
        const mod = abilityModifier(score)
        const proficient = saveProf.get(k) ?? false

        return (
          <div
            key={k}
            data-testid={`attr-${k}`}
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, #1B1725, #15121C)',
              border: '1px solid #2A2537',
              borderRadius: 12,
              padding: compact ? '8px 6px 6px' : '10px 8px 8px',
              textAlign: 'center',
            }}
          >
            {proficient && (
              <span
                data-testid={`attr-${k}-save-dot`}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#D4A017',
                  boxShadow: '0 0 6px rgba(212,160,23,0.5)',
                  display: 'block',
                }}
              />
            )}
            <div
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: 9,
                fontWeight: 600,
                color: '#7A7788',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {t(`ability.${k}`)}
            </div>
            <div
              data-testid={`attr-${k}-mod`}
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: compact ? 28 : 32,
                fontWeight: 600,
                color: '#F4EFE0',
                lineHeight: 1,
                marginTop: 4,
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {formatSigned(mod)}
            </div>
            <div
              style={{
                marginTop: 6,
                paddingTop: 4,
                borderTop: '1px solid #2A2537',
              }}
            >
              <input
                type="number"
                min={1}
                max={30}
                value={score}
                onChange={e => handleScoreChange(k, e.target.value)}
                aria-label={t('aria.ability_score_input', { ability: t(`ability.${k}`) })}
                data-testid={`attr-${k}-score`}
                style={SCORE_INPUT}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
