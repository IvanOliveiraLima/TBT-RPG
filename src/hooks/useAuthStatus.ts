import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { getSyncStatus, onSyncStatusChange, type SyncStatus } from '@/services/sync'

export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'authenticated_idle'
  | 'authenticated_syncing'
  | 'authenticated_offline'
  | 'authenticated_error'

export function useAuthStatus(): AuthStatus {
  const loading = useAuthStore(s => s.loading)
  const user    = useAuthStore(s => s.user)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus())

  useEffect(() => {
    return onSyncStatusChange(setSyncStatus)
  }, [])

  if (loading) return 'loading'
  if (!user)   return 'unauthenticated'
  return `authenticated_${syncStatus}` as AuthStatus
}
