import type React from 'react'
import type { Character, AbilityKey, Abilities } from '@/domain/character'
import { abilityModifier, formatSigned } from '@/domain/calculations'
import { useTranslation } from '@/i18n'
import { NumberField } from '@/components/primitives/NumberField'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'
import { useSheetRoll } from '@/hooks/useSheetRoll'

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

// ── AttrCell ──────────────────────────────────────────────────────────────────
// Extracted so useState/useEffect hooks can run per cell (hooks can't be in .map)

interface AttrCellProps {
  k: AbilityKey
  score: number
  abilities: Abilities
  proficient: boolean
  compact: boolean
  locked: boolean
  onUpdate?: (partial: Partial<Character>) => void
}

function AttrCell({ k, score, abilities, proficient, compact, locked, onUpdate }: AttrCellProps) {
  const { t } = useTranslation()
  const mod = abilityModifier(score)
  const { rollCheck } = useSheetRoll()

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
      <button
        type="button"
        onClick={() => rollCheck(t(`ability.${k}`), mod)}
        aria-label={t('aria.roll', { label: t(`ability.${k}`) })}
        className="hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors rounded-lg"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          width: '100%',
          marginTop: 4,
          background: 'none',
          border: 'none',
          padding: '4px 2px',
          cursor: 'pointer',
        }}
      >
        <span
          data-testid={`attr-${k}-mod`}
          style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: compact ? 28 : 32,
            fontWeight: 600,
            color: '#F4EFE0',
            lineHeight: 1,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {formatSigned(mod)}
        </span>
        <span aria-hidden="true" style={{ fontSize: 11, opacity: 0.5, lineHeight: 1 }}>⚅</span>
      </button>
      <div
        style={{
          marginTop: 6,
          paddingTop: 4,
          borderTop: '1px solid #2A2537',
        }}
      >
        <NumberField
          value={score}
          min={1}
          max={30}
          onChange={n => { if (onUpdate) onUpdate({ abilities: { ...abilities, [k]: n } }) }}
          aria-label={t('aria.ability_score_input', { ability: t(`ability.${k}`) })}
          data-testid={`attr-${k}-score`}
          style={SCORE_INPUT}
          readOnly={locked}
        />
      </div>
    </div>
  )
}

// ── AttrGrid ──────────────────────────────────────────────────────────────────

export function AttrGrid({ character, cols = 3, compact = false, onUpdate }: AttrGridProps) {
  const locked = useCharacterLocked(character.id)
  const saveProf = new Map(
    character.savingThrows.map((st) => [st.ability, st.proficient]),
  )

  return (
    <div
      data-testid="attr-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
      }}
    >
      {ABILITY_ORDER.map((k) => (
        <AttrCell
          key={k}
          k={k}
          score={character.abilities[k]}
          abilities={character.abilities}
          proficient={saveProf.get(k) ?? false}
          compact={compact}
          locked={locked}
          {...(onUpdate !== undefined ? { onUpdate } : {})}
        />
      ))}
    </div>
  )
}
