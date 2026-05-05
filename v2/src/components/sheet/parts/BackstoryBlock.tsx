import type React from 'react'
import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Label } from '../ui/Label'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 18,
}

export function BackstoryBlock({ character }: { character: Character }) {
  const { t } = useTranslation()
  return (
    <div style={CARD} data-testid="backstory-block">
      <Label style={{ marginBottom: 10 }}>{t('backstory.section_title')}</Label>
      {character.backstory ? (
        <p
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: 14,
            color: '#B8B4C8',
            lineHeight: 1.75,
            margin: 0,
          }}
          data-testid="backstory-text"
        >
          {character.backstory}
        </p>
      ) : (
        <div data-testid="backstory-empty">
          <p style={{ color: '#7A7788', fontStyle: 'italic', fontSize: 13, margin: '0 0 6px' }}>
            {t('backstory.empty_state_title')}
          </p>
          <p style={{ color: '#7A7788', fontSize: 11, margin: 0, opacity: 0.7 }}>
            {t('backstory.empty_state_hint')}
          </p>
        </div>
      )}
    </div>
  )
}
