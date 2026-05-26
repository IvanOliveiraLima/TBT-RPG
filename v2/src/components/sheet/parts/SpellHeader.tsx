/**
 * SpellcastingHeader — editable spellcasting metadata block.
 *
 * Renders: class (free-text + datalist), ability (select INT/WIS/CHA),
 * save DC (derived, read-only), attack bonus (derived, read-only).
 */

import type { Character, AbilityKey } from '@/domain/character'
import { formatSigned } from '@/domain/calculations'
import { deriveSpellSaveDC, deriveSpellAttackBonus } from '@/domain/calculations'
import { CANONICAL_CLASSES } from '@/data/canonical'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const T = {
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  gold:          '#D4A017',
  borderSubtle:  '#2A2537',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

const SEAMLESS: React.CSSProperties = {
  background:   'transparent',
  border:       '1px solid transparent',
  borderRadius:  6,
  padding:       '4px 6px',
  color:         T.textPrimary,
  fontFamily:    T.sans,
  fontSize:      14,
  width:         '100%',
  boxSizing:     'border-box',
  textAlign:     'center',
}

interface SpellHeaderProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function SpellHeader({ character, onUpdate }: SpellHeaderProps) {
  const { t } = useTranslation()

  const saveDC     = deriveSpellSaveDC(character.abilities, character.spellcastingAbility, character.proficiencyBonus)
  const atkBonus   = deriveSpellAttackBonus(character.abilities, character.spellcastingAbility, character.proficiencyBonus)

  function handleClassChange(value: string) {
    onUpdate?.({ spellcastingClass: value })
  }

  function handleAbilityChange(value: string) {
    const ability = value as AbilityKey | ''
    // Derive new DC for CombatStrip (keep spellSaveDC in sync)
    const newDC = ability
      ? (deriveSpellSaveDC(character.abilities, ability, character.proficiencyBonus) ?? 0)
      : 0
    onUpdate?.({ spellcastingAbility: ability, spellSaveDC: newDC })
  }

  const readOnly = !onUpdate

  return (
    <div data-testid="spell-header">
      <Card padding="md">
        <div
          style={{
            display:               'grid',
            gridTemplateColumns:   'repeat(2, 1fr)',
            gap:                   10,
          }}
          className="sm:grid-cols-4"
        >
          {/* CLASS */}
          <div style={{ textAlign: 'center' }}>
            <Label>{t('spells.header.class')}</Label>
            {readOnly ? (
              <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.textPrimary }}>
                {character.spellcastingClass || character.classes[0]?.name || '—'}
              </div>
            ) : (
              <input
                type="text"
                value={character.spellcastingClass}
                onChange={e => handleClassChange(e.target.value)}
                list="canonical-classes"
                aria-label={t('aria.spellcasting_class_input')}
                style={SEAMLESS}
                className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors outline-none"
                placeholder={t('spells.class_placeholder')}
              />
            )}
          </div>

          {/* ABILITY */}
          <div style={{ textAlign: 'center' }}>
            <Label>{t('spells.header.ability')}</Label>
            {readOnly ? (
              <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.textPrimary }}>
                {character.spellcastingAbility
                  ? t(`ability.${character.spellcastingAbility}` as TranslationKey)
                  : '—'}
              </div>
            ) : (
              <select
                value={character.spellcastingAbility}
                onChange={e => handleAbilityChange(e.target.value)}
                aria-label={t('aria.spellcasting_ability_select')}
                style={{
                  ...SEAMLESS,
                  cursor: 'pointer',
                  appearance: 'none',
                }}
                className="alignment-select hover:border-[#2A2537] focus:border-[#2A2537] transition-colors outline-none"
              >
                <option value="">{t('spells.no_ability')}</option>
                <option value="int">{t('ability.int' as TranslationKey)}</option>
                <option value="wis">{t('ability.wis' as TranslationKey)}</option>
                <option value="cha">{t('ability.cha' as TranslationKey)}</option>
              </select>
            )}
          </div>

          {/* SAVE DC */}
          <div style={{ textAlign: 'center' }}>
            <Label>{t('spells.header.save_dc')}</Label>
            <div
              style={{
                fontFamily: T.serif,
                fontSize:   18,
                fontWeight: 600,
                color:      saveDC !== null ? T.gold : T.textMuted,
                textShadow: saveDC !== null ? `0 0 8px ${T.gold}40` : undefined,
              }}
            >
              {saveDC !== null ? String(saveDC) : '—'}
            </div>
          </div>

          {/* ATTACK BONUS */}
          <div style={{ textAlign: 'center' }}>
            <Label>{t('spells.header.attack_bonus')}</Label>
            <div
              style={{
                fontFamily: T.serif,
                fontSize:   18,
                fontWeight: 600,
                color:      atkBonus !== null ? T.textPrimary : T.textMuted,
              }}
            >
              {atkBonus !== null ? formatSigned(atkBonus) : '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* Datalist for class names */}
      {!readOnly && (
        <datalist id="canonical-classes">
          {CANONICAL_CLASSES.map(c => <option key={c} value={c} />)}
        </datalist>
      )}
    </div>
  )
}
