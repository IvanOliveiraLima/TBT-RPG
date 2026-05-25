/**
 * ConfirmableRemoveButton — two-step inline confirmation for destructive actions.
 *
 * Pattern B (inline): first click → "Confirm?" state; second click → executes.
 * Click outside or 5s timeout → resets to rest without executing.
 * stopPropagation on every click to avoid triggering parent expand/collapse handlers.
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/i18n'

const CONFIRM_TIMEOUT_MS = 5000

interface ConfirmableRemoveButtonProps {
  onConfirm: () => void
  ariaLabel: string
  ariaLabelConfirm?: string | undefined
  disabled?: boolean | undefined
  size?: 'sm' | 'md' | undefined
  className?: string | undefined
  testId?: string | undefined
}

export function ConfirmableRemoveButton({
  onConfirm,
  ariaLabel,
  ariaLabelConfirm,
  disabled = false,
  size = 'md',
  className = '',
  testId,
}: ConfirmableRemoveButtonProps) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<number | null>(null)

  // Reset on click outside
  useEffect(() => {
    if (!confirming) return

    function handleOutsideClick(e: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setConfirming(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [confirming])

  // Auto-reset after 5s
  useEffect(() => {
    if (!confirming) return

    timeoutRef.current = window.setTimeout(() => {
      setConfirming(false)
    }, CONFIRM_TIMEOUT_MS)

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [confirming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()

    if (disabled) return

    if (!confirming) {
      setConfirming(true)
      return
    }

    setConfirming(false)
    onConfirm()
  }

  const label = confirming
    ? (ariaLabelConfirm ?? t('remove.confirm_aria'))
    : ariaLabel

  const isSm = size === 'sm'

  const baseStyle: React.CSSProperties = {
    backgroundColor: confirming ? 'rgba(244, 67, 54, 0.15)' : 'transparent',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: confirming ? 'rgba(244, 67, 54, 0.6)' : 'transparent',
    borderRadius: 4,
    color: confirming ? 'rgba(244, 67, 54, 1)' : '#7A7788',
    fontWeight: confirming ? 600 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    opacity: disabled ? 0.4 : 1,
    transition: 'background-color 150ms, border-color 150ms, color 150ms',
    fontFamily: "'Inter', system-ui, sans-serif",
    flexShrink: 0,
    whiteSpace: 'nowrap',
    // Size-based dimensions
    minWidth: isSm ? 28 : 32,
    minHeight: isSm ? 28 : 32,
    fontSize: isSm ? 13 : 14,
    padding: confirming ? (isSm ? '0 6px' : '0 8px') : '0 2px',
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      data-action="remove"
      data-confirming={confirming ? 'true' : undefined}
      data-testid={testId}
      className={className}
      style={baseStyle}
    >
      {confirming ? t('remove.confirm') : '×'}
    </button>
  )
}
