import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { CharacterImageModal } from '@/components/sheet/parts/CharacterImageModal'
import { renderWithI18n } from './helpers/render'

// jsdom does not implement pointer capture APIs — stub them globally
HTMLElement.prototype.setPointerCapture = () => {}
HTMLElement.prototype.releasePointerCapture = () => {}

// Canvas stubs — writable so tests can reset or extend them
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn().mockReturnValue('data:image/jpeg;base64,CANVAS_RESULT'),
  writable: true,
})
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    clearRect: vi.fn(),  // required: preview effect calls clearRect before drawImage
  }),
  writable: true,
})

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = 'x'.repeat(sizeBytes)
  return new File([content], name, { type })
}

describe('CharacterImageModal', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { vi.restoreAllMocks() })

  // ── visibility ────────────────────────────────────────────────────────────

  it('renders nothing when isOpen=false', () => {
    const { container } = renderWithI18n(
      <CharacterImageModal isOpen={false} onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when isOpen=true', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    expect(screen.getByTestId('image-modal')).toBeDefined()
  })

  // ── i18n dual-lang ────────────────────────────────────────────────────────

  it('shows title in PT', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    expect(screen.getByTestId('image-modal-title').textContent).toBe('Editar imagem do personagem')
  })

  it('shows title in EN', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'en'
    )
    expect(screen.getByTestId('image-modal-title').textContent).toBe('Edit character image')
  })

  it('shows apply label in PT', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    expect(screen.getByTestId('image-modal-apply').textContent).toBe('Aplicar')
  })

  it('shows cancel label in PT', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    expect(screen.getByTestId('image-modal-cancel').textContent).toBe('Cancelar')
  })

  // ── cancel ────────────────────────────────────────────────────────────────

  it('calls onClose when Cancel button clicked', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <CharacterImageModal isOpen onClose={onClose} onApply={vi.fn()} />, 'pt'
    )
    fireEvent.click(screen.getByTestId('image-modal-cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <CharacterImageModal isOpen onClose={onClose} onApply={vi.fn()} />, 'pt'
    )
    fireEvent.click(screen.getByTestId('image-modal-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does NOT call onClose when clicking inside modal panel', () => {
    const onClose = vi.fn()
    renderWithI18n(
      <CharacterImageModal isOpen onClose={onClose} onApply={vi.fn()} />, 'pt'
    )
    fireEvent.click(screen.getByTestId('image-modal'))
    expect(onClose).not.toHaveBeenCalled()
  })

  // ── file validation: bad format ───────────────────────────────────────────

  it('shows error for unsupported file format', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    const input = screen.getByTestId('image-modal-file-input')
    const gifFile = makeFile('anim.gif', 'image/gif', 100)
    fireEvent.change(input, { target: { files: [gifFile] } })
    expect(screen.getByTestId('image-modal-error').textContent).toBe(
      'Formato não suportado. Use JPG, PNG ou WebP.'
    )
  })

  it('shows error for unsupported format in EN', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'en'
    )
    const input = screen.getByTestId('image-modal-file-input')
    const gifFile = makeFile('anim.gif', 'image/gif', 100)
    fireEvent.change(input, { target: { files: [gifFile] } })
    expect(screen.getByTestId('image-modal-error').textContent).toBe(
      'Unsupported format. Use JPG, PNG, or WebP.'
    )
  })

  // ── file validation: too large ────────────────────────────────────────────

  it('shows error for file exceeding 2 MB', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    const input = screen.getByTestId('image-modal-file-input')
    const bigFile = makeFile('big.png', 'image/png', 2 * 1024 * 1024 + 1)
    fireEvent.change(input, { target: { files: [bigFile] } })
    expect(screen.getByTestId('image-modal-error').textContent).toBe(
      'Imagem excede o limite de 2 MB'
    )
  })

  it('shows too-large error in EN', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'en'
    )
    const input = screen.getByTestId('image-modal-file-input')
    const bigFile = makeFile('big.png', 'image/png', 2 * 1024 * 1024 + 1)
    fireEvent.change(input, { target: { files: [bigFile] } })
    expect(screen.getByTestId('image-modal-error').textContent).toBe(
      'Image exceeds 2 MB limit'
    )
  })

  // ── apply disabled without image ──────────────────────────────────────────

  it('Apply button is disabled when no image loaded', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    const applyBtn = screen.getByTestId('image-modal-apply') as HTMLButtonElement
    expect(applyBtn.disabled).toBe(true)
  })

  it('does not call onApply when Apply clicked without image', () => {
    const onApply = vi.fn()
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={onApply} />, 'pt'
    )
    fireEvent.click(screen.getByTestId('image-modal-apply'))
    expect(onApply).not.toHaveBeenCalled()
  })

  // ── zoom slider ───────────────────────────────────────────────────────────

  it('zoom slider is not shown before an image is loaded', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    expect(screen.queryByTestId('image-modal-zoom')).toBeNull()
  })

  // ── file input accept attribute ───────────────────────────────────────────

  it('file input accepts jpg, jpeg, png, webp extensions', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    const input = screen.getByTestId('image-modal-file-input') as HTMLInputElement
    expect(input.accept).toContain('.jpg')
    expect(input.accept).toContain('.png')
    expect(input.accept).toContain('.webp')
  })
})

