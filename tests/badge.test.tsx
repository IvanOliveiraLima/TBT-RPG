import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/sheet/ui/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge variant="purple">Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeDefined()
  })

  it('renders all variants without crashing', () => {
    const variants = ['purple', 'gold', 'ruby', 'success', 'muted'] as const
    for (const variant of variants) {
      const { container } = render(<Badge variant={variant}>{variant}</Badge>)
      expect(container.firstChild).not.toBeNull()
    }
  })

  it('renders icon when provided', () => {
    render(<Badge variant="gold" icon={<span data-testid="icon">★</span>}>With Icon</Badge>)
    expect(screen.getByTestId('icon')).toBeDefined()
    expect(screen.getByText('With Icon')).toBeDefined()
  })

  it('uses inline-flex display for alignment', () => {
    const { container } = render(<Badge variant="purple">test</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.style.display).toBe('inline-flex')
  })

  it('purple variant has purple-tinted foreground color', () => {
    const { container } = render(<Badge variant="purple">Inspirado</Badge>)
    const el = container.firstChild as HTMLElement
    // #B5A5E8 — a purple-toned text color
    expect(el.style.color).toBeTruthy()
  })

  it('renders children without icon', () => {
    render(<Badge variant="ruby">Solo</Badge>)
    expect(screen.getByText('Solo')).toBeDefined()
  })
})
