import type { Character } from '@/domain/character'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

// Colors matching design-reference/tbt-rpg/project/components/sheet-parts.jsx
const COINS = [
  { key: 'pp' as const, label: 'PP', color: '#D0D0E8', ariaName: 'Platina' },
  { key: 'gp' as const, label: 'GP', color: '#D4A017', ariaName: 'Ouro' },
  { key: 'ep' as const, label: 'EP', color: '#C8B070', ariaName: 'Electrum' },
  { key: 'sp' as const, label: 'SP', color: '#B8B8C8', ariaName: 'Prata' },
  { key: 'cp' as const, label: 'CP', color: '#B47850', ariaName: 'Cobre' },
]

const T = {
  textPrimary:  '#F4EFE0',
  textMuted:    '#7A7788',
  elevated:     '#1D1929',
  borderSubtle: '#2A2537',
  serif:        "'Cinzel', Georgia, serif",
} as const

interface CurrencyBlockProps {
  character: Character
}

export function CurrencyBlock({ character }: CurrencyBlockProps) {
  const { currency } = character

  return (
    <div data-testid="currency-block">
      <Card padding="md">
        <Label>MOEDAS</Label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
          }}
        >
          {COINS.map(({ key, label, color, ariaName }) => (
            <div
              key={key}
              data-testid={`currency-${key}`}
              aria-label={`${ariaName}: ${currency[key]}`}
              style={{
                background: T.elevated,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: 8,
                padding: '8px 4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: 16,
                  fontWeight: 600,
                  color: T.textPrimary,
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: 2,
                }}
              >
                {currency[key]}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