// ── Canvas-based preview tests ─────────────────────────────────────────────────
//
// These tests need Image + FileReader mocks to trigger the image-load flow.
// MockImage fires onload synchronously on src assignment — no async waiting needed.

const OriginalImage = window.Image

/** Returns an Image whose onload fires synchronously when src is set. */
function mockImageWithDimensions(naturalWidth: number, naturalHeight: number) {
  // @ts-expect-error replacing browser class with mock
  window.Image = class MockImage {
    naturalWidth = naturalWidth
    naturalHeight = naturalHeight
    onload: (() => void) | null = null
    private _src = ''
    get src() { return this._src }
    set src(url: string) {
      this._src = url
      this.onload?.()
    }
  }
}

/** Stubs FileReader so readAsDataURL fires onload synchronously. */
function stubFileReader(fakeUrl = 'data:image/jpeg;base64,abc') {
  vi.stubGlobal('FileReader', class {
    onload: ((e: ProgressEvent<FileReader>) => void) | null = null
    readAsDataURL() {
      this.onload?.({ target: { result: fakeUrl } } as unknown as ProgressEvent<FileReader>)
    }
  })
}

/** Loads a test JPEG into the rendered modal and waits for effects to flush. */
async function loadTestImage(naturalWidth = 800, naturalHeight = 600) {
  mockImageWithDimensions(naturalWidth, naturalHeight)
  stubFileReader()
  const input = screen.getByTestId('image-modal-file-input') as HTMLInputElement
  const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } })
  })
}

