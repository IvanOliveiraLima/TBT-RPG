import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { EditableStringList } from '@/components/primitives/EditableStringList'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'

interface LanguagesBlockProps {
  character: Character
  onUpdate: (partial: Partial<Character>) => void
}

export function LanguagesBlock({ character, onUpdate }: LanguagesBlockProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)

  return (
    <div data-testid="languages-block">
      <Card padding="md">
        <Label>{t('languages.section_title')}</Label>
        <div style={{ marginTop: 8 }}>
          <EditableStringList
            items={character.languages}
            onUpdate={newLangs => onUpdate({ languages: newLangs })}
            placeholder={t('languages.placeholder')}
            inputAriaKey="aria.language_input"
            removeAriaKey="aria.remove_language"
            addLabel={t('languages.add_button')}
            emptyHint={t('languages.empty_state_hint')}
            listTestId="languages-list"
            {...(locked ? { locked: true } : {})}
          />
        </div>
      </Card>
    </div>
  )
}
