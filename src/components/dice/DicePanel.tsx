import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { roll } from '@/domain/dice'
import type { RollResult } from '@/domain/dice'
import { useDiceStore } from '@/store/useDiceStore'

const T = {
  surface:      '#15121C',
  panel:        '#1B1725',
  border:       '#2A2537',
  borderStrong: '#4A3A6B',
  text:         '#F4EFE0',
  textSub:      '#C8C4D6',
  textMuted:    '#7A7788',
  ruby:         '#8B1A2E',
  rubyLight:    '#C0392B',
  gold:         '#D4A017',
  green:        '#27AE60',
  purple:       '#5B3FA8',
  sans:         "'Inter', system-ui, sans-serif",
  serif:        "'Cinzel', Georgia, serif",
} as const

const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const
type DieSides = (typeof DIE_SIDES)[number]

interface DicePanelProps {
  onClose: () => void
}

function dieFaceLabel(sides: number): string {
  return `d${sides}`
}

function formatModifier(mod: number): string {
  if (mod === 0) return '0'
  return mod > 0 ? `+${mod}` : `${mod}`
}

function RollSummary({ result }: { result: RollResult }) {
  const { t } = useTranslation()

  const isCritHit = result.crit === 'hit'
  const isCritMiss = result.crit === 'miss'
  const critColor = isCritHit ? T.green : T.rubyLight

  return (
    <div
      data-testid="roll-result"
      style={{
        background: T.surface,
        border: `1px solid ${isCritHit ? T.green : isCritMiss ? T.rubyLight : T.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 10,
      }}
    >
      {/* Total + crit label */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span
          data-testid="roll-total"
          style={{
            fontFamily: T.serif,
            fontSize: 36,
            fontWeight: 700,
            color: isCritHit ? T.green : isCritMiss ? T.rubyLight : T.text,
            lineHeight: 1,
          }}
        >
          {result.total}
        </span>
        <span style={{ fontSize: 13, color: T.textSub }}>{result.notation}</span>
        {result.mode !== 'normal' && (
          <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 2 }}>
            ({result.mode === 'advantage' ? t('dice.advantage') : t('dice.disadvantage')})
          </span>
        )}
        {(isCritHit || isCritMiss) && (
          <span
            data-testid="roll-crit-label"
            style={{
              marginLeft: 'auto',
              fontSize: 12, fontWeight: 700,
              color: critColor,
              border: `1px solid ${critColor}`,
              borderRadius: 6, padding: '2px 8px',
            }}
          >
            {isCritHit ? t('dice.crit_hit') : t('dice.crit_miss')}
          </span>
        )}
      </div>

      {/* Individual dice */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: result.modifier !== 0 ? 6 : 0 }}>
        {result.dice.map((d, i) => (
          <span
            key={i}
            data-testid={d.kept ? 'die-kept' : 'die-discarded'}
            style={{
              display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30,
              background: d.kept ? 'rgba(91,63,168,0.25)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${d.kept ? T.purple : T.border}`,
              borderRadius: 6,
              fontSize: 13, fontWeight: 700,
              color: d.kept ? T.text : T.textMuted,
              textDecoration: d.kept ? 'none' : 'line-through',
            }}
          >
            {d.value}
          </span>
        ))}
      </div>

      {/* Modifier */}
      {result.modifier !== 0 && (
        <div style={{ fontSize: 12, color: T.textMuted }}>
          {t('dice.modifier')}: {formatModifier(result.modifier)}
        </div>
      )}
    </div>
  )
}

