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
  readOnly?: boolean
}

/**
 * A controlled number input with local string state.
 *
 * Allows intermediate empty/partial values while typing (no snapping to 0 or min
 * on every keystroke). Restores to the last valid domain value on blur if the
 * field is left empty or invalid. Clamps the emitted value to [min, max].
 *
 * When showSteppers is true, wraps the input with decrement (−) and increment (+)
 * buttons. The wrapper fills its parent width and uses flex layout so the buttons
 * (flex-shrink: 0) never overlap the input (flex: 1 1 0, min-width: 48px).
 */
export function NumberField({
  value,
  min = 0,
  max = 999,
  onChange,
  showSteppers = false,
  readOnly,
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
    if (readOnly) return
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

  const fieldDisabled = rest.disabled === true || readOnly === true

  // When steppers are active, separate the passed style so we can override
  // width-related properties. The input must use flex: 1 1 0 to consume
  // remaining space after the buttons, not width: 100% which would size it
  // relative to the flex container and cause overlap on narrow viewports.
  const { style: passedStyle, ...inputRest } = rest

  const inputStyle: React.CSSProperties | undefined = showSteppers
    ? { ...passedStyle, width: 'auto', flex: '1 1 0', minWidth: 48 }
    : passedStyle

  const input = (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      readOnly={readOnly}
      style={inputStyle}
      {...inputRest}
    />
  )

  if (!showSteppers) return input

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    flexShrink: 0,
    minWidth: 32,
    minHeight: 32,
    background: '#1E1B2A',
    border: '1px solid #2A2537',
    borderRadius: 6,
    color: '#A09DB0',
    fontSize: 18,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
    userSelect: 'none',
  })

  const decrementDisabled = fieldDisabled || value <= min
  const incrementDisabled = fieldDisabled || value >= max

  return (
    <div
      data-testid="number-field-stepper-wrapper"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={decrementDisabled}
        aria-label={t('aria.decrement_value')}
        style={btnStyle(decrementDisabled)}
      >
        −
      </button>

      {input}

      <button
        type="button"
        onClick={increment}
        disabled={incrementDisabled}
        aria-label={t('aria.increment_value')}
        style={btnStyle(incrementDisabled)}
      >
        +
      </button>
    </div>
  )
}
