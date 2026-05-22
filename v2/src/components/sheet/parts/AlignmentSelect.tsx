import type React from 'react'
import { useTranslation } from '@/i18n'
import { ALIGNMENTS } from '@/data/canonical/alignments'
import type { Alignment } from '@/data/canonical/alignments'

interface AlignmentSelectProps {
  value: string
  onChange: (alignment: string) => void
}

const SELECT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid #2A2537',
  borderRadius: 6,
  padding: '5px 8px',
  paddingRight: 28,
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

export function AlignmentSelect({ value, onChange }: AlignmentSelectProps) {
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
      aria-label={t('aria.alignment_input')}
      data-testid="alignment-select"
      className="alignment-select"
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
