import type { Character, Attack, AbilityKey } from '@/domain/character'
import { Badge } from '../ui/Badge'

interface AttacksListProps {
  character: Character
}

const T = {
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

const ABILITY_ABBR: Record<AbilityKey | '', string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
  '': '—',
}

export function AttacksList({ character }: AttacksListProps) {
  const attacks = character.attacks.filter((a) => a.name.trim() !== '')

  return (
    <div data-testid="attacks-list">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
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
          Ataques
        </h3>
        <span
          style={{
            fontSize: 11,
            color: T.textMuted,
            marginRight: 8,
            fontFamily: T.sans,
          }}
        >
          ({attacks.length})
        </span>
        <button
          data-testid="add-attack-btn"
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
      {attacks.length === 0 ? (
        <div
          data-testid="attacks-empty-state"
          style={{ textAlign: 'center', padding: '24px 0', fontFamily: T.sans }}
        >
          <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 6px' }}>
            Nenhum ataque cadastrado.
          </p>
          <p style={{ fontSize: 11, color: T.textMuted, opacity: 0.7, margin: 0 }}>
            Adicione um ataque para registrar suas armas e magias ofensivas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attacks.map((a) => (
            <AttackRow key={a.id} attack={a} />
          ))}
        </div>
      )}
    </div>
  )
}

interface AttackRowProps {
  attack: Attack
}

function AttackRow({ attack }: AttackRowProps) {
  const abilityLabel = ABILITY_ABBR[attack.baseStat] ?? attack.baseStat.toUpperCase()
  const hasDamage = attack.damage.trim() !== ''
  const hasDamageType = attack.damageType.trim() !== ''

  const metaParts: string[] = [abilityLabel]
  if (hasDamage) {
    metaParts.push(hasDamageType ? `${attack.damage} ${attack.damageType}` : attack.damage)
  }
  const metaLine = metaParts.join(' · ')

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`attack-row-${attack.id}`}
      onClick={() => alert('Detalhes do ataque virão na Fase C')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          alert('Detalhes do ataque virão na Fase C')
        }
      }}
      style={{
        background: T.elevated,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 10,
        padding: '10px 12px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 8,
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Left: name + meta line */}
      <div>
        <div
          style={{
            fontFamily: T.serif,
            fontSize: 14,
            fontWeight: 600,
            color: T.textPrimary,
            marginBottom: 2,
          }}
        >
          {attack.name}
        </div>
        <div
          data-testid={`attack-meta-${attack.id}`}
          style={{
            fontSize: 11,
            color: T.textMuted,
          }}
        >
          {metaLine}
        </div>
      </div>

      {/* Right: bonus badge + remove button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Badge variant={attack.rollType === 'dc' ? 'purple' : 'gold'}>
          {attack.bonus}
        </Badge>
        <button
          data-testid={`remove-attack-${attack.id}`}
          aria-label={`Remover ataque ${attack.name}`}
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
    </div>
  )
}
