/**
 * InventoryList — editable inventory grouped by category.
 *
 * ItemCard: compact row (equipped, name, qty, weight) + expand/collapse for full edit form.
 * Category grouping: all 5 categories always visible, each with per-category add button.
 * WeightBar: color-coded by load level (light/moderate/heavy/overburdened).
 * ConfirmableRemoveButton for safe deletion.
 */

import { useState, useRef, useMemo, useEffect } from 'react'
import type { Character, InventoryItem, ItemCategory } from '@/domain/character'
import { ITEM_CATEGORIES } from '@/data/canonical/item-categories'
import { ConfirmableRemoveButton } from '@/components/primitives/ConfirmableRemoveButton'
import { NumberField } from '@/components/primitives/NumberField'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import {
  calculateTotalWeight,
  calculateWeightCapacity,
  getWeightLoadLevel,
  groupItemsByCategory,
  isEquippableCategory,
} from '@/domain/derived'
import { formatWeight } from '@/utils/format'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'
import { AutoGrowTextarea } from '@/components/primitives/AutoGrowTextarea'

const T = {
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  elevated:      '#1D1929',
  bgCard:        '#201C2C',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  gold:          '#D4A017',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

const LOAD_COLORS: Record<ReturnType<typeof getWeightLoadLevel>, string> = {
  light:        '#4CAF50',
  moderate:     '#FFC107',
  heavy:        '#FF9800',
  overburdened: '#F44336',
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

// ── InventoryList ────────────────────────────────────────────────────────────

interface InventoryListProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function InventoryList({ character, onUpdate }: InventoryListProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  const readOnly = !onUpdate

  // Single-open accordion state
  const [openId, setOpenId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Close open card on outside pointerdown (covers mouse + touch)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) setOpenId(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const items = character.inventory
  const totalWeight = useMemo(() => calculateTotalWeight(items), [items])
  const maxWeight = calculateWeightCapacity(character.abilities.str)
  const loadLevel = getWeightLoadLevel(totalWeight, maxWeight)
  const barPct = maxWeight > 0 ? Math.min((totalWeight / maxWeight) * 100, 100) : 0

  const grouped = useMemo(() => groupItemsByCategory(items), [items])

  function addItem(category: ItemCategory) {
    const newId = crypto.randomUUID()
    const newItem: InventoryItem = {
      id:          newId,
      name:        '',
      quantity:    1,
      weight:      0,
      category,
      description: '',
      equipped:    false,
    }
    onUpdate?.({ inventory: [...items, newItem] })
    setOpenId(newId)
  }

  function updateItem(id: string, partial: Partial<InventoryItem>) {
    onUpdate?.({
      inventory: items.map(item => item.id === id ? { ...item, ...partial } : item),
    })
  }

  function removeItem(id: string) {
    onUpdate?.({ inventory: items.filter(item => item.id !== id) })
    setOpenId(cur => (cur === id ? null : cur))
  }

  return (
    <div ref={listRef} data-testid="inventory-list">
      <Card padding="md">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Label style={{ marginBottom: 0 }}>
            {t('inventory.section_title')}{' '}
            <span style={{ color: T.gold, fontWeight: 400 }}>
              {t('inventory.count_label', { count: String(items.length) })}
            </span>
          </Label>
          <span style={{ flex: 1 }} />
          <span
            data-testid="inventory-total-weight"
            style={{ fontSize: 11, color: T.textMuted, fontVariantNumeric: 'tabular-nums', fontFamily: T.sans }}
          >
            {formatWeight(totalWeight)} / {maxWeight} lb
          </span>
        </div>

        {/* Weight bar */}
        <div
          data-testid="weight-bar"
          aria-label={t('aria.weight_bar' as TranslationKey, {
            current: String(Math.round(totalWeight * 10) / 10),
            max:     String(maxWeight),
          })}
          style={{
            height:       6,
            background:   '#0D0B14',
            borderRadius: 3,
            marginBottom: 12,
            overflow:     'hidden',
          }}
        >
          <div
            data-testid="weight-bar-fill"
            data-load-level={loadLevel}
            style={{
              width:           `${barPct}%`,
              height:          '100%',
              background:      LOAD_COLORS[loadLevel],
              borderRadius:    3,
              transition:      'width 200ms, background 200ms',
            }}
          />
        </div>

        {/* Empty state (no items at all) */}
        {items.length === 0 && (
          <div
            data-testid="inventory-empty-state"
            style={{ textAlign: 'center', padding: '12px 0', fontFamily: T.sans }}
          >
            <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 4px' }}>
              {t('inventory.empty_state_title')}
            </p>
            <p style={{ fontSize: 11, color: T.textMuted, margin: 0, opacity: 0.7 }}>
              {t('inventory.empty_state_hint')}
            </p>
          </div>
        )}

        {/* Category groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ITEM_CATEGORIES.map(category => {
            const categoryItems = grouped[category] ?? []
            const labelKey = `inventory.category_${category}` as TranslationKey
            const addKey   = `inventory.add_${category}` as TranslationKey

            return (
              <div key={category} data-testid={`inventory-category-${category}`}>
                {/* Category header */}
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
                    {t(labelKey)}
                  </Label>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.sans }}>
                    ({categoryItems.length})
                  </span>
                </div>

                {/* Item cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {categoryItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      readOnly={readOnly}
                      expanded={openId === item.id}
                      onToggle={() => setOpenId(cur => (cur === item.id ? null : item.id))}
                      onUpdate={partial => updateItem(item.id, partial)}
                      onRemove={() => removeItem(item.id)}
                      {...(locked ? { locked: true } : {})}
                    />
                  ))}
                </div>

                {/* Per-category add button */}
                {!readOnly && !locked && (
                  <button
                    data-testid={`add-item-${category}`}
                    onClick={() => addItem(category)}
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
                    {t(addKey)}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ── ItemCard ─────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: InventoryItem
  readOnly: boolean
  expanded: boolean
  onToggle: () => void
  onUpdate: (partial: Partial<InventoryItem>) => void
  onRemove: () => void
  locked?: boolean
}

function ItemCard({ item, readOnly, expanded, onToggle, onUpdate, onRemove, locked }: ItemCardProps) {
  const { t } = useTranslation()

  function handleCardClick(e: React.MouseEvent) {
    // readOnly (no onUpdate at all): don't expand; locked: allow expand for read-only view
    if (readOnly && !locked) return
    const target = e.target as HTMLElement
    if (target.closest('input, button, textarea, select, [role="checkbox"]')) return
    onToggle()
  }

  const totalWeight = item.weight * item.quantity

  return (
    <div
      data-testid={`inventory-item-${item.id}`}
      onClick={handleCardClick}
      style={{
        borderRadius:  8,
        border:        `1px solid ${expanded ? T.borderDefault : T.borderSubtle}`,
        background:    expanded ? T.bgCard : 'transparent',
        transition:    'background 150ms, border-color 150ms',
        overflow:      'hidden',
        cursor:        (readOnly && !locked) ? 'default' : 'pointer',
      }}
    >
      {/* Compact header row */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          padding:    '8px 10px',
        }}
      >
        {/* Equipped checkbox — only for weapon/armor; placeholder preserves alignment */}
        {isEquippableCategory(item.category) ? (
          <input
            type="checkbox"
            checked={item.equipped}
            onChange={e => onUpdate({ equipped: e.target.checked })}
            aria-label={t('aria.item_equipped' as TranslationKey, { name: item.name || '#' })}
            data-testid={`item-equipped-${item.id}`}
            title={t('inventory.equipped_hint')}
            disabled={readOnly}
            style={{ cursor: readOnly ? 'default' : 'pointer', flexShrink: 0 }}
          />
        ) : (
          <span
            aria-hidden="true"
            data-testid={`item-equipped-placeholder-${item.id}`}
            style={{ width: 13, flexShrink: 0 }}
          />
        )}

        {/* Name */}
        {expanded && !readOnly ? (
          <input
            type="text"
            value={item.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder={t('inventory.name_placeholder')}
            aria-label={t('aria.item_name' as TranslationKey)}
            data-testid={`item-name-${item.id}`}
            style={{ ...SEAMLESS, flex: '0 1 auto', maxWidth: 'min(60%, 320px)', minWidth: 120 }}
            className="hover:border-[#2A2537] focus:border-[#2A2537] outline-none transition-colors"
            autoFocus={!locked}
            readOnly={locked}
          />
        ) : (
          <span
            style={{
              flex:         '0 1 auto',
              maxWidth:     'min(60%, 320px)',
              fontFamily:   T.sans,
              fontSize:     13,
              color:        T.textPrimary,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              minWidth:     0,
            }}
          >
            {item.name || t('inventory.unnamed_item')}
          </span>
        )}

        {/* Free space — clicking here collapses the card */}
        <span data-testid={`item-header-gap-${item.id}`} style={{ flex: 1 }} />

        {/* Quantity badge (only when > 1) */}
        {item.quantity > 1 && !expanded && (
          <span
            style={{
              fontSize:   11,
              color:      T.textMuted,
              fontFamily: T.sans,
              flexShrink: 0,
            }}
          >
            ×{item.quantity}
          </span>
        )}

        {/* Total weight */}
        <span
          data-testid={`item-weight-${item.id}`}
          style={{
            fontSize:           11,
            color:              T.textMuted,
            fontVariantNumeric: 'tabular-nums',
            fontFamily:         T.sans,
            flexShrink:         0,
          }}
        >
          {formatWeight(totalWeight)}
        </span>

        {/* Remove button */}
        {!readOnly && !locked && (
          <ConfirmableRemoveButton
            onConfirm={onRemove}
            ariaLabel={t('aria.remove_item' as TranslationKey, { name: item.name || '#' })}
            testId={`remove-item-${item.id}`}
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
          {/* Row: quantity + weight + category */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('inventory.quantity_label')}</Label>
              {/* Quantity is transient (spending consumables) — NOT locked */}
              <NumberField
                value={item.quantity}
                min={0}
                max={9999}
                onChange={n => onUpdate({ quantity: n })}
                aria-label={t('aria.item_quantity' as TranslationKey)}
                data-testid={`item-quantity-${item.id}`}
                style={{
                  ...SEAMLESS,
                  border: `1px solid ${T.borderSubtle}`,
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, marginBottom: 3 }}>
                {t('inventory.weight_label')}{' '}
                <span style={{ color: T.textMuted, fontSize: 9 }}>{t('inventory.per_unit')}</span>
              </Label>
              <NumberField
                value={item.weight}
                min={0}
                max={9999}
                onChange={n => onUpdate({ weight: n })}
                aria-label={t('aria.item_weight_input' as TranslationKey)}
                data-testid={`item-weight-input-${item.id}`}
                {...(locked ? { readOnly: true } : {})}
                style={{
                  ...SEAMLESS,
                  border: `1px solid ${T.borderSubtle}`,
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('inventory.category_label')}</Label>
              <select
                value={item.category}
                onChange={e => onUpdate({ category: e.target.value as ItemCategory })}
                disabled={locked}
                aria-label={t('aria.item_category' as TranslationKey)}
                data-testid={`item-category-${item.id}`}
                className="dark-select"
                style={{
                  ...SEAMLESS,
                  border:     `1px solid ${T.borderSubtle}`,
                  cursor:     locked ? 'default' : 'pointer',
                  appearance: 'none',
                }}
              >
                {ITEM_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {t(`inventory.category_${cat}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label style={{ fontSize: 10, marginBottom: 3 }}>{t('inventory.description_label')}</Label>
            <AutoGrowTextarea
              value={item.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder={t('inventory.description_placeholder')}
              rows={3}
              aria-label={t('aria.item_description' as TranslationKey)}
              data-testid={`item-description-${item.id}`}
              readOnly={locked}
              style={{
                ...SEAMLESS,
                border:     `1px solid ${T.borderSubtle}`,
                lineHeight: 1.5,
              }}
              className="hover:border-[#3A3450] focus:border-[#3A3450] outline-none transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  )
}
