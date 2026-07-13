import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from '@/i18n'
import { getCampaignMap } from '@/services/campaign-maps'
import { CampaignMapViewer } from '@/components/campaigns/CampaignMapViewer'
import type { CampaignMap } from '@/services/campaign-maps'

export default function CampaignMapBroadcast() {
  const { mapId } = useParams<{ id: string; mapId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)

  const [map, setMap] = useState<CampaignMap | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (!mapId) return
    getCampaignMap(mapId)
      .then(m => { setMap(m); setLoading(false) })
      .catch(() => setLoading(false))
  }, [mapId, user, authLoading, navigate])

  const containerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    background: '#0E0C16',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  if (authLoading || loading) {
    return (
      <div data-testid="broadcast-loading" style={containerStyle}>
        <span style={{ color: '#8B7EC8', fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>
          {t('broadcast.waiting')}
        </span>
      </div>
    )
  }

  if (typeof BroadcastChannel === 'undefined') {
    return (
      <div data-testid="broadcast-unsupported" style={containerStyle}>
        <span style={{ color: '#8B7EC8', fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>
          {t('broadcast.unsupported')}
        </span>
      </div>
    )
  }

  if (!map) {
    return (
      <div data-testid="broadcast-loading" style={containerStyle}>
        <span style={{ color: '#8B7EC8', fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>
          {t('broadcast.waiting')}
        </span>
      </div>
    )
  }

  return (
    <div data-testid="broadcast-page" style={containerStyle}>
      <CampaignMapViewer map={map} broadcast expanded />
    </div>
  )
}
