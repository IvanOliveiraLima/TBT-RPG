import { useState, useMemo } from 'react'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { useCharactersStore } from '@/store/characters'
import { linkCharacterToCampaign, CampaignCharacterServiceError } from '@/services/campaign-characters'
import { buildCharacterSummary } from '@/domain/campaign'
import type { CampaignCharacter } from '@/domain/campaign'

const T = {
  bg:           '#0F0D14',
  surface:      '#15121C',
  elevated:     '#1B1725',
  borderSubtle: '#2A2537',
  borderActive: '#5B3FA8',
  textPrimary:  '#F4EFE0',
  textSecondary:'#C8C4D6',
  textMuted:    '#7A7788',
  purple:       '#5B3FA8',
  purpleDim:    'rgba(91,63,168,0.15)',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
  danger:       '#E24B4A',
} as const

interface LinkCharacterModalProps {
  campaignId: string
  alreadyLinkedIds: string[]
  onLinked: (newLink: CampaignCharacter) => void
  onCancel: () => void
}

export function LinkCharacterModal({
  campaignId,
  alreadyLinkedIds,
  onLinked,
  onCancel,
}: LinkCharacterModalProps) {
  const { t } = useTranslation()
  const characters = useCharactersStore(s => s.characters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'linking' | 'error'>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const eligibleChars = useMemo(
    () => characters.filter(c => !alreadyLinkedIds.includes(c.id)),
    [characters, alreadyLinkedIds],
  )

  const isLinking = status === 'linking'

  async function handleLink() {
    if (!selectedId) return
    const char = characters.find(c => c.id === selectedId)
    if (!char) return

    setStatus('linking')
    setErrorCode(null)

    try {
      const newLink = await linkCharacterToCampaign({ campaignId, character: char })
      onLinked(newLink)
    } catch (err) {
      setStatus('error')
      setErrorCode(err instanceof CampaignCharacterServiceError ? err.code : 'unknown')
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isLinking) onCancel()
  }

  return (
    <div
      onClick={handleBackdropClick}
      data-testid="link-character-modal"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: T.surface,
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: 16,
          width: '100%', maxWidth: 440,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          fontFamily: T.sans,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '18px 20px 14px',
          borderBottom: `1px solid ${T.borderSubtle}`,
        }}>
          <h2 style={{
            fontFamily: T.serif, fontSize: 15, fontWeight: 600,
            color: T.textPrimary, margin: 0, flex: 1,
          }}>
            {t('link_character.title')}
          </h2>
          <button
            onClick={onCancel}
            disabled={isLinking}
            aria-label={t('common.cancel')}
            style={{
              background: 'transparent', border: 'none',
              color: T.textMuted, fontSize: 18,
              cursor: isLinking ? 'default' : 'pointer',
              padding: '2px 6px', borderRadius: 6,
              opacity: isLinking ? 0.4 : 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
            {t('link_character.description')}
          </p>

          {/* Empty states */}
          {characters.length === 0 && (
            <div
              data-testid="link-char-no-chars"
              style={{
                textAlign: 'center', padding: '20px 12px',
                color: T.textMuted, fontSize: 13,
              }}
            >
              {t('link_character.no_chars_at_all')}
            </div>
          )}

          {characters.length > 0 && eligibleChars.length === 0 && (
            <div
              data-testid="link-char-all-linked"
              style={{
                textAlign: 'center', padding: '20px 12px',
                color: T.textMuted, fontSize: 13,
              }}
            >
              {t('link_character.all_already_linked')}
            </div>
          )}

          {/* Char list */}
          {eligibleChars.length > 0 && (
            <div
              data-testid="link-char-list"
              style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}
            >
              {eligibleChars.map(c => {
                const summary = buildCharacterSummary(c)
                const isSelected = selectedId === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    data-testid={`link-char-option-${c.id}`}
                    aria-pressed={isSelected}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: 2, padding: '10px 12px', borderRadius: 10,
                      background: isSelected ? T.purpleDim : T.elevated,
                      border: `1px solid ${isSelected ? T.borderActive : T.borderSubtle}`,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 150ms',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                      {c.name}
                    </div>
                    {summary && (
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        {summary}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Error */}
          {status === 'error' && errorCode && (
            <div
              role="alert"
              data-testid="link-char-error"
              style={{
                background: 'rgba(226,75,74,0.1)',
                border: '1px solid rgba(226,75,74,0.35)',
                borderRadius: 8, padding: '10px 12px',
                fontSize: 13, color: T.danger,
              }}
            >
              {t(`link_character.error_${errorCode}` as TranslationKey)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 8, padding: '14px 20px 18px',
          borderTop: `1px solid ${T.borderSubtle}`,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={isLinking}
            data-testid="link-char-cancel"
            style={{
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: '9px 18px',
              color: T.textSecondary, fontFamily: T.sans,
              fontSize: 13, fontWeight: 600,
              cursor: isLinking ? 'default' : 'pointer',
              opacity: isLinking ? 0.4 : 1,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedId || isLinking || eligibleChars.length === 0}
            data-testid="link-char-confirm"
            style={{
              background: (!selectedId || isLinking || eligibleChars.length === 0) ? T.elevated : T.purple,
              border: `1px solid ${(!selectedId || isLinking || eligibleChars.length === 0) ? T.borderSubtle : T.purple}`,
              borderRadius: 8, padding: '9px 20px',
              color: (!selectedId || isLinking || eligibleChars.length === 0) ? T.textMuted : T.textPrimary,
              fontFamily: T.sans, fontSize: 13, fontWeight: 600,
              cursor: (!selectedId || isLinking || eligibleChars.length === 0) ? 'default' : 'pointer',
              transition: 'all 150ms',
            }}
          >
            {isLinking ? t('link_character.linking') : t('link_character.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
