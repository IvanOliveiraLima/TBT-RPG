import type React from 'react'
import { useTranslation } from '@/i18n'
import { ALIGNMENTS } from '@/data/canonical/alignments'
import type { Alignment } from '@/data/canonical/alignments'

interface AlignmentSelectProps {
  value: string
  onChange: (alignment: string) => void
  disabled?: boolean
}

// backgroundColor (not 'background' shorthand) preserves backgroundImage (chevron) as a separate property
const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: 6,
  padding: '4px 28px 4px 6px',  // matches SEAMLESS_INPUT top/left/bottom; 28px right reserves chevron space
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

export function AlignmentSelect({ value, onChange, disabled }: AlignmentSelectProps) {
  const { t } = useTranslation()

  const isCustom = value !== '' && !ALIGNMENTS.includes(value as Alignment)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === '__custom__') return
    onChange(val)
  }

  return (
    <select
      value={isCustom ? '__custom__' : value}
      onChange={handleChange}
      disabled={disabled}
      aria-label={t('aria.alignment_input')}
      data-testid="alignment-select"
      className="dark-select hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
      style={SELECT_STYLE}
    >
      <option value="">{t('identity.alignment_unselected')}</option>
      {isCustom && (
        <option value="__custom__" disabled data-testid="alignment-custom-option">
          {t('identity.alignment_custom_label', { value })}
        </option>
      )}
      {ALIGNMENTS.map(a => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  )
}
