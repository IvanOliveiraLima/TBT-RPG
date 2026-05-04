import { useTranslation } from '@/i18n'

interface HitDiceEntry {
  current: number
  max: number
  dieSize: number
}

interface HitDicePoolProps {
  hitDice: HitDiceEntry[]
}

export function HitDicePool({ hitDice }: HitDicePoolProps) {
  const { t } = useTranslation()
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: '#7A7788',
          marginBottom: 6,
        }}
      >
        {t('hit_dice.section_title')}
      </div>

      {hitDice.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            fontFamily: "'Cinzel', Georgia, serif",
            color: '#7A7788',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600 }}>—</span>
          <span style={{ fontSize: 12, color: '#7A7788' }}>/ — d8</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hitDice.map((hd, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                fontFamily: "'Cinzel', Georgia, serif",
                color: '#F4EFE0',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 600 }}>
                {hd.current > 0 ? hd.current : hd.max > 0 ? hd.max : '—'}
              </span>
              <span style={{ fontSize: 12, color: '#7A7788' }}>
                / {hd.max > 0 ? hd.max : '—'} d{hd.dieSize}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
