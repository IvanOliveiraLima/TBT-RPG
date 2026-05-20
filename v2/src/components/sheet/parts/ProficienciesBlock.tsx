import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { EditableStringList } from '@/components/primitives/EditableStringList'

const T = {
  textMuted:    '#7A7788',
  border:       '#2A2537',
  sans:         "'Inter', system-ui, sans-serif",
} as const

type ProfKey = keyof Character['proficiencies']

interface SubListConfig {
  key:           ProfKey
  sublabelKey:   string
  placeholderKey: string
  emptyHintKey:  string
  ariaListKey:   string
}

const SUB_LISTS: SubListConfig[] = [
  {
    key:            'weapons',
    sublabelKey:    'proficiencies.weapons_label',
    placeholderKey: 'proficiencies.weapons_placeholder',
    emptyHintKey:   'proficiencies.weapons_empty_hint',
    ariaListKey:    'aria.weapons_list',
  },
  {
    key:            'armor',
    sublabelKey:    'proficiencies.armor_label',
    placeholderKey: 'proficiencies.armor_placeholder',
    emptyHintKey:   'proficiencies.armor_empty_hint',
    ariaListKey:    'aria.armor_list',
  },
  {
    key:            'tools',
    sublabelKey:    'proficiencies.tools_label',
    placeholderKey: 'proficiencies.tools_placeholder',
    emptyHintKey:   'proficiencies.tools_empty_hint',
    ariaListKey:    'aria.tools_list',
  },
  {
    key:            'other',
    sublabelKey:    'proficiencies.other_label',
    placeholderKey: 'proficiencies.other_placeholder',
    emptyHintKey:   'proficiencies.other_empty_hint',
    ariaListKey:    'aria.other_list',
  },
]

interface ProficienciesBlockProps {
  character: Character
  onUpdate: (partial: Partial<Character>) => void
}

export function ProficienciesBlock({ character, onUpdate }: ProficienciesBlockProps) {
  const { t } = useTranslation()

  function updateSubList(key: ProfKey, newList: string[]) {
    onUpdate({
      proficiencies: { ...character.proficiencies, [key]: newList },
    })
  }

  return (
    <div data-testid="proficiencies-block">
      <Card padding="md">
        <Label>{t('proficiencies.section_title')}</Label>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SUB_LISTS.map(({ key, sublabelKey, placeholderKey, emptyHintKey, ariaListKey }, idx) => (
            <div
              key={key}
              data-testid={`prof-list-${key}`}
              aria-label={t(ariaListKey as Parameters<typeof t>[0])}
              style={
                idx < SUB_LISTS.length - 1
                  ? { paddingBottom: 12, borderBottom: `1px solid ${T.border}` }
                  : undefined
              }
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: T.textMuted,
                  marginBottom: 6,
                  fontFamily: T.sans,
                }}
              >
                {t(sublabelKey as Parameters<typeof t>[0])}
              </div>
              <EditableStringList
                items={character.proficiencies[key]}
                onUpdate={newList => updateSubList(key, newList)}
                placeholder={t(placeholderKey as Parameters<typeof t>[0])}
                inputAriaKey="aria.language_input"
                removeAriaKey="aria.remove_language"
                addLabel={t('proficiencies.add_button')}
                emptyHint={t(emptyHintKey as Parameters<typeof t>[0])}
                listTestId={`prof-items-${key}`}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
