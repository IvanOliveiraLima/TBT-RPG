import type { Character, AbilityKey, SavingThrowState } from '@/domain/character'
import {
  proficiencyBonus,
  savingThrowBonus,
  formatSigned,
} from '@/domain/calculations'
import { deriveTotalLevel } from '@/domain/derived'
import { useTranslation } from '@/i18n'
import { Pip } from '../ui/Pip'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'

interface SavingThrowsProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

const ABILITY_ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export function SavingThrows({ character, onUpdate }: SavingThrowsProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  const profMap = new Map(character.savingThrows.map((st) => [st.ability, st.proficient]))
  const profBonus = proficiencyBonus(deriveTotalLevel(character))

  function handleToggle(k: AbilityKey) {
    if (!onUpdate) return
    const currentProf = profMap.get(k) ?? false
    const newSavingThrows: SavingThrowState[] = ABILITY_ORDER.map((ability) => {
      const prof = ability === k ? !currentProf : (profMap.get(ability) ?? false)
      return {
        ability,
        proficient: prof,
        bonus: savingThrowBonus(character.abilities[ability], prof, profBonus),
      }
    })
    onUpdate({ savingThrows: newSavingThrows })
  }

  return (
    <div
      data-testid="saving-throws"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}
    >
      {ABILITY_ORDER.map((k) => {
        const proficient = profMap.get(k) ?? false
        const bonus = savingThrowBonus(character.abilities[k], proficient, profBonus)

        return (
          <div
            key={k}
            data-testid={`save-${k}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              borderRadius: 8,
            }}
          >
            <button
              type="button"
              onClick={() => handleToggle(k)}
              disabled={!onUpdate || locked}
              aria-label={t('aria.save_proficiency_toggle', { ability: t(`saves.ability.${k}`) })}
              aria-pressed={proficient}
              data-testid={`save-${k}-toggle`}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: (onUpdate && !locked) ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Pip state={proficient ? 'filled' : 'empty'} color="gold" size="sm" />
            </button>
            <span style={{ flex: 1, fontSize: 12, color: '#C8C4D6' }}>
              {t(`saves.ability.${k}`)}
            </span>
            <span
              data-testid={`save-${k}-bonus`}
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 600,
                color: proficient ? '#D4A017' : '#F4EFE0',
                fontSize: 14,
                fontVariantNumeric: 'tabular-nums',
                minWidth: 24,
                textAlign: 'right',
              }}
            >
              {formatSigned(bonus)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
