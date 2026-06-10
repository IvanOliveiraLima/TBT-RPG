import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

const T = {
  bg:       '#0F0D14',
  textMuted: '#7A7788',
  sans:     "'Inter', system-ui, sans-serif",
} as const

export default function JoinByLink() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)

  useEffect(() => {
    if (authLoading) return

    if (!code) {
      navigate('/', { replace: true })
      return
    }

    if (!user) {
      const redirectTo = encodeURIComponent(`/campaigns?openJoin=${encodeURIComponent(code)}`)
      navigate(`/login?redirectTo=${redirectTo}`, { replace: true })
      return
    }

    navigate(`/campaigns?openJoin=${encodeURIComponent(code)}`, { replace: true })
  }, [code, user, authLoading, navigate])

  return (
    <div style={{
      minHeight: '100dvh',
      background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.textMuted, fontFamily: T.sans, fontSize: 14,
    }}>
      …
    </div>
  )
}
