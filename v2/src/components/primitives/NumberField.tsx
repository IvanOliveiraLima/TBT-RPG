import { useState } from 'react'
import type React from 'react'
import { useTranslation } from '@/i18n'

interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'onBlur'> {
  value: number
  min?: number
  max?: number
  onChange: (n: number) => void
  showSteppers?: boolean
}

/**
 * A controlled number input with local string state.
 *
 * Allows intermediate empty/partial values while typing (no snapping to 0 or min
 * on every keystroke). Restores to the last valid domain value on blur if the
 * field is left empty or invalid. Clamps the emitted value to [min, max].
 *
 * When showSteppers is true, wraps the input with decrement (−) and increment (+)
 * buttons. The buttons respect the disabled state of the field.
 */
export function NumberField({
  value,
  min = 0,
  max = 999,
  onChange,
  showSteppers = false,
  ...rest
}: NumberFieldProps) {
  const { t } = useTranslation()
  const [prevValue, setPrevValue] = useState(value)
  const [inputValue, setInputValue] = useState(String(value))

  // Sync input when domain value changes externally (store update, reload, etc.)
  if (prevValue !== value) {
    setPrevValue(value)
    setInputValue(String(value))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setInputValue(raw)
    if (raw === '') return
    const parsed = parseInt(raw, 10)
    if (Number.isNaN(parsed)) return
    const clamped = Math.max(min, Math.min(max, parsed))
    if (clamped !== value) onChange(clamped)
  }

  function handleBlur() {
    if (inputValue === '' || Number.isNaN(parseInt(inputValue, 10))) {
      setInputValue(String(value))
    }
  }

  function decrement() {
    const next = Math.max(min, value - 1)
    if (next !== value) onChange(next)
  }

  function increment() {
    const next = Math.min(max, value + 1)
    if (next !== value) onChange(next)
  }

  const fieldDisabled = rest.disabled === true

  const input = (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...rest}
    />
  )

  if (!showSteppers) return input

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={fieldDisabled || value <= min}
        aria-label={t('aria.decrement_value')}
        style={{
          minWidth: 32,
          minHeight: 32,
          background: '#1E1B2A',
          border: '1px solid #2A2537',
          borderRadius: 6,
          color: '#A09DB0',
          fontSize: 18,
          cursor: fieldDisabled || value <= min ? 'default' : 'pointer',
          opacity: fieldDisabled || value <= min ? 0.35 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
          padding: 0,
          userSelect: 'none',
        }}
      >
        −
      </button>

      {input}

      <button
        type="button"
        onClick={increment}
        disabled={fieldDisabled || value >= max}
        aria-label={t('aria.increment_value')}
        style={{
          minWidth: 32,
          minHeight: 32,
          background: '#1E1B2A',
          border: '1px solid #2A2537',
          borderRadius: 6,
          color: '#A09DB0',
          fontSize: 18,
          cursor: fieldDisabled || value >= max ? 'default' : 'pointer',
          opacity: fieldDisabled || value >= max ? 0.35 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
          padding: 0,
          userSelect: 'none',
        }}
      >
        +
      </button>
    </div>
  )
}
