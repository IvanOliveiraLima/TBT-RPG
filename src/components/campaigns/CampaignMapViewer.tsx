/**
 * CampaignMapViewer — Leaflet CRS.Simple image viewer with pan/zoom, map markers, and tokens.
 * Shows a signed URL of a campaign map image inside a full-bounds ImageOverlay.
 * Owner can add/rename/remove markers (click-to-add), place/drag/edit/remove tokens (button add).
 * Members see markers and tokens (read-only); tokens update via 5 s polling.
 * Meant to be rendered inside a modal that defines the container height.
 */

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import type React from 'react'
import { MapContainer, ImageOverlay, Marker, Popup, useMap, useMapEvents, SVGOverlay } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from '@/i18n'
import { getCampaignMapSignedUrl, updateCampaignMapGrid } from '@/services/campaign-maps'
import type { CampaignMap, GridConfig } from '@/services/campaign-maps'
import {
  listMapMarkers,
  createMapMarker,
  updateMapMarkerLabel,
  deleteMapMarker,
} from '@/services/campaign-map-markers'
import type { CampaignMapMarker } from '@/services/campaign-map-markers'
import {
  listMapTokens,
  createMapToken,
  updateMapToken,
  deleteMapToken,
  uploadTokenImage,
  uploadTokenImageBlob,
  getTokenImageSignedUrl,
  removeTokenImage,
  setTokenImageFromCharacterPortrait,
} from '@/services/campaign-map-tokens'
import type { CampaignMapToken, TokenPatch } from '@/services/campaign-map-tokens'
import {
  listTokenPresets,
  getTokenPresetImageSignedUrl,
} from '@/services/campaign-token-presets'
import type { CampaignTokenPreset } from '@/services/campaign-token-presets'
import { listCampaignCharacters } from '@/services/campaign-characters'
import { fetchCampaignCharacterImages } from '@/services/campaign-view'
import { snapToGrid } from '@/utils/snap-to-grid'
import { tokenDiameterPx } from '@/utils/token-size'
import { getMapFog, saveMapFog } from '@/services/campaign-map-fog'
import type { CampaignMapFog } from '@/services/campaign-map-fog'
import { pointToCell, allCells, cellKey } from '@/utils/fog-cells'
import { CONDITION_KEYS, CONDITION_COLOR } from '@/domain/conditions'
import type { ConditionKey } from '@/domain/conditions'
import {
  listMapAreas,
  createMapArea,
  clearMapAreas,
} from '@/services/campaign-map-areas'
import type { CampaignMapArea } from '@/services/campaign-map-areas'

const T = {
  bg:          '#15121C',
  textMuted:   '#7A7788',
  textPrimary: '#F4EFE0',
  danger:      '#E24B4A',
  sans:        "'Inter', system-ui, sans-serif",
} as const

const MAP_POLL_MS   = 15_000
const TOKEN_POLL_MS = 5_000
const FOG_POLL_MS   = 5_000

const PIN_ICON_HTML =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="#5DCAA5" stroke="#15121C" stroke-width="1.5">' +
  '<path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>' +
  '<circle cx="12" cy="9" r="2.5" fill="#15121C"/>' +
  '</svg>'

// Module-level icon cache — keyed by (imageUrl|color, diameter-in-px, conditions)
const TOKEN_ICON_CACHE = new Map<string, L.DivIcon>()

const CHIP_H = 14   // px — height of one chip row below the disc
const CHIP_GAP = 2  // px — gap between chip row and disc
const MAX_CHIPS = 3 // show at most this many condition abbr chips; the rest become "+N"

function getTokenIcon(
  color: string,
  sizeCells: number,
  cellImageUnits: number | null,
  pxPerUnit: number,
  imageUrl?: string | null,
  chips?: Array<{ abbr: string; color: string }>,
): L.DivIcon {
  const d = Math.round(tokenDiameterPx(sizeCells, cellImageUnits, pxPerUnit))
  const condKey = chips && chips.length > 0 ? chips.map(c => c.abbr).join(',') : ''
  const key = `${imageUrl ?? color}-${d}-${condKey}`
  const cached = TOKEN_ICON_CACHE.get(key)
  if (cached) return cached

  const ring = 2
  const inner = imageUrl
    ? `background-image:url('${imageUrl}');background-size:cover;background-position:center;`
    : `background:${color};`
  const border = imageUrl
    ? `border:${ring}px solid ${color};`
    : `border:${ring}px solid rgba(255,255,255,0.7);`

  let chipHtml = ''
  if (chips && chips.length > 0) {
    const visible = chips.slice(0, MAX_CHIPS)
    const overflow = chips.length - MAX_CHIPS
    const chipSpans = visible.map(c =>
      `<span style="background:${c.color};color:#fff;font-size:9px;font-weight:700;padding:1px 3px;border-radius:3px;line-height:${CHIP_H}px;white-space:nowrap;">${c.abbr}</span>`
    ).join('')
    const overflowSpan = overflow > 0
      ? `<span style="background:#374151;color:#fff;font-size:9px;font-weight:700;padding:1px 3px;border-radius:3px;line-height:${CHIP_H}px;white-space:nowrap;">+${overflow}</span>`
      : ''
    chipHtml = `<div style="display:flex;gap:2px;justify-content:center;flex-wrap:nowrap;margin-top:${CHIP_GAP}px;max-width:${d + 16}px;">${chipSpans}${overflowSpan}</div>`
  }

  const totalH = chips && chips.length > 0 ? d + CHIP_GAP + CHIP_H : d
  const icon = L.divIcon({
    className: 'tbt-token',
    html: `<div style="display:inline-block;"><div style="width:${d}px;height:${d}px;border-radius:50%;${inner}${border}box-sizing:border-box;"></div>${chipHtml}</div>`,
    iconSize: [d, totalH],
    iconAnchor: [d / 2, d / 2],
    popupAnchor: [0, -d / 2],
  })
  TOKEN_ICON_CACHE.set(key, icon)
  return icon
}

// Inner component — captures map click events for owner flows.
// onDblClick: create marker (blocked while a preset is armed).
// onSingleClick: place preset token (only fires while a preset is armed).
function MapClickHandler({
  onDblClick,
  onSingleClick,
}: {
  onDblClick?: (latlng: L.LatLng) => void
  onSingleClick?: (latlng: L.LatLng) => void
}) {
  useMapEvents({
    click:    e => onSingleClick?.(e.latlng),
    dblclick: e => onDblClick?.(e.latlng),
  })
  return null
}

// Inner component — sets crosshair cursor on the Leaflet container while a preset is armed.
function ArmedCursorEffect({ armed }: { armed: boolean }) {
  const leafletMap = useMap()
  useEffect(() => {
    const container = leafletMap.getContainer()
    container.style.cursor = armed ? 'crosshair' : ''
  }, [armed, leafletMap])
  return null
}

// Inner component — tracks px-per-image-unit scale, updating on zoomend
function ZoomScaleTracker({ onScale }: { onScale: (pxPerUnit: number) => void }) {
  const map = useMap()
  useEffect(() => {
    const update = () => {
      const a = map.latLngToLayerPoint([0, 0])
      const b = map.latLngToLayerPoint([0, 1]) // +1 lng = +1 image unit in x
      onScale(Math.abs(b.x - a.x))
    }
    update() // initial
    map.on('zoomend', update)
    return () => { map.off('zoomend', update) }
  }, [map, onScale])
  return null
}

