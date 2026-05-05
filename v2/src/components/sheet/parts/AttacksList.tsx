import type { Character, Attack } from '@/domain/character'
import { Badge } from '../ui/Badge'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

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

export function AttacksList({ character }: AttacksListProps) {
  const { t } = useTranslation()
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
          {t('attacks.section_title')}
        </h3>
        <span
          style={{
            fontSize: 11,
            color: T.textMuted,
            marginRight: 8,
            fontFamily: T.sans,
          }}
        >
          {t('attacks.count_label', { count: String(attacks.length) })}
        </span>
        <button
          data-testid="add-attack-btn"
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
          + {t('attacks.add_button')}
        </button>
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
  const { t } = useTranslation()

  const abilityLabel = attack.baseStat
    ? t(`ability.${attack.baseStat}` as TranslationKey)
    : '—'

  const hasDamage = attack.damage.trim() !== ''
  const hasDamageType = attack.damageType.trim() !== ''

  const metaParts: string[] = [abilityLabel]
  if (hasDamage) {
    metaParts.push(hasDamageType ? `${attack.damage} ${attack.damageType}` : attack.damage)
  }
  const metaLine = metaParts.join(' · ')

  const handleRow = () => alert(t('phase_c.details_coming_soon'))

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('attacks.row_aria', {
        name: attack.name,
        bonus_or_dc: attack.bonus,
        damage: attack.damage || '—',
      })}
      data-testid={`attack-row-${attack.id}`}
      onClick={handleRow}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleRow()
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
          aria-label={t('aria.remove_attack', { name: attack.name })}
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
    </div>
  )
}
