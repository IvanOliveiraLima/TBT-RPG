import type React from 'react'
import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Label } from '../ui/Label'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'

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

interface NotesBlockProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function NotesBlock({ character, onUpdate }: NotesBlockProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  // notes1 is editable; notes2 is preserved read-only and shown below
  // Edit: only notes1 receives user input
  const isReadonlySuffix = Boolean(character.notes2)

  return (
    <div style={CARD} data-testid="notes-block">
      <Label style={{ marginBottom: 10 }}>{t('notes.section_title')}</Label>
      {isReadonlySuffix ? (
        // notes2 exists: show notes1 as editable textarea + notes2 as read-only text below
        <>
          <textarea
            value={character.notes1}
            onChange={(e) => onUpdate?.({ notes1: e.target.value })}
            placeholder={t('notes.placeholder')}
            aria-label={t('notes.section_title')}
            data-testid="notes-textarea"
            style={TEXTAREA}
            readOnly={locked}
          />
          <p
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: 14,
              color: '#7A7788',
              lineHeight: 1.75,
              margin: '8px 0 0',
              fontStyle: 'italic',
            }}
            data-testid="notes-readonly"
          >
            {character.notes2}
          </p>
        </>
      ) : (
        <textarea
          value={character.notes1}
          onChange={(e) => onUpdate?.({ notes1: e.target.value })}
          placeholder={t('notes.placeholder')}
          aria-label={t('notes.section_title')}
          data-testid="notes-textarea"
          style={{
            ...TEXTAREA,
            minHeight: !character.notes1 ? 120 : undefined,
          }}
          readOnly={locked}
        />
      )}
    </div>
  )
}
