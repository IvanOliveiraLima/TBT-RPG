/**
 * CampaignMapViewer — Leaflet CRS.Simple image viewer with pan/zoom and map markers.
 * Shows a signed URL of a campaign map image inside a full-bounds ImageOverlay.
 * Owner can add, rename and remove markers; members can view markers and labels.
 * Meant to be rendered inside a modal that defines the container height.
 */

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from '@/i18n'
import { getCampaignMapSignedUrl } from '@/services/campaign-maps'
import type { CampaignMap } from '@/services/campaign-maps'
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

  const bounds = useMemo(
    () => L.latLngBounds([[0, 0], [map.height, map.width]]),
    [map.height, map.width],
  )

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
                        borderRadius: 4, boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        data-testid={`marker-save-btn-${m.id}`}
                        onClick={() => void handleRenameMarker(m.id)}
                        style={{ flex: 1, padding: '3px 0', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                      >
                        {t('campaign_maps.marker_rename')}
                      </button>
                      <button
                        type="button"
                        data-testid={`marker-cancel-rename-${m.id}`}
                        onClick={() => setEditingId(null)}
                        style={{ flex: 1, padding: '3px 0', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
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
                          style={{ flex: 1, padding: '3px 0', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                        >
                          {t('campaign_maps.marker_rename')}
                        </button>
                        <button
                          type="button"
                          data-testid={`marker-remove-${m.id}`}
                          onClick={() => void handleDeleteMarker(m.id)}
                          style={{ flex: 1, padding: '3px 0', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: T.danger }}
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
                    borderRadius: 4, boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    data-testid="pending-add-btn"
                    onClick={() => void handleAddMarker()}
                    disabled={savingPending}
                    style={{ flex: 1, padding: '3px 0', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  >
                    {t('campaign_maps.marker_save')}
                  </button>
                  <button
                    type="button"
                    data-testid="pending-cancel-btn"
                    onClick={() => setPendingLatLng(null)}
                    style={{ flex: 1, padding: '3px 0', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
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
