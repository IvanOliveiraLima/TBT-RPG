import type { Character } from '@/domain/character'
import { useTranslation } from '@/i18n'
import { Badge } from '../ui/Badge'

interface FeaturesListProps {
  character: Character
}

export function FeaturesList({ character }: FeaturesListProps) {
  const { t } = useTranslation()
  const { features } = character

  if (features.length === 0) {
    return (
      <div
        data-testid="features-empty"
        style={{ fontSize: 13, color: '#7A7788', padding: '8px 10px' }}
      >
        {t('features.empty')}
      </div>
    )
  }

  return (
    <div
      data-testid="features-list"
      style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      {features.map((f) => {
        const showUses =
          f.type === 'active' && f.usesMax !== undefined && f.usesMax > 0

        return (
          <div
            key={f.id}
            data-testid={`feature-${f.id}`}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ color: '#D4A017', fontSize: 12 }}>✦</span>
            <span style={{ flex: 1, fontSize: 13, color: '#F4EFE0' }}>
              {f.name}
            </span>
            {f.source && (
              <span
                style={{
                  fontSize: 10,
                  color: '#7A7788',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {f.source}
              </span>
            )}
            {showUses && (
              <Badge variant="gold">
                {f.usesLeft ?? 0}/{f.usesMax}
              </Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}
