import type React from 'react'

export const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: `radial-gradient(ellipse at top, rgba(91,63,168,0.18), transparent 55%), #0F0D14`,
  padding: '24px',
  fontFamily: "'Inter', system-ui, sans-serif",
}

export const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 360,
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 16,
  padding: '32px 24px',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: 1,
  color: '#7A7788', marginBottom: 6,
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1B1725',
  border: '1px solid #2A2537',
  borderRadius: 8, padding: '10px 12px',
  fontSize: 14, color: '#F4EFE0',
  outline: 'none', boxSizing: 'border-box',
}

export const linkBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none',
  fontSize: 13, color: '#7A7788',
  cursor: 'pointer', textDecoration: 'underline',
}

export function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: disabled ? '#3A3450' : '#5B3FA8',
    border: 'none', borderRadius: 10, padding: '12px',
    fontSize: 14, fontWeight: 600,
    color: disabled ? '#7A7788' : '#F4EFE0',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 200ms',
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
