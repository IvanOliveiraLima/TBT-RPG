const T = {
  textPrimary: '#F4EFE0',
  textMuted:   '#7A7788',
  serif:       "'Cinzel', Georgia, serif",
  sans:        "'Inter', system-ui, sans-serif",
} as const

/** Desktop-only tab for session notes and allies. */
export function NotesTab() {
  return (
    <div style={{
      padding: 24,
      textAlign: 'center',
      fontFamily: T.sans,
      color: T.textMuted,
    }}>
      <p style={{ fontFamily: T.serif, fontSize: 16, color: T.textPrimary, marginBottom: 8 }}>
        Notas
      </p>
      <p style={{ fontSize: 13 }}>Conteúdo em construção</p>
      <p style={{ fontSize: 11, marginTop: 16, opacity: 0.7 }}>
        Notas de sessão e aliados aparecerão aqui. Disponível apenas no desktop.
      </p>
    </div>
  )
}