// Inner component — handles fog painting via drag; disables pan and sets crosshair cursor in fogMode.
// Uses native Pointer Events (pointerdown/pointermove/pointerup) on the map container so drag-paint
// works on touch devices as well as mouse (useMapEvents mousemove doesn't fire on touch).
function FogInteraction({
  fogMode,
  onPaint,
  onCommit,
}: {
  fogMode: boolean
  onPaint: (latlng: L.LatLng) => void
  onCommit: () => void
}) {
  const leafletMap = useMap()

  useEffect(() => {
    const container = leafletMap.getContainer()
    if (!fogMode) {
      leafletMap.dragging.enable()
      container.style.cursor = ''
      container.style.touchAction = ''
      return
    }
    leafletMap.dragging.disable()
    container.style.cursor = 'crosshair'
    container.style.touchAction = 'none'
    let painting = false
    const down = (e: Event) => {
      const pe = e as PointerEvent
      if ((pe.target as HTMLElement).closest('button, input, select, label')) return
      painting = true
      try { container.setPointerCapture(pe.pointerId) } catch { /* noop */ }
      onPaint(leafletMap.mouseEventToLatLng(pe as unknown as MouseEvent))
    }
    const move = (e: Event) => {
      if (painting) onPaint(leafletMap.mouseEventToLatLng(e as unknown as MouseEvent))
    }
    const end = () => { if (painting) { painting = false; onCommit() } }
    container.addEventListener('pointerdown', down)
    container.addEventListener('pointermove', move)
    container.addEventListener('pointerup', end)
    container.addEventListener('pointercancel', end)
    return () => {
      container.removeEventListener('pointerdown', down)
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerup', end)
      container.removeEventListener('pointercancel', end)
      leafletMap.dragging.enable()
      container.style.cursor = ''
      container.style.touchAction = ''
    }
  }, [fogMode, leafletMap, onPaint, onCommit])

  return null
}

// Inner component — handles area drawing via drag; disables pan and sets crosshair in areaMode.
// onStart(latlng) called on pointerdown, onMove(latlng) on pointermove, onEnd() on pointerup.
function AreaInteraction({
  areaMode,
  onStart,
  onMove,
  onEnd,
}: {
  areaMode: boolean
  onStart: (latlng: L.LatLng) => void
  onMove:  (latlng: L.LatLng) => void
  onEnd:   () => void
}) {
  const leafletMap = useMap()

  useEffect(() => {
    const container = leafletMap.getContainer()
    if (!areaMode) {
      leafletMap.dragging.enable()
      container.style.cursor = ''
      container.style.touchAction = ''
      return
    }
    leafletMap.dragging.disable()
    container.style.cursor = 'crosshair'
    container.style.touchAction = 'none'
    let dragging = false
    const down = (e: Event) => {
      const pe = e as PointerEvent
      if ((pe.target as HTMLElement).closest('button, input, select, label')) return
      dragging = true
      try { container.setPointerCapture(pe.pointerId) } catch { /* noop */ }
      onStart(leafletMap.mouseEventToLatLng(pe as unknown as MouseEvent))
    }
    const move = (e: Event) => {
      if (dragging) onMove(leafletMap.mouseEventToLatLng(e as unknown as MouseEvent))
    }
    const end = () => { if (dragging) { dragging = false; onEnd() } }
    container.addEventListener('pointerdown', down)
    container.addEventListener('pointermove', move)
    container.addEventListener('pointerup', end)
    container.addEventListener('pointercancel', end)
    return () => {
      container.removeEventListener('pointerdown', down)
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerup', end)
      container.removeEventListener('pointercancel', end)
      leafletMap.dragging.enable()
      container.style.cursor = ''
      container.style.touchAction = ''
    }
  }, [areaMode, leafletMap, onStart, onMove, onEnd])

  return null
}

