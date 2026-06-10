import { useState } from 'react'
import { useTranslation } from '@/i18n'
import type { Campaign } from '@/domain/campaign'
import { regenerateInviteCode, CampaignServiceError } from '@/services/campaign'

const T = {
  bg:            '#0F0D14',
  surface:       '#15121C',
  borderSubtle:  '#2A2537',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textMuted:     '#7A7788',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  danger:        '#E24B4A',
  success:       '#5DCAA5',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

function formatCode(code: string): string {
  if (code.length !== 8) return code
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

interface InviteCodeBlockProps {
  campaign: Campaign
  isOwner: boolean
  onCodeRegenerated: (newCode: string) => void
}

export function InviteCodeBlock({ campaign, isOwner, onCodeRegenerated }: InviteCodeBlockProps) {
  const { t } = useTranslation()
  const [copiedTarget, setCopiedTarget] = useState<'link' | 'code' | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOwner) return null

  function buildInviteLink(): string {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    return `${window.location.origin}${base}/join/${campaign.inviteCode}`
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(buildInviteLink())
      setCopiedTarget('link')
      setTimeout(() => setCopiedTarget(null), 2000)
    } catch (err) {
      console.error('Failed to copy link', err)
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(campaign.inviteCode)
      setCopiedTarget('code')
      setTimeout(() => setCopiedTarget(null), 2000)
    } catch (err) {
      console.error('Failed to copy code', err)
    }
  }

  async function handleRegenerate() {
    if (!confirm(t('invite.regenerate_confirm'))) return
    setRegenerating(true)
    setError(null)
    try {
      const newCode = await regenerateInviteCode(campaign.id)
      onCodeRegenerated(newCode)
    } catch (err) {
      const code = err instanceof CampaignServiceError ? err.code : 'unknown'
      setError(code)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div
      data-testid="invite-code-block"
      style={{
        background: T.surface,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 14,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div style={{
        fontFamily: T.serif, fontSize: 11, fontWeight: 600,
        letterSpacing: 2, textTransform: 'uppercase',
        color: T.textMuted, marginBottom: 6,
      }}>
        {t('invite.title')}
      </div>
      <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.55, marginBottom: 14 }}>
        {t('invite.description')}
      </div>

      {/* Code display */}
      <div
        data-testid="invite-code-text"
        style={{
          fontFamily: T.serif, fontSize: 20, fontWeight: 700,
          color: T.gold, letterSpacing: 3,
          background: T.bg,
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: 8, padding: '10px 16px',
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        {formatCode(campaign.inviteCode)}
      </div>

      {/* Copy buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          data-testid="copy-invite-link"
          onClick={() => void handleCopyLink()}
          aria-label={t('aria.copy_invite_link')}
          style={{
            flex: 1,
            background: copiedTarget === 'link' ? T.borderSubtle : T.purple,
            border: 'none',
            borderRadius: 8, padding: '10px',
            color: T.textPrimary, fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            fontFamily: T.sans,
            transition: 'background 200ms',
          }}
        >
          {copiedTarget === 'link' ? t('invite.link_copied') : t('invite.copy_link')}
        </button>

        <button
          data-testid="copy-invite-code"
          onClick={() => void handleCopyCode()}
          aria-label={t('aria.copy_invite_code')}
          style={{
            flex: 1,
            background: 'transparent',
            border: `1px solid ${T.borderSubtle}`,
            borderRadius: 8, padding: '10px',
            color: copiedTarget === 'code' ? T.success : T.textSecondary,
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            fontFamily: T.sans,
            transition: 'color 200ms',
          }}
        >
          {copiedTarget === 'code' ? t('invite.code_copied') : t('invite.copy_code')}
        </button>
      </div>

      <button
        data-testid="invite-code-regenerate"
        onClick={() => void handleRegenerate()}
        disabled={regenerating}
        aria-label={t('aria.regenerate_invite_code')}
        style={{
          width: '100%',
          background: 'transparent',
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: 8, padding: '8px',
          color: T.textMuted, fontSize: 11, fontWeight: 600,
          cursor: regenerating ? 'not-allowed' : 'pointer',
          opacity: regenerating ? 0.6 : 1,
          fontFamily: T.sans,
          transition: 'opacity 200ms',
        }}
      >
        {regenerating ? t('invite.regenerating') : t('invite.regenerate')}
      </button>

      {error && (
        <div
          data-testid="invite-regenerate-error"
          role="alert"
          style={{ marginTop: 10, fontSize: 12, color: T.danger }}
        >
          {t('invite.regenerate_error')}
        </div>
      )}
    </div>
  )
}
