import type { Character } from '@/domain/character'
import {
  proficiencyBonus,
  passivePerception,
  initiativeBonus,
  formatSigned,
} from '@/domain/calculations'
import { deriveTotalLevel } from '@/domain/derived'
import { useTranslation } from '@/i18n'
import { useCharacterLocked } from '@/hooks/useCharacterLocked'
import { NumberField } from '@/components/primitives/NumberField'
import { useSheetRoll } from '@/hooks/useSheetRoll'

interface CombatStripProps {
  character: Character
  cols?: 2 | 3 | 6
  onUpdate?: (partial: Partial<Character>) => void
}

export function CombatStrip({ character, cols = 3, onUpdate }: CombatStripProps) {
  const { t } = useTranslation()
  const locked = useCharacterLocked(character.id)
  const { rollCheck } = useSheetRoll()

  // AC and speed are permanent — read-only when locked or no onUpdate
  const acReadOnly = !onUpdate || locked
  const speedReadOnly = !onUpdate || locked

  // Derive live — ignores stale stored values
  const profBonus = proficiencyBonus(deriveTotalLevel(character))
  const percSkill = character.skills.find(s => s.name === 'Perception')
  const pp = passivePerception(
    character.abilities.wis,
    percSkill?.proficient ?? false,
    percSkill?.expertise ?? false,
    profBonus,
  )
  const initiative = initiativeBonus(character.abilities.dex)

  const displayItems: { key: string; label: string; value: string }[] = [
    { key: 'init', label: t('combat.initiative'),         value: formatSigned(initiative) },
    { key: 'spd',  label: t('combat.speed'),              value: `${character.speed} ft` },
    { key: 'pp',   label: t('combat.passive_perception'), value: String(pp) },
    ...(character.spellSaveDC > 0
      ? [{ key: 'dc', label: t('combat.spell_save_dc'), value: String(character.spellSaveDC) }]
      : []),
    { key: 'prof', label: t('combat.proficiency_bonus'),  value: formatSigned(profBonus) },
  ]

  const statCard: React.CSSProperties = {
    background: '#15121C',
    border: '1px solid #2A2537',
    borderRadius: 10,
    padding: '8px 6px',
    textAlign: 'center',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: '#7A7788',
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  }

  const valueStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 22,
    fontWeight: 600,
    color: '#F4EFE0',
    marginTop: 2,
    lineHeight: 1.1,
    fontVariantNumeric: 'tabular-nums',
  }

  return (
    <div
      data-testid="combat-strip"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 6,
      }}
    >
      {/* AC — editable */}
      <div
        key="ac"
        data-testid="combat-stat-ac"
        style={statCard}
      >
        <div style={labelStyle}>{t('combat.ac')}</div>
        {acReadOnly ? (
          <div style={valueStyle}>{String(character.ac)}</div>
        ) : (
          <NumberField
            data-testid="ac-input"
            value={character.ac}
            min={0}
            max={50}
            onChange={(v) => onUpdate?.({ ac: v })}
            aria-label={t('aria.ac_input')}
            style={{
              ...valueStyle,
              background: 'transparent',
              border: '1px solid #2A2537',
              borderRadius: 4,
              width: '100%',
              padding: '2px 4px',
              textAlign: 'center',
            }}
          />
        )}
      </div>

      {/* All other stats */}
      {displayItems.map((it) => (
        <div
          key={it.key}
          data-testid={`combat-stat-${it.key}`}
          onClick={it.key === 'init' ? () => rollCheck(t('combat.initiative'), initiative) : undefined}
          style={{
            ...statCard,
            ...(it.key === 'init' ? { cursor: 'pointer' } : {}),
          }}
        >
          <div style={labelStyle}>{it.label}</div>
          {it.key === 'spd' && !speedReadOnly ? (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
              <NumberField
                data-testid="speed-input"
                value={character.speed}
                min={0}
                max={200}
                onChange={(v) => onUpdate?.({ speed: v })}
                aria-label={t('aria.speed_input')}
                style={{
                  ...valueStyle,
                  background: 'transparent',
                  border: '1px solid #2A2537',
                  borderRadius: 4,
                  width: '100%',
                  padding: '2px 4px',
                  textAlign: 'center',
                }}
              />
              <span style={{ ...labelStyle, fontSize: 10 }}>ft</span>
            </div>
          ) : (
            <div style={valueStyle}>{it.value}</div>
          )}
        </div>
      ))}
    </div>
  )
}
