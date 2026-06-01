import type { Character } from '@/domain/character'
import { NumberField } from '@/components/primitives/NumberField'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { Card } from '../ui/Card'
import { Label } from '../ui/Label'

// EP removed — 4 coins only (PP/GP/SP/CP). EP converted → SP during migration.
const COINS: { key: keyof Character['currency']; color: string }[] = [
  { key: 'pp', color: '#D0D0E8' },
  { key: 'gp', color: '#D4A017' },
  { key: 'sp', color: '#B8B8C8' },
  { key: 'cp', color: '#B47850' },
]

const T = {
  textPrimary:  '#F4EFE0',
  textMuted:    '#7A7788',
  elevated:     '#1D1929',
  borderSubtle: '#2A2537',
  serif:        "'Cinzel', Georgia, serif",
  sans:         "'Inter', system-ui, sans-serif",
} as const

interface CurrencyBlockProps {
  character: Character
  onUpdate?: (partial: Partial<Character>) => void
}

export function CurrencyBlock({ character, onUpdate }: CurrencyBlockProps) {
  const { t } = useTranslation()
  const { currency } = character
  const readOnly = !onUpdate

  function updateCoin(coin: keyof Character['currency'], value: number) {
    onUpdate?.({
      currency: { ...currency, [coin]: Math.max(0, value) },
    })
  }

  return (
    <div data-testid="currency-block">
      <Card padding="md">
        <Label>{t('currency.section_title')}</Label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {COINS.map(({ key, color }) => (
            <div
              key={key}
              data-testid={`currency-${key}`}
              aria-label={t(`currency.${key}_aria` as TranslationKey, { count: String(currency[key]) })}
              style={{
                background:   T.elevated,
                border:       `1px solid ${T.borderSubtle}`,
                borderRadius:  8,
                padding:       '8px 4px',
                textAlign:     'center',
              }}
            >
              <div
                style={{
                  fontSize:      9,
                  color,
                  fontWeight:    700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom:  4,
                }}
              >
                {t(`currency.${key}_label` as TranslationKey)}
              </div>
              {readOnly ? (
                <div
                  style={{
                    fontFamily:         T.serif,
                    fontSize:           16,
                    fontWeight:         600,
                    color:              T.textPrimary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {currency[key]}
                </div>
              ) : (
                <NumberField
                  value={currency[key]}
                  min={0}
                  max={999999}
                  onChange={n => updateCoin(key, n)}
                  aria-label={t(`currency.${key}_aria` as TranslationKey, { count: String(currency[key]) })}
                  data-testid={`currency-input-${key}`}
                  style={{
                    fontFamily:         T.serif,
                    fontSize:           14,
                    fontWeight:         600,
                    color:              T.textPrimary,
                    fontVariantNumeric: 'tabular-nums',
                    background:         'transparent',
                    border:             `1px solid transparent`,
                    borderRadius:        4,
                    textAlign:          'center',
                    width:              '100%',
                    padding:            '2px 0',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
