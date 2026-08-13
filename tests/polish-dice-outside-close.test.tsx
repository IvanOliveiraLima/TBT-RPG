/**
 * DicePanel — click-outside close behaviour
 *
 * Covers:
 * - mousedown outside closes (the basic case)
 * - mousedown inside each panel button does NOT close
 * - TWO panel instances mounted (replicates SheetLayout's twin-shell setup):
 *   clicking any button of the first panel must NOT close (Fix 0 — sibling-panel guard)
 * - [data-dice-ui] cluster: mousedown on it does NOT close (Fix 1 — mode selector etc.)
 * - [role="tooltip"]: mousedown does NOT close (Fix 2 — HelpHint portal)
 * - Shells: cluster container has data-dice-ui; standalone FABs also have it
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { DicePanel } from '@/components/dice/DicePanel'
import { useDiceStore } from '@/store/useDiceStore'
vi.mock('@/domain/dice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/dice')>()
  return { ...actual, roll: vi.fn().mockReturnValue({
    id: 'r1', notation: 'd20', dice: [{ sides: 20, value: 10, kept: true }],
    modifier: 0, total: 10, mode: 'normal' as const, crit: null, at: Date.now(),
  }) }
})

vi.mock('@/services/sync', () => ({
  scheduleEditSync: vi.fn(),
  startPeriodicSync: vi.fn(),
  stopPeriodicSync: vi.fn(),
}))

vi.mock('@/store/characters', () => ({
  useCharactersStore: vi.fn(() => ({ characters: [], loading: false, error: null })),
}))

describe('DicePanel — click-outside close behaviour', () => {
  beforeEach(() => {
    useDiceStore.setState({ history: [], lastResult: null })
  })

  /* ── basic ── */

  it('mousedown outside the panel calls onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <div data-testid="outside">outside</div>
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('mousedown inside the panel does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(<DicePanel onClose={onClose} />, 'en')
    fireEvent.mouseDown(screen.getByTestId('dice-panel'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('mousedown on the roll button (inside panel) does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(<DicePanel onClose={onClose} />, 'en')
    fireEvent.mouseDown(screen.getByTestId('roll-btn'))
    expect(onClose).not.toHaveBeenCalled()
  })

  /* ── Fix 0: twin-instance (SheetLayout mounts MobileShell + DesktopShell simultaneously) ── */

  it('TWO panels mounted: mousedown inside the first panel does NOT close (sibling guard)', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <DicePanel onClose={onClose} />
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    // Both panels share the same data-testid; getAllByTestId gives [first, second]
    const [firstPanel] = screen.getAllByTestId('dice-panel')
    fireEvent.mouseDown(firstPanel)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('TWO panels: mousedown on roll-btn of first panel does NOT close either', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <DicePanel onClose={onClose} />
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    const [firstRollBtn] = screen.getAllByTestId('roll-btn')
    fireEvent.mouseDown(firstRollBtn)
    expect(onClose).not.toHaveBeenCalled()
  })

  /* ── Fix 1: [data-dice-ui] cluster guard ── */

  it('mousedown on [data-dice-ui] element does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <div data-dice-ui data-testid="cluster">
          <button data-testid="mode-btn">N</button>
        </div>
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    fireEvent.mouseDown(screen.getByTestId('cluster'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('mousedown on a child of [data-dice-ui] (mode button) does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <div data-dice-ui>
          <button data-testid="mode-btn">N</button>
        </div>
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    fireEvent.mouseDown(screen.getByTestId('mode-btn'))
    expect(onClose).not.toHaveBeenCalled()
  })

  /* ── Fix 2: [role="tooltip"] portal guard ── */

  it('mousedown on [role="tooltip"] element (HelpHint portal) does NOT call onClose', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <div>
        <div role="tooltip" data-testid="tooltip">Help text</div>
        <DicePanel onClose={onClose} />
      </div>,
      'en',
    )
    fireEvent.mouseDown(screen.getByTestId('tooltip'))
    expect(onClose).not.toHaveBeenCalled()
  })

  /* ── Shell source markers (static attribute check, no full shell mount) ── */

  it('MobileShell source has data-dice-ui on the cluster container', async () => {
    const src = await import('../src/components/sheet/MobileShell?raw')
    expect((src as unknown as { default: string }).default).toContain('data-dice-ui')
  })

  it('DesktopShell source has data-dice-ui on the cluster container', async () => {
    const src = await import('../src/components/sheet/DesktopShell?raw')
    expect((src as unknown as { default: string }).default).toContain('data-dice-ui')
  })

  it('MobileShell source has no orphaned data-dice-toggle', async () => {
    const src = await import('../src/components/sheet/MobileShell?raw')
    expect((src as unknown as { default: string }).default).not.toContain('data-dice-toggle')
  })

  it('DesktopShell source has no orphaned data-dice-toggle', async () => {
    const src = await import('../src/components/sheet/DesktopShell?raw')
    expect((src as unknown as { default: string }).default).not.toContain('data-dice-toggle')
  })
})
