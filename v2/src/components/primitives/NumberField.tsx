import { useState } from 'react'
import type React from 'react'

interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'onBlur'> {
  value: number
  min?: number
  max?: number
  onChange: (n: number) => void
}

/**
 * A controlled number input with local string state.
 *
 * Allows intermediate empty/partial values while typing (no snapping to 0 or min
 * on every keystroke). Restores to the last valid domain value on blur if the
 * field is left empty or invalid. Clamps the emitted value to [min, max].
 *
 * Usage pattern is identical to AttrCell's inline pattern (extracted here to
 * eliminate the same latent bug in IdentityBlock class levels and LoreHero XP).
 */
export function NumberField({ value, min = 0, max = 999, onChange, ...rest }: NumberFieldProps) {
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

  return (
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
}
