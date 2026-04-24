import { Pip } from '../ui/Pip'

const INDICES = [0, 1, 2] as const

interface DeathSavesProps {
  successes: number
  failures: number
}

export function DeathSaves({ successes, failures }: DeathSavesProps) {
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
        Death Saves
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Successes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#5DCAA5', width: 18 }}>✓</span>
          {INDICES.map(i => (
            <Pip key={i} state={i < successes ? 'filled' : 'empty'} color="success" size="sm" />
          ))}
        </div>
        {/* Failures */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#E24B4A', width: 18 }}>✗</span>
          {INDICES.map(i => (
            <Pip key={i} state={i < failures ? 'filled' : 'empty'} color="ruby" size="sm" />
          ))}
        </div>
      </div>
    </div>
  )
}
