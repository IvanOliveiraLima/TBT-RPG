/**
 * SpellSlotsBlock — editable spell slots with fill-from-left pip interaction.
 *
 * Shows only levels with max > 0.
 * Pip click: fill-from-left toggle (same logic as death saves).
 * NumberField for editing max per level.
 * SlotLevelAdder dropdown to add new levels.
 */

import type { Character } from '@/domain/character'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { Pip } from '../ui/Pip'
import { useTranslation } from '@/i18n'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'

const T = {
  textMuted:     '#7A7788',
  textTertiary:  '#4E4B5A',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  sans:          "'Inter', system-ui, sans-serif",
} as const

interface SpellSlotsProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function SpellSlots({ character, onUpdate }: SpellSlotsProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)

  const slots: Record<string, { current: number; max: number }> = character.spellSlots ?? {}

  function updateCurrent(level: string, newCurrent: number) {
    onUpdate?.({
      spellSlots: {
        ...slots,
        [level]: { ...slots[level]!, current: newCurrent },
      },
    })
  }

  function updateMax(level: string, newMax: number) {
    const clamped = Math.max(0, newMax)
    const current = Math.min(slots[level]?.current ?? 0, clamped)
    if (clamped === 0) {
      // Remove level entry when max drops to 0
      const next = { ...slots }
      delete next[level]
      onUpdate?.({ spellSlots: next })
    } else {
      onUpdate?.({
        spellSlots: {
          ...slots,
          [level]: { current, max: clamped },
        },
      })
    }
  }

  function addLevel(level: string) {
    onUpdate?.({
      spellSlots: {
        ...slots,
        [level]: { current: 0, max: 1 },
      },
    })
  }

  // Levels with max > 0, sorted numerically
  const activeEntries = Object.entries(slots)
    .filter(([, s]) => s.max > 0)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))

  // Levels not yet added (for the adder dropdown)
  const allLevels = ['1','2','3','4','5','6','7','8','9']
  const availableLevels = allLevels.filter(lvl => (slots[lvl]?.max ?? 0) === 0)

  // Read-only mode: hide adder and number steppers
  const readOnly = !onUpdate

  // In read-only mode, hide if no active slots
  if (readOnly && activeEntries.length === 0) return null

  return (
    <div data-testid="spell-slots">
      <Card padding="md">
        <Label style={{ marginBottom: 10 }}>{t('spell_slots.section_title')}</Label>

        {activeEntries.length === 0 && !readOnly && (
          <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 8px', fontFamily: T.sans }}>
            {t('spells.no_slots_hint')}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeEntries.map(([level, slot]) => (
            <SlotRow
              key={level}
              level={level}
              slot={slot}
              onCurrentChange={readOnly ? undefined : (n) => updateCurrent(level, n)}
              onMaxChange={(readOnly || locked) ? undefined : (n) => updateMax(level, n)}
            />
          ))}
        </div>

        {!readOnly && !locked && availableLevels.length > 0 && (
          <div style={{ marginTop: activeEntries.length > 0 ? 10 : 4 }}>
            <select
              value=""
              onChange={e => { if (e.target.value) addLevel(e.target.value) }}
              aria-label={t('aria.add_slot_level')}
              data-testid="add-slot-level"
              className="dark-select"
              style={{
                background:   T.elevated,
                border:       `1px solid ${T.borderSubtle}`,
                borderRadius:  6,
                color:         T.textMuted,
                fontFamily:    T.sans,
                fontSize:      12,
                padding:       '4px 8px',
                cursor:        'pointer',
              }}
            >
              <option value="">{t('spells.add_slot_level')}</option>
              {availableLevels.map(lvl => (
                <option key={lvl} value={lvl}>{t('spells.level', { n: lvl })}</option>
              ))}
            </select>
          </div>
        )}
      </Card>
    </div>
  )
}

