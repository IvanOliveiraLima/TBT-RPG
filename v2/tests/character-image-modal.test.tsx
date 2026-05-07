import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { CharacterImageModal } from '@/components/sheet/parts/CharacterImageModal'
import { renderWithI18n } from './helpers/render'

// Canvas toDataURL returns a stub value in jsdom
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn().mockReturnValue('data:image/jpeg;base64,CANVAS_RESULT'),
  writable: true,
})
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue({
    drawImage: vi.fn(),
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
