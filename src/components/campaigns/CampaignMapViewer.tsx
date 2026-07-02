/**
 * CampaignMapViewer — Leaflet CRS.Simple image viewer with pan/zoom and map markers.
 * Shows a signed URL of a campaign map image inside a full-bounds ImageOverlay.
 * Owner can add, rename and remove markers; members can view markers and labels.
 * Meant to be rendered inside a modal that defines the container height.
 */

import { useEffect, useState, useMemo } from 'react'
import type React from 'react'
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents, SVGOverlay } from 'react-leaflet'
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

const T = {
  bg:          '#15121C',
  textMuted:   '#7A7788',
  textPrimary: '#F4EFE0',
  danger:      '#E24B4A',
  sans:        "'Inter', system-ui, sans-serif",
} as const

const MAP_POLL_MS = 15_000

const PIN_ICON_HTML =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="#5DCAA5" stroke="#15121C" stroke-width="1.5">' +
  '<path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>' +
  '<circle cx="12" cy="9" r="2.5" fill="#15121C"/>' +
  '</svg>'

// Inner component — captures map click events for owner add-marker flow
function MapClickHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

interface Props {
  map: CampaignMap
  isOwner?: boolean
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

export function CampaignMapViewer({ map, isOwner = false }: Props) {
  const { t } = useTranslation()
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [markers, setMarkers] = useState<CampaignMapMarker[]>([])
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

  // Poll markers every 15s for non-owners (members see additions without reopening)
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

  const pinIcon = useMemo(() => L.divIcon({
    className: 'tbt-map-pin',
    html: PIN_ICON_HTML,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  }), [])

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
      setPanelOpen(false)
    } catch {
      // best-effort: local state still valid, user can retry
    } finally {
      setSavingGrid(false)
    }
  }

  async function handleDeleteMarker(id: string) {
    try {
      await deleteMapMarker(id)
      setMarkers(prev => prev.filter(m => m.id !== id))
    } catch {
      // noop
    }
  }

  if (error) {
    return (
      <div
        data-testid="campaign-map-viewer-error"
        style={{
          height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      style={{ height: '70vh', width: '100%', position: 'relative' }}
    >
      {/* ── Grid toggle button — collapsed (owner only) ──────────────── */}
      {isOwner && !panelOpen && (
        <button
          type="button"
          data-testid="grid-panel-toggle"
          onClick={() => setPanelOpen(true)}
          aria-label={t('campaign_maps.grid_title')}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 1000,
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

      {/* ── Grid config panel — expanded (owner only) ─────────────────── */}
      {isOwner && panelOpen && (
        <div
          data-testid="grid-config-panel"
          style={{
            position: 'absolute', top: 8, right: 8,
            zIndex: 1000,
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
        style={{ height: '100%', width: '100%', background: T.bg }}
        attributionControl={false}
      >
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

        {isOwner && (
          <MapClickHandler
            onMapClick={latlng => {
              setPendingLatLng(latlng)
              setPendingLabel('')
            }}
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
      </MapContainer>
    </div>
  )
}
