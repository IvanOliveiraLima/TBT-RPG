import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n'
import { listCampaignRolls, clearCampaignRolls } from '@/services/campaign-dice-log'
import type { CampaignDiceRoll } from '@/services/campaign-dice-log'

const T = {
  surface:      '#15121C',
  panel:        '#1B1725',
  border:       '#2A2537',
  borderStrong: '#4A3A6B',
  text:         '#F4EFE0',
  textSub:      '#C8C4D6',
  textMuted:    '#7A7788',
  ruby:         '#8B1A2E',
  rubyLight:    '#C0392B',
  gold:         '#D4A017',
  green:        '#27AE60',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

const POLL_INTERVAL_MS = 5000

function formatRelative(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000)
  if (diffSec < 60)  return `${diffSec}s`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`
  return `${Math.floor(diffSec / 3600)}h`
}

interface Props {
  campaignId: string
  isOwner: boolean
}

export function CampaignRollLog({ campaignId, isOwner }: Props) {
  const { t } = useTranslation()
  const [rolls, setRolls] = useState<CampaignDiceRoll[]>([])
  const [clearing, setClearing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    listCampaignRolls(campaignId).then(setRolls).catch(() => setRolls([]))
    intervalRef.current = setInterval(() => {
      listCampaignRolls(campaignId).then(setRolls).catch(() => setRolls([]))
    }, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [campaignId])

  async function handleClear() {
    setClearing(true)
    await clearCampaignRolls(campaignId)
    listCampaignRolls(campaignId).then(setRolls).catch(() => setRolls([]))
    setClearing(false)
  }

  return (
    <div
      data-testid="campaign-roll-log"
      style={{
        background: T.panel,
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 14,
        padding: 20,
        fontFamily: T.sans,
        color: T.text,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          fontFamily: T.serif, fontSize: 11, fontWeight: 600,
          letterSpacing: 2, textTransform: 'uppercase', color: T.textMuted,
        }}>
          {t('dice_log.title')}
        </div>
        {isOwner && rolls.length > 0 && (
          <button
            data-testid="dice-log-clear-btn"
            onClick={() => { void handleClear() }}
            disabled={clearing}
            style={{
              background: 'transparent',
              border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '5px 12px',
              color: T.textMuted, fontFamily: T.sans,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('dice_log.clear')}
          </button>
        )}
      </div>

      {/* Empty state */}
      {rolls.length === 0 && (
        <div
          data-testid="dice-log-empty"
          style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: 12 }}
        >
          {t('dice_log.empty')}
        </div>
      )}

      {/* Roll list */}
      {rolls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rolls.map(roll => {
            const isCritHit  = roll.result.crit === 'hit'
            const isCritMiss = roll.result.crit === 'miss'
            const totalColor = isCritHit ? T.green : isCritMiss ? T.rubyLight : T.text

            return (
              <div
                key={roll.id}
                data-testid="dice-log-entry"
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 8, padding: '6px 10px',
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8, fontSize: 12,
                }}
              >
                {/* Actor */}
                <span
                  data-testid="dice-log-actor"
                  style={{ fontWeight: 600, color: T.gold, minWidth: 0, flex: '0 0 auto', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {roll.actorName}
                </span>

                {/* Label */}
                <span style={{ color: T.textSub, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {roll.result.label ?? roll.result.notation}
                </span>

                {/* Individual dice (compact) */}
                <span style={{ color: T.textMuted, fontSize: 11 }}>
                  [{roll.result.dice.map(d => d.value).join(', ')}]
                </span>

                {/* Total */}
                <span
                  data-testid="dice-log-total"
                  style={{ fontWeight: 700, color: totalColor, fontFamily: T.serif, fontSize: 15, minWidth: 28, textAlign: 'right' }}
                >
                  {roll.result.total}
                </span>

                {/* Relative time */}
                <span style={{ color: T.textMuted, fontSize: 11, flex: '0 0 auto' }}>
                  {formatRelative(roll.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
