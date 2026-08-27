import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { HelpHint } from '@/components/HelpHint'
import {
  sortCombatants,
  startCombat,
  endCombat,
  nextTurn,
  prevTurn,
  addCombatant,
  removeCombatant,
  setInitiative,
  setCombatantHp,
} from '@/domain/initiative'
import type { Combatant, InitiativeTracker } from '@/domain/initiative'

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Given a base name and existing combatants, return the numbered name for the new combatant
 *  and, if a pure name collision exists, the id of the combatant to rename to "{base} 1". */
function autoNumberName(
  base: string,
  combatants: Combatant[],
): { renamedId: string | null; newName: string } {
  const trimBase = base.trim()
  const familyRe = new RegExp(`^${escapeRegex(trimBase)}(\\s+\\d+)?$`, 'i')
  const family = combatants.filter(c => familyRe.test(c.name.trim()))
  if (family.length === 0) return { renamedId: null, newName: trimBase }

  const pure = family.find(c => !/\s+\d+$/.test(c.name.trim()))
  if (pure) {
    const usedNums = new Set<number>([1])
    for (const c of family) {
      if (c.id === pure.id) continue
      const m = c.name.trim().match(/\s+(\d+)$/)
      if (m) usedNums.add(parseInt(m[1]!, 10))
    }
    let next = 2
    while (usedNums.has(next)) next++
    return { renamedId: pure.id, newName: `${trimBase} ${next}` }
  }

  const maxNum = family.reduce((mx, c) => {
    const m = c.name.trim().match(/\s+(\d+)$/)
    return m ? Math.max(mx, parseInt(m[1]!, 10)) : mx
  }, 0)
  return { renamedId: null, newName: `${trimBase} ${maxNum + 1}` }
}

