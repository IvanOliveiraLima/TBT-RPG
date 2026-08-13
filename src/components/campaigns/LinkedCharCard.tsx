import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import { CharCardVisual } from '@/components/character/CharCardVisual'
import { deriveTotalLevel, formatClassesShort } from '@/domain/derived'
import { classLabel as resolveClassLabel } from '@/utils/classLabel'
import { fetchCampaignCharacterImages } from '@/services/campaign-view'
import type { LinkedCharacterDetails } from '@/services/campaign-view'

const T = {
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  textMuted:    '#7A7788',
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface LinkedCharCardProps {
  detail: LinkedCharacterDetails
  campaignId: string
  isMaster: boolean
  currentUserId: string | null
  onUnlink: () => Promise<void>
}

export function LinkedCharCard({
  detail,
  campaignId,
  isMaster,
  currentUserId,
  onUnlink,
}: LinkedCharCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [unlinking, setUnlinking] = useState(false)

  // Lazy image state — images load in background after card renders
  const [portraitData, setPortraitData] = useState<string | null>(detail.portraitData)
  const [imagesLoaded, setImagesLoaded] = useState(detail.portraitData != null)

  useEffect(() => {
    if (imagesLoaded) return
    if (!detail.character) return  // deleted char — no images to fetch

    let cancelled = false

    fetchCampaignCharacterImages({
      userId: detail.ownerUserId,
      characterId: detail.characterId,
    })
      .then((images) => {
        if (cancelled) return
        setPortraitData(images.portraitData)
        setImagesLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setImagesLoaded(true)  // stop retrying — placeholder stays
      })

    return () => {
      cancelled = true
    }
  }, [detail.characterId, detail.ownerUserId, detail.character, imagesLoaded])

  const char = detail.character
  const canUnlink = isMaster || (currentUserId != null && currentUserId === detail.ownerUserId)

  const name = char?.name ?? t('campaign_detail.unknown_character')
  const raceLabel = char?.race ?? null
  const classLabel = char ? (formatClassesShort(char, name => resolveClassLabel(name, t)) || null) : null
  const totalLevel = char ? deriveTotalLevel(char) : null
  const hpCurrent = char?.hp?.current ?? null
  const hpMax = char?.hp?.max ?? null

  const ownerLabel = detail.ownerDisplayName
    ? `${t('campaign_chars.owner_label')}: ${detail.ownerDisplayName}`
    : `${t('campaign_chars.owner_label')}: ${t('campaign_detail.unknown_member')}`

  async function handleUnlinkClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (unlinking) return
    setUnlinking(true)
    try {
      await onUnlink()
    } finally {
      setUnlinking(false)
    }
  }

  function handleCardClick() {
    if (char) {
      navigate(`/campaigns/${campaignId}/characters/${detail.characterId}`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') handleCardClick()
  }

  const unlinkButton = (
    <button
      onClick={handleUnlinkClick}
      disabled={unlinking}
      data-testid={`unlink-char-${detail.characterId}`}
      aria-label={t('aria.unlink_character', { name })}
      style={{
        background: 'transparent',
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 8, padding: '5px 10px',
        color: T.textMuted, fontFamily: T.sans,
        fontSize: 11, cursor: unlinking ? 'default' : 'pointer',
        opacity: unlinking ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      {unlinking ? t('campaign_chars.unlinking') : t('campaign_chars.unlink')}
    </button>
  )

  return (
    <div
      data-testid={`linked-char-${detail.characterId}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={t('aria.linked_char_view', { name })}
      style={{
        display: 'flex', gap: 12, padding: '10px 12px',
        background: T.elevated,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 10,
        cursor: char ? 'pointer' : 'default',
        ...(isMobile
          ? { flexDirection: 'column', alignItems: 'stretch' }
          : { alignItems: 'center', justifyContent: 'space-between' }),
      }}
    >
      <CharCardVisual
        name={name}
        raceLabel={raceLabel}
        classLabel={classLabel}
        totalLevel={totalLevel}
        portraitData={portraitData}
        hpCurrent={hpCurrent}
        hpMax={hpMax}
        ownerLabel={ownerLabel}
        isLoading={!imagesLoaded && char != null}
      />

      {canUnlink && (
        isMobile
          ? <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{unlinkButton}</div>
          : unlinkButton
      )}
    </div>
  )
}
