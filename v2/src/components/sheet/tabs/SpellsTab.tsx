import { useCharacterStore } from '@/store/character'
import { SpellHeader } from '../parts/SpellHeader'
import { SpellSlots } from '../parts/SpellSlots'
import { SpellList } from '../parts/SpellList'
import { Card } from '../ui/Card'

const T = {
  textPrimary: '#F4EFE0',
  textMuted:   '#7A7788',
  borderStrong: '#3A3450',
  serif:       "'Cinzel', Georgia, serif",
  sans:        "'Inter', system-ui, sans-serif",
} as const

export function SpellsTab() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  // Non-caster: show informational message
  if (!character.spells) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', fontFamily: T.sans }}>
          <div style={{ fontSize: 36, color: T.borderStrong, marginBottom: 12 }}>✦</div>
          <p
            style={{
              fontFamily: T.serif,
              fontSize: 14,
              color: T.textPrimary,
              margin: '0 0 8px',
            }}
          >
            {character.name} não conjura magias.
          </p>
          <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 4px' }}>
            Esta classe não possui conjuração de magias.
          </p>
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0, opacity: 0.7 }}>
            Magias são acessadas por classes como Druid, Bard, Cleric, Wizard, Sorcerer e outras.
          </p>
        </div>
      </Card>
    )
  }

  const hasSlots = character.spells.slots.some((s) => s.max > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SpellHeader character={character} />
      {hasSlots && <SpellSlots character={character} />}
      <SpellList character={character} />
    </div>
  )
}
