import { useState, useRef, useId, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { HelpIcon } from '@/components/icons'

// Module-level: close previously open hint when a new one opens (one at a time)
let globalClose: (() => void) | null = null

const POPOVER_WIDTH = 260

interface HelpHintProps {
  textKey: TranslationKey
  ariaLabelKey?: TranslationKey
}

export function HelpHint({ textKey, ariaLabelKey }: HelpHintProps) {
  const { t } = useTranslation()
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setPos(null)
    globalClose = null
  }, [])

  function toggle() {
    if (open) {
      close()
      return
    }
    // Close any other open HelpHint
    globalClose?.()

    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return

    const estimatedHeight = 100
    const spaceBelow = window.innerHeight - rect.bottom
    const top =
      spaceBelow < estimatedHeight + 6
        ? rect.top - estimatedHeight - 6
        : rect.bottom + 6

    const left = Math.min(Math.max(8, rect.left), window.innerWidth - POPOVER_WIDTH - 8)

    setPos({ top, left })
    setOpen(true)
    globalClose = close
  }

  // If the component unmounts while open, release the global close reference
  // so it doesn't point to a dead instance.
  useEffect(() => {
    return () => { if (globalClose === close) globalClose = null }
  }, [close])

  // Register close listeners only when open — prevents the opening click from
  // immediately triggering close-outside
  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (
        anchorRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return
      close()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    function handleScrollOrResize() {
      close()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open, close])

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={t(ariaLabelKey ?? 'help.aria_open')}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={toggle}
        data-testid="help-hint-trigger"
        style={{
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
        }}
      >
        <HelpIcon />
      </button>
      {open && pos &&
        createPortal(
          <div
            ref={popoverRef}
            id={tooltipId}
            role="tooltip"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
              maxWidth: POPOVER_WIDTH,
              background: '#2A2537',
              border: '1px solid #3A3450',
              borderRadius: 10,
              padding: '10px 12px',
              color: '#F4EFE0',
              fontSize: 13,
              lineHeight: 1.5,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {t(textKey)}
          </div>,
          document.body
        )}
    </>
  )
}
