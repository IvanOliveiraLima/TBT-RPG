const T = {
  textPrimary: '#F4EFE0',
  textMuted:   '#7A7788',
  serif:       "'Cinzel', Georgia, serif",
  sans:        "'Inter', system-ui, sans-serif",
} as const

export function CombatTab() {
  return (
    <div style={{
      padding: 24,
      textAlign: 'center',
      fontFamily: T.sans,
      color: T.textMuted,
    }}>
      <p style={{ fontFamily: T.serif, fontSize: 16, color: T.textPrimary, marginBottom: 8 }}>
        Combate &amp; Skills
      </p>
      <p style={{ fontSize: 13 }}>Conteúdo em construção</p>
      <p style={{ fontSize: 11, marginTop: 16, opacity: 0.7 }}>
        Ataques, saving throws e perícias aparecerão aqui.
      </p>
    </div>
  )
}
