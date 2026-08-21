import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { RowMenu } from '@/components/primitives/RowMenu'
import { renderWithI18n } from './helpers/render'

function makeItems(onA = vi.fn(), onB = vi.fn()) {
  return [
    { key: 'a', label: 'Action A', onSelect: onA, testId: 'item-a' },
    { key: 'b', label: 'Delete', onSelect: onB, danger: true as const, confirm: true as const, testId: 'item-b' },
  ]
}

describe('RowMenu — trigger', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders trigger button with aria-label', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions for Foo" testId="menu" />, 'en')
    expect(screen.getByRole('button', { name: 'Actions for Foo' })).toBeDefined()
  })

  it('menu is closed initially', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    expect(screen.queryByTestId('item-a')).toBeNull()
  })

  it('clicking trigger opens the menu', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    expect(screen.getByTestId('item-a')).toBeDefined()
    expect(screen.getByTestId('item-b')).toBeDefined()
  })

  it('clicking trigger again closes the menu', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('menu'))
    expect(screen.queryByTestId('item-a')).toBeNull()
  })

  it('trigger has aria-expanded=false when closed', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    const btn = screen.getByTestId('menu')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('trigger has aria-expanded=true when open', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    expect(screen.getByTestId('menu').getAttribute('aria-expanded')).toBe('true')
  })

  it('trigger does not propagate click to parent', () => {
    const parentClick = vi.fn()
    renderWithI18n(
      <div onClick={parentClick}>
        <RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />
      </div>,
      'en'
    )
    fireEvent.click(screen.getByTestId('menu'))
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('disabled trigger does not open the menu', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" disabled />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    expect(screen.queryByTestId('item-a')).toBeNull()
  })
})

describe('RowMenu — plain item (no confirm)', () => {
  beforeEach(() => { localStorage.clear() })

  it('clicking a plain item calls onSelect', () => {
    const onA = vi.fn()
    renderWithI18n(<RowMenu items={makeItems(onA)} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-a'))
    expect(onA).toHaveBeenCalledTimes(1)
  })

  it('clicking a plain item closes the menu', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-a'))
    expect(screen.queryByTestId('item-a')).toBeNull()
  })

  it('plain item click does not propagate to parent', () => {
    const parentClick = vi.fn()
    renderWithI18n(
      <div onClick={parentClick}>
        <RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />
      </div>,
      'en'
    )
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-a'))
    expect(parentClick).not.toHaveBeenCalled()
  })
})

describe('RowMenu — confirm item', () => {
  beforeEach(() => { localStorage.clear() })

  it('first click shows Confirm? (EN)', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-b'))
    expect(screen.getByText('Confirm?')).toBeDefined()
  })

  it('first click shows Confirmar? (PT)', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Ações" testId="menu" />, 'pt')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-b'))
    expect(screen.getByText('Confirmar?')).toBeDefined()
  })

  it('first click on confirm item does NOT call onSelect', () => {
    const onB = vi.fn()
    renderWithI18n(<RowMenu items={makeItems(vi.fn(), onB)} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-b'))
    expect(onB).not.toHaveBeenCalled()
  })

  it('second click on confirm item calls onSelect', () => {
    const onB = vi.fn()
    renderWithI18n(<RowMenu items={makeItems(vi.fn(), onB)} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-b'))
    fireEvent.click(screen.getByTestId('item-b'))
    expect(onB).toHaveBeenCalledTimes(1)
  })

  it('second click on confirm item closes the menu', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-b'))
    fireEvent.click(screen.getByTestId('item-b'))
    expect(screen.queryByTestId('item-b')).toBeNull()
  })

  it('confirm item click does not propagate to parent', () => {
    const parentClick = vi.fn()
    renderWithI18n(
      <div onClick={parentClick}>
        <RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />
      </div>,
      'en'
    )
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-b'))
    fireEvent.click(screen.getByTestId('item-b'))
    expect(parentClick).not.toHaveBeenCalled()
  })
})

describe('RowMenu — Esc closes', () => {
  beforeEach(() => { localStorage.clear() })

  it('pressing Esc closes the menu', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    expect(screen.getByTestId('item-a')).toBeDefined()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('item-a')).toBeNull()
  })

  it('pressing Esc resets confirm state', () => {
    renderWithI18n(<RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />, 'en')
    fireEvent.click(screen.getByTestId('menu'))
    fireEvent.click(screen.getByTestId('item-b'))
    expect(screen.getByText('Confirm?')).toBeDefined()
    fireEvent.keyDown(document, { key: 'Escape' })
    // After Esc menu is closed; reopen to check confirm state is reset
    fireEvent.click(screen.getByTestId('menu'))
    expect(screen.queryByText('Confirm?')).toBeNull()
    expect(screen.getByText('Delete')).toBeDefined()
  })
})

describe('RowMenu — click-outside closes', () => {
  beforeEach(() => { localStorage.clear() })

  it('mousedown outside closes the menu', () => {
    renderWithI18n(
      <div>
        <RowMenu items={makeItems()} ariaLabel="Actions" testId="menu" />
        <button data-testid="outside">Outside</button>
      </div>,
      'en'
    )
    fireEvent.click(screen.getByTestId('menu'))
    expect(screen.getByTestId('item-a')).toBeDefined()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByTestId('item-a')).toBeNull()
  })
})

describe('RowMenu — two instances do not interfere', () => {
  beforeEach(() => { localStorage.clear() })

  it('opening one menu does not open the other', () => {
    renderWithI18n(
      <div>
        <RowMenu items={makeItems()} ariaLabel="Menu 1" testId="menu-1" />
        <RowMenu items={makeItems()} ariaLabel="Menu 2" testId="menu-2" />
      </div>,
      'en'
    )
    fireEvent.click(screen.getByTestId('menu-1'))
    expect(screen.getByTestId('menu-1-dropdown')).toBeDefined()
    expect(screen.queryByTestId('menu-2-dropdown')).toBeNull()
  })
})
