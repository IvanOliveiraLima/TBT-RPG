import type React from 'react'
import type { Character, ClassEntry } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { CANONICAL_RACES } from '@/data/canonical/races'
import { CANONICAL_CLASSES } from '@/data/canonical/classes'
import { CANONICAL_BACKGROUNDS } from '@/data/canonical/backgrounds'
import { ALIGNMENTS } from '@/data/canonical/alignments'
import type { Alignment } from '@/data/canonical/alignments'

const INPUT_RESET: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  fontFamily: 'inherit',
}

const FIELD_INPUT: React.CSSProperties = {
  ...INPUT_RESET,
  width: '100%',
  color: '#F4EFE0',
  fontSize: 13,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid #2A2537',
  borderRadius: 6,
  padding: '5px 8px',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.8,
  color: '#7A7788',
  textTransform: 'uppercase',
  marginBottom: 3,
  display: 'block',
}

const SELECT_STYLE: React.CSSProperties = {
  ...FIELD_INPUT,
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: 28,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%237A7788' d='M5.5 7.5l4.5 5 4.5-5z'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  backgroundSize: '1em',
}

interface IdentityBlockProps {
  character: Character
  onUpdate: (partial: Partial<Character>) => void
}

export function IdentityBlock({ character, onUpdate }: IdentityBlockProps) {
  const { t } = useTranslation()

  // ── Alignment: detect non-canonical values ─────────────────────────────────
  const isCustomAlignment =
    character.alignment !== '' &&
    !ALIGNMENTS.includes(character.alignment as Alignment)

  const handleAlignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === '__custom__') return  // disabled option — ignore
    onUpdate({ alignment: val })
  }

  // ── Classes ─────────────────────────────────────────────────────────────────
  function updateClass(index: number, partial: Partial<ClassEntry>) {
    const newClasses = character.classes.map((c, i) =>
      i === index ? { ...c, ...partial } : c
    )
    onUpdate({ classes: newClasses })
  }

  function addClass() {
    const newClasses: ClassEntry[] = [
      ...character.classes,
      { name: '', level: 1, hitDie: 8 },
    ]
    onUpdate({ classes: newClasses })
  }

  function removeClass(index: number) {
    const newClasses = character.classes.filter((_, i) => i !== index)
    onUpdate({ classes: newClasses })
  }

  return (
    <div data-testid="identity-block">
      {/* ── Race ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <label>
          <span style={LABEL_STYLE}>{t('identity.race_label')}</span>
          <input
            type="text"
            value={character.race}
            onChange={e => onUpdate({ race: e.target.value })}
            list="canonical-races"
            aria-label={t('aria.race_input')}
            style={FIELD_INPUT}
            data-testid="identity-race-input"
          />
        </label>
        <datalist id="canonical-races">
          {CANONICAL_RACES.map(r => <option key={r} value={r} />)}
        </datalist>
      </div>

      {/* ── Background ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <label>
          <span style={LABEL_STYLE}>{t('identity.background_label')}</span>
          <input
            type="text"
            value={character.background}
            onChange={e => onUpdate({ background: e.target.value })}
            list="canonical-backgrounds"
            aria-label={t('aria.background_input')}
            style={FIELD_INPUT}
            data-testid="identity-background-input"
          />
        </label>
        <datalist id="canonical-backgrounds">
          {CANONICAL_BACKGROUNDS.map(b => <option key={b} value={b} />)}
        </datalist>
      </div>

      {/* ── Alignment ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <label>
          <span style={LABEL_STYLE}>{t('identity.alignment_label')}</span>
          <select
            value={isCustomAlignment ? '__custom__' : character.alignment}
            onChange={handleAlignmentChange}
            aria-label={t('aria.alignment_input')}
            className="identity-block-select"
            style={SELECT_STYLE}
            data-testid="identity-alignment-select"
          >
            <option value="">{t('identity.alignment_unselected')}</option>
            {isCustomAlignment && (
              <option value="__custom__" disabled data-testid="identity-alignment-custom-option">
                {t('identity.alignment_custom_label', { value: character.alignment })}
              </option>
            )}
            {ALIGNMENTS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Classes ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <span style={LABEL_STYLE}>{t('identity.classes_label')}</span>
        {character.classes.map((cls, i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}
            data-testid={`identity-class-row-${i}`}
          >
            <input
              type="text"
              value={cls.name}
              onChange={e => updateClass(i, { name: e.target.value })}
              list="canonical-classes"
              placeholder={t('identity.class_name_placeholder')}
              aria-label={t('aria.class_name_input', { index: String(i + 1) })}
              style={{ ...FIELD_INPUT, flex: 1 }}
              data-testid={`identity-class-name-${i}`}
            />
            <input
              type="number"
              min="1"
              max="20"
              value={cls.level}
              onChange={e => {
                const val = parseInt(e.target.value, 10)
                updateClass(i, { level: Number.isNaN(val) ? 1 : Math.max(1, Math.min(20, val)) })
              }}
              aria-label={t('aria.class_level_input', { index: String(i + 1) })}
              style={{ ...FIELD_INPUT, width: 52, textAlign: 'center' }}
              data-testid={`identity-class-level-${i}`}
            />
            <button
              type="button"
              onClick={() => removeClass(i)}
              disabled={character.classes.length === 1}
              aria-label={t('aria.remove_class', { name: cls.name || `#${i + 1}` })}
              style={{
                background: 'transparent',
                border: '1px solid #3A3450',
                borderRadius: 4,
                color: character.classes.length === 1 ? '#3A3450' : '#7A7788',
                cursor: character.classes.length === 1 ? 'not-allowed' : 'pointer',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}
              data-testid={`identity-remove-class-${i}`}
            >
              ×
            </button>
          </div>
        ))}
        <datalist id="canonical-classes">
          {CANONICAL_CLASSES.map(c => <option key={c} value={c} />)}
        </datalist>
        <button
          type="button"
          onClick={addClass}
          style={{
            background: 'transparent',
            border: '1px dashed #3A3450',
            borderRadius: 6,
            color: '#7A7788',
            fontSize: 11,
            padding: '4px 10px',
            cursor: 'pointer',
            width: '100%',
            marginTop: 2,
          }}
          data-testid="identity-add-class"
        >
          {t('identity.add_class_button')}
        </button>
      </div>

      {/* ── Inspiration ────────────────────────────────────────────────────── */}
      <div>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={character.inspiration}
            onChange={e => onUpdate({ inspiration: e.target.checked })}
            aria-label={t('aria.inspiration_toggle')}
            style={{ width: 14, height: 14, accentColor: '#D4A017', cursor: 'pointer' }}
            data-testid="identity-inspiration-checkbox"
          />
          <span style={{ fontSize: 13, color: '#B8B4C8' }}>
            {t('identity.inspiration_label')}
          </span>
        </label>
      </div>
    </div>
  )
}
