import { useState } from 'react'
import { useSyncConflictStore } from '@/store/useSyncConflictStore'
import { useTranslation } from '@/i18n'
import { SyncConflictModal } from './SyncConflictModal'

const COLOR  = '#EF9F27'
const BG     = 'rgba(239,159,39,0.12)'
const BORDER = 'rgba(239,159,39,0.35)'

export function SyncConflictBanner() {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const conflictCount = useSyncConflictStore(s => Object.keys(s.conflicts).length)

  // When conflictCount drops to 0, this component returns null — modal unmounts automatically
  if (conflictCount === 0) return null

  return (
    <>
      <div
        style={{
          position:  'fixed',
          bottom:    80,
          left:      '50%',
          transform: 'translateX(-50%)',
          width:     'min(400px, calc(100vw - 32px))',
          zIndex:    9998,
        }}
      >
        <div
          role="status"
          style={{
            background:    BG,
            border:        `1px solid ${BORDER}`,
            borderRadius:  10,
            padding:       '12px 16px',
            display:       'flex',
            alignItems:    'center',
            gap:           10,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠</span>
          <div style={{ flex: 1, fontSize: 13, color: COLOR, fontWeight: 500 }}>
            {t('sync_conflict.banner', { n: conflictCount })}
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background:   'transparent',
              border:       `1px solid ${BORDER}`,
              borderRadius: 6,
              padding:      '4px 10px',
              fontSize:     12,
              fontWeight:   600,
              color:        COLOR,
              cursor:       'pointer',
              flexShrink:   0,
            }}
          >
            {t('sync_conflict.resolve')}
          </button>
        </div>
      </div>

      {modalOpen && <SyncConflictModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
