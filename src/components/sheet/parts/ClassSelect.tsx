import type React from 'react'
import { useTranslation } from '@/i18n'
import { CANONICAL_CLASSES } from '@/data/canonical/classes'
import { getCanonicalClass } from '@/domain/classes'
import { classLabel } from '@/utils/classLabel'

// backgroundColor (not 'background' shorthand) preserves backgroundImage (chevron) as a separate property
const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: 6,
  padding: '4px 28px 4px 6px',
  color: '#F4EFE0',
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
  width: '100%',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%237A7788' d='M5.5 7.5l4.5 5 4.5-5z'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  backgroundSize: '1em',
}

interface ClassSelectProps {
  value: string
  onChange: (canonicalName: string) => void
  disabled?: boolean
  index?: number
  style?: React.CSSProperties
}

export function ClassSelect({ value, onChange, disabled, index, style }: ClassSelectProps) {
  const { t } = useTranslation()

  const canon = getCanonicalClass(value)
  const isCustom = value !== '' && !canon

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === '__custom__') return
    onChange(val)
  }

  const idx = index ?? 0

  return (
    <select
      value={isCustom ? '__custom__' : (canon ?? '')}
      onChange={handleChange}
      disabled={disabled}
      aria-label={t('aria.class_name_input', { index: String(idx + 1) })}
      data-testid={`class-name-${idx}`}
      className="dark-select hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
      style={{ ...SELECT_STYLE, ...style }}
    >
      <option value="">{t('identity.class_name_unselected')}</option>
      {isCustom && (
        <option value="__custom__" disabled data-testid="class-custom-option">
          {t('identity.class_custom_label', { value })}
        </option>
      )}
      {CANONICAL_CLASSES.map(c => (
        <option key={c} value={c}>{classLabel(c, t)}</option>
      ))}
    </select>
  )
}
