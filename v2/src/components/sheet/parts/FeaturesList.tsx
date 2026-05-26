import type { Character, Feature } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { ConfirmableRemoveButton } from '@/components/primitives/ConfirmableRemoveButton'

const T = {
  bg:          '#1A1625',
  border:      '#2A2537',
  borderFocus: '#6F4DC9',
  text:        '#D4D0E8',
  textMuted:   '#7A7788',
  gold:        '#D4A017',
  removeColor: '#7A7788',
  sans:        "'Inter', system-ui, sans-serif",
} as const

/* ── Source datalist ──────────────────────────────────────────────────────── */

function SourceDatalist({ id }: { id: string }) {
  const { t } = useTranslation()
  return (
    <datalist id={id}>
      <option value={t('features.source_class')} />
      <option value={t('features.source_race')} />
      <option value={t('features.source_background')} />
      <option value={t('features.source_feat')} />
      <option value={t('features.source_item')} />
    </datalist>
  )
}

/* ── FeatureCard ──────────────────────────────────────────────────────────── */

const INPUT_STYLE = {
  background: 'transparent',
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 12,
  color: T.text,
  fontFamily: T.sans,
  outline: 'none',
} as const

interface FeatureCardProps {
  feature: Feature
  datalistId: string
  onUpdate: (partial: Partial<Feature>) => void
  onRemove: () => void
}

function FeatureCard({ feature, datalistId, onUpdate, onRemove }: FeatureCardProps) {
  const { t } = useTranslation()

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = T.borderFocus
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = T.border
  }

  return (
    <div
      data-testid={`feature-card-${feature.id}`}
      style={{
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 8,
      }}
    >
      {/* Row 1: name · source · type · remove */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
        <span style={{ color: T.gold, fontSize: 12, flexShrink: 0 }}>✦</span>

        <input
          type="text"
          value={feature.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder={t('features.name_placeholder')}
          aria-label={t('aria.feature_name')}
          data-testid={`feature-name-${feature.id}`}
          style={{ ...INPUT_STYLE, flex: 2, minWidth: 0 }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />

        <input
          type="text"
          value={feature.source ?? ''}
          onChange={e => onUpdate({ source: e.target.value })}
          placeholder={t('features.source_placeholder')}
          list={datalistId}
          aria-label={t('aria.feature_source')}
          data-testid={`feature-source-${feature.id}`}
          style={{ ...INPUT_STYLE, flex: 1, minWidth: 0 }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />

        <select
          value={feature.type}
          onChange={e => {
            onUpdate({ type: e.target.value as Feature['type'] })
          }}
          aria-label={t('aria.feature_type')}
          data-testid={`feature-type-${feature.id}`}
          style={{
            ...INPUT_STYLE,
            flexShrink: 0,
            cursor: 'pointer',
          }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        >
          <option value="passive">{t('features.type_passive')}</option>
          <option value="active">{t('features.type_active')}</option>
          <option value="reaction">{t('features.type_reaction')}</option>
        </select>

        <ConfirmableRemoveButton
          onConfirm={onRemove}
          ariaLabel={t('aria.remove_feature', { name: feature.name || `#${feature.id}` })}
          testId={`feature-remove-${feature.id}`}
        />
      </div>

      {/* Row 2: description */}
      <textarea
        value={feature.description}
        onChange={e => onUpdate({ description: e.target.value })}
        placeholder={t('features.description_placeholder')}
        rows={2}
        aria-label={t('aria.feature_description')}
        data-testid={`feature-desc-${feature.id}`}
        style={{
          ...INPUT_STYLE,
          width: '100%',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        onFocus={focusBorder}
        onBlur={blurBorder}
      />

      {/* Row 3: uses (only when type=active) */}
      {feature.type === 'active' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
          }}
          data-testid={`feature-uses-row-${feature.id}`}
        >
          <input
            type="number"
            value={feature.usesLeft ?? 0}
            min={0}
            max={feature.usesMax ?? 99}
            onChange={e => onUpdate({ usesLeft: Math.max(0, parseInt(e.target.value) || 0) })}
            aria-label={t('aria.feature_uses_left')}
            data-testid={`feature-uses-left-${feature.id}`}
            style={{ ...INPUT_STYLE, width: 52, textAlign: 'center' }}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
          <span style={{ color: T.textMuted, fontSize: 12 }}>/</span>
          <input
            type="number"
            value={feature.usesMax ?? 0}
            min={0}
            max={99}
            onChange={e => {
              const newMax = Math.max(0, parseInt(e.target.value) || 0)
              const partial: Partial<Feature> = { usesMax: newMax }
              if ((feature.usesLeft ?? 0) > newMax) partial.usesLeft = newMax
              onUpdate(partial)
            }}
            aria-label={t('aria.feature_uses_max')}
            data-testid={`feature-uses-max-${feature.id}`}
            style={{ ...INPUT_STYLE, width: 52, textAlign: 'center' }}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
          <span style={{ color: T.textMuted, fontSize: 11, fontFamily: T.sans }}>
            {t('features.uses_hint')}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── FeaturesList (editable) ──────────────────────────────────────────────── */

interface FeaturesListProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function FeaturesList({ character, onUpdate }: FeaturesListProps) {
  const { t } = useTranslation()
  const { features } = character

  const DATALIST_ID = 'feature-sources-datalist'

  function addFeature() {
    if (!onUpdate) return
    const newFeature: Feature = {
      id:          crypto.randomUUID(),
      name:        '',
      source:      '',
      description: '',
      type:        'passive',
    }
    onUpdate({ features: [...features, newFeature] })
  }

  function updateFeature(id: string, partial: Partial<Feature>) {
    if (!onUpdate) return
    onUpdate({
      features: features.map(f => {
        if (f.id !== id) return f
        const merged = { ...f, ...partial }
        // Clear usesLeft/usesMax when type changes away from 'active'
        if (partial.type && partial.type !== 'active') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { usesLeft: _l, usesMax: _m, ...cleaned } = merged
          return cleaned as Feature
        }
        return merged
      }),
    })
  }

  function removeFeature(id: string) {
    if (!onUpdate) return
    onUpdate({ features: features.filter(f => f.id !== id) })
  }

  if (features.length === 0 && !onUpdate) {
    return (
      <div
        data-testid="features-empty"
        style={{ fontSize: 13, color: T.textMuted, padding: '8px 10px' }}
      >
        {t('features.empty')}
      </div>
    )
  }

  return (
    <div data-testid="features-list">
      <SourceDatalist id={DATALIST_ID} />

      {features.length === 0 && (
        <p
          data-testid="features-empty"
          style={{
            fontSize: 12,
            color: T.textMuted,
            fontStyle: 'italic',
            margin: '4px 0 8px',
            fontFamily: T.sans,
          }}
        >
          {t('features.empty_state_hint')}
        </p>
      )}

      {features.map(f => (
        <FeatureCard
          key={f.id}
          feature={f}
          datalistId={DATALIST_ID}
          onUpdate={partial => updateFeature(f.id, partial)}
          onRemove={() => removeFeature(f.id)}
        />
      ))}

      {onUpdate && (
        <button
          type="button"
          data-testid="features-add"
          onClick={addFeature}
          style={{
            background: 'none',
            border: `1px dashed ${T.border}`,
            borderRadius: 6,
            color: T.textMuted,
            fontSize: 11,
            padding: '4px 10px',
            cursor: 'pointer',
            marginTop: 4,
            fontFamily: T.sans,
          }}
        >
          {t('features.add_button')}
        </button>
      )}
    </div>
  )
}
