import { useAuthStore } from '@/store/auth'

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading'

export function useAuthStatus(): AuthStatus {
  const loading = useAuthStore(s => s.loading)
  const user = useAuthStore(s => s.user)
  if (loading) return 'loading'
  return user ? 'authenticated' : 'unauthenticated'
}
