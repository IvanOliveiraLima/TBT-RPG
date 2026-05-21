import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { NumberField } from '@/components/primitives/NumberField'
import { I18nProvider } from '@/i18n'
import { renderWithI18n } from './helpers/render'

describe('NumberField', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders with the given value', () => {
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={vi.fn()} data-testid="nf" />, 'en')
    expect((screen.getByTestId('nf') as HTMLInputElement).value).toBe('10')
  })

  it('calls onChange with clamped value when valid number is typed', () => {
    const onChange = vi.fn()
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />, 'en')
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '18' } })
    expect(onChange).toHaveBeenCalledWith(18)
  })

  it('does not call onChange when input is empty (intermediate state)', () => {
    const onChange = vi.fn()
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />, 'en')
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange for non-numeric input', () => {
    const onChange = vi.fn()
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />, 'en')
    fireEvent.change(screen.getByTestId('nf'), { target: { value: 'abc' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clamps value to min', () => {
    const onChange = vi.fn()
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />, 'en')
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '0' } })
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('clamps value to max', () => {
    const onChange = vi.fn()
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />, 'en')
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '99' } })
    expect(onChange).toHaveBeenCalledWith(30)
  })

  it('restores last valid value on blur when empty', () => {
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={vi.fn()} data-testid="nf" />, 'en')
    const input = screen.getByTestId('nf') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    fireEvent.blur(input)
    expect(input.value).toBe('10')
  })

  it('restores last valid value on blur when non-numeric', () => {
    renderWithI18n(<NumberField value={5} min={1} max={20} onChange={vi.fn()} data-testid="nf" />, 'en')
    const input = screen.getByTestId('nf') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'xyz' } })
    fireEvent.blur(input)
    expect(input.value).toBe('5')
  })

  it('syncs to external value changes (update during render)', () => {
    const { rerender } = renderWithI18n(
      <NumberField value={10} min={1} max={30} onChange={vi.fn()} data-testid="nf" />, 'en'
    )
    // Must re-wrap with I18nProvider since renderWithI18n's rerender doesn't auto-wrap
    rerender(
      <I18nProvider>
        <NumberField value={20} min={1} max={30} onChange={vi.fn()} data-testid="nf" />
      </I18nProvider>
    )
    expect((screen.getByTestId('nf') as HTMLInputElement).value).toBe('20')
  })

  it('does not call onChange when new value equals current value', () => {
    const onChange = vi.fn()
    renderWithI18n(<NumberField value={10} min={1} max={30} onChange={onChange} data-testid="nf" />, 'en')
    fireEvent.change(screen.getByTestId('nf'), { target: { value: '10' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('passes extra props to the input element', () => {
    renderWithI18n(
      <NumberField
        value={5}
        min={0}
        max={10}
        onChange={vi.fn()}
        data-testid="nf"
        aria-label="Test field"
        disabled
      />,
      'en',
    )
    const input = screen.getByTestId('nf') as HTMLInputElement
    expect(input.getAttribute('aria-label')).toBe('Test field')
    expect(input.disabled).toBe(true)
  })
})

describe('NumberField — steppers', () => {
  beforeEach(() => { localStorage.clear() })

  it('does not render stepper buttons by default', () => {
    const { container } = renderWithI18n(
      <NumberField value={5} min={0} max={10} onChange={vi.fn()} data-testid="nf" />,
      'en',
    )
    expect(container.querySelectorAll('button').length).toBe(0)
  })

  it('renders decrement and increment buttons when showSteppers is true (EN)', () => {
    renderWithI18n(
      <NumberField value={5} min={0} max={10} onChange={vi.fn()} data-testid="nf" showSteppers />,
      'en',
    )
    expect(screen.getByRole('button', { name: 'Decrement' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Increment' })).toBeDefined()
  })

  it('renders decrement and increment buttons with PT labels (PT)', () => {
    renderWithI18n(
      <NumberField value={5} min={0} max={10} onChange={vi.fn()} data-testid="nf" showSteppers />,
      'pt',
    )
    expect(screen.getByRole('button', { name: 'Diminuir' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeDefined()
  })

  it('decrement button decreases value by 1', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <NumberField value={5} min={0} max={10} onChange={onChange} data-testid="nf" showSteppers />,
      'en',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Decrement' }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('increment button increases value by 1', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <NumberField value={5} min={0} max={10} onChange={onChange} data-testid="nf" showSteppers />,
      'en',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Increment' }))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('decrement button is disabled when value equals min', () => {
    renderWithI18n(
      <NumberField value={0} min={0} max={10} onChange={vi.fn()} data-testid="nf" showSteppers />,
      'en',
    )
    expect((screen.getByRole('button', { name: 'Decrement' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('increment button is disabled when value equals max', () => {
    renderWithI18n(
      <NumberField value={10} min={0} max={10} onChange={vi.fn()} data-testid="nf" showSteppers />,
      'en',
    )
    expect((screen.getByRole('button', { name: 'Increment' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('clicking decrement at min does not call onChange', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <NumberField value={0} min={0} max={10} onChange={onChange} data-testid="nf" showSteppers />,
      'en',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Decrement' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clicking increment at max does not call onChange', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <NumberField value={10} min={0} max={10} onChange={onChange} data-testid="nf" showSteppers />,
      'en',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Increment' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('both stepper buttons are disabled when field is disabled', () => {
    renderWithI18n(
      <NumberField value={5} min={0} max={10} onChange={vi.fn()} data-testid="nf" showSteppers disabled />,
      'en',
    )
    expect((screen.getByRole('button', { name: 'Decrement' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Increment' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
