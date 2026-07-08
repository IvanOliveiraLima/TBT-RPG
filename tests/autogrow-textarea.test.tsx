import { render, screen, fireEvent } from '@testing-library/react'
import { AutoGrowTextarea } from '@/components/primitives/AutoGrowTextarea'

describe('AutoGrowTextarea', () => {
  it('renders a textarea element', () => {
    render(<AutoGrowTextarea value="hello" onChange={() => {}} readOnly />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('forwards value prop', () => {
    render(<AutoGrowTextarea value="test content" onChange={() => {}} readOnly />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.value).toBe('test content')
  })

  it('forwards data-testid', () => {
    render(<AutoGrowTextarea value="" onChange={() => {}} data-testid="my-textarea" readOnly />)
    expect(screen.getByTestId('my-textarea')).toBeDefined()
  })

  it('forwards aria-label', () => {
    render(<AutoGrowTextarea value="" onChange={() => {}} aria-label="Description field" readOnly />)
    expect(screen.getByRole('textbox', { name: 'Description field' })).toBeDefined()
  })

  it('calls onChange when user types', () => {
    const handleChange = vi.fn()
    render(<AutoGrowTextarea value="" onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('applies resize:none and overflow:hidden styles', () => {
    render(<AutoGrowTextarea value="" onChange={() => {}} readOnly />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.style.resize).toBe('none')
    expect(el.style.overflow).toBe('hidden')
  })

  it('merges custom style without losing resize:none/overflow:hidden', () => {
    render(<AutoGrowTextarea value="" onChange={() => {}} style={{ color: 'red' }} readOnly />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.style.resize).toBe('none')
    expect(el.style.overflow).toBe('hidden')
    expect(el.style.color).toBe('red')
  })

  it('uses rows=2 as default minimum', () => {
    render(<AutoGrowTextarea value="" onChange={() => {}} readOnly />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.rows).toBe(2)
  })

  it('forwards custom rows', () => {
    render(<AutoGrowTextarea value="" onChange={() => {}} rows={4} readOnly />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.rows).toBe(4)
  })

  it('forwards readOnly prop', () => {
    render(<AutoGrowTextarea value="locked" onChange={() => {}} readOnly />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.readOnly).toBe(true)
  })

  it('forwards placeholder prop', () => {
    render(<AutoGrowTextarea value="" onChange={() => {}} placeholder="Enter text…" readOnly />)
    const el = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(el.placeholder).toBe('Enter text…')
  })
})
