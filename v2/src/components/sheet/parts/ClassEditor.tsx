import type React from 'react'
import type { Character, ClassEntry } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { CANONICAL_CLASSES } from '@/data/canonical/classes'
import { NumberField } from '@/components/primitives/NumberField'
import { getHitDie } from '@/domain/classes'

const CLASS_NAME_INPUT: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 6,
  padding: '4px 6px',
  fontFamily: 'inherit',
  color: '#F4EFE0',
  fontSize: 13,
  outline: 'none',
  flex: 1,
}

const CLASS_LEVEL_INPUT: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid #2A2537',
  borderRadius: 6,
  padding: '4px 6px',
  width: 52,
  textAlign: 'center' as const,
  color: '#F4EFE0',
  fontSize: 13,
}

interface ClassEditorProps {
  character: Character
  onUpdate: (partial: Partial<Character>) => void
}

export function ClassEditor({ character, onUpdate }: ClassEditorProps) {
  const { t } = useTranslation()

  function updateClass(index: number, partial: Partial<ClassEntry>) {
    const oldCls = character.classes[index]!
    let newCls = { ...oldCls, ...partial }
    if (partial.name !== undefined && partial.name !== oldCls.name) {
      newCls = { ...newCls, hitDie: getHitDie(newCls.name) }
    }
    const newClasses = character.classes.map((c, i) => i === index ? newCls : c)
    const newHitDice = character.hitDice.map(hd => {
      if (hd.className !== oldCls.name) return hd
      return {
        ...hd,
        className: newCls.name,
        dieSize: getHitDie(newCls.name),
        max: newCls.level,
        current: Math.min(hd.current, newCls.level),
      }
    })
    onUpdate({ classes: newClasses, hitDice: newHitDice })
  }

  function addClass() {
    const existing = character.classes.map(c => c.name)
    const baseName = t('identity.class_default_name')
    let defaultName = baseName
    let suffix = 2
    while (existing.includes(defaultName)) {
      defaultName = `${baseName} ${suffix}`
      suffix++
    }
    const newClass: ClassEntry = { name: defaultName, level: 1, hitDie: 8 }
    onUpdate({
      classes: [...character.classes, newClass],
      hitDice: [
        ...character.hitDice,
        { className: defaultName, dieSize: 8, current: 1, max: 1 },
      ],
    })
  }

  function removeClass(index: number) {
    const removedName = character.classes[index]?.name ?? ''
    onUpdate({
      classes: character.classes.filter((_, i) => i !== index),
      hitDice: character.hitDice.filter(hd => hd.className !== removedName),
    })
  }

  return (
    <div data-testid="class-editor">
      {character.classes.map((cls, i) => (
        <div
          key={i}
          style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}
          data-testid={`class-row-${i}`}
        >
          <input
            type="text"
            value={cls.name}
            onChange={e => updateClass(i, { name: e.target.value })}
            list="canonical-classes"
            placeholder={t('identity.class_name_placeholder')}
            aria-label={t('aria.class_name_input', { index: String(i + 1) })}
            className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
            style={CLASS_NAME_INPUT}
            data-testid={`class-name-${i}`}
          />
          <NumberField
            value={cls.level}
            min={1}
            max={20}
            onChange={n => updateClass(i, { level: n })}
            aria-label={t('aria.class_level_input', { index: String(i + 1) })}
            style={CLASS_LEVEL_INPUT}
            data-testid={`class-level-${i}`}
          />
          <button
            type="button"
            onClick={() => removeClass(i)}
            disabled={character.classes.length === 1}
            aria-label={t('aria.remove_class', { name: cls.name || `#${i + 1}` })}
            style={{
              background: 'transparent',
              border: '1px solid #3A3450',
              borderRadius: 4,
              color: character.classes.length === 1 ? '#3A3450' : '#7A7788',
              cursor: character.classes.length === 1 ? 'not-allowed' : 'pointer',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
            data-testid={`remove-class-${i}`}
          >
            ×
          </button>
        </div>
      ))}
      <datalist id="canonical-classes">
        {CANONICAL_CLASSES.map(c => <option key={c} value={c} />)}
      </datalist>
      <button
        type="button"
        onClick={addClass}
        style={{
          background: 'transparent',
          border: '1px dashed #3A3450',
          borderRadius: 6,
          color: '#7A7788',
          fontSize: 11,
          padding: '4px 10px',
          cursor: 'pointer',
          width: '100%',
          marginTop: 2,
        }}
        data-testid="add-class"
      >
        {t('identity.add_class_button')}
      </button>
    </div>
  )
}
