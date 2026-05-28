import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { AlignmentSelect } from '@/components/sheet/parts/AlignmentSelect'
import { renderWithI18n } from './helpers/render'

describe('AlignmentSelect', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders with current canonical value selected', () => {
    renderWithI18n(<AlignmentSelect value="Neutral Good" onChange={vi.fn()} />, 'pt')
    const sel = screen.getByTestId('alignment-select') as HTMLSelectElement
    expect(sel.value).toBe('Neutral Good')
  })

  it('renders empty option when value is empty string', () => {
    renderWithI18n(<AlignmentSelect value="" onChange={vi.fn()} />, 'pt')
    const sel = screen.getByTestId('alignment-select') as HTMLSelectElement
    expect(sel.value).toBe('')
  })

  it('has 10 options for canonical value (9 canonical + unselected)', () => {
    renderWithI18n(<AlignmentSelect value="Neutral Good" onChange={vi.fn()} />, 'pt')
    const sel = screen.getByTestId('alignment-select') as HTMLSelectElement
    expect(sel.options.length).toBe(10)
  })

  it('calls onChange when canonical value selected', () => {
    const onChange = vi.fn()
    renderWithI18n(<AlignmentSelect value="Neutral Good" onChange={onChange} />, 'pt')
    fireEvent.change(screen.getByTestId('alignment-select'), { target: { value: 'Chaotic Good' } })
    expect(onChange).toHaveBeenCalledWith('Chaotic Good')
  })

  it('does not call onChange when disabled __custom__ option is triggered', () => {
    const onChange = vi.fn()
    renderWithI18n(
      <AlignmentSelect value="Lawful Awesome" onChange={onChange} />, 'pt'
    )
    fireEvent.change(screen.getByTestId('alignment-select'), { target: { value: '__custom__' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows custom value as disabled option when non-canonical', () => {
    renderWithI18n(
      <AlignmentSelect value="Lawful Awesome" onChange={vi.fn()} />, 'pt'
    )
    const customOpt = screen.getByTestId('alignment-custom-option')
    expect(customOpt.textContent).toContain('Lawful Awesome')
    expect((customOpt as HTMLOptionElement).disabled).toBe(true)
  })

  it('has 11 options when value is non-canonical (9 + unselected + custom)', () => {
    renderWithI18n(
      <AlignmentSelect value="Lawful Awesome" onChange={vi.fn()} />, 'pt'
    )
    const sel = screen.getByTestId('alignment-select') as HTMLSelectElement
    expect(sel.options.length).toBe(11)
  })

  it('calls onChange with empty string when unselected option chosen', () => {
    const onChange = vi.fn()
    renderWithI18n(<AlignmentSelect value="Neutral Good" onChange={onChange} />, 'pt')
    fireEvent.change(screen.getByTestId('alignment-select'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('applies dark-select CSS class for dark theme option list', () => {
    const { container } = renderWithI18n(
      <AlignmentSelect value="Neutral Good" onChange={vi.fn()} />, 'pt'
    )
    const sel = container.querySelector('[data-testid="alignment-select"]') as HTMLSelectElement
    expect(sel.classList.contains('dark-select')).toBe(true)
  })
})
