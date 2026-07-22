import { useState } from 'react'
import { useTranslation } from '@/i18n'
import {
  sortCombatants,
  startCombat,
  endCombat,
  nextTurn,
  prevTurn,
  addCombatant,
  removeCombatant,
  setInitiative,
} from '@/domain/initiative'
import type { Combatant, InitiativeTracker } from '@/domain/initiative'

// Module-level factories — keep impure calls (Date.now, Math.random) outside component body
function makeLinkedCombatant(lc: { characterId: string; name: string }): Combatant {
  return {
    id:                `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name:              lc.name,
    initiative:        0,
    linkedCharacterId: lc.characterId,
  }
}

function makeFreeCombatant(name: string, initiative: number): Combatant {
  return {
    id:         `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    initiative,
  }
}

const T = {
  surface:      '#15121C',
  panel:        '#1B1725',
  border:       '#2A2537',
  borderStrong: '#4A3A6B',
  borderActive: '#5B3FA8',
  text:         '#F4EFE0',
  textSub:      '#C8C4D6',
  textMuted:    '#7A7788',
  accent:       '#5B3FA8',
  accentLight:  'rgba(91,63,168,0.18)',
  gold:         '#D4A017',
  danger:       '#E24B4A',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

interface LinkedChar { characterId: string; name: string }

interface Props {
  isOwner: boolean
  tracker: InitiativeTracker
  linkedChars: LinkedChar[]
  onUpdate: (t: InitiativeTracker) => void
  autoInitiative?: boolean
  onToggleAutoInitiative?: (v: boolean) => void
}

export function CampaignInitiativePanel({ isOwner, tracker, linkedChars, onUpdate, autoInitiative, onToggleAutoInitiative }: Props) {
  const { t } = useTranslation()
  const [monsterName, setMonsterName] = useState('')
  const [monsterInit, setMonsterInit] = useState('0')
  const [showMonsterForm, setShowMonsterForm] = useState(false)

  const sorted = sortCombatants(tracker.combatants)

  function handleAddLinkedChar(lc: LinkedChar) {
    if (tracker.combatants.some(c => c.linkedCharacterId === lc.characterId)) return
    onUpdate(addCombatant(tracker, makeLinkedCombatant(lc)))
  }

  function handleAddMonster() {
    const name = monsterName.trim()
    if (!name) return
    const init = parseInt(monsterInit, 10)
    onUpdate(addCombatant(tracker, makeFreeCombatant(name, isNaN(init) ? 0 : init)))
    setMonsterName('')
    setMonsterInit('0')
    setShowMonsterForm(false)
  }

  const btnBase: React.CSSProperties = {
    background:   'transparent',
    border:       `1px solid ${T.border}`,
    borderRadius: 8,
    padding:      '5px 10px',
    color:        T.textSub,
    fontFamily:   T.sans,
    fontSize:     12,
    fontWeight:   600,
    cursor:       'pointer',
  }

  const btnAccent: React.CSSProperties = {
    ...btnBase,
    background: T.accent,
    border:     'none',
    color:      T.text,
  }

  const inputBase: React.CSSProperties = {
    background:   T.surface,
    border:       `1px solid ${T.border}`,
    borderRadius: 6,
    padding:      '4px 8px',
    color:        T.text,
    fontFamily:   T.sans,
    fontSize:     12,
    outline:      'none',
    width:        '100%',
    boxSizing:    'border-box',
  }

  return (
    <div
      data-testid="campaign-initiative-panel"
      style={{
        background:   T.panel,
        border:       `1px solid ${T.borderStrong}`,
        borderRadius: 14,
        padding:      20,
        fontFamily:   T.sans,
        color:        T.text,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          fontFamily:    T.serif,
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color:         T.textMuted,
        }}>
          {tracker.active
            ? t('initiative.round', { n: tracker.round })
            : t('initiative.title')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isOwner && onToggleAutoInitiative && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                data-testid="auto-initiative-toggle"
                checked={autoInitiative ?? false}
                onChange={e => onToggleAutoInitiative(e.target.checked)}
                style={{ width: 13, height: 13, accentColor: T.accent, cursor: 'pointer' }}
              />
              {t('initiative.auto_initiative')}
            </label>
          )}
          {isOwner && (
            <button
              data-testid={tracker.active ? 'initiative-end-btn' : 'initiative-start-btn'}
              onClick={() => onUpdate(tracker.active ? endCombat(tracker) : startCombat(tracker))}
              style={btnBase}
            >
              {tracker.active ? t('initiative.end') : t('initiative.start')}
            </button>
          )}
        </div>
      </div>

      {/* ── Turn controls (owner, during active combat) ─────────── */}
      {isOwner && tracker.active && sorted.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            data-testid="initiative-prev"
            onClick={() => onUpdate(prevTurn(tracker))}
            style={{ ...btnBase, flex: 1 }}
          >
            {t('initiative.prev')}
          </button>
          <button
            data-testid="initiative-next"
            onClick={() => onUpdate(nextTurn(tracker))}
            style={{ ...btnBase, flex: 1 }}
          >
            {t('initiative.next')}
          </button>
        </div>
      )}

      {/* ── Combatant list ──────────────────────────────────────── */}
      {sorted.length === 0 && (
        <div
          data-testid="initiative-empty"
          style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: '12px 0', marginBottom: 12 }}
        >
          {t('initiative.empty')}
        </div>
      )}
      {sorted.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {sorted.map(c => {
            const isActive = c.id === tracker.activeCombatantId
            return (
              <div
                key={c.id}
                data-testid={`combatant-row-${c.id}`}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        8,
                  padding:    '6px 10px',
                  background: isActive ? T.accentLight : T.surface,
                  border:     `1px solid ${isActive ? T.borderActive : T.border}`,
                  borderRadius: 8,
                  fontSize:   13,
                }}
              >
                {/* Active indicator */}
                <span style={{ color: isActive ? T.gold : 'transparent', fontSize: 10, flexShrink: 0, lineHeight: 1 }}>
                  ▶
                </span>

                {/* Name */}
                <span style={{ flex: 1, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>

                {/* Initiative value */}
                {isOwner ? (
                  <input
                    type="number"
                    data-testid={`initiative-value-${c.id}`}
                    value={c.initiative}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v)) onUpdate(setInitiative(tracker, c.id, v))
                    }}
                    style={{
                      ...inputBase,
                      width:     44,
                      textAlign: 'center',
                      padding:   '3px 4px',
                    }}
                  />
                ) : (
                  <span
                    data-testid={`initiative-value-${c.id}`}
                    style={{ color: T.textSub, minWidth: 24, textAlign: 'right' }}
                  >
                    {c.initiative}
                  </span>
                )}

                {/* Remove (owner only) */}
                {isOwner && (
                  <button
                    data-testid={`remove-combatant-${c.id}`}
                    aria-label="Remove"
                    onClick={() => onUpdate(removeCombatant(tracker, c.id))}
                    style={{
                      background: 'transparent',
                      border:     'none',
                      color:      T.danger,
                      cursor:     'pointer',
                      fontSize:   15,
                      lineHeight: 1,
                      padding:    '0 2px',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Owner: quick-add linked chars ───────────────────────── */}
      {isOwner && linkedChars.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>
            {t('initiative.quick_add')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {linkedChars.map(lc => {
              const already = tracker.combatants.some(c => c.linkedCharacterId === lc.characterId)
              return (
                <button
                  key={lc.characterId}
                  data-testid={`quick-add-${lc.characterId}`}
                  disabled={already}
                  onClick={() => handleAddLinkedChar(lc)}
                  style={{
                    ...btnBase,
                    padding: '3px 8px',
                    fontSize: 11,
                    opacity: already ? 0.4 : 1,
                    cursor:  already ? 'default' : 'pointer',
                  }}
                >
                  + {lc.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Owner: add monster/NPC ──────────────────────────────── */}
      {isOwner && !showMonsterForm && (
        <button
          data-testid="show-monster-form"
          onClick={() => setShowMonsterForm(true)}
          style={btnBase}
        >
          {t('initiative.add_monster')}
        </button>
      )}
      {isOwner && showMonsterForm && (
        <div data-testid="monster-form" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="text"
            data-testid="monster-name-input"
            placeholder={t('initiative.name')}
            value={monsterName}
            onChange={e => setMonsterName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddMonster() }}
            style={inputBase}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              data-testid="monster-init-input"
              placeholder={t('initiative.value')}
              value={monsterInit}
              onChange={e => setMonsterInit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddMonster() }}
              style={{ ...inputBase, width: 60, flexShrink: 0 }}
            />
            <button
              data-testid="monster-add-btn"
              onClick={handleAddMonster}
              style={btnAccent}
            >
              +
            </button>
            <button
              data-testid="monster-cancel-btn"
              onClick={() => { setShowMonsterForm(false); setMonsterName(''); setMonsterInit('0') }}
              style={btnBase}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