interface SlotRowProps {
  level: string
  slot: { current: number; max: number }
  onCurrentChange: ((n: number) => void) | undefined
  onMaxChange: ((n: number) => void) | undefined
}

function SlotRow({ level, slot, onCurrentChange, onMaxChange }: SlotRowProps) {
  const { t } = useTranslation()
  const readOnly = !onCurrentChange

  function handlePipClick(pipIndex: number) {
    if (!onCurrentChange) return
    // Fill-from-left: click pip N → set current to N if < N, or N-1 if already >= N
    const newCurrent = pipIndex <= slot.current ? pipIndex - 1 : pipIndex
    onCurrentChange(Math.max(0, Math.min(slot.max, newCurrent)))
  }

  return (
    <div
      data-testid={`spell-slot-level-${level}`}
      role="group"
      aria-label={t('spell_slots.pip_aria', {
        level,
        current: String(slot.current),
        max:     String(slot.max),
      })}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        padding:       '8px 10px',
        background:    T.elevated,
        border:        `1px solid ${T.borderSubtle}`,
        borderRadius:   10,
      }}
    >
      {/* Level label */}
      <div
        style={{
          fontSize:       10,
          fontWeight:     600,
          color:          T.textMuted,
          textTransform:  'uppercase',
          letterSpacing:  0.8,
          fontFamily:     T.sans,
          minWidth:       52,
        }}
      >
        {t('spell_slots.level_label', { level })}
      </div>

      {/* Pips */}
      <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Array.from({ length: slot.max }).map((_, i) => {
          const pipIndex = i + 1
          const filled = pipIndex <= slot.current
          return readOnly ? (
            <span key={pipIndex} data-filled={filled ? 'true' : 'false'}>
              <Pip state={filled ? 'filled' : 'empty'} color="gold" size="md" />
            </span>
          ) : (
            <button
              key={pipIndex}
              role="checkbox"
              aria-checked={filled}
              onClick={() => handlePipClick(pipIndex)}
              aria-label={t('aria.slot_pip', { level, n: String(pipIndex) })}
              data-filled={filled ? 'true' : 'false'}
              style={{
                background:    'transparent',
                border:        'none',
                padding:       0,
                cursor:        'pointer',
                display:       'inline-flex',
                alignItems:    'center',
              }}
            >
              <Pip state={filled ? 'filled' : 'empty'} color="gold" size="md" />
            </button>
          )
        })}
      </div>

      {/* Counter */}
      <div
        style={{
          fontSize:            11,
          color:               T.textTertiary,
          fontFamily:          T.sans,
          fontVariantNumeric:  'tabular-nums',
          minWidth:            32,
          textAlign:           'right',
        }}
      >
        {t('spell_slots.count_label', {
          current: String(slot.current),
          max:     String(slot.max),
        })}
      </div>

      {/* Max editor */}
      {!readOnly && (
        <input
          type="number"
          value={slot.max}
          min={0}
          max={20}
          onChange={e => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n)) onMaxChange?.(n)
          }}
          aria-label={t('aria.slot_max_input', { level })}
          data-testid={`slot-max-${level}`}
          style={{
            width:        44,
            background:   'transparent',
            border:       `1px solid ${T.borderSubtle}`,
            borderRadius:  4,
            color:         T.textMuted,
            fontFamily:    T.sans,
            fontSize:      11,
            textAlign:     'center',
            padding:       '2px 4px',
          }}
        />
      )}

      {/* Remove level button — solves mobile: no number input spinners on touch */}
      {onMaxChange && (
        <button
          type="button"
          onClick={() => onMaxChange(0)}
          aria-label={t('spell_slots.remove_level', { level })}
          title={t('spell_slots.remove_level', { level })}
          data-testid={`slot-remove-${level}`}
          style={{
            background:    'transparent',
            border:        'none',
            color:         T.textMuted,
            cursor:        'pointer',
            fontSize:      16,
            lineHeight:    1,
            padding:       '2px 4px',
            display:       'inline-flex',
            alignItems:    'center',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

