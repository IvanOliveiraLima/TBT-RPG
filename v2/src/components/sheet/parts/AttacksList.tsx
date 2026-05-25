import { useState } from 'react'
import type React from 'react'
import type { Character, Attack, AbilityKey } from '@/domain/character'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { AttackKindIcon } from './AttackKindIcon'
import { NumberField } from '@/components/primitives/NumberField'
import { CANONICAL_DAMAGE_TYPES } from '@/data/canonical/damage-types'
import { CANONICAL_RANGES } from '@/data/canonical/attack-ranges'
import { formatAttackBonus, formatAttackSummary } from '@/domain/derived'

/* ── Design tokens (matches rest of Combat tab) ─────────────────────────── */

const T = {
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  accent:        '#E8C569',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

/* ── SEAMLESS_INPUT matches hero-input pattern ───────────────────────────── */

const SEAMLESS_INPUT: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 6,
  padding: '4px 6px',
  fontFamily: T.sans,
  fontSize: 13,
  color: T.textPrimary,
  width: '100%',
  outline: 'none',
}

/* ── Ability keys in select order ─────────────────────────────────────────── */

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

/* ── AttackCard ──────────────────────────────────────────────────────────── */

interface AttackCardProps {
  attack: Attack
  onUpdate: (partial: Partial<Attack>) => void
  onRemove: () => void
}

