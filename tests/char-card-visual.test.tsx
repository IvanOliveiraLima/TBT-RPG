/**
 * Tests for CharCardVisual — purely presentational character card.
 */
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { CharCardVisual } from '@/components/character/CharCardVisual'
import { renderWithI18n } from './helpers/render'

// CharCardVisual has no i18n keys itself, but renderWithI18n is the project-standard
// wrapper. Using 'en' avoids any locale detection noise.

describe('CharCardVisual', () => {
  it('renders the character name', () => {
    renderWithI18n(<CharCardVisual name="Aragorn" />, 'en')
    expect(screen.getByText('Aragorn')).toBeDefined()
  })

  it('renders a placeholder with the first letter of the name when no portrait', () => {
    renderWithI18n(<CharCardVisual name="Gandalf" />, 'en')
    const portrait = screen.getByTestId('char-card-visual-portrait')
    expect(portrait).toBeDefined()
    // The first letter is rendered as text inside the portrait div
    expect(portrait.textContent).toContain('G')
  })

  it('does NOT render text content for the first letter when portraitData is provided', () => {
    renderWithI18n(
      <CharCardVisual name="Legolas" portraitData="data:image/png;base64,abc" />,
      'en',
    )
    const portrait = screen.getByTestId('char-card-visual-portrait')
    // When portraitData is present the first-letter fallback is suppressed
    // (the conditional `!portraitData &&` means no text node is rendered)
    // The portrait background is set via inline style; portrait div has no letter text
    expect(portrait.textContent?.trim()).toBe('')
  })

  it('renders level badge when totalLevel is provided', () => {
    renderWithI18n(<CharCardVisual name="Legolas" totalLevel={5} />, 'en')
    expect(screen.getByTestId('char-card-visual-level-badge')).toBeDefined()
    expect(screen.getByTestId('char-card-visual-level-badge').textContent).toBe('5')
  })

  it('does NOT render level badge when totalLevel is null', () => {
    renderWithI18n(<CharCardVisual name="Legolas" totalLevel={null} />, 'en')
    expect(screen.queryByTestId('char-card-visual-level-badge')).toBeNull()
  })

  it('does NOT render level badge when totalLevel is undefined', () => {
    renderWithI18n(<CharCardVisual name="Legolas" />, 'en')
    expect(screen.queryByTestId('char-card-visual-level-badge')).toBeNull()
  })

  it('renders HP bar when hpCurrent and hpMax are provided', () => {
    renderWithI18n(<CharCardVisual name="Aragorn" hpCurrent={30} hpMax={45} />, 'en')
    expect(screen.getByTestId('char-card-visual-hp-bar')).toBeDefined()
  })

  it('does NOT render HP bar when no HP data', () => {
    renderWithI18n(<CharCardVisual name="Aragorn" />, 'en')
    expect(screen.queryByTestId('char-card-visual-hp-bar')).toBeNull()
  })

  it('renders HP current and max text when HP data is provided', () => {
    renderWithI18n(<CharCardVisual name="Aragorn" hpCurrent={30} hpMax={45} />, 'en')
    // HP current is rendered as text alongside /max
    expect(screen.getByText('30')).toBeDefined()
    expect(screen.getByText('/45')).toBeDefined()
  })

  it('renders owner label when ownerLabel is provided', () => {
    renderWithI18n(
      <CharCardVisual name="Aragorn" ownerLabel="Player: Alice" />,
      'en',
    )
    expect(screen.getByText('Player: Alice')).toBeDefined()
  })

  it('does NOT render owner label when ownerLabel is not provided', () => {
    renderWithI18n(<CharCardVisual name="Aragorn" />, 'en')
    expect(screen.queryByText(/Player:/)).toBeNull()
  })

  it('renders HP skeleton when isLoading=true and no HP data', () => {
    renderWithI18n(<CharCardVisual name="Aragorn" isLoading={true} />, 'en')
    expect(screen.getByTestId('char-card-visual-hp-skeleton')).toBeDefined()
  })

  it('does NOT render HP skeleton when isLoading=true but HP data is present', () => {
    renderWithI18n(
      <CharCardVisual name="Aragorn" isLoading={true} hpCurrent={20} hpMax={45} />,
      'en',
    )
    expect(screen.queryByTestId('char-card-visual-hp-skeleton')).toBeNull()
    // HP bar is shown instead
    expect(screen.getByTestId('char-card-visual-hp-bar')).toBeDefined()
  })

  it('renders race and class labels when provided', () => {
    renderWithI18n(
      <CharCardVisual name="Aragorn" raceLabel="Human" classLabel="Ranger 5" />,
      'en',
    )
    expect(screen.getByText('Human')).toBeDefined()
    expect(screen.getByText('Ranger 5')).toBeDefined()
  })

  it('renders portrait div with correct background when portraitData is provided', () => {
    const src = 'data:image/png;base64,abc123'
    renderWithI18n(<CharCardVisual name="Legolas" portraitData={src} />, 'en')
    const portrait = screen.getByTestId('char-card-visual-portrait')
    expect(portrait.getAttribute('style')).toContain(src)
  })
})
