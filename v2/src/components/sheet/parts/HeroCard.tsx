import type React from 'react'
import type { Character } from '@/domain/character'
import { deriveTotalLevel, formatClassesShort } from '@/domain/derived'
import { useTranslation } from '@/i18n'
import { Badge } from '../ui/Badge'
import { NumberField } from '@/components/primitives/NumberField'
import { CANONICAL_RACES } from '@/data/canonical/races'
import { CANONICAL_BACKGROUNDS } from '@/data/canonical/backgrounds'
import { AlignmentSelect } from './AlignmentSelect'
import { ClassEditor } from './ClassEditor'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#7A7788',
  display: 'block',
  marginBottom: 2,
}

const SEAMLESS_INPUT: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 6,
  padding: '4px 6px',
  fontFamily: 'inherit',
  fontSize: 13,
  color: '#F4EFE0',
  width: '100%',
  outline: 'none',
}

interface HeroCardProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
  compact?: boolean
}

export function HeroCard({ character, onUpdate, compact = false }: HeroCardProps) {
  const { t } = useTranslation()
  const portrait = character.images.character
  const classLine = formatClassesShort(character)
  const totalLevel = deriveTotalLevel(character)
  const portraitSize = compact ? 58 : 72
  const nameFontSize = compact ? 18 : 22

  const nameInputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: 0,
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: nameFontSize,
    fontWeight: 600,
    color: '#F4EFE0',
    letterSpacing: 0.3,
    lineHeight: 1.1,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    width: '100%',
  }

  return (
    <div
      className="parchment-texture noise-grain"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #1B1725, #15121C)',
        border: '1px solid #2A2537',
        borderRadius: 16,
        padding: compact ? 14 : 18,
        overflow: 'hidden',
      }}
    >
      {/* Always horizontal: portrait left, identity right */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Portrait */}
        <div
          style={{
            width: portraitSize,
            height: portraitSize,
            flexShrink: 0,
            borderRadius: 12,
            background: portrait
              ? `url(${portrait}) center/cover`
              : `radial-gradient(circle at 40% 35%, #8B6FC5 0%, transparent 55%),
                 radial-gradient(circle at 60% 65%, #8B1A2E 0%, transparent 55%),
                 linear-gradient(135deg, #2A1F3D, #1A0F2A)`,
            border: '1.5px solid #D4A017',
            boxShadow: '0 0 20px rgba(212,160,23,0.25), inset 0 0 20px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: compact ? 22 : 28,
            color: '#D4A017',
            fontWeight: 600,
            position: 'relative',
          }}
        >
          {!portrait && (character.name[0] ?? '?')}

          {/* Level badge — ruby circle, bottom-right */}
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              background: '#8B1A2E',
              color: '#F4EFE0',
              fontFamily: "'Cinzel', Georgia, serif",
              fontWeight: 700,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid #0F0D14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}
          >
            {totalLevel}
          </div>
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {onUpdate ? (
            <>
              {/* Name */}
              <div>
                <span style={LABEL_STYLE}>{t('hero.name_label')}</span>
                <input
                  type="text"
                  value={character.name}
                  onChange={e => onUpdate({ name: e.target.value })}
                  aria-label={t('aria.character_name_input')}
                  data-testid="hero-name-input"
                  style={nameInputStyle}
                />
              </div>

              {/* Race / Background / Alignment row */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 80px', minWidth: 0 }}>
                  <span style={LABEL_STYLE}>{t('identity.race_label')}</span>
                  <input
                    type="text"
                    value={character.race}
                    onChange={e => onUpdate({ race: e.target.value })}
                    list="canonical-races"
                    aria-label={t('aria.race_input')}
                    data-testid="hero-race-input"
                    className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
                    style={SEAMLESS_INPUT}
                  />
                </div>
                <div style={{ flex: '1 1 80px', minWidth: 0 }}>
                  <span style={LABEL_STYLE}>{t('identity.background_label')}</span>
                  <input
                    type="text"
                    value={character.background}
                    onChange={e => onUpdate({ background: e.target.value })}
                    list="canonical-backgrounds"
                    aria-label={t('aria.background_input')}
                    data-testid="hero-background-input"
                    className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
                    style={SEAMLESS_INPUT}
                  />
                </div>
                <div style={{ flex: '1 1 100px', minWidth: 0 }}>
                  <span style={LABEL_STYLE}>{t('identity.alignment_label')}</span>
                  <AlignmentSelect
                    value={character.alignment}
                    onChange={alignment => onUpdate({ alignment })}
                  />
                </div>
              </div>

              {/* Classes */}
              <div style={{ marginTop: 8 }}>
                <span style={LABEL_STYLE}>{t('identity.classes_label')}</span>
                <ClassEditor character={character} onUpdate={onUpdate} />
              </div>

              {/* Level + XP + Inspiration */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  marginTop: 6,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span style={LABEL_STYLE}>{t('hero.level_label')}</span>
                  <span
                    data-testid="hero-level"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#C8C4D6',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {totalLevel}
                  </span>
                </div>
                <div>
                  <span style={LABEL_STYLE}>{t('hero.xp_label')}</span>
                  <NumberField
                    value={character.experience}
                    min={0}
                    max={355000}
                    onChange={n => onUpdate({ experience: n })}
                    aria-label={t('aria.xp_input')}
                    data-testid="hero-xp-input"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: 0,
                      fontSize: 14,
                      color: '#C8C4D6',
                      width: 70,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={character.inspiration}
                    onChange={e => onUpdate({ inspiration: e.target.checked })}
                    aria-label={t('aria.inspiration_toggle')}
                    data-testid="hero-inspiration-checkbox"
                    style={{ width: 14, height: 14, accentColor: '#D4A017', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 12, color: '#B8B4C8' }}>
                    {t('identity.inspiration_label')}
                  </span>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Read-only name */}
              <div
                style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: nameFontSize,
                  fontWeight: 600,
                  color: '#F4EFE0',
                  letterSpacing: 0.3,
                  lineHeight: 1.1,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {character.name}
              </div>

              {/* Meta: race · class level · background */}
              <div
                style={{
                  fontSize: 12,
                  color: '#A09DB0',
                  marginTop: 3,
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {character.race && <span>{character.race}</span>}
                {character.race && classLine && (
                  <span style={{ color: '#3A3450' }}>•</span>
                )}
                {classLine && (
                  <span style={{ color: '#C8C4D6' }}>{classLine}</span>
                )}
                {classLine && character.background && (
                  <span style={{ color: '#3A3450' }}>•</span>
                )}
                {character.background && <span>{character.background}</span>}
              </div>

              {/* Inspiration badge */}
              {character.inspiration && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Badge variant="purple" icon={<span>✦</span>}>
                    {t('hero.inspired_badge')}
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Datalists — rendered outside the flex container to avoid layout impact */}
      {onUpdate && (
        <>
          <datalist id="canonical-races">
            {CANONICAL_RACES.map(r => <option key={r} value={r} />)}
          </datalist>
          <datalist id="canonical-backgrounds">
            {CANONICAL_BACKGROUNDS.map(b => <option key={b} value={b} />)}
          </datalist>
        </>
      )}
    </div>
  )
}
