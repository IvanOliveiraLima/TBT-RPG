import type React from 'react'
import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'

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

export function LoreHero({ character }: { character: Character }) {
  const { t } = useTranslation()
  const portrait = character.images.character
  const firstClass = character.classes[0]
  const initial = (character.name[0] ?? '?').toUpperCase()

  const metaParts = [
    character.race,
    firstClass ? `${firstClass.name} ${character.totalLevel}` : null,
    character.background || null,
    character.alignment || null,
  ].filter(Boolean)

  return (
    <div style={CARD} data-testid="lore-hero">
      <div className="flex flex-col lg:flex-row" style={{ gap: 18, alignItems: 'flex-start' }}>

        {/* Portrait */}
        <div
          role="img"
          aria-label={t('aria.portrait', { name: character.name })}
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
        </div>

        {/* Identity info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: 26,
              fontWeight: 700,
              color: '#F4EFE0',
              lineHeight: 1.2,
            }}
            data-testid="lore-name"
          >
            {character.name}
          </div>

          <div
            style={{ fontSize: 13, color: '#B8B4C8', lineHeight: 1.6 }}
            data-testid="lore-meta"
          >
            {metaParts.join(' · ')}
          </div>

          <div style={{ fontSize: 12, color: '#7A7788' }}>
            {t('lore.hero.level_xp', { level: String(character.totalLevel), xp: String(character.experience) })}
          </div>
        </div>
      </div>
    </div>
  )
}
