import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HelpIcon } from '@/components/icons'

describe('HelpIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<HelpIcon />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('respects size prop', () => {
    const { container } = render(<HelpIcon size={20} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('20')
    expect(svg.getAttribute('height')).toBe('20')
  })
})
