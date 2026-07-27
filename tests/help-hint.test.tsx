import { describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { HelpHint } from '@/components/HelpHint'
import { renderWithI18n } from './helpers/render'

beforeEach(() => { localStorage.clear() })

describe('HelpHint — trigger renders', () => {
  it('renders a button trigger', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    expect(screen.getByTestId('help-hint-trigger')).toBeDefined()
  })

  it('trigger has aria-label "Show help" in EN', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    expect(screen.getByLabelText('Show help')).toBeDefined()
  })

  it('trigger has aria-label "Mostrar ajuda" in PT', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'pt')
    expect(screen.getByLabelText('Mostrar ajuda')).toBeDefined()
  })

  it('uses ariaLabelKey when provided', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" ariaLabelKey="help.aria_open" />, 'en')
    expect(screen.getByLabelText('Show help')).toBeDefined()
  })
})

describe('HelpHint — open / close', () => {
  it('tooltip is not in the document initially', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('clicking trigger opens the tooltip with the translated text', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    const tooltip = document.body.querySelector('[role="tooltip"]')
    expect(tooltip).not.toBeNull()
    expect(tooltip!.textContent).toContain("player's initiative roll")
  })

  it('tooltip appears in document.body (portal)', () => {
    const { baseElement } = renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    const tooltip = document.body.querySelector('[role="tooltip"]')
    expect(tooltip).not.toBeNull()
    // tooltip IS inside baseElement (document.body) as a portal
    expect(baseElement.contains(tooltip)).toBe(true)
  })

  it('clicking trigger again closes the tooltip', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    const btn = screen.getByTestId('help-hint-trigger')
    fireEvent.click(btn)
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
    fireEvent.click(btn)
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('pressing Esc closes the tooltip', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('click outside closes the tooltip', () => {
    renderWithI18n(
      <div>
        <HelpHint textKey="initiative.auto_initiative_hint" />
        <button data-testid="outside">outside</button>
      </div>,
      'en'
    )
    fireEvent.click(screen.getByTestId('help-hint-trigger'))
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
    // mousedown outside the trigger and popover
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('opening the hint does NOT immediately close it (click that opens is not captured by click-outside)', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    // Simulate a realistic sequence: mousedown then click on the trigger
    const btn = screen.getByTestId('help-hint-trigger')
    fireEvent.mouseDown(btn)
    fireEvent.click(btn)
    // Should still be open — mousedown on the trigger itself must not close
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
  })
})

describe('HelpHint — aria attributes', () => {
  it('aria-expanded is false when closed', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    const btn = screen.getByTestId('help-hint-trigger')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('aria-expanded is true when open', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    const btn = screen.getByTestId('help-hint-trigger')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('aria-describedby points to tooltip id when open', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    const btn = screen.getByTestId('help-hint-trigger')
    fireEvent.click(btn)
    const tooltip = document.body.querySelector('[role="tooltip"]')!
    expect(btn.getAttribute('aria-describedby')).toBe(tooltip.id)
  })

  it('aria-describedby is absent when closed', () => {
    renderWithI18n(<HelpHint textKey="initiative.auto_initiative_hint" />, 'en')
    const btn = screen.getByTestId('help-hint-trigger')
    expect(btn.getAttribute('aria-describedby')).toBeNull()
  })
})
