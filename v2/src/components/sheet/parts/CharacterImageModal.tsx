import type React from 'react'
import { useState, useRef, useCallback } from 'react'
import { useTranslation } from '@/i18n'

const VIEWPORT_W = 360
const VIEWPORT_H = 270
const MAX_FILE_BYTES = 2 * 1024 * 1024  // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

export interface CharacterImageModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (dataUrl: string) => void
  initialImage?: string
}

interface DragState {
  active: boolean
  startX: number
  startY: number
  startOX: number
  startOY: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function CharacterImageModal({ isOpen, onClose, onApply, initialImage }: CharacterImageModalProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [sourceUrl, setSourceUrl] = useState<string | null>(initialImage ?? null)
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [baseScale, setBaseScale] = useState(1)
  const [zoomFactor, setZoomFactor] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const drag = useRef<DragState>({ active: false, startX: 0, startY: 0, startOX: 0, startOY: 0 })

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
      setSourceUrl(url)
      setZoomFactor(1)
    }
    reader.readAsDataURL(file)
    // Reset file input so same file can be re-selected
    e.target.value = ''
  }, [t])

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const w = img.naturalWidth
    const h = img.naturalHeight
    setNaturalW(w)
    setNaturalH(h)
    const scale = Math.min(VIEWPORT_W / w, VIEWPORT_H / h)
    setBaseScale(scale)
    setZoomFactor(1)
    // Center image in viewport
    setOffsetX((VIEWPORT_W - w * scale) / 2)
    setOffsetY((VIEWPORT_H - h * scale) / 2)
  }, [])

  const effectiveZoom = baseScale * zoomFactor
  const displayW = naturalW * effectiveZoom
  const displayH = naturalH * effectiveZoom

  const clampedOffsets = useCallback((ox: number, oy: number, dw: number, dh: number) => {
    const maxX = 0
    const minX = VIEWPORT_W - dw
    const maxY = 0
    const minY = VIEWPORT_H - dh
    return {
      x: dw <= VIEWPORT_W ? (VIEWPORT_W - dw) / 2 : clamp(ox, minX, maxX),
      y: dh <= VIEWPORT_H ? (VIEWPORT_H - dh) / 2 : clamp(oy, minY, maxY),
    }
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, startOX: offsetX, startOY: offsetY }
    setIsDragging(true)
    e.preventDefault()
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    const { x, y } = clampedOffsets(drag.current.startOX + dx, drag.current.startOY + dy, displayW, displayH)
    setOffsetX(x)
    setOffsetY(y)
  }

  const endDrag = () => {
    drag.current.active = false
    setIsDragging(false)
  }

  const onZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFactor = Number(e.target.value)
    setZoomFactor(newFactor)
    const newDW = naturalW * baseScale * newFactor
    const newDH = naturalH * baseScale * newFactor
    const { x, y } = clampedOffsets(offsetX, offsetY, newDW, newDH)
    setOffsetX(x)
    setOffsetY(y)
  }

  const handleApply = () => {
    if (!sourceUrl || !imgRef.current) return
    const canvas = canvasRef.current ?? document.createElement('canvas')
    canvas.width = VIEWPORT_W
    canvas.height = VIEWPORT_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate source region visible in viewport
    const sx = Math.max(0, -offsetX / effectiveZoom)
    const sy = Math.max(0, -offsetY / effectiveZoom)
    const sw = Math.min(naturalW - sx, VIEWPORT_W / effectiveZoom)
    const sh = Math.min(naturalH - sy, VIEWPORT_H / effectiveZoom)

    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    onApply(canvas.toDataURL('image/jpeg', 0.9))
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

        {/* Viewport */}
        <div
          role="img"
          aria-label={t('image.modal.drag_hint')}
          style={{
            width: VIEWPORT_W,
            height: VIEWPORT_H,
            overflow: 'hidden',
            position: 'relative',
            background: '#0F0D14',
            borderRadius: 8,
            border: '1px solid #2A2537',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          data-testid="image-modal-viewport"
        >
          {sourceUrl ? (
            <img
              ref={imgRef}
              src={sourceUrl}
              alt=""
              onLoad={handleImageLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: offsetX,
                top: offsetY,
                width: displayW,
                height: displayH,
                pointerEvents: 'none',
              }}
              data-testid="image-modal-preview"
            />
          ) : (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#7A7788', fontSize: 13, fontStyle: 'italic',
              }}
            >
              {t('image.modal.select_file')}
            </div>
          )}
        </div>

        {/* Zoom slider */}
        {sourceUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#7A7788', flexShrink: 0 }}>
              {t('image.modal.zoom_label')}
            </span>
            <input
              type="range"
              min="1"
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

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} style={{ display: 'none' }} data-testid="image-modal-canvas" />

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
            disabled={!sourceUrl}
            style={{
              background: sourceUrl ? 'rgba(212,160,23,0.2)' : 'transparent',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: 8,
              color: sourceUrl ? '#D4A017' : '#7A7788',
              padding: '7px 18px',
              cursor: sourceUrl ? 'pointer' : 'not-allowed',
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
