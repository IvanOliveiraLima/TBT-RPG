/**
 * TokenPresetsSection — Token preset library for CampaignDetail.
 *
 * Owner: can add, edit, and remove token presets (color, size, label, image).
 * Only rendered for owners.
 */

import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { useTranslation } from '@/i18n'
import {
  listTokenPresets,
  createTokenPreset,
  updateTokenPreset,
  deleteTokenPreset,
  uploadTokenPresetImage,
  getTokenPresetImageSignedUrl,
  removeTokenPresetImage,
} from '@/services/campaign-token-presets'
import type { CampaignTokenPreset } from '@/services/campaign-token-presets'

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

export function TokenPresetsSection({ campaignId, isOwner }: Props) {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<CampaignTokenPreset[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [editLabels, setEditLabels] = useState<Record<string, string>>({})

  const cancelledRef = useRef({ current: false })

  async function resolveSignedUrls(
    list: CampaignTokenPreset[],
    cancelled: { current: boolean },
  ) {
    const urls: Record<string, string> = {}
    for (const p of list) {
      if (cancelled.current) break
      if (p.imagePath) {
        try {
          urls[p.id] = await getTokenPresetImageSignedUrl(p.imagePath)
        } catch { /* ignore */ }
      }
    }
    if (!cancelled.current) setSignedUrls(prev => ({ ...prev, ...urls }))
  }

  useEffect(() => {
    const cancelled = { current: false }
    cancelledRef.current = cancelled
    listTokenPresets(campaignId)
      .then(list => {
        if (cancelled.current) return
        setPresets(list)
        const labels: Record<string, string> = {}
        for (const p of list) labels[p.id] = p.label
        setEditLabels(labels)
        void resolveSignedUrls(list, cancelled)
      })
      .catch(() => {})
    return () => { cancelled.current = true }
  }, [campaignId])

  async function handleAdd() {
    const newPreset = await createTokenPreset(campaignId)
    setPresets(prev => [...prev, newPreset])
    setEditLabels(prev => ({ ...prev, [newPreset.id]: '' }))
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    preset: CampaignTokenPreset,
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadErrors(prev => ({ ...prev, [preset.id]: t('token_presets.upload_error_type') }))
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [preset.id]: t('token_presets.upload_error_size') }))
      e.target.value = ''
      return
    }

    setUploadErrors(prev => ({ ...prev, [preset.id]: '' }))
    setUploading(prev => ({ ...prev, [preset.id]: true }))
    try {
      const path = await uploadTokenPresetImage(campaignId, preset.id, file)
      setPresets(prev => prev.map(p => p.id === preset.id ? { ...p, imagePath: path } : p))
      // Resolve new signed URL
      try {
        const url = await getTokenPresetImageSignedUrl(path)
        setSignedUrls(prev => ({ ...prev, [preset.id]: url }))
      } catch { /* ignore */ }
    } catch {
      setUploadErrors(prev => ({ ...prev, [preset.id]: t('token_presets.upload_error_type') }))
    } finally {
      setUploading(prev => ({ ...prev, [preset.id]: false }))
      e.target.value = ''
    }
  }

  async function handleRemoveImage(preset: CampaignTokenPreset) {
    if (!preset.imagePath) return
    await removeTokenPresetImage(preset.id, preset.imagePath).catch(() => undefined)
    setPresets(prev => prev.map(p => p.id === preset.id ? { ...p, imagePath: null } : p))
    setSignedUrls(prev => {
      const next = { ...prev }
      delete next[preset.id]
      return next
    })
  }

  async function handleRemoveConfirm() {
    const presetToRemove = presets.find(p => p.id === confirmRemoveId)
    if (!presetToRemove) { setConfirmRemoveId(null); return }
    setRemoving(true)
    try {
      await deleteTokenPreset(presetToRemove)
      setPresets(prev => prev.filter(p => p.id !== confirmRemoveId))
    } catch {
      // best-effort
    } finally {
      setRemoving(false)
      setConfirmRemoveId(null)
    }
  }

  return (
    <div
      data-testid="token-presets-section"
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
          {t('token_presets.section_title')}
        </div>

        {isOwner && (
          <button
            type="button"
            data-testid="presets-add"
            onClick={() => void handleAdd()}
            style={SMALL_BTN}
          >
            + {t('token_presets.add')}
          </button>
        )}
      </div>

      {/* Empty state */}
      {presets.length === 0 && (
        <div
          data-testid="presets-empty-state"
          style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: 12 }}
        >
          {t('token_presets.empty')}
        </div>
      )}

      {/* Preset list */}
      {presets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {presets.map(preset => (
            <div
              key={preset.id}
              data-testid={`preset-row-${preset.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                background: T.elevated,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: 10, padding: '10px 14px',
              }}
            >
              {/* Color disc / image thumbnail */}
              {signedUrls[preset.id] ? (
                <img
                  src={signedUrls[preset.id]}
                  alt=""
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    objectFit: 'cover', flexShrink: 0,
                    border: `2px solid ${preset.color}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: preset.color, flexShrink: 0,
                  }}
                />
              )}

              {/* Label input */}
              <input
                data-testid={`preset-label-${preset.id}`}
                type="text"
                value={editLabels[preset.id] ?? preset.label}
                placeholder={t('token_presets.name')}
                onChange={e => setEditLabels(prev => ({ ...prev, [preset.id]: e.target.value }))}
                onBlur={() => {
                  const label = editLabels[preset.id] ?? preset.label
                  void updateTokenPreset(preset.id, { label })
                }}
                style={{
                  flex: 1, minWidth: 80,
                  background: 'transparent',
                  border: `1px solid transparent`,
                  borderRadius: 6, padding: '4px 6px',
                  color: T.textPrimary, fontFamily: T.sans,
                  fontSize: 13, outline: 'none',
                }}
                className="hover:border-[#2A2537] focus:border-[#2A2537]"
              />

              {/* Color input */}
              <input
                data-testid={`preset-color-${preset.id}`}
                type="color"
                value={preset.color}
                onChange={e => {
                  const color = e.target.value
                  setPresets(prev => prev.map(p => p.id === preset.id ? { ...p, color } : p))
                  void updateTokenPreset(preset.id, { color })
                }}
                style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4, padding: 2 }}
                title={t('token_presets.color')}
              />

              {/* Size select */}
              <select
                data-testid={`preset-size-${preset.id}`}
                value={String(preset.size)}
                onChange={e => {
                  const size = Number(e.target.value)
                  setPresets(prev => prev.map(p => p.id === preset.id ? { ...p, size } : p))
                  void updateTokenPreset(preset.id, { size })
                }}
                className="dark-select"
                style={{
                  background: T.elevated,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 6, padding: '4px 6px',
                  color: T.textPrimary, fontFamily: T.sans,
                  fontSize: 12, cursor: 'pointer',
                }}
                title={t('token_presets.size')}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>

              {/* Image upload */}
              <label
                data-testid={`preset-image-upload-${preset.id}`}
                style={{
                  ...SMALL_BTN,
                  fontSize: 11,
                  opacity: uploading[preset.id] ? 0.5 : 1,
                  cursor: uploading[preset.id] ? 'default' : 'pointer',
                }}
              >
                {t('token_presets.image_upload')}
                <input
                  data-testid={`preset-image-input-${preset.id}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  disabled={uploading[preset.id]}
                  onChange={e => void handleFileChange(e, preset)}
                />
              </label>

              {/* Image remove (only if has image) */}
              {preset.imagePath && (
                <button
                  type="button"
                  data-testid={`preset-image-remove-${preset.id}`}
                  onClick={() => void handleRemoveImage(preset)}
                  style={{ ...SMALL_BTN, fontSize: 11, color: T.danger, border: `1px solid rgba(226,75,74,0.3)` }}
                >
                  {t('token_presets.image_remove')}
                </button>
              )}

              {/* Upload error */}
              {uploadErrors[preset.id] && (
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(226,75,74,0.1)',
                    border: `1px solid rgba(226,75,74,0.35)`,
                    borderRadius: 8, padding: '6px 10px',
                    fontSize: 11, color: T.danger,
                  }}
                >
                  {uploadErrors[preset.id]}
                </div>
              )}

              {/* Remove preset (two-step) */}
              {isOwner && (
                confirmRemoveId === preset.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      type="button"
                      data-testid={`preset-remove-confirm-${preset.id}`}
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
                      data-testid={`preset-remove-cancel-${preset.id}`}
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
                    data-testid={`preset-remove-${preset.id}`}
                    onClick={() => setConfirmRemoveId(preset.id)}
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
  )
}