describe('CharacterImageModal — canvas rendering', () => {
  beforeEach(() => {
    // Clear all vi.fn() call histories so each test starts fresh
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.Image = OriginalImage
  })

  // ── dimensions ──────────────────────────────────────────────────────────────

  it('canvas has fixed 320×320 HTML dimensions', () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    const canvas = screen.getByTestId('image-modal-canvas') as HTMLCanvasElement
    expect(canvas.width).toBe(320)
    expect(canvas.height).toBe(320)
  })

  // ── drawImage called after load ──────────────────────────────────────────────

  it('calls drawImage on canvas context after image loads', async () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    await loadTestImage()
    const ctx = (screen.getByTestId('image-modal-canvas') as HTMLCanvasElement).getContext('2d') as unknown as { drawImage: ReturnType<typeof vi.fn> }
    expect(ctx.drawImage).toHaveBeenCalled()
  })

  // ── aspect ratio ────────────────────────────────────────────────────────────

  it('preserves 4:3 aspect ratio at zoom 1x', async () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    await loadTestImage(800, 600)  // 4:3

    const ctx = (screen.getByTestId('image-modal-canvas') as HTMLCanvasElement).getContext('2d') as unknown as { drawImage: ReturnType<typeof vi.fn> }
    // drawImage(image, drawX, drawY, drawW, drawH)
    const lastCall = ctx.drawImage.mock.calls.at(-1) as number[]
    const drawW = lastCall[3]!
    const drawH = lastCall[4]!
    expect(drawW / drawH).toBeCloseTo(800 / 600, 5)
  })

  it('preserves 4:3 aspect ratio at zoom 2x', async () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    await loadTestImage(800, 600)

    await act(async () => {
      fireEvent.change(screen.getByTestId('image-modal-zoom'), { target: { value: '2' } })
    })

    const ctx = (screen.getByTestId('image-modal-canvas') as HTMLCanvasElement).getContext('2d') as unknown as { drawImage: ReturnType<typeof vi.fn> }
    const lastCall = ctx.drawImage.mock.calls.at(-1) as number[]
    expect(lastCall[3]! / lastCall[4]!).toBeCloseTo(800 / 600, 5)
  })

  it('draw size doubles when zoom goes from 1x to 2x', async () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    await loadTestImage()

    const ctx = (screen.getByTestId('image-modal-canvas') as HTMLCanvasElement).getContext('2d') as unknown as { drawImage: ReturnType<typeof vi.fn> }
    const drawW1 = (ctx.drawImage.mock.calls.at(-1) as number[])[3]!

    await act(async () => {
      fireEvent.change(screen.getByTestId('image-modal-zoom'), { target: { value: '2' } })
    })

    const drawW2 = (ctx.drawImage.mock.calls.at(-1) as number[])[3]!
    expect(drawW2).toBeCloseTo(drawW1 * 2, 1)
  })

  // ── drag (pointer events) ────────────────────────────────────────────────────

  it('pointerdown+pointermove triggers additional redraws', async () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    await loadTestImage()

    const ctx = (screen.getByTestId('image-modal-canvas') as HTMLCanvasElement).getContext('2d') as unknown as { drawImage: ReturnType<typeof vi.fn> }
    const callsBefore = ctx.drawImage.mock.calls.length

    const canvas = screen.getByTestId('image-modal-canvas')
    await act(async () => {
      fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: 1 })
      fireEvent.pointerMove(canvas, { clientX: 150, clientY: 130, pointerId: 1 })
      fireEvent.pointerUp(canvas, { pointerId: 1 })
    })

    expect(ctx.drawImage.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('canvas has touch-action none style', () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    const canvas = screen.getByTestId('image-modal-canvas') as HTMLCanvasElement
    expect(canvas.style.touchAction).toBe('none')
  })

  // ── apply ───────────────────────────────────────────────────────────────────

  it('apply calls onApply with jpeg data URL and calls onClose', async () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    renderWithI18n(<CharacterImageModal isOpen onClose={onClose} onApply={onApply} />, 'pt')
    await loadTestImage()

    await act(async () => {
      fireEvent.click(screen.getByTestId('image-modal-apply'))
    })

    expect(onApply).toHaveBeenCalledWith('data:image/jpeg;base64,CANVAS_RESULT')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('apply renders into a 600×600 output canvas', async () => {
    renderWithI18n(<CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt')
    await loadTestImage()

    const origCreate = document.createElement.bind(document)
    let capturedCanvas: HTMLCanvasElement | null = null
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag)
      if (tag === 'canvas') capturedCanvas = el as HTMLCanvasElement
      return el
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('image-modal-apply'))
    })

    expect(capturedCanvas?.width).toBe(600)
    expect(capturedCanvas?.height).toBe(600)
  })

  // ── reset on remount ────────────────────────────────────────────────────────
  // State reset is handled by LoreHero via key prop — each open increments the
  // key, forcing React to remount CharacterImageModal with fresh state.
  // Here we verify that a freshly mounted component (no image loaded) hides zoom.

  it('zoom slider is hidden on fresh mount (no image loaded)', () => {
    renderWithI18n(
      <CharacterImageModal isOpen onClose={vi.fn()} onApply={vi.fn()} />, 'pt'
    )
    expect(screen.queryByTestId('image-modal-zoom')).toBeNull()
  })
})