// Inner component — owner popup for editing a token's label, color, size, and image
function TokenPopupContent({
  token,
  campaignId,
  onSave,
  onRemove,
  onUploadImage,
  onRemoveImage,
  onPickCharacterPortrait,
  onToggleCondition,
}: {
  token: CampaignMapToken
  campaignId: string
  onSave: (id: string, patch: TokenPatch) => void
  onRemove: (id: string) => void
  onUploadImage: (tokenId: string, file: File) => void
  onRemoveImage: (tokenId: string, imagePath: string) => void
  onPickCharacterPortrait: (tokenId: string, portraitDataUrl: string) => void
  onToggleCondition: (tokenId: string, key: ConditionKey) => void
}) {
  const { t } = useTranslation()
  const [label, setLabel] = useState(token.label)
  const [color, setColor] = useState(token.color)
  const [size, setSize] = useState(token.size)
  const [imageError, setImageError] = useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadingPicker, setLoadingPicker] = useState(false)
  const [pickerChars, setPickerChars] = useState<Array<{
    characterId: string
    characterName: string
    portraitDataUrl: string | null
  }>>([])

  async function openPortraitPicker() {
    setPickerOpen(true)
    setLoadingPicker(true)
    try {
      const linked = await listCampaignCharacters(campaignId)
      const withPortraits = await Promise.all(
        linked.map(async (c) => {
          const imgs = await fetchCampaignCharacterImages({ userId: c.userId, characterId: c.characterId })
          return {
            characterId: c.characterId,
            characterName: c.characterName,
            portraitDataUrl: imgs.portraitData,
          }
        }),
      )
      setPickerChars(withPortraits)
    } catch {
      setPickerOpen(false)
    } finally {
      setLoadingPicker(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)
    onUploadImage(token.id, file)
    e.target.value = ''
  }

  return (
    <div data-testid={`token-popup-${token.id}`} style={{ fontFamily: T.sans, minWidth: 140 }}>
      <input
        data-testid={`token-label-input-${token.id}`}
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder={t('campaign_maps.token_label')}
        style={{
          width: '100%', marginBottom: 6, padding: '3px 6px',
          borderRadius: 4, boxSizing: 'border-box', fontSize: 16,
        }}
      />
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          type="color"
          data-testid={`token-color-input-${token.id}`}
          value={color}
          onChange={e => setColor(e.target.value)}
          style={{ width: 36, height: 30, cursor: 'pointer', borderRadius: 4, border: 'none', padding: 0 }}
        />
        <select
          data-testid={`token-size-select-${token.id}`}
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          style={{ flex: 1, padding: '4px 6px', borderRadius: 4, fontSize: 14 }}
        >
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 6 }}>
        <label
          data-testid={`token-image-upload-label-${token.id}`}
          style={{ display: 'block', fontSize: 12, marginBottom: 4, cursor: 'pointer', color: T.textMuted }}
        >
          {t('campaign_maps.token_image_upload')}
          <input
            type="file"
            data-testid={`token-image-input-${token.id}`}
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        <button
          type="button"
          data-testid={`token-portrait-pick-${token.id}`}
          onClick={() => void openPortraitPicker()}
          style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', color: T.textMuted, background: 'none', border: `1px solid ${T.textMuted}`, marginBottom: 4, display: 'block' }}
        >
          {t('campaign_maps.token_image_from_character')}
        </button>
        {pickerOpen && (
          <div data-testid={`token-portrait-picker-${token.id}`} style={{ marginBottom: 4, border: `1px solid ${T.textMuted}`, borderRadius: 4, padding: 4 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{t('campaign_maps.token_image_pick_character')}</div>
            {loadingPicker ? (
              <div data-testid={`token-portrait-loading-${token.id}`} style={{ fontSize: 12 }}>…</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 120, overflowY: 'auto' }}>
                {pickerChars.map(c => (
                  <li key={c.characterId}>
                    <button
                      type="button"
                      data-testid={`portrait-char-${c.characterId}`}
                      disabled={!c.portraitDataUrl}
                      onClick={() => {
                        if (c.portraitDataUrl) {
                          onPickCharacterPortrait(token.id, c.portraitDataUrl)
                          setPickerOpen(false)
                        }
                      }}
                      style={{ width: '100%', textAlign: 'left', padding: '2px 4px', fontSize: 12, cursor: c.portraitDataUrl ? 'pointer' : 'not-allowed', opacity: c.portraitDataUrl ? 1 : 0.5, background: 'none', border: 'none' }}
                    >
                      {c.characterName}
                      {!c.portraitDataUrl && (
                        <span data-testid={`portrait-char-no-portrait-${c.characterId}`} style={{ marginLeft: 4, fontSize: 10, color: T.textMuted }}>
                          ({t('campaign_maps.token_image_no_portrait')})
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              data-testid={`token-portrait-picker-close-${token.id}`}
              onClick={() => setPickerOpen(false)}
              style={{ fontSize: 11, marginTop: 4, cursor: 'pointer', background: 'none', border: 'none', color: T.textMuted }}
            >
              ×
            </button>
          </div>
        )}
        {token.imagePath && (
          <button
            type="button"
            data-testid={`token-image-remove-${token.id}`}
            onClick={() => { setImageError(null); onRemoveImage(token.id, token.imagePath!) }}
            style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', color: T.danger, background: 'none', border: `1px solid ${T.danger}` }}
          >
            {t('campaign_maps.token_image_remove')}
          </button>
        )}
        {imageError && (
          <div data-testid={`token-image-error-${token.id}`} style={{ fontSize: 11, color: T.danger, marginTop: 4 }}>
            {imageError}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
          {t('token_conditions_title')}
        </div>
        <div
          data-testid={`token-conditions-${token.id}`}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}
        >
          {CONDITION_KEYS.map(key => {
            const active = token.conditions.includes(key)
            return (
              <button
                key={key}
                type="button"
                data-testid={`condition-toggle-${token.id}-${key}`}
                onClick={() => onToggleCondition(token.id, key)}
                style={{
                  padding: '3px 4px',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: active ? CONDITION_COLOR[key] : 'transparent',
                  color: active ? '#fff' : T.textMuted,
                  border: `1px solid ${active ? CONDITION_COLOR[key] : T.textMuted}`,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {t(`conditions.${key}.abbr` as Parameters<typeof t>[0])} {t(`conditions.${key}.name` as Parameters<typeof t>[0])}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          data-testid={`token-save-${token.id}`}
          onClick={() => onSave(token.id, { label, color, size })}
          style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          {t('campaign_maps.token_save')}
        </button>
        <button
          type="button"
          data-testid={`token-remove-${token.id}`}
          onClick={() => onRemove(token.id)}
          style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13, color: T.danger }}
        >
          {t('campaign_maps.token_remove')}
        </button>
      </div>
    </div>
  )
}

interface Props {
  map: CampaignMap
  isOwner?: boolean
  expanded?: boolean
  onGridSaved?: (mapId: string, grid: GridConfig) => void
}

function InvalidateOnChange({ dep }: { dep: unknown }) {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(id)
  }, [dep, map])
  return null
}

const GRID_INPUT: React.CSSProperties = {
  background: '#1B1725',
  border: '1px solid #2A2537',
  borderRadius: 6,
  padding: '4px 8px',
  color: '#F4EFE0',
  fontFamily: "'Inter', system-ui, sans-serif",
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  fontSize: 16,
}

export function CampaignMapViewer({ map, isOwner = false, expanded = false, onGridSaved }: Props) {
  const { t } = useTranslation()
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [markers, setMarkers] = useState<CampaignMapMarker[]>([])
  const [tokens, setTokens] = useState<CampaignMapToken[]>([])
  const [pendingLatLng, setPendingLatLng] = useState<L.LatLng | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')
  const [savingPending, setSavingPending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [localGrid, setLocalGrid] = useState<GridConfig>({
    enabled: map.gridEnabled,
    size: map.gridSize,
    offsetX: map.gridOffsetX,
    offsetY: map.gridOffsetY,
    color: map.gridColor,
  })
  const [savingGrid, setSavingGrid] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [fog, setFog] = useState<CampaignMapFog>({ mapId: map.id, enabled: false, revealed: [], updatedAt: 0 })
  const [fogMode, setFogMode] = useState(false)
  const [brush, setBrush] = useState<'reveal' | 'hide'>('reveal')
  const [pxPerUnit, setPxPerUnit] = useState(1)
  // Signed URLs for token images keyed by imagePath (path is stable until replaced)
  const [tokenImageUrlsByPath, setTokenImageUrlsByPath] = useState<Record<string, string>>({})
  // Preset palette state (owner only)
  const [presets, setPresets] = useState<CampaignTokenPreset[]>([])
  const [presetUrls, setPresetUrls] = useState<Record<string, string>>({})
  const [armedPresetId, setArmedPresetId] = useState<string | null>(null)
  const [presetPanelOpen, setPresetPanelOpen] = useState(false)
  // Area drawing state (owner only)
  const [areas, setAreas] = useState<CampaignMapArea[]>([])
  const [areaMode, setAreaMode] = useState(false)
  const [areaShape, setAreaShape] = useState<'circle' | 'square'>('circle')
  const [areaColor, setAreaColor] = useState('#E0562D')
  const [areaPanelOpen, setAreaPanelOpen] = useState(false)
  // Preview during drag: centre (viewBox space) + current radius
  const [areaPreview, setAreaPreview] = useState<{ x: number; y: number; radius: number; shape: 'circle' | 'square'; color: string } | null>(null)
  const areaCenterRef   = useRef<{ x: number; y: number } | null>(null)
  const areaPreviewRef  = useRef<{ x: number; y: number; radius: number } | null>(null)
  // Ref kept in sync so drag-paint commit always reads the latest fog state
  const fogRef = useRef(fog)
  useEffect(() => { fogRef.current = fog }, [fog])
  // Tracks the last painted cell key so drag-paint skips redundant setFog calls for the same cell
  const lastPaintedCellRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getCampaignMapSignedUrl(map.imagePath)
      .then(url => { if (!cancelled) setSignedUrl(url) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [map.imagePath])

  useEffect(() => {
    let cancelled = false
    listMapMarkers(map.id)
      .then(ms => { if (!cancelled) setMarkers(ms) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [map.id])

  // Poll markers every 15 s for non-owners (members see additions without reopening)
  useEffect(() => {
    if (isOwner) return
    let cancelled = false
    const id = setInterval(() => {
      listMapMarkers(map.id)
        .then(ms => { if (!cancelled) setMarkers(ms) })
        .catch(() => {})
    }, MAP_POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [map.id, isOwner])

  // Fetch tokens on mount
  useEffect(() => {
    let cancelled = false
    listMapTokens(map.id)
      .then(ts => { if (!cancelled) setTokens(ts) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [map.id])

  // Poll tokens every 5 s for non-owners
  useEffect(() => {
    if (isOwner) return
    let cancelled = false
    const id = setInterval(() => {
      listMapTokens(map.id)
        .then(ts => { if (!cancelled) setTokens(ts) })
        .catch(() => {})
    }, TOKEN_POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [map.id, isOwner])

  // Fetch areas on mount
  useEffect(() => {
    let cancelled = false
    listMapAreas(map.id)
      .then(as => { if (!cancelled) setAreas(as) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [map.id])

  // Poll areas every 5 s for non-owners
  useEffect(() => {
    if (isOwner) return
    let cancelled = false
    const id = setInterval(() => {
      listMapAreas(map.id)
        .then(as => { if (!cancelled) setAreas(as) })
        .catch(() => {})
    }, TOKEN_POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [map.id, isOwner])

  // Resolve signed URLs for tokens that have an image; dedup by path
  useEffect(() => {
    const paths = [...new Set(tokens.map(t => t.imagePath).filter((p): p is string => !!p))]
    const missing = paths.filter(p => !tokenImageUrlsByPath[p])
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(
      missing.map(path =>
        getTokenImageSignedUrl(path)
          .then(url => ({ path, url }))
          .catch(() => null),
      ),
    ).then(results => {
      if (cancelled) return
      const next: Record<string, string> = {}
      results.forEach(r => { if (r) next[r.path] = r.url })
      if (Object.keys(next).length > 0) setTokenImageUrlsByPath(prev => ({ ...prev, ...next }))
    })
    return () => { cancelled = true }
  }, [tokens]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch fog on mount
  useEffect(() => {
    let cancelled = false
    getMapFog(map.id)
      .then(f => { if (!cancelled) setFog(f) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [map.id])

  // Poll fog every 5 s for non-owners
  useEffect(() => {
    if (isOwner) return
    let cancelled = false
    const id = setInterval(() => {
      getMapFog(map.id)
        .then(f => { if (!cancelled) setFog(f) })
        .catch(() => {})
    }, FOG_POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [map.id, isOwner])

  // Fetch preset palette + resolve signed URLs for preset images (owner only)
  useEffect(() => {
    if (!isOwner) return
    let cancelled = false
    listTokenPresets(map.campaignId)
      .then(ps => {
        if (cancelled) return
        setPresets(ps)
        const paths = [...new Set(ps.filter(p => p.imagePath).map(p => p.imagePath!))]
        paths.forEach(path => {
          getTokenPresetImageSignedUrl(path)
            .then(url => { if (!cancelled) setPresetUrls(prev => ({ ...prev, [path]: url })) })
            .catch(() => undefined)
        })
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [isOwner, map.campaignId])

  const bounds = useMemo(
    () => L.latLngBounds([[0, 0], [map.height, map.width]]),
    [map.height, map.width],
  )

  const gridLines = useMemo(() => {
    if (!localGrid.enabled || !localGrid.size || localGrid.size <= 0) return null
    const { size, offsetX, offsetY } = localGrid
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
    const startX = ((offsetX % size) + size) % size
    for (let x = startX; x <= map.width; x += size) {
      lines.push({ x1: x, y1: 0, x2: x, y2: map.height })
    }
    const startY = ((offsetY % size) + size) % size
    for (let y = startY; y <= map.height; y += size) {
      lines.push({ x1: 0, y1: y, x2: map.width, y2: y })
    }
    return lines
  }, [localGrid, map.width, map.height])

  const fogRevealedRects = useMemo(() => {
    if (!localGrid.size) return []
    const s = localGrid.size
    return fog.revealed.map(key => {
      const parts = key.split(',')
      const col = Number(parts[0])
      const row = Number(parts[1])
      return (
        <rect
          key={key}
          x={localGrid.offsetX + col * s}
          y={localGrid.offsetY + row * s}
          width={s}
          height={s}
          fill="black"
        />
      )
    })
  }, [fog.revealed, localGrid.size, localGrid.offsetX, localGrid.offsetY])

  const revealedSet = useMemo(() => new Set(fog.revealed), [fog.revealed])

  function isTokenHiddenForViewer(tok: CampaignMapToken): boolean {
    if (isOwner) return false
    if (!fog.enabled) return false
    const cell = pointToCell(tok.x, map.height - tok.y, localGrid)
    if (!cell) return false
    return !revealedSet.has(cellKey(cell.col, cell.row))
  }

  const pinIcon = useMemo(() => L.divIcon({
    className: 'tbt-map-pin',
    html: PIN_ICON_HTML,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  }), [])

  async function handleAddToken() {
    const cx = map.width / 2
    const cy = map.height / 2
    const snapped = snapToGrid(cx, cy, 1, localGrid)
    try {
      const token = await createMapToken(map.id, snapped.x, snapped.y)
      setTokens(prev => [...prev, token])
    } catch {
      // best-effort
    }
  }

  async function placePreset(latlng: L.LatLng) {
    const preset = presets.find(p => p.id === armedPresetId)
    if (!preset) return
    const snapped = snapToGrid(latlng.lng, latlng.lat, preset.size, localGrid)
    try {
      const tok = await createMapToken(map.id, snapped.x, snapped.y, {
        label: preset.label,
        color: preset.color,
        size: preset.size,
      })
      setTokens(prev => [...prev, tok])
      if (preset.imagePath) {
        const signedUrl = presetUrls[preset.imagePath]
          ?? await getTokenPresetImageSignedUrl(preset.imagePath)
        const blob = await fetch(signedUrl).then(r => r.blob())
        const imagePath = await uploadTokenImageBlob(map.campaignId, tok.id, blob)
        setTokens(prev => prev.map(t => t.id === tok.id ? { ...t, imagePath } : t))
      }
    } catch {
      // best-effort — token may have been created without image
    }
  }

  async function handleSaveToken(id: string, patch: TokenPatch) {
    try {
      await updateMapToken(id, patch)
      setTokens(prev => prev.map(tok => tok.id === id ? { ...tok, ...patch } : tok))
    } catch {
      // noop — keep popup open so user can retry
    }
  }

  async function handleRemoveToken(id: string) {
    const tok = tokens.find(t => t.id === id)
    if (!tok) return
    try {
      await deleteMapToken(tok)
      setTokens(prev => prev.filter(t => t.id !== id))
      if (tok.imagePath) {
        setTokenImageUrlsByPath(prev => {
          const next = { ...prev }
          delete next[tok.imagePath!]
          return next
        })
      }
    } catch {
      // noop
    }
  }

  async function handleUploadTokenImage(tokenId: string, file: File) {
    try {
      const path = await uploadTokenImage(map.campaignId, tokenId, file)
      setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, imagePath: path } : t))
      // Evict old signed URL so the new path gets fetched
      setTokenImageUrlsByPath(prev => {
        const oldToken = tokens.find(t => t.id === tokenId)
        if (!oldToken?.imagePath) return prev
        const next = { ...prev }
        delete next[oldToken.imagePath]
        return next
      })
    } catch {
      // noop — popup keeps open
    }
  }

  async function handleRemoveTokenImage(tokenId: string, imagePath: string) {
    try {
      await removeTokenImage(tokenId, imagePath)
      setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, imagePath: null } : t))
      setTokenImageUrlsByPath(prev => {
        const next = { ...prev }
        delete next[imagePath]
        return next
      })
    } catch {
      // noop
    }
  }

  async function handlePickCharacterPortrait(tokenId: string, portraitDataUrl: string) {
    try {
      const path = await setTokenImageFromCharacterPortrait(map.campaignId, tokenId, portraitDataUrl)
      setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, imagePath: path } : t))
      setTokenImageUrlsByPath(prev => {
        const oldToken = tokens.find(t => t.id === tokenId)
        if (!oldToken?.imagePath) return prev
        const next = { ...prev }
        delete next[oldToken.imagePath]
        return next
      })
    } catch {
      // noop
    }
  }

  async function handleToggleCondition(tokenId: string, key: ConditionKey) {
    const tok = tokens.find(t => t.id === tokenId)
    if (!tok) return
    const next = tok.conditions.includes(key)
      ? tok.conditions.filter(c => c !== key)
      : [...tok.conditions, key]
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, conditions: next } : t))
    try {
      await updateMapToken(tokenId, { conditions: next })
    } catch {
      // revert
      setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, conditions: tok.conditions } : t))
    }
  }

  async function handleAddMarker() {
    if (!pendingLatLng) return
    setSavingPending(true)
    try {
      const marker = await createMapMarker(map.id, pendingLatLng.lng, pendingLatLng.lat, pendingLabel)
      setMarkers(prev => [...prev, marker])
      setPendingLatLng(null)
      setPendingLabel('')
    } catch {
      // keep pending open on error
    } finally {
      setSavingPending(false)
    }
  }

  async function handleRenameMarker(id: string) {
    try {
      await updateMapMarkerLabel(id, editingLabel)
      setMarkers(prev => prev.map(m => m.id === id ? { ...m, label: editingLabel } : m))
      setEditingId(null)
    } catch {
      // noop — keep editing open
    }
  }

  async function handleSaveGrid() {
    setSavingGrid(true)
    try {
      await updateCampaignMapGrid(map.id, localGrid)
      onGridSaved?.(map.id, localGrid)
      setPanelOpen(false)
    } catch {
      // best-effort: local state still valid, user can retry
    } finally {
      setSavingGrid(false)
    }
  }

  function handleToggleFogEnabled() {
    const next = { ...fog, enabled: !fog.enabled }
    setFog(next)
    void saveMapFog(map.id, { enabled: next.enabled, revealed: next.revealed }).catch(() => {})
  }

  function handleRevealAll() {
    const all = allCells(map.width, map.height, localGrid)
    const next = { ...fog, revealed: all }
    setFog(next)
    void saveMapFog(map.id, { enabled: next.enabled, revealed: all }).catch(() => {})
  }

  function handleHideAll() {
    const next = { ...fog, revealed: [] }
    setFog(next)
    void saveMapFog(map.id, { enabled: next.enabled, revealed: [] }).catch(() => {})
  }

  // Fog drag-paint helpers — onPaint updates local state, onCommit persists once on pointerup.
  // Wrapped in useCallback so FogInteraction's useEffect dep array stays stable across renders.
  const handleFogPaint = useCallback((latlng: L.LatLng) => {
    // CRS.Simple: lat=0 at bottom, viewBox y=0 at top → flip Y before cell lookup
    const cell = pointToCell(latlng.lng, map.height - latlng.lat, localGrid)
    if (!cell) return
    const key = cellKey(cell.col, cell.row)
    if (key === lastPaintedCellRef.current) return  // skip same cell during drag
    lastPaintedCellRef.current = key
    setFog(prev => {
      const revealed = brush === 'reveal'
        ? Array.from(new Set([...prev.revealed, key]))
        : prev.revealed.filter(k => k !== key)
      const next = { ...prev, revealed }
      fogRef.current = next  // keep ref in sync for handleFogCommit
      return next
    })
  }, [map.height, localGrid, brush])

  const handleFogCommit = useCallback(() => {
    lastPaintedCellRef.current = null
    const current = fogRef.current
    void saveMapFog(map.id, { enabled: current.enabled, revealed: current.revealed }).catch(() => {})
  }, [map.id])

  async function handleDeleteMarker(id: string) {
    try {
      await deleteMapMarker(id)
      setMarkers(prev => prev.filter(m => m.id !== id))
    } catch {
      // noop
    }
  }

  const handleAreaStart = useCallback((latlng: L.LatLng) => {
    const cx = latlng.lng
    const cy = map.height - latlng.lat
    areaCenterRef.current  = { x: cx, y: cy }
    areaPreviewRef.current = { x: cx, y: cy, radius: 0 }
    setAreaPreview({ x: cx, y: cy, radius: 0, shape: areaShape, color: areaColor })
  }, [map.height, areaShape, areaColor])

  const handleAreaMove = useCallback((latlng: L.LatLng) => {
    const center = areaCenterRef.current
    if (!center) return
    const px = latlng.lng
    const py = map.height - latlng.lat
    const radius = Math.sqrt((px - center.x) ** 2 + (py - center.y) ** 2)
    areaPreviewRef.current = { x: center.x, y: center.y, radius }
    setAreaPreview({ x: center.x, y: center.y, radius, shape: areaShape, color: areaColor })
  }, [map.height, areaShape, areaColor])

  // onEnd reads from ref (not state) so the useCallback deps stay stable during the drag.
  // areaPreview changes on every pointermove, which would cause AreaInteraction's useEffect
  // to remount mid-drag (clearing `let dragging` and losing pointer capture).
  const handleAreaEnd = useCallback(() => {
    const preview = areaPreviewRef.current
    areaCenterRef.current  = null
    areaPreviewRef.current = null
    setAreaPreview(null)
    if (!preview || preview.radius < 6) return
    const { x, y, radius } = preview
    void createMapArea(map.id, { shape: areaShape, x, y, radius, color: areaColor })
      .then(area => setAreas(prev => [...prev, area]))
      .catch(() => {})
  }, [map.id, areaShape, areaColor])

  async function handleClearAreas() {
    await clearMapAreas(map.id)
    setAreas([])
  }

  const viewerHeight = expanded ? '100%' : '70vh'

  if (error) {
    return (
      <div
        data-testid="campaign-map-viewer-error"
        style={{
          flex: expanded ? 1 : undefined, minHeight: 0,
          height: viewerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: T.bg, color: T.textMuted, fontFamily: T.sans, fontSize: 14,
        }}
      >
        ⚠
      </div>
    )
  }

  if (!signedUrl) {
    return (
      <div
        data-testid="campaign-map-viewer-loading"
        style={{
          flex: expanded ? 1 : undefined, minHeight: 0,
          height: viewerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: T.bg, color: T.textMuted, fontFamily: T.sans, fontSize: 14,
        }}
      >
        {t('campaign_maps.loading')}
      </div>
    )
  }

  return (
    <div
      data-testid="campaign-map-viewer"
      style={{ flex: expanded ? 1 : undefined, minHeight: 0, height: viewerHeight, width: '100%', position: 'relative' }}
    >
      {/* ── Owner toolbar — upper-right, below Leaflet zoom controls ─── */}
      {isOwner && (
        <div
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 1000,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
          }}
        >
          {/* Grid: collapsed toggle button OR expanded panel */}
          {!panelOpen && (
            <button
              type="button"
              data-testid="grid-panel-toggle"
              onClick={() => setPanelOpen(true)}
              aria-label={t('campaign_maps.grid_title')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(21,18,28,0.85)', color: T.textMuted,
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 12, fontWeight: 600, fontFamily: T.sans,
              }}
            >
              ⊞ {t('campaign_maps.grid_title')}
            </button>
          )}
          {panelOpen && (
            <div
              data-testid="grid-config-panel"
              style={{
                background: 'rgba(21, 18, 28, 0.92)',
                border: '1px solid #2A2537',
                borderRadius: 10,
                padding: '10px 12px',
                fontFamily: T.sans,
                display: 'flex', flexDirection: 'column', gap: 8,
                width: 260,
              }}
            >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: T.textMuted }}>
              {t('campaign_maps.grid_title')}
            </span>
            <button
              type="button"
              data-testid="grid-collapse-btn"
              onClick={() => setPanelOpen(false)}
              aria-label={t('campaign_maps.grid_collapse')}
              style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
            >×</button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textPrimary, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              data-testid="grid-enable-toggle"
              checked={localGrid.enabled}
              onChange={e => setLocalGrid(g => ({ ...g, enabled: e.target.checked }))}
            />
            {t('campaign_maps.grid_enable')}
          </label>
          {localGrid.enabled && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: T.textMuted }}>{t('campaign_maps.grid_cell_size')}</label>
                <input
                  type="number"
                  data-testid="grid-size-input"
                  value={localGrid.size ?? ''}
                  min={4}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    setLocalGrid(g => ({ ...g, size: isNaN(v) ? null : v }))
                  }}
                  style={GRID_INPUT}
                />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: T.textMuted }}>{t('campaign_maps.grid_offset_x')}</label>
                  <input
                    type="number"
                    data-testid="grid-offset-x-input"
                    value={localGrid.offsetX}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      setLocalGrid(g => ({ ...g, offsetX: isNaN(v) ? 0 : v }))
                    }}
                    style={GRID_INPUT}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: T.textMuted }}>{t('campaign_maps.grid_offset_y')}</label>
                  <input
                    type="number"
                    data-testid="grid-offset-y-input"
                    value={localGrid.offsetY}
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      setLocalGrid(g => ({ ...g, offsetY: isNaN(v) ? 0 : v }))
                    }}
                    style={GRID_INPUT}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: T.textMuted }}>{t('campaign_maps.grid_color')}</label>
                <input
                  type="color"
                  data-testid="grid-color-input"
                  value={localGrid.color}
                  onChange={e => setLocalGrid(g => ({ ...g, color: e.target.value }))}
                  style={{ height: 30, width: '100%', cursor: 'pointer', borderRadius: 4, border: 'none' }}
                />
              </div>
            </>
          )}
          <button
            type="button"
            data-testid="grid-save-btn"
            onClick={() => void handleSaveGrid()}
            disabled={savingGrid}
            style={{
              background: '#5B3FA8', border: 'none', borderRadius: 8,
              padding: '6px 0', color: T.textPrimary, fontFamily: T.sans,
              fontSize: 12, fontWeight: 600, cursor: savingGrid ? 'default' : 'pointer',
              opacity: savingGrid ? 0.6 : 1,
            }}
          >
            {t('campaign_maps.grid_save')}
          </button>
        </div>
          )}

          {/* Add token (always below grid control) */}
          <button
            type="button"
            data-testid="token-add-btn"
            onClick={() => void handleAddToken()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(21,18,28,0.85)', color: T.textMuted,
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 12, fontWeight: 600, fontFamily: T.sans,
            }}
          >
            + {t('campaign_maps.token_add')}
          </button>

          {/* Preset palette — toggle button or panel */}
          {!presetPanelOpen && (
            <button
              type="button"
              data-testid="preset-palette-toggle"
              onClick={() => setPresetPanelOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: armedPresetId ? 'rgba(212,160,23,0.15)' : 'rgba(21,18,28,0.85)',
                color: armedPresetId ? '#D4A017' : T.textMuted,
                border: armedPresetId ? '1px solid rgba(212,160,23,0.4)' : '1px solid rgba(255,255,255,0.12)',
                fontSize: 12, fontWeight: 600, fontFamily: T.sans,
              }}
            >
              ⬡ {t('token_presets.palette')}
            </button>
          )}
          {presetPanelOpen && (
            <div
              data-testid="preset-palette-panel"
              style={{
                background: 'rgba(21, 18, 28, 0.92)',
                border: '1px solid #2A2537',
                borderRadius: 10,
                padding: '10px 12px',
                fontFamily: T.sans,
                display: 'flex', flexDirection: 'column', gap: 8,
                width: 220,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: T.textMuted }}>
                  {t('token_presets.palette')}
                </span>
                <button
                  type="button"
                  data-testid="preset-palette-close"
                  onClick={() => { setPresetPanelOpen(false); setArmedPresetId(null) }}
                  style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
                >×</button>
              </div>

              {presets.length === 0 ? (
                <p data-testid="preset-palette-empty" style={{ fontSize: 12, color: T.textMuted, margin: 0, fontStyle: 'italic' }}>
                  {t('token_presets.palette_empty')}
                </p>
              ) : (
                presets.map(preset => {
                  const imgUrl = preset.imagePath ? presetUrls[preset.imagePath] : undefined
                  const isArmed = armedPresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      data-testid={`preset-palette-item-${preset.id}`}
                      onClick={() => setArmedPresetId(isArmed ? null : preset.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: isArmed ? 'rgba(212,160,23,0.15)' : 'transparent',
                        border: isArmed ? '1px solid rgba(212,160,23,0.4)' : '1px solid transparent',
                        borderRadius: 6,
                        padding: '5px 8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: imgUrl ? undefined : preset.color,
                        backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        border: '2px solid rgba(255,255,255,0.3)',
                      }} />
                      <span style={{ fontSize: 12, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preset.label || '—'}
                      </span>
                    </button>
                  )
                })
              )}

              {armedPresetId && (
                <>
                  <p style={{ fontSize: 11, color: '#D4A017', margin: 0 }}>
                    {t('token_presets.place_hint').replace('{name}', presets.find(p => p.id === armedPresetId)?.label ?? '')}
                  </p>
                  <button
                    type="button"
                    data-testid="preset-place-done"
                    onClick={() => setArmedPresetId(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 6,
                      color: T.textPrimary,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: T.sans,
                      alignSelf: 'flex-end',
                    }}
                  >
                    {t('token_presets.place_done')}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Area drawing panel */}
          {!areaPanelOpen && !areaMode && (
            <button
              type="button"
              data-testid="area-panel-toggle"
              onClick={() => {
                setAreaPanelOpen(true)
                setFogMode(false)
                setArmedPresetId(null)
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(21,18,28,0.85)', color: T.textMuted,
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 12, fontWeight: 600, fontFamily: T.sans,
              }}
            >
              ◎ {t('areas.title')}
            </button>
          )}
          {(areaPanelOpen || areaMode) && (
            <div
              data-testid="area-panel"
              style={{
                background: 'rgba(21, 18, 28, 0.92)',
                border: '1px solid #2A2537',
                borderRadius: 10,
                padding: '10px 12px',
                fontFamily: T.sans,
                display: 'flex', flexDirection: 'column', gap: 8,
                width: 200,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: T.textMuted }}>
                  {t('areas.title')}
                </span>
                <button
                  type="button"
                  data-testid="area-panel-close"
                  onClick={() => { setAreaPanelOpen(false); setAreaMode(false); setAreaPreview(null) }}
                  style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
                >×</button>
              </div>

              {/* Shape selector */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  data-testid="area-shape-circle"
                  onClick={() => setAreaShape('circle')}
                  style={{
                    flex: 1, padding: '4px 0', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                    background: areaShape === 'circle' ? '#5B3FA8' : 'transparent',
                    color: areaShape === 'circle' ? T.textPrimary : T.textMuted,
                    border: areaShape === 'circle' ? '1px solid #5B3FA8' : '1px solid rgba(255,255,255,0.12)',
                    fontFamily: T.sans,
                  }}
                >
                  {t('areas.shape_circle')}
                </button>
                <button
                  type="button"
                  data-testid="area-shape-square"
                  onClick={() => setAreaShape('square')}
                  style={{
                    flex: 1, padding: '4px 0', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                    background: areaShape === 'square' ? '#5B3FA8' : 'transparent',
                    color: areaShape === 'square' ? T.textPrimary : T.textMuted,
                    border: areaShape === 'square' ? '1px solid #5B3FA8' : '1px solid rgba(255,255,255,0.12)',
                    fontFamily: T.sans,
                  }}
                >
                  {t('areas.shape_square')}
                </button>
              </div>

              {/* Color picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: T.textMuted }}>{t('areas.color')}</label>
                <input
                  type="color"
                  data-testid="area-color-input"
                  value={areaColor}
                  onChange={e => setAreaColor(e.target.value)}
                  style={{ height: 30, width: '100%', cursor: 'pointer', borderRadius: 4, border: 'none' }}
                />
              </div>

              {/* Draw hint */}
              {areaMode && (
                <p style={{ fontSize: 11, color: '#D4A017', margin: 0 }}>{t('areas.draw_hint')}</p>
              )}

              {/* Clear all */}
              {areas.length > 0 && (
                <button
                  type="button"
                  data-testid="area-clear-btn"
                  onClick={() => void handleClearAreas()}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6, color: T.danger, padding: '4px 10px',
                    cursor: 'pointer', fontSize: 12, fontFamily: T.sans,
                  }}
                >
                  {t('areas.clear')}
                </button>
              )}

              {/* Draw mode toggle */}
              {!areaMode ? (
                <button
                  type="button"
                  data-testid="area-draw-start"
                  onClick={() => { setAreaMode(true); setAreaPanelOpen(true) }}
                  style={{
                    background: '#5B3FA8', border: 'none', borderRadius: 6,
                    color: T.textPrimary, padding: '4px 10px',
                    cursor: 'pointer', fontSize: 12, fontFamily: T.sans, fontWeight: 600,
                  }}
                >
                  {t('areas.draw_hint')}
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="area-draw-done"
                  onClick={() => { setAreaMode(false); setAreaPreview(null) }}
                  style={{
                    background: '#5B3FA8', border: 'none', borderRadius: 6,
                    color: T.textPrimary, padding: '4px 10px',
                    cursor: 'pointer', fontSize: 12, fontFamily: T.sans, fontWeight: 600,
                  }}
                >
                  {t('areas.done')}
                </button>
              )}
            </div>
          )}

          {/* Fog panel or toggle */}
          {!fogMode && (
            <button
              type="button"
              data-testid="fog-panel-toggle"
              onClick={() => { setFogMode(true); setAreaMode(false); setAreaPanelOpen(false) }}
              disabled={!localGrid.enabled}
              {...(!localGrid.enabled ? { title: t('campaign_maps.fog_requires_grid') } : {})}
              aria-label={t('campaign_maps.fog_title')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8,
                cursor: !localGrid.enabled ? 'not-allowed' : 'pointer',
                background: 'rgba(21,18,28,0.85)', color: T.textMuted,
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 12, fontWeight: 600, fontFamily: T.sans,
                opacity: !localGrid.enabled ? 0.5 : 1,
              }}
            >
              ◎ {t('campaign_maps.fog_title')}
            </button>
          )}
          {fogMode && (
            <div
              data-testid="fog-config-panel"
              style={{
                background: 'rgba(21, 18, 28, 0.92)',
                border: '1px solid #2A2537',
                borderRadius: 10,
                padding: '10px 12px',
                fontFamily: T.sans,
                display: 'flex', flexDirection: 'column', gap: 8,
                width: 220,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: T.textMuted }}>
                  {t('campaign_maps.fog_title')}
                </span>
                <button
                  type="button"
                  data-testid="fog-done-btn"
                  onClick={() => setFogMode(false)}
                  style={{ background: 'transparent', border: 'none', color: T.textPrimary, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: T.sans }}
                >
                  {t('campaign_maps.fog_done')}
                </button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textPrimary, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  data-testid="fog-enable-toggle"
                  checked={fog.enabled}
                  onChange={() => handleToggleFogEnabled()}
                />
                {t('campaign_maps.fog_enable')}
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  data-testid="fog-brush-reveal"
                  onClick={() => setBrush('reveal')}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    fontFamily: T.sans, fontWeight: 600,
                    background: brush === 'reveal' ? '#5B3FA8' : 'transparent',
                    color: brush === 'reveal' ? T.textPrimary : T.textMuted,
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {t('campaign_maps.fog_brush_reveal')}
                </button>
                <button
                  type="button"
                  data-testid="fog-brush-hide"
                  onClick={() => setBrush('hide')}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    fontFamily: T.sans, fontWeight: 600,
                    background: brush === 'hide' ? '#5B3FA8' : 'transparent',
                    color: brush === 'hide' ? T.textPrimary : T.textMuted,
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {t('campaign_maps.fog_brush_hide')}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  data-testid="fog-reveal-all"
                  onClick={() => handleRevealAll()}
                  style={{ flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: T.sans, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: T.textPrimary }}
                >
                  {t('campaign_maps.fog_reveal_all')}
                </button>
                <button
                  type="button"
                  data-testid="fog-hide-all"
                  onClick={() => handleHideAll()}
                  style={{ flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: T.sans, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: T.textPrimary }}
                >
                  {t('campaign_maps.fog_hide_all')}
                </button>
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                {t('campaign_maps.fog_paint_hint')}
              </p>
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <div
          data-testid="marker-add-hint"
          style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: 'rgba(0,0,0,0.6)', color: T.textPrimary,
            padding: '4px 10px', borderRadius: 4, fontSize: 11, fontFamily: T.sans,
            pointerEvents: 'none',
          }}
        >
          {t('campaign_maps.marker_add_hint')}
        </div>
      )}

      <MapContainer
        key={map.id}
        crs={L.CRS.Simple}
        bounds={bounds}
        minZoom={-4}
        maxZoom={4}
        doubleClickZoom={false}
        style={{ height: '100%', width: '100%', background: T.bg }}
        attributionControl={false}
      >
        <InvalidateOnChange dep={expanded} />
        <ZoomScaleTracker onScale={setPxPerUnit} />
        <ImageOverlay url={signedUrl} bounds={bounds} />

        {/* Square grid overlay — pointer-events:none so it never blocks pan/markers */}
        {gridLines && (
          <SVGOverlay
            bounds={bounds}
            attributes={{ viewBox: `0 0 ${map.width} ${map.height}`, style: 'pointer-events: none' }}
          >
            {gridLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke={localGrid.color}
                strokeOpacity={0.5}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
              />
            ))}
          </SVGOverlay>
        )}

        {/* Area shapes — pointer-events:none; visible to all */}
        {(areas.length > 0 || areaPreview) && (
          <SVGOverlay
            bounds={bounds}
            attributes={{
              viewBox: `0 0 ${map.width} ${map.height}`,
              style: 'pointer-events: none',
              'data-testid': 'areas-overlay',
            }}
          >
            {areas.map(area =>
              area.shape === 'circle' ? (
                <circle
                  key={area.id}
                  cx={area.x}
                  cy={area.y}
                  r={area.radius}
                  fill={area.color}
                  fillOpacity={0.28}
                  stroke={area.color}
                  strokeOpacity={0.9}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                <rect
                  key={area.id}
                  x={area.x - area.radius}
                  y={area.y - area.radius}
                  width={area.radius * 2}
                  height={area.radius * 2}
                  fill={area.color}
                  fillOpacity={0.28}
                  stroke={area.color}
                  strokeOpacity={0.9}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              ),
            )}
            {areaPreview && areaPreview.radius > 0 && (
              areaPreview.shape === 'circle' ? (
                <circle
                  cx={areaPreview.x}
                  cy={areaPreview.y}
                  r={areaPreview.radius}
                  fill={areaPreview.color}
                  fillOpacity={0.18}
                  stroke={areaPreview.color}
                  strokeOpacity={0.7}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                <rect
                  x={areaPreview.x - areaPreview.radius}
                  y={areaPreview.y - areaPreview.radius}
                  width={areaPreview.radius * 2}
                  height={areaPreview.radius * 2}
                  fill={areaPreview.color}
                  fillOpacity={0.18}
                  stroke={areaPreview.color}
                  strokeOpacity={0.7}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  vectorEffect="non-scaling-stroke"
                />
              )
            )}
          </SVGOverlay>
        )}

        {/* Fog of war mask — pointer-events:none so it never blocks pan/markers */}
        {fog.enabled && (
          <SVGOverlay
            bounds={bounds}
            attributes={{
              viewBox: `0 0 ${map.width} ${map.height}`,
              style: 'pointer-events: none',
              'data-testid': 'fog-overlay',
            }}
          >
            <defs>
              <mask id={`fog-${map.id}`}>
                <rect x={0} y={0} width={map.width} height={map.height} fill="white" />
                {fogRevealedRects}
              </mask>
            </defs>
            <rect
              x={0}
              y={0}
              width={map.width}
              height={map.height}
              fill="#0a0a0f"
              fillOpacity={isOwner ? 0.5 : 1}
              mask={`url(#fog-${map.id})`}
            />
          </SVGOverlay>
        )}

        {isOwner && (
          <>
            <MapClickHandler
              onDblClick={latlng => {
                if (fogMode) return  // fog painting handled by FogInteraction
                if (areaMode) return  // area drawing handled by AreaInteraction
                if (armedPresetId) return  // dblclick ignored while preset is armed
                setPendingLatLng(latlng)
                setPendingLabel('')
              }}
              onSingleClick={latlng => {
                if (fogMode) return
                if (areaMode) return  // area drawing handled by AreaInteraction
                if (!armedPresetId) return
                void placePreset(latlng)
              }}
            />
            <ArmedCursorEffect armed={!!armedPresetId} />
          </>
        )}

        {/* Fog drag-paint: disables pan in fogMode, handles mousedown/mousemove/mouseup */}
        {isOwner && (
          <FogInteraction
            fogMode={fogMode}
            onPaint={handleFogPaint}
            onCommit={handleFogCommit}
          />
        )}

        {isOwner && (
          <AreaInteraction
            areaMode={areaMode}
            onStart={handleAreaStart}
            onMove={handleAreaMove}
            onEnd={handleAreaEnd}
          />
        )}

        {/* Existing markers */}
        {markers.map(m => (
          <Marker key={m.id} position={[m.y, m.x]} icon={pinIcon}>
            <Popup>
              <div
                data-testid={`marker-popup-${m.id}`}
                style={{ fontFamily: T.sans, minWidth: 120 }}
              >
                {editingId === m.id ? (
                  <>
                    <input
                      data-testid={`marker-label-input-${m.id}`}
                      value={editingLabel}
                      onChange={e => setEditingLabel(e.target.value)}
                      placeholder={t('campaign_maps.marker_label_placeholder')}
                      style={{
                        width: '100%', marginBottom: 6, padding: '3px 6px',
                        borderRadius: 4, boxSizing: 'border-box', fontSize: 16,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        data-testid={`marker-save-btn-${m.id}`}
                        onClick={() => void handleRenameMarker(m.id)}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                      >
                        {t('campaign_maps.marker_rename')}
                      </button>
                      <button
                        type="button"
                        data-testid={`marker-cancel-rename-${m.id}`}
                        onClick={() => setEditingId(null)}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                      >
                        {t('campaign_maps.marker_cancel')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      data-testid={`marker-label-${m.id}`}
                      style={{ fontSize: 13, marginBottom: isOwner ? 6 : 0, color: '#333' }}
                    >
                      {m.label || t('campaign_maps.marker_empty_label')}
                    </div>
                    {isOwner && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          data-testid={`marker-rename-${m.id}`}
                          onClick={() => { setEditingId(m.id); setEditingLabel(m.label) }}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                        >
                          {t('campaign_maps.marker_rename')}
                        </button>
                        <button
                          type="button"
                          data-testid={`marker-remove-${m.id}`}
                          onClick={() => void handleDeleteMarker(m.id)}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13, color: T.danger }}
                        >
                          {t('campaign_maps.marker_remove')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pending (new) marker for owner click-to-add flow */}
        {pendingLatLng && (
          <Marker position={[pendingLatLng.lat, pendingLatLng.lng]} icon={pinIcon}>
            <Popup>
              <div data-testid="pending-marker" style={{ fontFamily: T.sans, minWidth: 120 }}>
                <input
                  data-testid="pending-label-input"
                  value={pendingLabel}
                  onChange={e => setPendingLabel(e.target.value)}
                  placeholder={t('campaign_maps.marker_label_placeholder')}
                  style={{
                    width: '100%', marginBottom: 6, padding: '3px 6px',
                    borderRadius: 4, boxSizing: 'border-box', fontSize: 16,
                  }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    data-testid="pending-add-btn"
                    onClick={() => void handleAddMarker()}
                    disabled={savingPending}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                  >
                    {t('campaign_maps.marker_save')}
                  </button>
                  <button
                    type="button"
                    data-testid="pending-cancel-btn"
                    onClick={() => setPendingLatLng(null)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                  >
                    {t('campaign_maps.marker_cancel')}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Tokens — disc (or circular image) + label; owner can drag (snap) and edit/remove */}
        {tokens.filter(tok => !isTokenHiddenForViewer(tok)).map(tok => {
          const imageUrl = tok.imagePath ? (tokenImageUrlsByPath[tok.imagePath] ?? null) : null
          const conditionChips = tok.conditions
            .filter((c): c is ConditionKey => CONDITION_KEYS.includes(c as ConditionKey))
            .map(c => ({ abbr: t(`conditions.${c}.abbr` as Parameters<typeof t>[0]), color: CONDITION_COLOR[c] }))
          return (
            <Marker
              key={tok.id}
              position={[tok.y, tok.x]}
              icon={getTokenIcon(tok.color, tok.size, localGrid.size, pxPerUnit, imageUrl, conditionChips)}
              draggable={isOwner && !areaMode && !fogMode}
              {...(isOwner ? {
                eventHandlers: {
                  dragend(e: L.DragEndEvent) {
                    const latlng = (e.target as L.Marker).getLatLng()
                    const snapped = snapToGrid(latlng.lng, latlng.lat, tok.size, localGrid)
                    setTokens(prev => prev.map(tk => tk.id === tok.id ? { ...tk, x: snapped.x, y: snapped.y } : tk))
                    void updateMapToken(tok.id, { x: snapped.x, y: snapped.y }).catch(() => {})
                  },
                },
              } : {})}
            >
              <Popup>
                {isOwner ? (
                  <TokenPopupContent
                    token={tok}
                    campaignId={map.campaignId}
                    onSave={(id, patch) => void handleSaveToken(id, patch)}
                    onRemove={id => void handleRemoveToken(id)}
                    onUploadImage={(tokenId, file) => void handleUploadTokenImage(tokenId, file)}
                    onRemoveImage={(tokenId, imagePath) => void handleRemoveTokenImage(tokenId, imagePath)}
                    onPickCharacterPortrait={(tokenId, dataUrl) => void handlePickCharacterPortrait(tokenId, dataUrl)}
                    onToggleCondition={(tokenId, key) => void handleToggleCondition(tokenId, key)}
                  />
                ) : (
                  <div data-testid={`token-popup-${tok.id}`} style={{ fontFamily: T.sans }}>
                    <span data-testid={`token-label-${tok.id}`}>
                      {tok.label || t('campaign_maps.marker_empty_label')}
                    </span>
                  </div>
                )}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
