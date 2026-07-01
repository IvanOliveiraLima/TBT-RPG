/**
 * CampaignMapsSection — Maps section for CampaignDetail.
 *
 * Owner: can upload new maps (with file + name), remove existing maps.
 * Member: can view the list and open the map viewer.
 * Viewer opens in a modal overlay with Leaflet pan/zoom.
 */

import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { useTranslation } from '@/i18n'
import {
  listCampaignMaps,
  uploadCampaignMap,
  deleteCampaignMap,
} from '@/services/campaign-maps'
import type { CampaignMap } from '@/services/campaign-maps'
import { CampaignMapViewer } from './CampaignMapViewer'

const T = {
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textMuted:     '#7A7788',
  danger:        '#E24B4A',
  purple:        '#5B3FA8',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: T.serif, fontSize: 11, fontWeight: 600,
  letterSpacing: 2, textTransform: 'uppercase', color: T.textMuted,
}

const SMALL_BTN: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${T.borderSubtle}`,
  borderRadius: 8, padding: '5px 12px',
  color: T.textSecondary, fontFamily: T.sans,
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

interface Props {
  campaignId: string
  isOwner: boolean
}

interface UploadState {
  name: string
  uploading: boolean
  error: string | null
}

export function CampaignMapsSection({ campaignId, isOwner }: Props) {
  const { t } = useTranslation()
  const [maps, setMaps] = useState<CampaignMap[]>([])
  const [viewerMap, setViewerMap] = useState<CampaignMap | null>(null)
  const [upload, setUpload] = useState<UploadState>({ name: '', uploading: false, error: null })
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listCampaignMaps(campaignId).then(setMaps).catch(() => setMaps([]))
  }, [campaignId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUpload(u => ({ ...u, error: null }))

    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUpload(u => ({ ...u, error: t('campaign_maps.upload_error_type') }))
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUpload(u => ({ ...u, error: t('campaign_maps.upload_error_size') }))
      e.target.value = ''
      return
    }

    const name = upload.name.trim() || file.name.replace(/\.[^.]+$/, '')
    setUpload(u => ({ ...u, uploading: true, error: null }))
    try {
      const newMap = await uploadCampaignMap(campaignId, file, name)
      setMaps(prev => [...prev, newMap])
      setUpload({ name: '', uploading: false, error: null })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setUpload(u => ({ ...u, uploading: false, error: t('campaign_maps.upload_error_type') }))
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveConfirm() {
    const mapToRemove = maps.find(m => m.id === confirmRemoveId)
    if (!mapToRemove) { setConfirmRemoveId(null); return }
    setRemoving(true)
    try {
      await deleteCampaignMap(mapToRemove)
      setMaps(prev => prev.filter(m => m.id !== confirmRemoveId))
    } catch {
      // best-effort: keep UI consistent on failure
    } finally {
      setRemoving(false)
      setConfirmRemoveId(null)
    }
  }

  return (
    <>
      {/* ── Maps section card ──────────────────────────────────────────── */}
      <div
        data-testid="campaign-detail-maps"
        style={{
          background: T.surface,
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div style={SECTION_HEADER}>
            {t('campaign_maps.section_title')} ({maps.length})
          </div>

          {isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                data-testid="map-name-input"
                type="text"
                placeholder={t('campaign_maps.name_label')}
                value={upload.name}
                onChange={e => setUpload(u => ({ ...u, name: e.target.value }))}
                disabled={upload.uploading}
                style={{
                  background: T.elevated,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 8,
                  padding: '5px 10px',
                  color: T.textPrimary,
                  fontFamily: T.sans,
                  fontSize: 12,
                  width: 140,
                  outline: 'none',
                }}
              />
              <label
                data-testid="add-map-label"
                style={{
                  ...SMALL_BTN,
                  opacity: upload.uploading ? 0.5 : 1,
                  cursor: upload.uploading ? 'default' : 'pointer',
                }}
              >
                + {t('campaign_maps.add')}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  disabled={upload.uploading}
                  onChange={handleFileChange}
                  data-testid="map-file-input"
                />
              </label>
            </div>
          )}
        </div>

        {/* Upload error */}
        {upload.error && (
          <div
            data-testid="map-upload-error"
            style={{
              marginBottom: 12,
              background: 'rgba(226,75,74,0.1)',
              border: `1px solid rgba(226,75,74,0.35)`,
              borderRadius: 8, padding: '8px 12px',
              fontSize: 12, color: T.danger,
            }}
          >
            {upload.error}
          </div>
        )}

        {/* Empty state */}
        {maps.length === 0 && (
          <div
            data-testid="maps-empty-state"
            style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: 12 }}
          >
            {t('campaign_maps.empty')}
          </div>
        )}

        {/* Map list */}
        {maps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {maps.map(m => (
              <div
                key={m.id}
                data-testid={`map-row-${m.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: T.elevated,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 10, padding: '10px 14px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewerMap(m)}
                  data-testid={`open-map-${m.id}`}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: T.textPrimary, fontFamily: T.sans, fontSize: 13,
                    fontWeight: 500, cursor: 'pointer', textAlign: 'left', flex: 1,
                  }}
                >
                  {m.name}
                </button>

                {isOwner && (
                  confirmRemoveId === m.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: T.textMuted }}>
                        {t('campaign_maps.remove_confirm')}
                      </span>
                      <button
                        type="button"
                        data-testid={`confirm-remove-map-${m.id}`}
                        onClick={() => void handleRemoveConfirm()}
                        disabled={removing}
                        style={{
                          ...SMALL_BTN,
                          border: `1px solid ${T.danger}`,
                          color: T.danger,
                          fontSize: 11,
                        }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        data-testid={`cancel-remove-map-${m.id}`}
                        onClick={() => setConfirmRemoveId(null)}
                        disabled={removing}
                        style={{ ...SMALL_BTN, fontSize: 11 }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid={`remove-map-${m.id}`}
                      onClick={() => setConfirmRemoveId(m.id)}
                      style={{ ...SMALL_BTN, color: T.danger, border: `1px solid rgba(226,75,74,0.3)`, fontSize: 11 }}
                    >
                      ✕
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Map viewer modal ───────────────────────────────────────────── */}
      {viewerMap && (
        <div
          data-testid="map-viewer-modal"
          onClick={e => { if (e.target === e.currentTarget) setViewerMap(null) }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'stretch', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.borderDefault}`,
              borderRadius: 16,
              overflow: 'hidden',
              maxWidth: 1100,
              width: '100%',
              margin: '0 auto',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: `1px solid ${T.borderSubtle}`,
            }}>
              <span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                {viewerMap.name}
              </span>
              <button
                type="button"
                onClick={() => setViewerMap(null)}
                data-testid="close-map-viewer"
                style={{
                  background: 'transparent', border: 'none',
                  color: T.textMuted, fontSize: 18, cursor: 'pointer', padding: '2px 6px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Viewer — key ensures remount on map switch so state resets cleanly */}
            <CampaignMapViewer key={viewerMap.id} map={viewerMap} />
          </div>
        </div>
      )}

      {/* ── Confirm remove modal ───────────────────────────────────────── */}
    </>
  )
}