// Module-level factories — keep impure calls (Date.now, Math.random) outside component body
function makeLinkedCombatant(lc: { characterId: string; name: string }): Combatant {
  return {
    id:                `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name:              lc.name,
    initiative:        0,
    linkedCharacterId: lc.characterId,
  }
}

function makeFreeCombatant(
  name: string,
  initiative: number,
  hp?: { current: number; max: number },
  tokenId?: string,
): Combatant {
  return {
    id:         `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    initiative,
    ...(hp      !== undefined ? { hp }      : {}),
    ...(tokenId !== undefined ? { tokenId } : {}),
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

interface LinkedChar { characterId: string; name: string; hp?: { current: number; max: number; temp: number } }

interface MapToken { id: string; label: string; hpMax?: number | null }

interface Props {
  isMaster: boolean
  tracker: InitiativeTracker
  linkedChars: LinkedChar[]
  onUpdate: (t: InitiativeTracker) => void
  autoInitiative?: boolean
  onToggleAutoInitiative?: (v: boolean) => void
  /** Map tokens available for linking a new monster; controls which tokens appear in the select. */
  tokens?: MapToken[]
  /** Id of the combatant whose row should be briefly highlighted (from map token click). */
  highlightCombatantId?: string
  /** Called when the master clicks on a combatant row/icon to spotlight its linked token. */
  onHighlightToken?: (tokenId: string | undefined) => void
}

export function CampaignInitiativePanel({ isMaster, tracker, linkedChars, onUpdate, autoInitiative, onToggleAutoInitiative, tokens, highlightCombatantId, onHighlightToken }: Props) {
  const { t } = useTranslation()
  const [monsterName,    setMonsterName]    = useState('')
  const [monsterInit,    setMonsterInit]    = useState('0')
  const [monsterHp,      setMonsterHp]      = useState('')
  const [monsterTokenId, setMonsterTokenId] = useState('')
  const [showMonsterForm, setShowMonsterForm] = useState(false)

  const sorted = sortCombatants(tracker.combatants)

  function handleAddLinkedChar(lc: LinkedChar) {
    if (tracker.combatants.some(c => c.linkedCharacterId === lc.characterId)) return
    onUpdate(addCombatant(tracker, makeLinkedCombatant(lc)))
  }

  function handleAddMonster() {
    const name = monsterName.trim()
    if (!name) return
    const init    = parseInt(monsterInit, 10)
    const hpRaw   = parseInt(monsterHp, 10)
    const hp      = !isNaN(hpRaw) && hpRaw > 0 ? { current: hpRaw, max: hpRaw } : undefined
    const tokenId = monsterTokenId || undefined

    const { renamedId, newName } = autoNumberName(name, tracker.combatants)
    let updated = tracker
    if (renamedId !== null) {
      updated = {
        ...tracker,
        combatants: tracker.combatants.map(c =>
          c.id === renamedId ? { ...c, name: `${name} 1` } : c
        ),
      }
    }

    onUpdate(addCombatant(updated, makeFreeCombatant(newName, isNaN(init) ? 0 : init, hp, tokenId)))
    setMonsterName('')
    setMonsterInit('0')
    setMonsterHp('')
    setMonsterTokenId('')
    setShowMonsterForm(false)
  }

  const miniBtn: React.CSSProperties = {
    background:   'transparent',
    border:       `1px solid ${T.border}`,
    borderRadius: 4,
    padding:      '1px 5px',
    color:        T.textSub,
    cursor:       'pointer',
    fontSize:     11,
    lineHeight:   1,
    flexShrink:   0,
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

  const fieldLabel: React.CSSProperties = {
    fontSize:      10,
    color:         T.textMuted,
    letterSpacing: 0.5,
  }

  const colLabel: React.CSSProperties = {
    fontSize:      10,
    color:         T.textMuted,
    letterSpacing: 1,
    textAlign:     'center',
    flexShrink:    0,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMaster && onToggleAutoInitiative ? 6 : 12 }}>
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
        {isMaster && (
          <button
            data-testid={tracker.active ? 'initiative-end-btn' : 'initiative-start-btn'}
            onClick={() => onUpdate(tracker.active ? endCombat(tracker) : startCombat(tracker))}
            style={btnBase}
          >
            {tracker.active ? t('initiative.end') : t('initiative.start')}
          </button>
        )}
      </div>

      {/* ── Auto-initiative toggle (owner only) ─────────────────── */}
      {isMaster && onToggleAutoInitiative && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: T.textMuted }}>
            <input
              type="checkbox"
              data-testid="auto-initiative-toggle"
              checked={autoInitiative ?? false}
              onChange={e => onToggleAutoInitiative(e.target.checked)}
              style={{ width: 13, height: 13, accentColor: T.accent, cursor: 'pointer' }}
            />
            {t('initiative.auto_initiative')}
            <HelpHint textKey="initiative.auto_initiative_hint" />
          </label>
        </div>
      )}

      {/* ── Turn controls (owner, during active combat) ─────────── */}
      {isMaster && tracker.active && sorted.length > 0 && (
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
        <div
          data-testid="combat-columns-header"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', marginBottom: 2 }}
        >
          {/* spacer for active ▶ indicator */}
          <span style={{ fontSize: 10, color: 'transparent', flexShrink: 0, lineHeight: 1 }}>▶</span>
          {/* name column */}
          <span style={{ flex: 1 }} />
          {/* HP column (master only) — before INIC so placeholder keeps INIC aligned */}
          {isMaster && <span style={{ ...colLabel, minWidth: 76 }}>{t('initiative.hp')}</span>}
          {/* initiative column — matches input width: 44 */}
          <span style={{ ...colLabel, width: 44 }}>{t('initiative.value')}</span>
          {/* spacer for remove button (master only) */}
          {isMaster && <span style={{ width: 18, flexShrink: 0 }} />}
        </div>
      )}
      {sorted.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {sorted.map(c => {
            const isActive    = c.id === tracker.activeCombatantId
            const isHighlight = c.id === highlightCombatantId
            // HP from the linked character's live sheet (read-only; undefined = not loaded yet)
            const linkedHp = c.linkedCharacterId
              ? linkedChars.find(lc => lc.characterId === c.linkedCharacterId)?.hp
              : undefined
            // Token link: only show icon when the token still exists in the current tokens list
            const hasTokenLink = isMaster && !!c.tokenId && !!tokens?.some(t => t.id === c.tokenId)
            return (
              <div
                key={c.id}
                data-testid={`combatant-row-${c.id}`}
                onClick={hasTokenLink ? (e) => {
                  if ((e.target as HTMLElement).closest('input, button, select')) return
                  onHighlightToken?.(c.tokenId)
                } : undefined}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        8,
                  padding:    '6px 10px',
                  background: isActive    ? T.accentLight
                            : isHighlight ? 'rgba(107,127,212,0.15)'
                            : T.surface,
                  border:     `1px solid ${isActive ? T.borderActive : T.border}`,
                  borderRadius: 8,
                  fontSize:   13,
                  cursor:     hasTokenLink ? 'pointer' : 'default',
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

                {/* Token link icon — spotlights the linked token on the map (master only) */}
                {hasTokenLink && (
                  <button
                    data-testid={`combatant-token-${c.id}`}
                    aria-label={t('initiative.highlight_token')}
                    onClick={e => { e.stopPropagation(); onHighlightToken?.(c.tokenId) }}
                    style={{
                      background: 'transparent', border: 'none',
                      color: T.textMuted, cursor: 'pointer',
                      fontSize: 11, padding: '0 1px', flexShrink: 0, lineHeight: 1,
                    }}
                  >
                    ↗
                  </button>
                )}

                {/* HP (master only) — monster editable / linked char read-only / placeholder */}
                {isMaster && (
                  c.hp ? (
                    /* Monster with HP — editable controls */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <button
                        data-testid={`hp-minus-${c.id}`}
                        aria-label={t('initiative.hp_aria_minus')}
                        onClick={() => onUpdate(setCombatantHp(tracker, c.id, {
                          ...c.hp!,
                          current: Math.max(0, c.hp!.current - 1),
                        }))}
                        style={miniBtn}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        data-testid={`combatant-hp-${c.id}`}
                        aria-label={t('aria.combatant_hp')}
                        value={c.hp.current}
                        onChange={e => {
                          const v = parseInt(e.target.value, 10)
                          if (!isNaN(v)) {
                            onUpdate(setCombatantHp(tracker, c.id, {
                              ...c.hp!,
                              current: Math.max(0, Math.min(c.hp!.max, v)),
                            }))
                          }
                        }}
                        style={{
                          ...inputBase,
                          width:     32,
                          textAlign: 'center',
                          padding:   '2px 3px',
                        }}
                      />
                      <span style={{ color: T.textMuted, fontSize: 10, flexShrink: 0 }}>
                        /{c.hp.max}
                      </span>
                      <button
                        data-testid={`hp-plus-${c.id}`}
                        aria-label={t('initiative.hp_aria_plus')}
                        onClick={() => onUpdate(setCombatantHp(tracker, c.id, {
                          ...c.hp!,
                          current: Math.min(c.hp!.max, c.hp!.current + 1),
                        }))}
                        style={miniBtn}
                      >
                        +
                      </button>
                    </div>
                  ) : linkedHp ? (
                    /* Linked player character — read-only HP from live sheet */
                    <div
                      data-testid={`combatant-hp-linked-${c.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, minWidth: 76 }}
                    >
                      <span style={{ color: T.text, fontSize: 12, minWidth: 20, textAlign: 'right' }}>
                        {linkedHp.current}
                      </span>
                      <span style={{ color: T.textMuted, fontSize: 10, flexShrink: 0 }}>
                        /{linkedHp.max}
                      </span>
                      {linkedHp.temp > 0 && (
                        <span
                          data-testid={`combatant-hp-temp-${c.id}`}
                          style={{ color: '#6B7FD4', fontSize: 10, flexShrink: 0 }}
                        >
                          +{linkedHp.temp}
                        </span>
                      )}
                    </div>
                  ) : (
                    /* No HP data yet — placeholder reserves column width for alignment */
                    <div aria-hidden data-testid={`hp-placeholder-${c.id}`} style={{ minWidth: 76, flexShrink: 0 }} />
                  )
                )}

                {/* Initiative value */}
                {isMaster ? (
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
                {isMaster && (
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
      {isMaster && linkedChars.length > 0 && (
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

      {/* ── Owner: quick-add creatures from map tokens ──────────── */}
      {isMaster && tokens && (() => {
        const eligible = tokens.filter(tok => !tracker.combatants.some(c => c.tokenId === tok.id))
        if (eligible.length === 0) return null
        return (
          <div data-testid="quick-add-creatures-section" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>
              {t('initiative.quick_add_creatures')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {eligible.map(tok => (
                <button
                  key={tok.id}
                  data-testid={`quick-add-token-${tok.id}`}
                  onClick={() => {
                    const hp = tok.hpMax ? { current: tok.hpMax, max: tok.hpMax } : undefined
                    const { renamedId, newName } = autoNumberName(tok.label, tracker.combatants)
                    let updated = tracker
                    if (renamedId !== null) {
                      updated = {
                        ...tracker,
                        combatants: tracker.combatants.map(c =>
                          c.id === renamedId ? { ...c, name: `${tok.label} 1` } : c
                        ),
                      }
                    }
                    onUpdate(addCombatant(updated, makeFreeCombatant(newName, 0, hp, tok.id)))
                  }}
                  style={{ ...btnBase, padding: '3px 8px', fontSize: 11 }}
                >
                  + {tok.label}
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Owner: add monster/NPC ──────────────────────────────── */}
      {isMaster && !showMonsterForm && (
        <button
          data-testid="show-monster-form"
          onClick={() => setShowMonsterForm(true)}
          style={btnBase}
        >
          {t('initiative.add_monster')}
        </button>
      )}
      {isMaster && showMonsterForm && (
        <div data-testid="monster-form" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Token select — only shown when the map has tokens */}
          {tokens && tokens.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span data-testid="monster-token-label" style={fieldLabel}>{t('initiative.token')}</span>
              <select
                data-testid="monster-token-select"
                value={monsterTokenId}
                onChange={e => {
                  const id = e.target.value
                  setMonsterTokenId(id)
                  // Pre-fill name from the token label when the name field is still empty
                  if (id && !monsterName) {
                    const tok = tokens.find(tk => tk.id === id)
                    if (tok) setMonsterName(tok.label)
                  }
                }}
                className="dark-select"
                style={{ ...inputBase }}
              >
                <option value="">—</option>
                {tokens
                  .filter(tok => !tracker.combatants.some(c => c.tokenId === tok.id))
                  .map(tok => (
                    <option key={tok.id} value={tok.id}>{tok.label}</option>
                  ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span data-testid="monster-name-label" style={fieldLabel}>{t('initiative.name')}</span>
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
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span data-testid="monster-init-label" style={fieldLabel}>{t('initiative.value')}</span>
              <input
                type="number"
                data-testid="monster-init-input"
                placeholder={t('initiative.value')}
                value={monsterInit}
                onChange={e => setMonsterInit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddMonster() }}
                style={{ ...inputBase, width: 60, flexShrink: 0 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span data-testid="monster-hp-label" style={fieldLabel}>{t('initiative.hp')}</span>
              <input
                type="number"
                data-testid="monster-hp-input"
                placeholder={t('initiative.hp')}
                value={monsterHp}
                onChange={e => setMonsterHp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddMonster() }}
                style={{ ...inputBase, width: 50, flexShrink: 0 }}
              />
            </div>
            <button
              data-testid="monster-add-btn"
              onClick={handleAddMonster}
              style={{ ...btnAccent, alignSelf: 'flex-end' }}
            >
              +
            </button>
            <button
              data-testid="monster-cancel-btn"
              onClick={() => { setShowMonsterForm(false); setMonsterName(''); setMonsterInit('0'); setMonsterHp(''); setMonsterTokenId('') }}
              style={{ ...btnBase, alignSelf: 'flex-end' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
