import type React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from '@/i18n'

const VIEWPORT_W = 320
const VIEWPORT_H = 320
const OUTPUT_SIZE = 600
const MAX_FILE_BYTES = 2 * 1024 * 1024  // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

export interface CharacterImageModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (dataUrl: string) => void
  initialImage?: string
}

export function CharacterImageModal({ isOpen, onClose, onApply, initialImage }: CharacterImageModalProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const draggingRef = useRef<{ startX: number; startY: number } | null>(null)

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [baseScale, setBaseScale] = useState(1)
  const [zoomFactor, setZoomFactor] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadImageUrl = useCallback((url: string) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(VIEWPORT_W / img.naturalWidth, VIEWPORT_H / img.naturalHeight)
      setBaseScale(scale)
      setZoomFactor(1)
      setOffset({ x: 0, y: 0 })
      setImage(img)
    }
    img.src = url
  }, [])

  // Load initial image when modal opens.
  // State reset is handled by the parent via key prop — a new key forces
  // React to remount the component, giving fresh state on each open.
  useEffect(() => {
    if (isOpen && initialImage) loadImageUrl(initialImage)
  }, [isOpen, initialImage, loadImageUrl])

  // Draw preview on canvas whenever image / zoom / offset changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H)

    const scale = baseScale * zoomFactor
    const drawW = image.naturalWidth * scale
    const drawH = image.naturalHeight * scale
    const drawX = (VIEWPORT_W - drawW) / 2 + offset.x
    const drawY = (VIEWPORT_H - drawH) / 2 + offset.y

    ctx.drawImage(image, drawX, drawY, drawW, drawH)
  }, [image, baseScale, zoomFactor, offset])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t('image.modal.error.bad_format'))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t('image.modal.error.too_large'))
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      loadImageUrl(url)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [t, loadImageUrl])

  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = {
      startX: e.clientX - offset.x,
      startY: e.clientY - offset.y,
    }
    setIsDragging(true)
    e.preventDefault()
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return
    setOffset({
      x: e.clientX - draggingRef.current.startX,
      y: e.clientY - draggingRef.current.startY,
    })
  }

  const endDrag = () => {
    draggingRef.current = null
    setIsDragging(false)
  }

  const onZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomFactor(Number(e.target.value))
  }

  // Apply: render the same transformation at OUTPUT_SIZE resolution
  const handleApply = () => {
    if (!image) return

    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = OUTPUT_SIZE
    finalCanvas.height = OUTPUT_SIZE
    const ctx = finalCanvas.getContext('2d')
    if (!ctx) return

    const scaleFactor = OUTPUT_SIZE / VIEWPORT_W
    const scale = baseScale * zoomFactor * scaleFactor
    const drawW = image.naturalWidth * scale
    const drawH = image.naturalHeight * scale
    const drawX = (OUTPUT_SIZE - drawW) / 2 + offset.x * scaleFactor
    const drawY = (OUTPUT_SIZE - drawH) / 2 + offset.y * scaleFactor

    ctx.drawImage(image, drawX, drawY, drawW, drawH)
    onApply(finalCanvas.toDataURL('image/jpeg', 0.9))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      data-testid="image-modal-backdrop"
    >
      <div
        style={{
          background: '#1A1726',
          border: '1px solid #2A2537',
          borderRadius: 14,
          padding: 24,
          width: VIEWPORT_W + 48,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        data-testid="image-modal"
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 16,
            fontWeight: 700,
            color: '#D4A017',
            margin: 0,
          }}
          data-testid="image-modal-title"
        >
          {t('image.modal.title')}
        </h2>

        {/* File select + error */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'rgba(212,160,23,0.15)',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: 8,
              color: '#D4A017',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
            }}
            data-testid="image-modal-select-btn"
          >
            {t('image.modal.select_file')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTS.join(',')}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            data-testid="image-modal-file-input"
          />
          {error && (
            <span
              style={{ color: '#E07070', fontSize: 12 }}
              data-testid="image-modal-error"
              role="alert"
            >
              {error}
            </span>
          )}
        </div>

        {/* Canvas preview — single element for both display and final crop */}
        <div
          style={{ position: 'relative' }}
          data-testid="image-modal-viewport"
        >
          {!image && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7A7788',
                fontSize: 13,
                fontStyle: 'italic',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              {t('image.modal.select_file')}
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={VIEWPORT_W}
            height={VIEWPORT_H}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            style={{
              display: 'block',
              background: '#0F0D14',
              borderRadius: 8,
              border: '1px solid #2A2537',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            aria-label={t('image.modal.drag_hint')}
            data-testid="image-modal-canvas"
          />
        </div>

        {/* Zoom slider — only shown when an image is loaded */}
        {image && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#7A7788', flexShrink: 0 }}>
              {t('image.modal.zoom_label')}
            </span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoomFactor}
              onChange={onZoomChange}
              aria-label={t('image.modal.zoom_label')}
              style={{ flex: 1 }}
              data-testid="image-modal-zoom"
            />
            <span style={{ fontSize: 12, color: '#B8B4C8', width: 32, textAlign: 'right' }}>
              {zoomFactor.toFixed(1)}×
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #2A2537',
              borderRadius: 8,
              color: '#B8B4C8',
              padding: '7px 18px',
              cursor: 'pointer',
              fontSize: 13,
            }}
            data-testid="image-modal-cancel"
          >
            {t('image.modal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!image}
            style={{
              background: image ? 'rgba(212,160,23,0.2)' : 'transparent',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: 8,
              color: image ? '#D4A017' : '#7A7788',
              padding: '7px 18px',
              cursor: image ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
            data-testid="image-modal-apply"
          >
            {t('image.modal.apply')}
          </button>
        </div>
      </div>
    </div>
  )
}
