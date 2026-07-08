/**
 * SpellsList — editable spell list grouped by level, with SpellCard.
 *
 * SpellCard: compact row + expand/collapse for full edit form.
 * Prepared toggle, school color pip, ConfirmableRemoveButton.
 * Click on card body expands; click on interactive element does not.
 */

import { useState, useRef, useMemo, useEffect } from 'react'
import type { Character, Spell, SpellSchool } from '@/domain/character'
import { SPELL_SCHOOLS, SCHOOL_COLORS } from '@/data/canonical/spell-schools'
import { CANONICAL_CASTING_TIMES } from '@/data/canonical/casting-times'
import { CANONICAL_RANGES } from '@/data/canonical/attack-ranges'
import { ConfirmableRemoveButton } from '@/components/primitives/ConfirmableRemoveButton'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'
import { AutoGrowTextarea } from '@/components/primitives/AutoGrowTextarea'

const T = {
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  elevated:      '#1B1725',
  bgCard:        '#201C2C',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  gold:          '#D4A017',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

const SEAMLESS: React.CSSProperties = {
  background:   'transparent',
  border:       '1px solid transparent',
  borderRadius:  6,
  padding:       '4px 6px',
  color:         T.textPrimary,
  fontFamily:    T.sans,
  fontSize:      13,
  width:         '100%',
  boxSizing:     'border-box',
}

// ── SpellsList ──────────────────────────────────────────────────────────────

interface SpellListProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function SpellList({ character, onUpdate }: SpellListProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  const readOnly = !onUpdate

  // Defense-in-depth: guard against legacy object shape that slipped past normalizeSpells.
  const spells: Spell[] = useMemo(() => {
    if (!Array.isArray(character.spells)) {
      console.warn('[SpellList] character.spells is not an array — legacy shape detected', {
        id:   character.id,
        type: typeof character.spells,
      })
      return []
    }
    return character.spells
  }, [character.spells, character.id])

  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, Spell[]> = {}
    for (let i = 0; i <= 9; i++) grouped[i] = []
    for (const spell of spells) {
      grouped[spell.level]?.push(spell)
    }
    return grouped
  }, [spells])

  // Levels to render: 0 always; 1–9 if has spells or has slot max > 0
  const visibleLevels: number[] = useMemo(() => {
    const levels: number[] = []
    for (let i = 0; i <= 9; i++) {
      const hasSpells = (spellsByLevel[i]?.length ?? 0) > 0
      const hasSlots  = i > 0 && (character.spellSlots[String(i)]?.max ?? 0) > 0
      if (hasSpells || hasSlots || i === 0) levels.push(i)
    }
    return levels
  }, [spellsByLevel, character.spellSlots])

  function addSpell(level: number) {
    const newSpell: Spell = {
      id:          crypto.randomUUID(),
      name:        '',
      level,
      school:      'abjuration',
      castingTime: '',
      range:       '',
      description: '',
      prepared:    false,
    }
    onUpdate?.({ spells: [...spells, newSpell] })
  }

  function updateSpell(id: string, partial: Partial<Spell>) {
    onUpdate?.({
      spells: spells.map(s => s.id === id ? { ...s, ...partial } : s),
    })
  }

  function removeSpell(id: string) {
    onUpdate?.({ spells: spells.filter(s => s.id !== id) })
  }

  const total = spells.length

  return (
    <div data-testid="spell-list">
      <Card padding="md">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <h3
            style={{
              flex:            1,
              fontSize:        9,
              fontWeight:      600,
              color:           T.textMuted,
              textTransform:   'uppercase',
              letterSpacing:   1.5,
              margin:          0,
              fontFamily:      T.sans,
            }}
          >
            {t('spells.section_title')}
          </h3>
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans }}>
            {t('spells.count_label', { count: String(total) })}
          </span>
        </div>

        {/* Empty state */}
        {total === 0 && (
          <div
            data-testid="spell-empty-state"
            style={{ textAlign: 'center', padding: '16px 0', fontFamily: T.sans }}
          >
            <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 4px' }}>
              {t('spells.empty_state_title')}
            </p>
          </div>
        )}

        {/* Level groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {visibleLevels.map((level) => {
            const levelSpells = spellsByLevel[level] ?? []
            const sectionLabel = level === 0
              ? t('spells.cantrips_section')
              : t('spells.level_section', { level: String(level) })

            return (
              <div key={level} data-testid={`spell-section-${level}`}>
                {/* Section header */}
                <div
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           8,
                    marginBottom:  6,
                    paddingBottom: 4,
                    borderBottom:  `1px solid ${T.borderSubtle}`,
                  }}
                >
                  <Label
                    style={{
                      fontFamily:    T.serif,
                      color:         T.gold,
                      fontSize:      11,
                      fontWeight:    600,
                      letterSpacing: 1.5,
                      marginBottom:  0,
                    }}
                  >
                    {sectionLabel}
                  </Label>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.sans }}>
                    {t('spells.section_count', { count: String(levelSpells.length) })}
                  </span>
                </div>

                {/* Spell cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {levelSpells.map(spell => (
                    <SpellCard
                      key={spell.id}
                      spell={spell}
                      readOnly={readOnly}
                      onUpdate={partial => updateSpell(spell.id, partial)}
                      onRemove={() => removeSpell(spell.id)}
                      {...(locked ? { locked: true } : {})}
                    />
                  ))}
                </div>

                {/* Per-level add button */}
                {!readOnly && !locked && (
                  <button
                    data-testid={level === 0 ? 'add-cantrip' : `add-spell-level-${level}`}
                    onClick={() => addSpell(level)}
                    style={{
                      marginTop:    4,
                      background:   'transparent',
                      border:       `1px dashed ${T.borderDefault}`,
                      borderRadius:  6,
                      color:         T.textMuted,
                      fontFamily:    T.sans,
                      fontSize:      11,
                      fontWeight:    500,
                      padding:       '4px 10px',
                      cursor:        'pointer',
                      width:         '100%',
                      textAlign:     'left',
                    }}
                  >
                    {level === 0
                      ? t('spells.add_cantrip')
                      : t('spells.add_at_level', { n: String(level) })}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Datalists */}
        <datalist id="canonical-casting-times">
          {CANONICAL_CASTING_TIMES.map(ct => <option key={ct} value={ct} />)}
        </datalist>
        <datalist id="canonical-spell-ranges">
          {CANONICAL_RANGES.map(r => <option key={r} value={r} />)}
        </datalist>
      </Card>
    </div>
  )
}

