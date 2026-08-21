import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TrashIcon } from '@/components/icons'

describe('TrashIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<TrashIcon />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('respects size prop', () => {
    const { container } = render(<TrashIcon size={20} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('20')
    expect(svg.getAttribute('height')).toBe('20')
  })

  it('has aria-hidden="true"', () => {
    const { container } = render(<TrashIcon />)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
})
