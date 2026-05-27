import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { CharacterCardMenu } from '@/components/CharacterCardMenu'

function render(onDelete = vi.fn(), lang: 'pt' | 'en' = 'pt') {
  return renderWithI18n(
    <CharacterCardMenu
      characterId="char_001"
      characterName="Eira"
      onDelete={onDelete}
    />,
    lang,
  )
}

// ── visibility ────────────────────────────────────────────────────────────────

describe('CharacterCardMenu — visibility', () => {
  it('renders the kebab trigger button', () => {
    render()
    expect(screen.getByTestId('character-card-menu-trigger')).toBeDefined()
  })

  it('does not render the dropdown initially', () => {
    render()
    expect(screen.queryByTestId('character-card-menu-dropdown')).toBeNull()
  })

  it('opens the dropdown on trigger click', async () => {
    render()
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    expect(screen.getByTestId('character-card-menu-dropdown')).toBeDefined()
  })

  it('closes the dropdown on second trigger click', async () => {
    render()
    const trigger = screen.getByTestId('character-card-menu-trigger')
    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(screen.queryByTestId('character-card-menu-dropdown')).toBeNull()
  })
})

// ── delete action ─────────────────────────────────────────────────────────────

describe('CharacterCardMenu — delete action', () => {
  it('renders delete option in the dropdown (PT)', async () => {
    render()
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    expect(screen.getByTestId('character-card-menu-delete')).toBeDefined()
    expect(screen.getByTestId('character-card-menu-delete').textContent).toContain('Excluir')
  })

  it('renders delete option in the dropdown (EN)', async () => {
    render(vi.fn(), 'en')
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    expect(screen.getByTestId('character-card-menu-delete').textContent).toContain('Delete')
  })

  it('calls onDelete with characterId and characterName when Delete is clicked', async () => {
    const mockOnDelete = vi.fn()
    render(mockOnDelete)
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    expect(mockOnDelete).toHaveBeenCalledWith('char_001', 'Eira')
  })

  it('closes the dropdown after Delete is clicked', async () => {
    render()
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    expect(screen.queryByTestId('character-card-menu-dropdown')).toBeNull()
  })
})

// ── stopPropagation ───────────────────────────────────────────────────────────

describe('CharacterCardMenu — stopPropagation', () => {
  it('clicking the menu container does not bubble to parent', () => {
    const parentClick = vi.fn()
    const { container } = renderWithI18n(
      <div onClick={parentClick}>
        <CharacterCardMenu characterId="c1" characterName="X" onDelete={vi.fn()} />
      </div>,
      'pt',
    )
    // Click the menu container div
    const menuDiv = container.querySelector('[data-testid="character-card-menu"]')!
    fireEvent.click(menuDiv)
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('clicking the trigger does not bubble to parent', () => {
    const parentClick = vi.fn()
    renderWithI18n(
      <div onClick={parentClick}>
        <CharacterCardMenu characterId="c1" characterName="X" onDelete={vi.fn()} />
      </div>,
      'pt',
    )
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('clicking Delete does not bubble to parent', () => {
    const parentClick = vi.fn()
    renderWithI18n(
      <div onClick={parentClick}>
        <CharacterCardMenu characterId="c1" characterName="X" onDelete={vi.fn()} />
      </div>,
      'pt',
    )
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    fireEvent.click(screen.getByTestId('character-card-menu-delete'))
    expect(parentClick).not.toHaveBeenCalled()
  })
})

// ── aria attributes ───────────────────────────────────────────────────────────

describe('CharacterCardMenu — accessibility', () => {
  it('trigger has aria-haspopup="menu"', () => {
    render()
    expect(screen.getByTestId('character-card-menu-trigger').getAttribute('aria-haspopup')).toBe('menu')
  })

  it('trigger has aria-expanded="false" when closed', () => {
    render()
    expect(screen.getByTestId('character-card-menu-trigger').getAttribute('aria-expanded')).toBe('false')
  })

  it('trigger has aria-expanded="true" when open', () => {
    render()
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    expect(screen.getByTestId('character-card-menu-trigger').getAttribute('aria-expanded')).toBe('true')
  })

  it('dropdown has role="menu"', () => {
    render()
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    expect(screen.getByTestId('character-card-menu-dropdown').getAttribute('role')).toBe('menu')
  })

  it('delete button has role="menuitem"', () => {
    render()
    fireEvent.click(screen.getByTestId('character-card-menu-trigger'))
    expect(screen.getByTestId('character-card-menu-delete').getAttribute('role')).toBe('menuitem')
  })
})