// ── SpellCard ───────────────────────────────────────────────────────────────

interface SpellCardProps {
  spell: Spell
  readOnly: boolean
  onUpdate: (partial: Partial<Spell>) => void
  onRemove: () => void
  locked?: boolean
}

function SpellCard({ spell, readOnly, onUpdate, onRemove, locked }: SpellCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const newlyAddedRef = useRef(false)

  // Auto-expand new (empty name) cards
  useEffect(() => {
    if (spell.name === '' && !newlyAddedRef.current) {
      newlyAddedRef.current = true
      setExpanded(true)
    }
  }, [spell.name])

  function handleCardClick(e: React.MouseEvent) {
    // When readOnly (no onUpdate at all): never expand
    if (readOnly) return
    const target = e.target as HTMLElement
    if (target.closest('input, button, textarea, select, [role="checkbox"]')) return
    setExpanded(prev => !prev)
  }

  function handleBlur(e: React.FocusEvent) {
    if (!cardRef.current?.contains(e.relatedTarget as Node)) {
      setExpanded(false)
    }
  }

  const isCantrip = spell.level === 0
  const dimmed = !isCantrip && !spell.prepared

  const schoolColor = SCHOOL_COLORS[spell.school] ?? T.textMuted

  return (
    <div
      ref={cardRef}
      data-testid={`spell-card-${spell.id}`}
      onClick={handleCardClick}
      onBlur={readOnly ? undefined : handleBlur}
      tabIndex={readOnly ? undefined : -1}
      style={{
        borderRadius:  8,
        border:        `1px solid ${expanded ? T.borderDefault : T.borderSubtle}`,
        background:    expanded ? T.bgCard : 'transparent',
        opacity:       dimmed ? 0.55 : 1,
        transition:    'opacity 150ms, background 150ms, border-color 150ms',
        overflow:      'hidden',
        cursor:        readOnly ? 'default' : 'pointer',
      }}
    >
      {/* Compact header row */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          padding:     '8px 10px',
        }}
      >
        {/* School pip */}
        <span
          data-testid={`spell-school-pip-${spell.id}`}
          aria-label={t(`spells.school_${spell.school}` as TranslationKey)}
          style={{
            width:        8,
            height:       8,
            borderRadius: '50%',
            backgroundColor: schoolColor,
            flexShrink:   0,
          }}
        />

        {/* Name */}
        {expanded && !readOnly ? (
          <input
            type="text"
            value={spell.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder={t('spells.name_placeholder')}
            aria-label={t('aria.spell_name')}
            data-testid={`spell-name-${spell.id}`}
            style={{ ...SEAMLESS, flex: 1, minWidth: 0 }}
            className="hover:border-[#2A2537] focus:border-[#2A2537] outline-none transition-colors"
            readOnly={locked}
            autoFocus={!locked}
          />
        ) : (
          <span
            style={{
              flex:        1,
              fontFamily:  T.sans,
              fontSize:    13,
              color:       T.textPrimary,
              overflow:    'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:  'nowrap',
              minWidth:    0,
            }}
          >
            {spell.name || t('spells.unnamed_spell')}
          </span>
        )}

        {/* Prepared checkbox — non-cantrips only */}
        {!isCantrip && (
          <input
            type="checkbox"
            checked={spell.prepared}
            onChange={e => onUpdate({ prepared: e.target.checked })}
            aria-label={t('aria.spell_prepared')}
            data-testid={`spell-prepared-${spell.id}`}
            title={t('spells.prepared_hint')}
            disabled={readOnly}
            style={{ cursor: readOnly ? 'default' : 'pointer', flexShrink: 0 }}
          />
        )}

        {/* Remove button */}
        {!readOnly && !locked && (
          <ConfirmableRemoveButton
            onConfirm={onRemove}
            ariaLabel={t('aria.remove_spell', { name: spell.name || '#' })}
            testId={`spell-remove-${spell.id}`}
            size="sm"
          />
        )}
      </div>

      {/* Expanded edit form — shown when expanded and either editable or locked (for read-only view) */}
      {expanded && !readOnly && (
        <div
          style={{
            padding:       '0 10px 10px',
            display:       'flex',
            flexDirection: 'column',
            gap:           8,
          }}
        >
          {/* Row: level + school */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('spells.level_label')}</Label>
              <select
                value={spell.level}
                onChange={e => onUpdate({ level: parseInt(e.target.value, 10) })}
                disabled={locked}
                data-testid={`spell-level-${spell.id}`}
                className="dark-select"
                style={{
                  ...SEAMLESS,
                  border:        `1px solid ${T.borderSubtle}`,
                  cursor:        locked ? 'default' : 'pointer',
                  appearance:    'none',
                }}
              >
                {[0,1,2,3,4,5,6,7,8,9].map(lvl => (
                  <option key={lvl} value={lvl}>
                    {lvl === 0 ? t('spells.cantrip') : t('spells.level', { n: String(lvl) })}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('spells.school_label')}</Label>
              <select
                value={spell.school}
                onChange={e => onUpdate({ school: e.target.value as SpellSchool })}
                disabled={locked}
                data-testid={`spell-school-${spell.id}`}
                className="dark-select"
                style={{
                  ...SEAMLESS,
                  border:        `1px solid ${T.borderSubtle}`,
                  cursor:        locked ? 'default' : 'pointer',
                  appearance:    'none',
                }}
              >
                {SPELL_SCHOOLS.map(s => (
                  <option key={s} value={s}>{t(`spells.school_${s}` as TranslationKey)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: casting time + range */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('spells.casting_time_label')}</Label>
              <input
                type="text"
                value={spell.castingTime}
                onChange={e => onUpdate({ castingTime: e.target.value })}
                list="canonical-casting-times"
                data-testid={`spell-casting-time-${spell.id}`}
                style={{ ...SEAMLESS, border: `1px solid ${T.borderSubtle}` }}
                className="hover:border-[#3A3450] focus:border-[#3A3450] outline-none transition-colors"
                readOnly={locked}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('spells.range_label')}</Label>
              <input
                type="text"
                value={spell.range}
                onChange={e => onUpdate({ range: e.target.value })}
                list="canonical-spell-ranges"
                data-testid={`spell-range-${spell.id}`}
                style={{ ...SEAMLESS, border: `1px solid ${T.borderSubtle}` }}
                className="hover:border-[#3A3450] focus:border-[#3A3450] outline-none transition-colors"
                readOnly={locked}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('spells.description_label')}</Label>
            <AutoGrowTextarea
              value={spell.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder={t('spells.description_placeholder')}
              rows={3}
              data-testid={`spell-description-${spell.id}`}
              style={{
                ...SEAMLESS,
                border:      `1px solid ${T.borderSubtle}`,
                lineHeight:   1.5,
              }}
              className="hover:border-[#3A3450] focus:border-[#3A3450] outline-none transition-colors"
              readOnly={locked}
            />
          </div>
        </div>
      )}
    </div>
  )
}
