import { useState } from 'react'
import type React from 'react'
import { useTranslation } from '@/i18n'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  inputStyle?: React.CSSProperties
}

export function PasswordInput({ inputStyle, ...props }: Props) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        style={{ ...inputStyle, paddingRight: 40 }}
      />
      <button
        type="button"
        aria-label={visible ? t('auth.password_hide') : t('auth.password_show')}
        aria-pressed={visible}
        onClick={() => setVisible(v => !v)}
        disabled={props.disabled}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: '#7A7788', display: 'inline-flex', alignItems: 'center',
        }}
        data-testid="password-visibility-toggle"
      >
        {visible
          ? /* eye-off */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          : /* eye */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>}
      </button>
    </div>
  )
}
