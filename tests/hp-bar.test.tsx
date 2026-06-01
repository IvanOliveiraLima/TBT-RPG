import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HpBar } from '@/components/sheet/parts/HpBar'

describe('HpBar', () => {
  beforeEach(() => { localStorage.clear() })

  // ── basic render ──────────────────────────────────────────────────────────

  it('renders the bar element', () => {
    render(<HpBar current={50} max={50} />)
    expect(screen.getByTestId('hp-bar')).toBeDefined()
  })

  it('renders the fill element', () => {
    render(<HpBar current={50} max={50} />)
    expect(screen.getByTestId('hp-bar-fill')).toBeDefined()
  })

  it('does not render temp div when temp is 0', () => {
    render(<HpBar current={50} max={50} temp={0} />)
    expect(screen.queryByTestId('hp-bar-temp')).toBeNull()
  })

  // ── temp overlay ──────────────────────────────────────────────────────────

  it('renders temp div when temp > 0', () => {
    render(<HpBar current={50} max={50} temp={10} />)
    expect(screen.getByTestId('hp-bar-temp')).toBeDefined()
  })

  it('HP fill width accounts for temp HP (effectiveMax = max + temp)', () => {
    // current=50, max=50, temp=10 → effectiveMax=60 → fill = 50/60 ≈ 83.33%
    render(<HpBar current={50} max={50} temp={10} />)
    const fill = screen.getByTestId('hp-bar-fill') as HTMLElement
    const width = fill.style.width
    const pct = parseFloat(width)
    expect(pct).toBeCloseTo(83.33, 1)
  })

  it('temp overlay width equals temp / effectiveMax', () => {
    // current=50, max=50, temp=10 → temp width = 10/60 ≈ 16.67%
    render(<HpBar current={50} max={50} temp={10} />)
    const tempDiv = screen.getByTestId('hp-bar-temp') as HTMLElement
    const width = parseFloat(tempDiv.style.width)
    expect(width).toBeCloseTo(16.67, 1)
  })

  it('HP fill + temp overlay together reach 100%', () => {
    render(<HpBar current={30} max={50} temp={10} />)
    const fillPct = parseFloat((screen.getByTestId('hp-bar-fill') as HTMLElement).style.width)
    const tempPct = parseFloat((screen.getByTestId('hp-bar-temp') as HTMLElement).style.width)
    expect(fillPct + tempPct).toBeCloseTo(66.67, 1)  // (30+10)/60
  })

  it('HP fill is 0% when current is 0 (temp still shows)', () => {
    render(<HpBar current={0} max={50} temp={10} />)
    const fillPct = parseFloat((screen.getByTestId('hp-bar-fill') as HTMLElement).style.width)
    expect(fillPct).toBe(0)
    expect(screen.getByTestId('hp-bar-temp')).toBeDefined()
  })

  // ── low HP detection ──────────────────────────────────────────────────────

  it('data-low is true when current < 30% of max (ignores temp)', () => {
    // current=5, max=50 → 10% → low. temp=30 doesn't change this.
    render(<HpBar current={5} max={50} temp={30} />)
    expect(screen.getByTestId('hp-bar-fill').getAttribute('data-low')).toBe('true')
  })

  it('data-low is false when current >= 30% of max', () => {
    render(<HpBar current={50} max={50} temp={10} />)
    expect(screen.getByTestId('hp-bar-fill').getAttribute('data-low')).toBe('false')
  })

  // ── edge cases ────────────────────────────────────────────────────────────

  it('handles max=0 gracefully (no division by zero)', () => {
    render(<HpBar current={0} max={0} />)
    const fill = screen.getByTestId('hp-bar-fill') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })
})
