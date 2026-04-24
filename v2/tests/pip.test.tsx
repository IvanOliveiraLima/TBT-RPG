import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Pip } from '@/components/sheet/ui/Pip'

describe('Pip', () => {
  it('renders without crashing', () => {
    const { container } = render(<Pip state="empty" />)
    expect(container.firstChild).toBeDefined()
  })

  it('empty state has transparent background', () => {
    const { container } = render(<Pip state="empty" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.background).toBe('transparent')
  })

  it('filled state has a colored background', () => {
    const { container } = render(<Pip state="filled" color="gold" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.background).not.toBe('transparent')
    expect(el.style.background).not.toBe('')
  })

  it('doubled state is also visually filled', () => {
    const { container } = render(<Pip state="doubled" color="purple" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.background).not.toBe('transparent')
  })

  it('sm size sets width to 8px', () => {
    const { container } = render(<Pip state="empty" size="sm" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('8px')
    expect(el.style.height).toBe('8px')
  })

  it('md size (default) sets width to 10px', () => {
    const { container } = render(<Pip state="empty" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('10px')
    expect(el.style.height).toBe('10px')
  })

  it('renders all color variants without crashing', () => {
    const colors = ['gold', 'ruby', 'success', 'purple'] as const
    for (const color of colors) {
      const { container } = render(<Pip state="filled" color={color} />)
      expect(container.firstChild).not.toBeNull()
    }
  })

  it('has border-radius 50% (circle shape)', () => {
    const { container } = render(<Pip state="empty" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.borderRadius).toBe('50%')
  })
})
