import type React from 'react'
import { useState } from 'react'
import type { Character } from '@/domain/character'
import { deriveTotalLevel, formatClassesShort } from '@/domain/derived'
import { useTranslation } from '@/i18n'
import { CharacterImageModal } from './CharacterImageModal'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 18,
}

const PORTRAIT_GRADIENT =
  'radial-gradient(circle at 50% 35%, rgba(212,160,23,0.3), transparent 50%),' +
  'radial-gradient(circle at 40% 70%, rgba(91,63,168,0.25), transparent 50%),' +
  'linear-gradient(135deg, #2A1F3D, #0F0D14)'

interface LoreHeroProps {
  character: Character
  onUpdate: (partial: Partial<Character>) => void
}

export function LoreHero({ character, onUpdate }: LoreHeroProps) {
  const { t } = useTranslation()
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modalOpenCount, setModalOpenCount] = useState(0)

  const portrait = character.images.character
  const initial = (character.name[0] ?? '?').toUpperCase()
  const classStr = formatClassesShort(character)

  const metaParts = [
    character.race,
    classStr || null,
    character.background || null,
    character.alignment || null,
  ].filter(Boolean)

  const handleImageApply = (dataUrl: string) => {
    onUpdate({ images: { ...character.images, character: dataUrl } })
    setImageModalOpen(false)
  }

  return (
    <div style={CARD} data-testid="lore-hero">
      <div className="flex flex-col lg:flex-row" style={{ gap: 18, alignItems: 'flex-start' }}>

        {/* Portrait — clickable to open image modal */}
        <button
          type="button"
          aria-label={t('aria.edit_image')}
          onClick={() => { setModalOpenCount(c => c + 1); setImageModalOpen(true) }}
          className="w-40 h-40 lg:w-[200px] lg:h-[200px]"
          style={{
            flexShrink: 0,
            borderRadius: 12,
            background: portrait ? `url(${portrait}) center/cover` : PORTRAIT_GRADIENT,
            border: '2px solid rgba(212,160,23,0.4)',
            boxShadow: '0 0 24px rgba(212,160,23,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          data-testid="lore-portrait"
        >
          {!portrait && (
            <span
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: 64,
                fontWeight: 700,
                color: '#D4A017',
                userSelect: 'none',
                lineHeight: 1,
              }}
              data-testid="lore-portrait-initial"
            >
              {initial}
            </span>
          )}
        </button>

        {/* Identity info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4, minWidth: 0, flex: 1 }}>
          <div
            style={{ fontSize: 13, color: '#B8B4C8', lineHeight: 1.6 }}
            data-testid="lore-meta"
          >
            {metaParts.join(' · ')}
          </div>

          {/* Level (read-only derived) */}
          <div style={{ fontSize: 12, color: '#7A7788' }}>
            <span data-testid="lore-level-text">
              {t('hero.level_label')} {deriveTotalLevel(character)}
            </span>
          </div>
        </div>
      </div>

      {/* Character image modal — key changes on every open, forcing a fresh state */}
      <CharacterImageModal
        key={modalOpenCount}
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onApply={handleImageApply}
        {...(portrait !== undefined ? { initialImage: portrait } : {})}
      />
    </div>
  )
}
