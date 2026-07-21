import { useState } from 'react'
import { useSyncConflictStore } from '@/store/useSyncConflictStore'
import type { ConflictEntry } from '@/store/useSyncConflictStore'
import {
  resolveConflictKeepMine,
  resolveConflictKeepCloud,
  resolveConflictKeepBoth,
} from '@/services/sync'
import { useTranslation } from '@/i18n'

const T = {
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textTertiary:  '#A09DB0',
  textMuted:     '#7A7788',
  warn:          '#EF9F27',
  warnBorder:    'rgba(239,159,39,0.35)',
  danger:        '#E24B4A',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString()
}

interface Props {
  onClose: () => void
}

export function SyncConflictModal({ onClose }: Props) {
  const { t } = useTranslation()
  const conflicts = useSyncConflictStore(s => Object.values(s.conflicts))

  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [errorIds,    setErrorIds]    = useState<Set<string>>(new Set())

  function clearError(id: string) {
    setErrorIds(prev => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })
  }

  function setError(id: string) {
    setErrorIds(prev => new Set(prev).add(id))
  }

  async function handleKeepMine(entry: ConflictEntry) {
    const id = entry.local.id
    setResolvingId(id)
    clearError(id)
    try {
      await resolveConflictKeepMine(entry.local)
    } catch {
      setError(id)
    } finally {
      setResolvingId(null)
    }
  }

  async function handleKeepCloud(entry: ConflictEntry) {
    const id = entry.local.id
    setResolvingId(id)
    clearError(id)
    try {
      await resolveConflictKeepCloud(entry.cloud, id)
    } catch {
      setError(id)
    } finally {
      setResolvingId(null)
    }
  }

  async function handleKeepBoth(entry: ConflictEntry) {
    const id = entry.local.id
    setResolvingId(id)
    clearError(id)
    try {
      const copyName = `${entry.local.name} ${t('sync_conflict.copy_suffix')}`
      await resolveConflictKeepBoth(entry.local, entry.cloud, copyName)
    } catch {
      setError(id)
    } finally {
      setResolvingId(null)
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && resolvingId === null) onClose()
  }

  return (
    /* Backdrop */
    <div
      onClick={handleBackdropClick}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         1000,
        padding:        '16px',
      }}
    >
      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('sync_conflict.title')}
        data-testid="sync-conflict-modal"
        style={{
          background:   T.surface,
          border:       `1px solid ${T.borderDefault}`,
          borderRadius: 16,
          width:        '100%',
          maxWidth:     480,
          maxHeight:    '85vh',
          display:      'flex',
          flexDirection:'column',
          boxShadow:    '0 24px 60px rgba(0,0,0,0.6)',
          fontFamily:   T.sans,
          overflow:     'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          padding:      '18px 20px 14px',
          borderBottom: `1px solid ${T.borderSubtle}`,
          flexShrink:   0,
        }}>
          <span style={{ color: T.warn, fontSize: 18 }}>⚠</span>
          <h2 style={{
            fontFamily: T.serif,
            fontSize:   15,
            fontWeight: 600,
            color:      T.textPrimary,
            margin:     0,
            flex:       1,
          }}>
            {t('sync_conflict.title')}
          </h2>
          <button
            onClick={onClose}
            disabled={resolvingId !== null}
            aria-label="Fechar"
            style={{
              background:   'transparent',
              border:       'none',
              color:        T.textMuted,
              fontSize:     18,
              cursor:       resolvingId !== null ? 'default' : 'pointer',
              padding:      '2px 6px',
              borderRadius: 6,
              opacity:      resolvingId !== null ? 0.4 : 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Conflict list — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px 20px' }}>
          {conflicts.map(entry => {
            const id        = entry.local.id
            const resolving = resolvingId === id
            const hasError  = errorIds.has(id)

            return (
              <div
                key={id}
                data-testid={`conflict-card-${id}`}
                style={{
                  background:   T.elevated,
                  border:       `1px solid ${T.borderSubtle}`,
                  borderRadius: 12,
                  padding:      '14px 16px',
                  marginBottom: 12,
                }}
              >
                {/* Char name */}
                <div style={{
                  fontFamily: T.serif,
                  fontSize:   14,
                  fontWeight: 600,
                  color:      T.textPrimary,
                  marginBottom: 6,
                }}>
                  {entry.local.name}
                </div>

                {/* Body text */}
                <p style={{ margin: '0 0 10px', fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
                  {t('sync_conflict.body')}
                </p>

                {/* Timestamps */}
                <div style={{
                  display:      'flex',
                  gap:          12,
                  marginBottom: 14,
                  fontSize:     12,
                  color:        T.textTertiary,
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: T.textSecondary }}>
                      {t('sync_conflict.this_device')}:
                    </span>
                    {' '}{formatTime(entry.local.updatedAt)}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: T.textSecondary }}>
                      {t('sync_conflict.cloud')}:
                    </span>
                    {' '}{formatTime(entry.cloud.updatedAt)}
                  </div>
                </div>

                {/* Error */}
                {hasError && (
                  <div
                    role="alert"
                    style={{
                      background:   'rgba(226,75,74,0.1)',
                      border:       '1px solid rgba(226,75,74,0.35)',
                      borderRadius: 8,
                      padding:      '8px 12px',
                      fontSize:     12,
                      color:        T.danger,
                      marginBottom: 10,
                    }}
                  >
                    Erro ao resolver conflito. Tente novamente.
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {/* Keep mine */}
                  <button
                    onClick={() => { void handleKeepMine(entry) }}
                    disabled={resolving}
                    data-testid={`keep-mine-${id}`}
                    style={{
                      flex:         '1 1 auto',
                      background:   resolving ? T.elevated : 'transparent',
                      border:       `1px solid ${T.borderDefault}`,
                      borderRadius: 8,
                      padding:      '8px 10px',
                      fontSize:     12,
                      fontWeight:   600,
                      color:        resolving ? T.textMuted : T.textSecondary,
                      cursor:       resolving ? 'default' : 'pointer',
                      opacity:      resolving ? 0.5 : 1,
                      transition:   'all 150ms',
                    }}
                  >
                    {t('sync_conflict.keep_mine')}
                  </button>

                  {/* Keep cloud */}
                  <button
                    onClick={() => { void handleKeepCloud(entry) }}
                    disabled={resolving}
                    data-testid={`keep-cloud-${id}`}
                    style={{
                      flex:         '1 1 auto',
                      background:   resolving ? T.elevated : 'transparent',
                      border:       `1px solid ${T.borderDefault}`,
                      borderRadius: 8,
                      padding:      '8px 10px',
                      fontSize:     12,
                      fontWeight:   600,
                      color:        resolving ? T.textMuted : T.textSecondary,
                      cursor:       resolving ? 'default' : 'pointer',
                      opacity:      resolving ? 0.5 : 1,
                      transition:   'all 150ms',
                    }}
                  >
                    {t('sync_conflict.keep_cloud')}
                  </button>

                  {/* Keep both */}
                  <button
                    onClick={() => { void handleKeepBoth(entry) }}
                    disabled={resolving}
                    data-testid={`keep-both-${id}`}
                    style={{
                      flex:         '1 0 100%',
                      background:   resolving ? T.elevated : `rgba(239,159,39,0.08)`,
                      border:       `1px solid ${T.warnBorder}`,
                      borderRadius: 8,
                      padding:      '8px 10px',
                      fontSize:     12,
                      fontWeight:   600,
                      color:        resolving ? T.textMuted : T.warn,
                      cursor:       resolving ? 'default' : 'pointer',
                      opacity:      resolving ? 0.5 : 1,
                      transition:   'all 150ms',
                    }}
                  >
                    {t('sync_conflict.keep_both')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
