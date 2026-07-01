/**
 * CampaignMapViewer — Leaflet CRS.Simple image viewer with pan/zoom.
 * Shows a signed URL of a campaign map image inside a full-bounds ImageOverlay.
 * Meant to be rendered inside a modal that defines the container height.
 */

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, ImageOverlay } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from '@/i18n'
import { getCampaignMapSignedUrl } from '@/services/campaign-maps'
import type { CampaignMap } from '@/services/campaign-maps'

const T = {
  bg:        '#15121C',
  textMuted: '#7A7788',
  sans:      "'Inter', system-ui, sans-serif",
} as const

interface Props {
  map: CampaignMap
}

export function CampaignMapViewer({ map }: Props) {
  const { t } = useTranslation()
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCampaignMapSignedUrl(map.imagePath)
      .then(url => { if (!cancelled) setSignedUrl(url) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [map.imagePath])

  const bounds = useMemo(
    () => L.latLngBounds([[0, 0], [map.height, map.width]]),
    [map.height, map.width],
  )

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
      style={{ height: '70vh', width: '100%' }}
    >
      <MapContainer
        key={map.id}
        crs={L.CRS.Simple}
        bounds={bounds}
        minZoom={-4}
        maxZoom={4}
        style={{ height: '100%', width: '100%', background: T.bg }}
        attributionControl={false}
      >
        <ImageOverlay
          url={signedUrl}
          bounds={bounds}
        />
      </MapContainer>
    </div>
  )
}
