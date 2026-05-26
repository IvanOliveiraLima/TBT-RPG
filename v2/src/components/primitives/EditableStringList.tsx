/**
 * EditableStringList — reusable editable list of strings.
 *
 * Used by LanguagesBlock and ProficienciesBlock sub-lists.
 * Pattern mirrors IdentityBlock class list: add appends empty string,
 * update maps by index, remove filters by index.
 */

import { useTranslation } from '@/i18n'
import { ConfirmableRemoveButton } from './ConfirmableRemoveButton'

const T = {
  bg:           '#15121C',
  bgInput:      'transparent',
  border:       '#2A2537',
  borderFocus:  '#6F4DC9',
  text:         '#D4D0E8',
  textMuted:    '#7A7788',
  removeColor:  '#7A7788',
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface EditableStringListProps {
  /** Current list of items */
  items: string[]
  /** Called when the list changes */
  onUpdate: (newItems: string[]) => void
  /** Placeholder for each input */
  placeholder: string
  /** Aria label applied to each input, receives {index} token */
  inputAriaKey: string
  /** Aria label for each remove button, receives {name} token */
  removeAriaKey: string
  /** Label for the add button */
  addLabel: string
  /** Empty-state text when items.length === 0 */
  emptyHint: string
  /** data-testid prefix applied to the container */
  listTestId?: string
}

export function EditableStringList({
  items,
  onUpdate,
  placeholder,
  inputAriaKey,
  removeAriaKey,
  addLabel,
  emptyHint,
  listTestId,
}: EditableStringListProps) {
  const { t } = useTranslation()

  function add() {
    onUpdate([...items, ''])
  }

  function update(index: number, value: string) {
    onUpdate(items.map((v, i) => (i === index ? value : v)))
  }

  function remove(index: number) {
    onUpdate(items.filter((_, i) => i !== index))
  }

  return (
    <div data-testid={listTestId}>
      {items.length === 0 && (
        <p
          style={{
            fontSize: 12,
            color: T.textMuted,
            fontStyle: 'italic',
            margin: '4px 0 6px',
            fontFamily: T.sans,
          }}
        >
          {emptyHint}
        </p>
      )}

      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 4,
          }}
        >
          <input
            type="text"
            value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder}
            aria-label={t(inputAriaKey as Parameters<typeof t>[0], { index: i + 1 })}
            style={{
              flex: 1,
              background: T.bgInput,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              color: T.text,
              fontFamily: T.sans,
              outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = T.borderFocus }}
            onBlur={e => { e.currentTarget.style.borderColor = T.border }}
          />
          <ConfirmableRemoveButton
            onConfirm={() => remove(i)}
            ariaLabel={t(removeAriaKey as Parameters<typeof t>[0], { name: item || `#${i + 1}` })}
            size="sm"
          />
        </div>
      ))}

      <button
        type="button"
        data-action="add"
        onClick={add}
        style={{
          background: 'none',
          border: `1px dashed ${T.border}`,
          borderRadius: 6,
          color: T.textMuted,
          fontSize: 11,
          padding: '3px 8px',
          cursor: 'pointer',
          marginTop: 2,
          fontFamily: T.sans,
        }}
      >
        {addLabel}
      </button>
    </div>
  )
}