export function DicePanel({ onClose }: DicePanelProps) {
  const { t } = useTranslation()
  const history = useDiceStore(s => s.history)
  const addRoll = useDiceStore(s => s.addRoll)
  const clear = useDiceStore(s => s.clear)

  const [selectedSides, setSelectedSides] = useState<DieSides>(20)
  const [quantity, setQuantity] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [mode, setMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal')
  const [lastResult, setLastResult] = useState<RollResult | null>(history[0] ?? null)

  function handleRoll() {
    const notation = quantity === 1 && modifier === 0
      ? `d${selectedSides}`
      : modifier === 0
        ? `${quantity}d${selectedSides}`
        : `${quantity}d${selectedSides}${modifier >= 0 ? '+' : ''}${modifier}`

    const result = roll(notation, { mode })
    addRoll(result)
    setLastResult(result)
  }

  function handleClear() {
    clear()
    setLastResult(null)
  }

  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: T.sans,
    transition: 'background 0.15s',
  }

  return (
    <div
      data-testid="dice-panel"
      style={{
        width: 300,
        background: T.panel,
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 14,
        padding: '16px 14px',
        fontFamily: T.sans,
        color: T.text,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 600 }}>
          {t('dice.title')}
        </span>
        <button
          data-testid="dice-panel-close"
          onClick={onClose}
          style={{ ...btnBase, background: 'transparent', color: T.textMuted, padding: '4px 8px', fontSize: 16 }}
        >
          ×
        </button>
      </div>

      {/* Die selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {DIE_SIDES.map(sides => {
          const active = sides === selectedSides
          return (
            <button
              key={sides}
              data-testid={`die-btn-d${sides}`}
              onClick={() => setSelectedSides(sides)}
              style={{
                ...btnBase,
                padding: '6px 0',
                flex: '1 0 calc(14% - 4px)',
                minWidth: 36,
                background: active ? T.purple : 'rgba(255,255,255,0.06)',
                color: active ? '#fff' : T.textSub,
                border: `1px solid ${active ? T.purple : T.border}`,
                fontSize: 12,
              }}
            >
              {dieFaceLabel(sides)}
            </button>
          )
        })}
      </div>

      {/* Quantity + Modifier */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 3 }}>
            {t('dice.quantity')}
          </label>
          <input
            data-testid="quantity-input"
            type="number"
            min={1}
            max={20}
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 7, padding: '5px 8px',
              color: T.text, fontSize: 14, fontFamily: T.sans,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 3 }}>
            {t('dice.modifier')}
          </label>
          <input
            data-testid="modifier-input"
            type="number"
            min={-20}
            max={20}
            value={modifier}
            onChange={e => setModifier(parseInt(e.target.value) || 0)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 7, padding: '5px 8px',
              color: T.text, fontSize: 14, fontFamily: T.sans,
            }}
          />
        </div>
      </div>

      {/* Advantage / Disadvantage (d20 only) */}
      {selectedSides === 20 && (
        <div style={{ display: 'flex', gap: 5 }}>
          {(['normal', 'advantage', 'disadvantage'] as const).map(m => {
            const label = m === 'normal' ? '—' : m === 'advantage' ? t('dice.advantage') : t('dice.disadvantage')
            const active = mode === m
            return (
              <button
                key={m}
                data-testid={`mode-${m}`}
                onClick={() => setMode(m)}
                style={{
                  ...btnBase,
                  flex: 1, padding: '5px 4px',
                  fontSize: 11,
                  background: active ? (m === 'advantage' ? T.green : m === 'disadvantage' ? T.rubyLight : T.purple) : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : T.textMuted,
                  border: `1px solid ${active ? 'transparent' : T.border}`,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Roll button */}
      <button
        data-testid="roll-btn"
        onClick={handleRoll}
        style={{
          ...btnBase,
          padding: '10px',
          fontSize: 15,
          background: T.ruby,
          color: '#fff',
          border: `1px solid ${T.rubyLight}`,
        }}
      >
        {t('dice.roll')}
      </button>

      {/* Last result */}
      {lastResult && <RollSummary result={lastResult} />}

      {/* History */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{t('dice.history')}</span>
          {history.length > 0 && (
            <button
              data-testid="clear-history-btn"
              onClick={handleClear}
              style={{ ...btnBase, padding: '3px 8px', fontSize: 11, background: 'transparent', color: T.textMuted, border: `1px solid ${T.border}` }}
            >
              {t('dice.clear')}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '10px 0' }}>
            {t('dice.empty')}
          </div>
        ) : (
          <div data-testid="dice-history" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {history.map(r => (
              <div
                key={r.id}
                data-testid="history-entry"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 8px',
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <span style={{ color: T.textSub }}>{r.notation}</span>
                <span style={{ fontWeight: 700, color: r.crit === 'hit' ? T.green : r.crit === 'miss' ? T.rubyLight : T.text }}>
                  {r.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
