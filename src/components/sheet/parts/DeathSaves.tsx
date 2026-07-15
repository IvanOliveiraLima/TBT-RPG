import type React from 'react'
import { Pip } from '../ui/Pip'
import { useTranslation } from '@/i18n'
import { useSheetRoll } from '@/hooks/useSheetRoll'

const INDICES = [1, 2, 3] as const

const PIP_BUTTON: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '6px',
  margin: '-6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
}

interface DeathSavesProps {
  successes: number
  failures: number
  onUpdate?: (ds: { successes: number; failures: number }) => void
}

export function DeathSaves({ successes, failures, onUpdate }: DeathSavesProps) {
  const { t } = useTranslation()
  const { rollExpr } = useSheetRoll()

  function handleSuccessClick(targetCount: number) {
    if (!onUpdate) return
    // Click pip N: if N <= current count, decrement to N-1; else increment to N
    const newCount = targetCount <= successes ? targetCount - 1 : targetCount
    onUpdate({ successes: newCount, failures })
  }

  function handleFailureClick(targetCount: number) {
    if (!onUpdate) return
    const newCount = targetCount <= failures ? targetCount - 1 : targetCount
    onUpdate({ successes, failures: newCount })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: '#7A7788',
          }}
        >
          {t('deathsaves.section_title')}
        </div>
        <button
          type="button"
          data-testid="deathsave-roll-btn"
          onClick={() => rollExpr(t('dice.label_death_save'), 'd20')}
          title={t('dice.roll')}
          style={{
            background: 'none',
            border: 'none',
            color: '#5B3FA8',
            fontSize: 14,
            cursor: 'pointer',
            padding: '2px 4px',
            lineHeight: 1,
          }}
        >
          ⚅
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Successes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#5DCAA5', width: 18 }}>✓</span>
          {INDICES.map(n => (
            onUpdate ? (
              <button
                key={n}
                type="button"
                data-testid={`deathsave-success-${n}`}
                aria-pressed={n <= successes}
                aria-label={t('aria.deathsave_success_toggle', { n: String(n) })}
                onClick={() => handleSuccessClick(n)}
                style={PIP_BUTTON}
              >
                <Pip state={n <= successes ? 'filled' : 'empty'} color="success" size="sm" />
              </button>
            ) : (
              <Pip key={n} state={n <= successes ? 'filled' : 'empty'} color="success" size="sm" />
            )
          ))}
        </div>
        {/* Failures */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#E24B4A', width: 18 }}>✗</span>
          {INDICES.map(n => (
            onUpdate ? (
              <button
                key={n}
                type="button"
                data-testid={`deathsave-failure-${n}`}
                aria-pressed={n <= failures}
                aria-label={t('aria.deathsave_failure_toggle', { n: String(n) })}
                onClick={() => handleFailureClick(n)}
                style={PIP_BUTTON}
              >
                <Pip state={n <= failures ? 'filled' : 'empty'} color="ruby" size="sm" />
              </button>
            ) : (
              <Pip key={n} state={n <= failures ? 'filled' : 'empty'} color="ruby" size="sm" />
            )
          ))}
        </div>
      </div>
    </div>
  )
}
