const T = {
  bg:          '#0F0D14',
  textPrimary: '#F4EFE0',
  textMuted:   '#7A7788',
  gold:        '#D4A017',
  serif:       "'Cinzel', Georgia, serif",
  sans:        "'Inter', system-ui, sans-serif",
} as const

export function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: T.bg,
      fontFamily: T.sans,
      gap: 16,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: `3px solid ${T.gold}30`,
        borderTopColor: T.gold,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 13, color: T.textMuted, fontFamily: T.serif }}>
        Carregando personagem…
      </p>
    </div>
  )
}
