/**
 * AIGenerationModal — modal for AI-assisted character creation.
 *
 * Shows a textarea for the character description, a PT/EN language toggle,
 * loading state with hint, and translated error messages.
 * Calls the Cloudflare Worker via ai-generate service.
 */

import { useState } from 'react'
import type { Character } from '@/domain/character'
import { generateCharacterWithAI, mergeAIResponseIntoCharacter, parseErrorCode } from '@/services/ai-generate'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const T = {
  bg:            '#0F0D14',
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textTertiary:  '#A09DB0',
  textMuted:     '#7A7788',
  ruby:          '#8B1A2E',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  danger:        '#E24B4A',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

interface AIGenerationModalProps {
  onClose: () => void
  onCharacterGenerated: (char: Character) => void
}

export function AIGenerationModal({ onClose, onCharacterGenerated }: AIGenerationModalProps) {
  const { t, lang } = useTranslation()

  const [description,     setDescription]     = useState('')
  const [generationLang,  setGenerationLang]  = useState<'pt' | 'en'>(lang)
  const [status,          setStatus]          = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorCode,       setErrorCode]       = useState<string | null>(null)

  const isLoading = status === 'loading'
  const canSubmit = !isLoading && description.trim().length >= 10

  async function handleGenerate() {
    if (description.trim().length < 10) {
      setStatus('error')
      setErrorCode('description_too_short')
      return
    }

    setStatus('loading')
    setErrorCode(null)

    try {
      const aiChar = await generateCharacterWithAI({
        description: description.trim(),
        lang: generationLang,
      })
      const newChar = mergeAIResponseIntoCharacter(aiChar)
      onCharacterGenerated(newChar)
      onClose()
    } catch (err) {
      setStatus('error')
      setErrorCode(parseErrorCode(err))
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isLoading) onClose()
  }

  return (
    /* Backdrop */
    <div
      onClick={handleBackdropClick}
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(0,0,0,0.7)',
        backdropFilter:  'blur(4px)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          1000,
        padding:         '16px',
      }}
    >
      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('ai_modal.title')}
        style={{
          background:   T.surface,
          border:       `1px solid ${T.borderDefault}`,
          borderRadius: 16,
          width:        '100%',
          maxWidth:     460,
          boxShadow:    '0 24px 60px rgba(0,0,0,0.6)',
          fontFamily:   T.sans,
          overflow:     'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            10,
          padding:        '18px 20px 14px',
          borderBottom:   `1px solid ${T.borderSubtle}`,
        }}>
          <span style={{ color: T.gold, fontSize: 18 }}>✦</span>
          <h2 style={{
            fontFamily: T.serif,
            fontSize:   16,
            fontWeight: 600,
            color:      T.textPrimary,
            margin:     0,
            flex:       1,
          }}>
            {t('ai_modal.title')}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label={t('aria.close_modal' as TranslationKey)}
            style={{
              background:   'transparent',
              border:       'none',
              color:        T.textMuted,
              fontSize:     18,
              cursor:       isLoading ? 'default' : 'pointer',
              padding:      '2px 6px',
              borderRadius: 6,
              opacity:      isLoading ? 0.4 : 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Description textarea */}
          <div>
            <label style={{
              display:      'block',
              fontSize:     11,
              fontWeight:   600,
              color:        T.textMuted,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              {t('ai_modal.description_label')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('ai_modal.description_placeholder')}
              rows={5}
              disabled={isLoading}
              aria-label={t('aria.ai_description_input' as TranslationKey)}
              data-testid="ai-description-textarea"
              style={{
                width:        '100%',
                background:   T.elevated,
                border:       `1px solid ${T.borderSubtle}`,
                borderRadius: 8,
                padding:      '10px 12px',
                color:        T.textPrimary,
                fontFamily:   T.sans,
                fontSize:     13,
                lineHeight:   1.55,
                resize:       'vertical',
                boxSizing:    'border-box',
                opacity:      isLoading ? 0.6 : 1,
              }}
              className="hover:border-[#3A3450] focus:border-[#3A3450] outline-none transition-colors"
            />
            <p style={{ fontSize: 11, color: T.textMuted, margin: '5px 0 0', lineHeight: 1.4 }}>
              {t('ai_modal.description_hint')}
            </p>
          </div>

          {/* Language toggle */}
          <div>
            <p style={{
              fontSize:      11,
              fontWeight:    600,
              color:         T.textMuted,
              letterSpacing: 1,
              textTransform: 'uppercase',
              margin:        '0 0 6px',
            }}>
              {t('ai_modal.language_label')}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['pt', 'en'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setGenerationLang(l)}
                  disabled={isLoading}
                  data-testid={`ai-lang-${l}`}
                  aria-pressed={generationLang === l}
                  style={{
                    flex:         1,
                    padding:      '7px',
                    borderRadius: 8,
                    border:       `1px solid ${generationLang === l ? T.gold : T.borderSubtle}`,
                    background:   generationLang === l ? T.elevated : 'transparent',
                    color:        generationLang === l ? T.textPrimary : T.textMuted,
                    fontFamily:   T.sans,
                    fontSize:     12,
                    fontWeight:   600,
                    cursor:       isLoading ? 'default' : 'pointer',
                    opacity:      isLoading ? 0.5 : 1,
                    transition:   'all 150ms',
                  }}
                >
                  {l === 'pt' ? 'Português' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div
              data-testid="ai-loading-state"
              style={{
                textAlign:  'center',
                padding:    '8px 0',
                fontFamily: T.sans,
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6, color: T.gold }}>⟳</div>
              <p style={{ fontSize: 13, color: T.textPrimary, margin: '0 0 4px' }}>
                {t('ai_modal.generating')}
              </p>
              <p style={{ fontSize: 11, color: T.textMuted, margin: 0, opacity: 0.8 }}>
                {t('ai_modal.generating_hint')}
              </p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && errorCode && (
            <div
              role="alert"
              data-testid="ai-error-message"
              style={{
                background:   'rgba(226,75,74,0.1)',
                border:       `1px solid rgba(226,75,74,0.35)`,
                borderRadius: 8,
                padding:      '10px 12px',
                fontSize:     13,
                color:        T.danger,
                lineHeight:   1.4,
              }}
            >
              {t(`ai_modal.error_${errorCode}` as TranslationKey)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display:      'flex',
          gap:          8,
          padding:      '14px 20px 18px',
          borderTop:    `1px solid ${T.borderSubtle}`,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background:   'transparent',
              border:       `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
              padding:      '9px 18px',
              color:        T.textSecondary,
              fontFamily:   T.sans,
              fontSize:     13,
              fontWeight:   600,
              cursor:       isLoading ? 'default' : 'pointer',
              opacity:      isLoading ? 0.4 : 1,
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canSubmit}
            data-testid="ai-generate-button"
            style={{
              background:   canSubmit ? T.purple : T.elevated,
              border:       `1px solid ${canSubmit ? T.purple : T.borderSubtle}`,
              borderRadius: 8,
              padding:      '9px 20px',
              color:        canSubmit ? T.textPrimary : T.textMuted,
              fontFamily:   T.sans,
              fontSize:     13,
              fontWeight:   600,
              cursor:       canSubmit ? 'pointer' : 'default',
              transition:   'all 150ms',
              display:      'flex',
              alignItems:   'center',
              gap:          6,
            }}
          >
            {isLoading ? (
              <>{t('ai_modal.generating_button')}</>
            ) : (
              <><span style={{ color: T.gold }}>✦</span> {t('ai_modal.generate_button')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
