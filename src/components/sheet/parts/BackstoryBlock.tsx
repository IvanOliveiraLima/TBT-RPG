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

const TEXTAREA: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  resize: 'vertical',
  minHeight: 120,
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 14,
  color: '#B8B4C8',
  lineHeight: 1.75,
  whiteSpace: 'pre-wrap',
}

interface BackstoryBlockProps {
  character: Character
  onUpdate: (partial: Partial<Character>) => void
}

export function BackstoryBlock({ character, onUpdate }: BackstoryBlockProps) {
  const { t } = useTranslation()
  return (
    <div style={CARD} data-testid="backstory-block">
      <Label style={{ marginBottom: 10 }}>{t('backstory.section_title')}</Label>
      <textarea
        value={character.backstory}
        onChange={(e) => onUpdate({ backstory: e.target.value })}
        placeholder={t('backstory.placeholder')}
        aria-label={t('backstory.section_title')}
        data-testid="backstory-textarea"
        style={TEXTAREA}
      />
    </div>
  )
}
