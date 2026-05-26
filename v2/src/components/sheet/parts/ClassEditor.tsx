import { useEffect, useRef } from 'react'
import type React from 'react'
import type { Character, ClassEntry } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { CANONICAL_CLASSES } from '@/data/canonical/classes'
import { NumberField } from '@/components/primitives/NumberField'
import { ConfirmableRemoveButton } from '@/components/primitives/ConfirmableRemoveButton'
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
  flex: '1 1 0',
  minWidth: 0,
}

// Fixed width: 2 digits (1–20) always fit; flex-shrink: 0 prevents squeezing on narrow viewports
const CLASS_LEVEL_INPUT: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid #2A2537',
  borderRadius: 6,
  padding: '4px 6px',
  width: 64,
  flexShrink: 0,
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
  // Holds the index of a newly-added class so we can focus+select its name input after render
  const newlyAddedIndexRef = useRef<number | null>(null)

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
    newlyAddedIndexRef.current = character.classes.length  // index of the new entry
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

  // After each render, check if a new class was just added and focus+select its name input
  useEffect(() => {
    if (newlyAddedIndexRef.current !== null) {
      const idx = newlyAddedIndexRef.current
      const input = document.querySelector(
        `[data-testid="class-name-${idx}"]`
      ) as HTMLInputElement | null
      if (input) {
        input.focus()
        if (typeof input.select === 'function') {
          input.select()
        } else {
          input.setSelectionRange(0, input.value.length)
        }
      }
      newlyAddedIndexRef.current = null
    }
  })

  return (
    <div data-testid="class-editor">
      {character.classes.map((cls, i) => (
        <div
          key={i}
          style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, minWidth: 0 }}
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
          <ConfirmableRemoveButton
            onConfirm={() => removeClass(i)}
            disabled={character.classes.length === 1}
            ariaLabel={t('aria.remove_class', { name: cls.name || `#${i + 1}` })}
            testId={`remove-class-${i}`}
            size="sm"
          />
        </div>
      ))}
      <datalist id="canonical-classes">
        {[...CANONICAL_CLASSES].sort((a, b) => a.localeCompare(b)).map(c => <option key={c} value={c} />)}
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
