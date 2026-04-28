import type { Character, SpellKnown } from '@/domain/character'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

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

function sectionLabel(level: number): string {
  return level === 0 ? 'TRUQUES' : `NÍVEL ${level}`
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function SpellList({ character }: SpellListProps) {
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
            MAGIAS
          </h3>
          <span
            style={{
              fontSize: 11,
              color: T.textMuted,
              marginRight: 8,
              fontFamily: T.sans,
            }}
          >
            ({total})
          </span>
          <button
            data-testid="add-spell-btn"
            onClick={() => alert('Edição virá na Fase C')}
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
            + Adicionar
          </button>
        </div>

        {/* Empty state */}
        {total === 0 ? (
          <div
            data-testid="spell-empty-state"
            style={{ textAlign: 'center', padding: '24px 0', fontFamily: T.sans }}
          >
            <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 6px' }}>
              Nenhuma magia cadastrada.
            </p>
            <p style={{ fontSize: 11, color: T.textMuted, opacity: 0.7, margin: 0 }}>
              Adicione cantrips e magias para gerenciar slots.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {levels.map((lv) => {
              const levelSpells = grouped.get(lv)!
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
                      {sectionLabel(lv)}
                    </Label>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.sans }}>
                      {levelSpells.length}
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
  const unprepared = spell.prepared === false
  const textColor = unprepared ? T.textMuted : T.textPrimary

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`spell-row-${slugify(spell.name)}`}
      data-prepared={unprepared ? 'false' : 'true'}
      onClick={() => alert('Detalhes virão na Fase C')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          alert('Detalhes virão na Fase C')
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
      {/* Remove button */}
      <button
        data-testid={`remove-spell-${slugify(spell.name)}`}
        aria-label={`Remover magia ${spell.name}`}
        onClick={(e) => {
          e.stopPropagation()
          alert('Remoção virá na Fase C')
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