function AttackCard({ attack, onUpdate, onRemove }: AttackCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  function handleContainerClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('input, button, textarea, select')) return
    setExpanded(true)
  }

  function handleContainerBlur(e: React.FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setExpanded(false)
    }
  }

  const abilityAbbrev = attack.ability
    ? t(`ability.${attack.ability}` as TranslationKey)
    : ''
  const summary = formatAttackSummary(attack, abilityAbbrev)

  return (
    <div
      data-testid={`attack-card-${attack.id}`}
      tabIndex={-1}
      onClick={handleContainerClick}
      onBlur={handleContainerBlur}
      style={{
        background: T.elevated,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: expanded ? 'default' : 'pointer',
      }}
    >
      {/* ── Header: always visible ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          data-testid={`attack-kind-icon-${attack.id}`}
          style={{ color: T.textMuted, flexShrink: 0, display: 'flex' }}
        >
          <AttackKindIcon kind={attack.kind} size={16} />
        </span>

        {expanded ? (
          <input
            type="text"
            value={attack.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder={t('combat.attack_name_placeholder')}
            aria-label={t('aria.attack_name')}
            data-testid={`attack-name-input-${attack.id}`}
            className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
            style={{ ...SEAMLESS_INPUT, flex: '1 1 0', minWidth: 0, fontFamily: T.serif, fontWeight: 600 }}
          />
        ) : (
          <span
            style={{
              flex: '1 1 0',
              minWidth: 0,
              fontFamily: T.serif,
              fontSize: 14,
              fontWeight: 600,
              color: T.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {attack.name || t('combat.unnamed_attack')}
          </span>
        )}

        <span
          data-testid={`attack-bonus-chip-${attack.id}`}
          style={{
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 600,
            color: T.accent,
            fontFamily: T.sans,
          }}
        >
          {formatAttackBonus(attack.attackBonus)}
        </span>

        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove() }}
          aria-label={t('aria.remove_attack', { name: attack.name || t('combat.unnamed_attack') })}
          data-testid={`remove-attack-${attack.id}`}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            color: T.textMuted,
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 4px',
            borderRadius: 4,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* ── Compact: summary line ────────────────────────────────────────── */}
      {!expanded && summary && (
        <div
          data-testid={`attack-summary-${attack.id}`}
          style={{
            marginTop: 2,
            paddingLeft: 24,
            fontSize: 11,
            color: T.textMuted,
            fontFamily: T.sans,
          }}
        >
          {summary}
        </div>
      )}

      {/* ── Expanded: edit form ──────────────────────────────────────────── */}
      {expanded && (
        <div style={{ marginTop: 10 }}>
          {/* Row 1: kind, ability, attackBonus */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
                {t('combat.kind_label')}
              </label>
              <select
                value={attack.kind}
                onChange={e => onUpdate({ kind: e.target.value as Attack['kind'] })}
                aria-label={t('aria.kind_select')}
                data-testid={`attack-kind-select-${attack.id}`}
                className="alignment-select hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 6,
                  padding: '4px 28px 4px 6px',
                  color: T.textPrimary,
                  fontSize: 13,
                  fontFamily: T.sans,
                  width: '100%',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%237A7788' d='M5.5 7.5l4.5 5 4.5-5z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '1em',
                  cursor: 'pointer',
                }}
              >
                <option value="melee">{t('combat.kind_melee')}</option>
                <option value="ranged">{t('combat.kind_ranged')}</option>
                <option value="spell">{t('combat.kind_spell')}</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
                {t('combat.ability_label')}
              </label>
              <select
                value={attack.ability}
                onChange={e => onUpdate({ ability: e.target.value as AbilityKey | '' })}
                aria-label={t('aria.ability_select')}
                data-testid={`attack-ability-select-${attack.id}`}
                className="alignment-select hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 6,
                  padding: '4px 28px 4px 6px',
                  color: T.textPrimary,
                  fontSize: 13,
                  fontFamily: T.sans,
                  width: '100%',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%237A7788' d='M5.5 7.5l4.5 5 4.5-5z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '1em',
                  cursor: 'pointer',
                }}
              >
                <option value="">{t('combat.ability_none')}</option>
                {ABILITY_KEYS.map(k => (
                  <option key={k} value={k}>{t(`ability.${k}` as TranslationKey)}</option>
                ))}
              </select>
            </div>

            <div style={{ flexShrink: 0, width: 80 }}>
              <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
                {t('combat.attack_bonus_label')}
              </label>
              <NumberField
                value={attack.attackBonus}
                min={-20}
                max={30}
                onChange={n => onUpdate({ attackBonus: n })}
                aria-label={t('aria.attack_bonus_input')}
                data-testid={`attack-bonus-input-${attack.id}`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #2A2537',
                  borderRadius: 6,
                  padding: '4px 6px',
                  width: '100%',
                  textAlign: 'center' as const,
                  color: T.textPrimary,
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {/* Row 2: damage, damageType, range */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
                {t('combat.damage_label')}
              </label>
              <input
                type="text"
                value={attack.damage}
                onChange={e => onUpdate({ damage: e.target.value })}
                placeholder="1d8+3"
                aria-label={t('aria.damage_input')}
                data-testid={`attack-damage-input-${attack.id}`}
                className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
                style={SEAMLESS_INPUT}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
                {t('combat.damage_type_label')}
              </label>
              <input
                type="text"
                value={attack.damageType}
                onChange={e => onUpdate({ damageType: e.target.value })}
                list="canonical-damage-types"
                aria-label={t('aria.damage_type_input')}
                data-testid={`attack-damage-type-input-${attack.id}`}
                className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
                style={SEAMLESS_INPUT}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
                {t('combat.range_label')}
              </label>
              <input
                type="text"
                value={attack.range}
                onChange={e => onUpdate({ range: e.target.value })}
                list="canonical-ranges"
                aria-label={t('aria.range_input')}
                data-testid={`attack-range-input-${attack.id}`}
                className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
                style={SEAMLESS_INPUT}
              />
            </div>
          </div>

          {/* Row 3: properties */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
              {t('combat.properties_label')}
            </label>
            <input
              type="text"
              value={attack.properties}
              onChange={e => onUpdate({ properties: e.target.value })}
              placeholder={t('combat.properties_placeholder')}
              data-testid={`attack-properties-input-${attack.id}`}
              className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
              style={SEAMLESS_INPUT}
            />
          </div>

          {/* Row 4: notes */}
          <div>
            <label style={{ display: 'block', fontSize: 10, color: T.textMuted, marginBottom: 2, fontFamily: T.sans }}>
              {t('combat.notes_label')}
            </label>
            <textarea
              value={attack.notes}
              onChange={e => onUpdate({ notes: e.target.value })}
              placeholder={t('combat.notes_placeholder')}
              rows={3}
              data-testid={`attack-notes-textarea-${attack.id}`}
              style={{
                ...SEAMLESS_INPUT,
                resize: 'vertical',
                fontFamily: T.sans,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── AttacksList (AttacksBlock) ──────────────────────────────────────────── */

interface AttacksListProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function AttacksList({ character, onUpdate }: AttacksListProps) {
  const { t } = useTranslation()
  const attacks = character.attacks

  function addAttack() {
    if (!onUpdate) return
    const newAttack: Attack = {
      id: crypto.randomUUID(),
      name: '',
      kind: 'melee',
      ability: 'str',
      attackBonus: 0,
      damage: '',
      damageType: '',
      range: '',
      properties: '',
      notes: '',
    }
    onUpdate({ attacks: [...attacks, newAttack] })
  }

  function updateAttack(id: string, partial: Partial<Attack>) {
    if (!onUpdate) return
    onUpdate({ attacks: attacks.map(a => a.id === id ? { ...a, ...partial } : a) })
  }

  function removeAttack(id: string) {
    if (!onUpdate) return
    onUpdate({ attacks: attacks.filter(a => a.id !== id) })
  }

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
          {t('attacks.section_title')}
        </h3>
        <span style={{ fontSize: 11, color: T.textMuted, marginRight: 8, fontFamily: T.sans }}>
          {t('attacks.count_label', { count: String(attacks.length) })}
        </span>
        {onUpdate && (
          <button
            type="button"
            data-testid="add-attack-btn"
            onClick={addAttack}
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
            + {t('attacks.add_button')}
          </button>
        )}
      </div>

      {/* Empty state */}
      {attacks.length === 0 ? (
        <div
          data-testid="attacks-empty-state"
          style={{ textAlign: 'center', padding: '24px 0', fontFamily: T.sans }}
        >
          <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 6px' }}>
            {t('attacks.empty_state_title')}
          </p>
          <p style={{ fontSize: 11, color: T.textMuted, opacity: 0.7, margin: 0 }}>
            {t('attacks.empty_state_hint')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attacks.map(attack => (
            <AttackCard
              key={attack.id}
              attack={attack}
              onUpdate={partial => updateAttack(attack.id, partial)}
              onRemove={() => removeAttack(attack.id)}
            />
          ))}
        </div>
      )}

      {/* Datalists */}
      <datalist id="canonical-damage-types">
        {CANONICAL_DAMAGE_TYPES.map(dt => <option key={dt} value={dt} />)}
      </datalist>
      <datalist id="canonical-ranges">
        {CANONICAL_RANGES.map(r => <option key={r} value={r} />)}
      </datalist>
    </div>
  )
}
