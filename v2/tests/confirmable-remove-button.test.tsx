import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { ConfirmableRemoveButton } from '@/components/primitives/ConfirmableRemoveButton'
import { renderWithI18n } from './helpers/render'

describe('ConfirmableRemoveButton — rest state', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders × in rest state (EN)', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove item" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove item' })
    expect(btn.textContent).toBe('×')
  })

  it('renders × in rest state (PT)', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remover item" />,
      'pt'
    )
    const btn = screen.getByRole('button', { name: 'Remover item' })
    expect(btn.textContent).toBe('×')
  })

  it('has data-action="remove" attribute', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove item" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove item' })
    expect(btn.getAttribute('data-action')).toBe('remove')
  })
})

describe('ConfirmableRemoveButton — confirming state', () => {
  beforeEach(() => { localStorage.clear() })

  it('shows "Confirm?" text after first click (EN)', () => {
    const onConfirm = vi.fn()
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remove item" />,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))
    expect(screen.getByText('Confirm?')).toBeDefined()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('shows "Confirmar?" text after first click (PT)', () => {
    const onConfirm = vi.fn()
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remover item" />,
      'pt'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remover item' }))
    expect(screen.getByText('Confirmar?')).toBeDefined()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('aria-label changes to default confirm label in confirming state (EN)', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove item" />,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))
    expect(screen.getByRole('button', { name: 'Confirm deletion' })).toBeDefined()
  })

  it('aria-label changes to custom confirm label when ariaLabelConfirm is provided', () => {
    renderWithI18n(
      <ConfirmableRemoveButton
        onConfirm={vi.fn()}
        ariaLabel="Remove item"
        ariaLabelConfirm="Really delete?"
      />,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))
    expect(screen.getByRole('button', { name: 'Really delete?' })).toBeDefined()
  })

  it('sets data-confirming="true" in confirming state', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove item" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove item' })
    fireEvent.click(btn)
    expect(btn.getAttribute('data-confirming')).toBe('true')
  })

  it('data-confirming is absent in rest state', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove item" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove item' })
    expect(btn.getAttribute('data-confirming')).toBeNull()
  })
})

describe('ConfirmableRemoveButton — confirmation execution', () => {
  beforeEach(() => { localStorage.clear() })

  it('executes onConfirm on second click', () => {
    const onConfirm = vi.fn()
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remove item" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove item' })
    fireEvent.click(btn)                                    // → confirming
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }))  // → execute
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('returns to rest state after confirm', () => {
    const onConfirm = vi.fn()
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remove item" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove item' })
    fireEvent.click(btn)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }))
    expect(screen.getByRole('button').textContent).toBe('×')
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('onConfirm is NOT called on first click', () => {
    const onConfirm = vi.fn()
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remove item" />,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

describe('ConfirmableRemoveButton — cancel behaviors', () => {
  beforeEach(() => { localStorage.clear() })

  it('resets to rest on mousedown outside the button', () => {
    const onConfirm = vi.fn()
    const { container } = renderWithI18n(
      <div>
        <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remove item" />
        <button data-testid="outside">Outside</button>
      </div>,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))
    expect(screen.getByText('Confirm?')).toBeDefined()

    fireEvent.mouseDown(screen.getByTestId('outside'))

    expect(screen.queryByText('Confirm?')).toBeNull()
    expect(onConfirm).not.toHaveBeenCalled()
    // back to ×
    expect(container.querySelector('button[data-action="remove"]')!.textContent).toBe('×')
  })

  it('auto-resets after 5s timeout', async () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remove item" />,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))
    expect(screen.getByText('Confirm?')).toBeDefined()

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByText('Confirm?')).toBeNull()
    expect(onConfirm).not.toHaveBeenCalled()
    vi.useRealTimers()
  }, 10000)
})

describe('ConfirmableRemoveButton — stopPropagation', () => {
  beforeEach(() => { localStorage.clear() })

  it('does not bubble click to parent on first click', () => {
    const parentClick = vi.fn()
    renderWithI18n(
      <div onClick={parentClick}>
        <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove" />
      </div>,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('does not bubble click to parent on second click (confirm)', () => {
    const parentClick = vi.fn()
    renderWithI18n(
      <div onClick={parentClick}>
        <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove" />
      </div>,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }))
    expect(parentClick).not.toHaveBeenCalled()
  })
})

describe('ConfirmableRemoveButton — disabled state', () => {
  beforeEach(() => { localStorage.clear() })

  it('does not enter confirming when disabled', () => {
    const onConfirm = vi.fn()
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={onConfirm} ariaLabel="Remove" disabled />,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('Confirm?')).toBeNull()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('button has disabled attribute when disabled=true', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove" disabled />,
      'en'
    )
    expect((screen.getByRole('button', { name: 'Remove' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('button is not disabled by default', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove" />,
      'en'
    )
    expect((screen.getByRole('button', { name: 'Remove' }) as HTMLButtonElement).disabled).toBe(false)
  })
})

describe('ConfirmableRemoveButton — size prop', () => {
  beforeEach(() => { localStorage.clear() })

  it('size md has minWidth 32 (default)', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove' }) as HTMLButtonElement
    expect(btn.style.minWidth).toBe('32px')
    expect(btn.style.minHeight).toBe('32px')
  })

  it('size sm has minWidth 28', () => {
    renderWithI18n(
      <ConfirmableRemoveButton onConfirm={vi.fn()} ariaLabel="Remove" size="sm" />,
      'en'
    )
    const btn = screen.getByRole('button', { name: 'Remove' }) as HTMLButtonElement
    expect(btn.style.minWidth).toBe('28px')
    expect(btn.style.minHeight).toBe('28px')
  })
})
