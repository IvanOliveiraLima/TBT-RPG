import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

// Colors matching design-reference/tbt-rpg/project/components/sheet-parts.jsx
const COINS: { key: 'pp' | 'gp' | 'ep' | 'sp' | 'cp'; color: string }[] = [
  { key: 'pp', color: '#D0D0E8' },
  { key: 'gp', color: '#D4A017' },
  { key: 'ep', color: '#C8B070' },
  { key: 'sp', color: '#B8B8C8' },
  { key: 'cp', color: '#B47850' },
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
  const { t } = useTranslation()
  const { currency } = character

  return (
    <div data-testid="currency-block">
      <Card padding="md">
        <Label>{t('currency.section_title')}</Label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
          }}
        >
          {COINS.map(({ key, color }) => (
            <div
              key={key}
              data-testid={`currency-${key}`}
              aria-label={t(`currency.${key}_aria` as TranslationKey, { count: String(currency[key]) })}
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
                {t(`currency.${key}_label` as TranslationKey)}
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
