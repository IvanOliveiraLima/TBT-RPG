import { useState, useRef, useEffect } from 'react'
import type { Character, Feature } from '@/domain/character'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { ConfirmableRemoveButton } from '@/components/primitives/ConfirmableRemoveButton'
import { AutoGrowTextarea } from '@/components/primitives/AutoGrowTextarea'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'

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
  readOnly: boolean
  expanded: boolean
  onToggle: () => void
  onUpdate: (partial: Partial<Feature>) => void
  onRemove: () => void
  locked?: boolean
}

function FeatureCard({ feature, datalistId, onUpdate, onRemove, locked, readOnly, expanded, onToggle }: FeatureCardProps) {
  const { t } = useTranslation()

  function handleCardClick(e: React.MouseEvent) {
    if (readOnly) return
    const target = e.target as HTMLElement
    if (target.closest('input, button, textarea, select, [role="checkbox"]')) return
    onToggle()
  }

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = T.borderFocus
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = T.border
  }

  const typeLabel = t(`features.type_${feature.type}` as TranslationKey)

  return (
    <div
      data-testid={`feature-card-${feature.id}`}
      onClick={handleCardClick}
      style={{
        background:   expanded ? T.bg : 'transparent',
        border:       `1px solid ${expanded ? T.border : 'transparent'}`,
        borderRadius: 8,
        marginBottom: 8,
        overflow:     'hidden',
        cursor:       readOnly ? 'default' : 'pointer',
      }}
    >
      {/* Always-visible header row: compact summary */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 10px', alignItems: 'center' }}>
        <span style={{ color: T.gold, fontSize: 12, flexShrink: 0 }}>✦</span>

        {/* Name — input when expanded, span when closed */}
        {expanded && !readOnly ? (
          <input
            type="text"
            value={feature.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder={t('features.name_placeholder')}
            aria-label={t('aria.feature_name')}
            data-testid={`feature-name-${feature.id}`}
            style={{ ...INPUT_STYLE, flex: '0 1 auto', maxWidth: 'min(60%, 320px)', minWidth: 120 }}
            onFocus={focusBorder}
            onBlur={blurBorder}
            readOnly={locked}
            autoFocus={!locked}
          />
        ) : (
          <span
            data-testid={`feature-summary-name-${feature.id}`}
            style={{
              flex:         '0 1 auto',
              maxWidth:     'min(60%, 320px)',
              minWidth:     0,
              fontSize:     13,
              color:        T.text,
              fontFamily:   T.sans,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {feature.name || t('features.name_placeholder')}
          </span>
        )}

        {/* Spacer — click here to toggle (non-interactive area) */}
        <span data-testid={`feature-header-gap-${feature.id}`} style={{ flex: 1 }} />

        {/* Compact chips — visible only when closed */}
        {!expanded && (
          <>
            {feature.source && (
              <span
                data-testid={`feature-summary-source-${feature.id}`}
                style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans, flexShrink: 0 }}
              >
                {feature.source}
              </span>
            )}
            <span
              data-testid={`feature-summary-type-${feature.id}`}
              style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans, flexShrink: 0 }}
            >
              {typeLabel}
            </span>
            {feature.type === 'active' && (
              <span
                data-testid={`feature-summary-uses-${feature.id}`}
                style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans, flexShrink: 0 }}
              >
                {feature.usesLeft ?? 0}/{feature.usesMax ?? 0}
              </span>
            )}
          </>
        )}

        {/* Remove button — always visible in header when not locked */}
        {!locked && !readOnly && (
          <ConfirmableRemoveButton
            onConfirm={onRemove}
            ariaLabel={t('aria.remove_feature', { name: feature.name || `#${feature.id}` })}
            testId={`feature-remove-${feature.id}`}
          />
        )}
      </div>

      {/* Expanded form — shown when expanded and onUpdate provided */}
      {expanded && !readOnly && (
        <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Row 1: source · type */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
              readOnly={locked}
            />

            <select
              value={feature.type}
              onChange={e => {
                onUpdate({ type: e.target.value as Feature['type'] })
              }}
              disabled={locked}
              aria-label={t('aria.feature_type')}
              data-testid={`feature-type-${feature.id}`}
              className="dark-select"
              style={{
                ...INPUT_STYLE,
                flexShrink: 0,
                cursor: locked ? 'default' : 'pointer',
              }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            >
              <option value="passive">{t('features.type_passive')}</option>
              <option value="active">{t('features.type_active')}</option>
              <option value="reaction">{t('features.type_reaction')}</option>
            </select>
          </div>

          {/* Row 2: description */}
          <AutoGrowTextarea
            value={feature.description}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder={t('features.description_placeholder')}
            rows={2}
            aria-label={t('aria.feature_description')}
            data-testid={`feature-desc-${feature.id}`}
            style={{
              ...INPUT_STYLE,
              width: '100%',
              boxSizing: 'border-box',
            }}
            onFocus={focusBorder}
            onBlur={blurBorder}
            readOnly={locked}
          />

          {/* Row 3: uses (only when type=active) */}
          {feature.type === 'active' && (
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        6,
                marginTop:  6,
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
      )}
    </div>
  )
}

/* ── FeaturesList ─────────────────────────────────────────────────────────── */

interface FeaturesListProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function FeaturesList({ character, onUpdate }: FeaturesListProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  const { features } = character
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

  const DATALIST_ID = 'feature-sources-datalist'

  function addFeature() {
    if (!onUpdate) return
    const newId = crypto.randomUUID()
    const newFeature: Feature = {
      id:          newId,
      name:        '',
      source:      '',
      description: '',
      type:        'passive',
    }
    onUpdate({ features: [...features, newFeature] })
    setOpenId(newId)
  }

  function updateFeature(id: string, partial: Partial<Feature>) {
    if (!onUpdate) return
    onUpdate({
      features: features.map(f => {
        if (f.id !== id) return f
        const merged = { ...f, ...partial }
        // Clear usesLeft/usesMax when type changes away from 'active'
        if (partial.type && partial.type !== 'active') {
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
    setOpenId(cur => (cur === id ? null : cur))
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
    <div ref={listRef} data-testid="features-list">
      <SourceDatalist id={DATALIST_ID} />

      {features.length === 0 && (
        <p
          data-testid="features-empty"
          style={{
            fontSize:   12,
            color:      T.textMuted,
            fontStyle:  'italic',
            margin:     '4px 0 8px',
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
          readOnly={readOnly}
          expanded={openId === f.id}
          onToggle={() => setOpenId(cur => (cur === f.id ? null : f.id))}
          onUpdate={partial => updateFeature(f.id, partial)}
          onRemove={() => removeFeature(f.id)}
          {...(locked ? { locked: true } : {})}
        />
      ))}

      {onUpdate && !locked && (
        <button
          type="button"
          data-testid="features-add"
          onClick={addFeature}
          style={{
            background:   'none',
            border:       `1px dashed ${T.border}`,
            borderRadius:  6,
            color:         T.textMuted,
            fontSize:      11,
            padding:       '4px 10px',
            cursor:        'pointer',
            marginTop:     4,
            fontFamily:    T.sans,
          }}
        >
          {t('features.add_button')}
        </button>
      )}
    </div>
  )
}
