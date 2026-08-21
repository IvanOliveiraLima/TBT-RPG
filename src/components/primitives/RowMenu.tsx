/**
 * RowMenu — generic kebab (⋮) menu for per-row actions.
 *
 * Items with confirm=true use a two-step flow: first click shows "Confirm?"
 * in danger color; second click executes and closes the menu.
 * Leaving the menu (Esc, click-outside) resets any pending confirm state.
 *
 * All hooks run unconditionally before any conditional return (rule from #270).
 * stopPropagation on trigger and items prevents expanding/collapsing parent cards.
 * Click-outside listener is registered only while the menu is open.
 */

import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { useTranslation } from '@/i18n'

export interface RowMenuItem {
  key: string
  label: string
  onSelect: () => void
  danger?: boolean
  confirm?: boolean
  testId?: string
}

interface RowMenuProps {
  items: RowMenuItem[]
  ariaLabel: string
  testId?: string
  disabled?: boolean
}

export function RowMenu({ items, ariaLabel, testId, disabled }: RowMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click-outside (mousedown) — registered only when open
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (
        !(triggerRef.current?.contains(target)) &&
        !(menuRef.current?.contains(target))
      ) {
        setOpen(false)
        setConfirming(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  // Close on Esc — registered only when open
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirming(null)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  function handleTrigger(e: React.MouseEvent) {
    e.stopPropagation()
    if (disabled) return
    if (open) {
      setOpen(false)
      setConfirming(null)
    } else {
      setOpen(true)
    }
  }

  function handleItemClick(e: React.MouseEvent, item: RowMenuItem) {
    e.stopPropagation()
    if (item.confirm) {
      if (confirming === item.key) {
        item.onSelect()
        setOpen(false)
        setConfirming(null)
      } else {
        setConfirming(item.key)
      }
    } else {
      item.onSelect()
      setOpen(false)
      setConfirming(null)
    }
  }

  const triggerStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '4px 6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: '#7A7788',
    fontSize: 18,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    opacity: disabled ? 0.4 : 1,
    flexShrink: 0,
    userSelect: 'none',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid={testId}
        disabled={disabled}
        onClick={handleTrigger}
        style={triggerStyle}
      >
        ⋮
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          data-testid={testId ? `${testId}-dropdown` : undefined}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 100,
            background: '#1B1725',
            border: '1px solid #3A3450',
            borderRadius: 8,
            padding: '4px 0',
            minWidth: 130,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {items.map(item => {
            const isConfirming = confirming === item.key
            const label = isConfirming ? t('remove.confirm') : item.label
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                data-testid={item.testId}
                onClick={e => handleItemClick(e, item)}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 14px',
                  textAlign: 'left',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: (item.danger || isConfirming) ? 'rgba(244,67,54,1)' : '#F4EFE0',
                  fontWeight: isConfirming ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
