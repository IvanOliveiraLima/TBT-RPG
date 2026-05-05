import type { Character, SpellKnown } from '@/domain/character'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { useTranslation } from '@/i18n'

const T = {
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  gold:          '#D4A017',
  purple:        '#7B63C8',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

interface SpellListProps {
  character: Character
}

function groupSpells(known: SpellKnown[]): Map<number, SpellKnown[]> {
  const map = new Map<number, SpellKnown[]>()
  for (const spell of known) {
    const arr = map.get(spell.level) ?? []
    arr.push(spell)
    map.set(spell.level, arr)
  }
  for (const [lv, spells] of map) {
    map.set(lv, [...spells].sort((a, b) => a.name.localeCompare(b.name)))
  }
  return map
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function SpellList({ character }: SpellListProps) {
  const { t } = useTranslation()

  if (!character.spells) return null

  const { known } = character.spells
  const total = known.length

  const grouped = groupSpells(known)
  const levels = [...grouped.keys()].sort((a, b) => a - b)

  return (
    <div data-testid="spell-list">
      <Card padding="md">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <h3
            style={{
              flex: 1,
              fontSize: 9,
              fontWeight: 600,
              color: T.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              margin: 0,
              fontFamily: T.sans,
            }}
          >
            {t('spells.section_title')}
          </h3>
          <span
            style={{
              fontSize: 11,
              color: T.textMuted,
              marginRight: 8,
              fontFamily: T.sans,
            }}
          >
            {t('spells.count_label', { count: String(total) })}
          </span>
          <button
            data-testid="add-spell-btn"
            onClick={() => alert(t('phase_c.editing_coming_soon'))}
            style={{
              background: 'transparent',
              border: `1px solid ${T.borderDefault}`,
              borderRadius: 6,
              color: T.textMuted,
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              cursor: 'pointer',
              fontFamily: T.sans,
            }}
          >
            + {t('spells.add_button')}
          </button>
        </div>

        {/* Empty state */}
        {total === 0 ? (
          <div
            data-testid="spell-empty-state"
            style={{ textAlign: 'center', padding: '24px 0', fontFamily: T.sans }}
          >
            <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 6px' }}>
              {t('spells.empty_state_title')}
            </p>
            <p style={{ fontSize: 11, color: T.textMuted, opacity: 0.7, margin: 0 }}>
              {t('spells.empty_state_hint')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {levels.map((lv) => {
              const levelSpells = grouped.get(lv)!
              const sectionLabel = lv === 0
                ? t('spells.cantrips_section')
                : t('spells.level_section', { level: String(lv) })

              return (
                <div key={lv} data-testid={`spell-section-${lv}`}>
                  {/* Section header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                      paddingBottom: 4,
                      borderBottom: `1px solid ${T.borderSubtle}`,
                    }}
                  >
                    <Label
                      style={{
                        fontFamily: T.serif,
                        color: T.gold,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 1.5,
                        marginBottom: 0,
                      }}
                    >
                      {sectionLabel}
                    </Label>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.sans }}>
                      {t('spells.section_count', { count: String(levelSpells.length) })}
                    </span>
                  </div>

                  {/* Spell rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {levelSpells.map((spell) => (
                      <SpellRow key={spell.name} spell={spell} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

interface SpellRowProps {
  spell: SpellKnown
}

function SpellRow({ spell }: SpellRowProps) {
  const { t } = useTranslation()

  const unprepared = spell.prepared === false
  const textColor = unprepared ? T.textMuted : T.textPrimary

  const handleRow = () => alert(t('phase_c.details_coming_soon'))

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('spells.row.row_aria', { name: spell.name })}
      data-testid={`spell-row-${slugify(spell.name)}`}
      data-prepared={unprepared ? 'false' : 'true'}
      onClick={handleRow}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleRow()
        }
      }}
      style={{
        padding: '7px 10px',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      {/* Bullet */}
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: unprepared ? T.textMuted : T.purple,
          flexShrink: 0,
        }}
      />
      {/* Name */}
      <span
        style={{
          flex: 1,
          fontFamily: T.serif,
          fontSize: 13,
          color: textColor,
          opacity: unprepared ? 0.6 : 1,
        }}
      >
        {spell.name}
      </span>
      {/* Unprepared indicator */}
      {unprepared && (
        <span
          style={{
            fontSize: 10,
            color: T.textMuted,
            opacity: 0.7,
          }}
          aria-label={t('spells.row.unprepared_aria')}
          title={t('spells.row.unprepared_aria')}
        >
          ☐
        </span>
      )}
      {/* Remove button */}
      <button
        data-testid={`remove-spell-${slugify(spell.name)}`}
        aria-label={t('aria.remove_spell', { name: spell.name })}
        onClick={(e) => {
          e.stopPropagation()
          alert(t('phase_c.editing_coming_soon'))
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: T.textMuted,
          cursor: 'pointer',
          fontSize: 16,
          padding: '2px 4px',
          borderRadius: 4,
          fontFamily: T.sans,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
