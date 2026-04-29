import type { Character, InventoryItem } from '@/domain/character'
import { formatWeight, totalInventoryWeight } from '@/utils/format'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

const T = {
  textPrimary:   '#F4EFE0',
  textSecondary: '#B8B4CC',
  textMuted:     '#7A7788',
  gold:          '#D4A017',
  elevated:      '#1D1929',
  borderSubtle:  '#2A2537',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
  success:       '#5B8A4A',
} as const

interface ItemRowProps {
  item: InventoryItem
}

function ItemRow({ item }: ItemRowProps) {
  return (
    <div
      data-testid={`inventory-item-${item.id}`}
      aria-label={`Item: ${item.name}, peso: ${formatWeight(item.weight)}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
      }}
      onClick={() => alert('Detalhes virão na Fase C')}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.elevated }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ flex: 1, fontSize: 13, fontFamily: T.serif, color: T.textSecondary }}>
        {item.name}
      </span>
      <span
        style={{
          fontSize: 11,
          color: T.textMuted,
          minWidth: 44,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatWeight(item.weight)}
      </span>
      <button
        data-testid={`remove-item-${item.id}`}
        aria-label={`Remover ${item.name}`}
        onClick={(e) => { e.stopPropagation(); alert('Edição virá na Fase C') }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: T.textMuted,
          fontSize: 12,
          padding: '0 2px',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}

interface InventoryListProps {
  character: Character
}

export function InventoryList({ character }: InventoryListProps) {
  const { inventory } = character
  const total = totalInventoryWeight(inventory)
  const carryMax = 15 * character.abilities.str || 150
  const barPct = carryMax > 0 ? Math.min((total / carryMax) * 100, 100) : 0

  return (
    <div data-testid="inventory-list">
      <Card padding="md">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Label style={{ marginBottom: 0 }}>
            ITENS <span style={{ color: T.gold, fontWeight: 400 }}>({inventory.length})</span>
          </Label>
          <span style={{ flex: 1 }} />
          <span
            data-testid="inventory-total-weight"
            style={{ fontSize: 11, color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatWeight(total)} / {carryMax} lb
          </span>
          <button
            data-testid="add-item-btn"
            onClick={() => alert('Edição virá na Fase C')}
            style={{
              background: 'none',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 6,
              color: T.gold,
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 8px',
              fontFamily: T.sans,
            }}
          >
            + Adicionar
          </button>
        </div>

        {/* Encumbrance bar */}
        <div
          style={{
            height: 4,
            background: '#0D0B14',
            borderRadius: 2,
            marginBottom: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${barPct}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${T.success}, ${T.gold})`,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Items */}
        {inventory.length === 0 ? (
          <div
            data-testid="inventory-empty-state"
            style={{ textAlign: 'center', padding: '20px 10px' }}
          >
            <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 6px' }}>
              Nenhum item registrado.
            </p>
            <p style={{ fontSize: 11, color: T.textMuted, margin: 0, opacity: 0.7 }}>
              Adicione itens para gerenciar seu inventário.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {inventory.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
