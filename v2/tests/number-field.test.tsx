import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, render } from '@testing-library/react'
import { NumberField } from '@/components/primitives/NumberField'

describe('NumberField', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders with the given value', () => {
    render(<NumberField value={10} min={1} max={30} onChange={vi.fn()} data-testid="nf" />)
    expect((screen.getByTestId('nf') as HTMLInputElement).value).toBe('10')
  })

  it('calls onChange with clamped value when valid number is typed', () => {
    const onChange = vi.fn()
    render(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />)
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '18' } })
    expect(onChange).toHaveBeenCalledWith(18)
  })

  it('does not call onChange when input is empty (intermediate state)', () => {
    const onChange = vi.fn()
    render(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />)
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange for non-numeric input', () => {
    const onChange = vi.fn()
    render(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />)
    fireEvent.change(screen.getByTestId('nf'), { target: { value: 'abc' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clamps value to min', () => {
    const onChange = vi.fn()
    render(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />)
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '0' } })
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('clamps value to max', () => {
    const onChange = vi.fn()
    render(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />)
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '99' } })
    expect(onChange).toHaveBeenCalledWith(30)
  })

  it('restores last valid value on blur when empty', () => {
    render(<NumberField value={10} min={1} max={30} onChange={vi.fn()} data-testid="nf" />)
    const input = screen.getByTestId('nf') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    fireEvent.blur(input)
    expect(input.value).toBe('10')
  })

  it('restores last valid value on blur when non-numeric', () => {
    render(<NumberField value={5} min={1} max={20} onChange={vi.fn()} data-testid="nf" />)
    const input = screen.getByTestId('nf') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'xyz' } })
    fireEvent.blur(input)
    expect(input.value).toBe('5')
  })

  it('syncs to external value changes (update during render)', () => {
    const { rerender } = render(
      <NumberField value={10} min={1} max={30} onChange={vi.fn()} data-testid="nf" />
    )
    rerender(<NumberField value={20} min={1} max={30} onChange={vi.fn()} data-testid="nf" />)
    expect((screen.getByTestId('nf') as HTMLInputElement).value).toBe('20')
  })

  it('does not call onChange when new value equals current value', () => {
    const onChange = vi.fn()
    render(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />)
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '10' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('passes extra props to the input element', () => {
    render(
      <NumberField
        value={5}
        min={0}
        max={10}
        onChange={vi.fn()}
        data-testid="nf"
        aria-label="Test field"
        disabled
      />
    )
    const input = screen.getByTestId('nf') as HTMLInputElement
    expect(input.getAttribute('aria-label')).toBe('Test field')
    expect(input.disabled).toBe(true)
  })
})
