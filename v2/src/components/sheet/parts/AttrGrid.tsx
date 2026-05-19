import { useState } from 'react'
import type React from 'react'
import type { Character, AbilityKey, Abilities } from '@/domain/character'
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

// ── AttrCell ──────────────────────────────────────────────────────────────────
// Extracted so useState/useEffect hooks can run per cell (hooks can't be in .map)

interface AttrCellProps {
  k: AbilityKey
  score: number
  abilities: Abilities
  proficient: boolean
  compact: boolean
  onUpdate?: (partial: Partial<Character>) => void
}

function AttrCell({ k, score, abilities, proficient, compact, onUpdate }: AttrCellProps) {
  const { t } = useTranslation()
  const mod = abilityModifier(score)

  // Local string state — allows intermediate empty value while user is typing.
  // Domain score is the source of truth; input is purely a UI concern.
  const [prevScore, setPrevScore] = useState(score)
  const [inputValue, setInputValue] = useState(String(score))

  // Sync input when domain score changes externally (reload, store update, etc.).
  // React-recommended pattern: update during render instead of in an effect to
  // avoid the double-render that useEffect + setState causes.
  if (prevScore !== score) {
    setPrevScore(score)
    setInputValue(String(score))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setInputValue(raw)

    if (raw === '') return  // intermediate empty — wait for next keystroke

    const parsed = parseInt(raw, 10)
    if (Number.isNaN(parsed)) return

    const clamped = Math.max(1, Math.min(30, parsed))
    if (clamped !== score && onUpdate) {
      onUpdate({ abilities: { ...abilities, [k]: clamped } })
    }
  }

  function handleBlur() {
    // If user left the input empty or invalid, restore the last valid domain value
    const parsed = parseInt(inputValue, 10)
    if (inputValue === '' || Number.isNaN(parsed)) {
      setInputValue(String(score))
    }
  }

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
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          inputMode="numeric"
          aria-label={t('aria.ability_score_input', { ability: t(`ability.${k}`) })}
          data-testid={`attr-${k}-score`}
          style={SCORE_INPUT}
        />
      </div>
    </div>
  )
}

// ── AttrGrid ──────────────────────────────────────────────────────────────────

export function AttrGrid({ character, cols = 3, compact = false, onUpdate }: AttrGridProps) {
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
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}
