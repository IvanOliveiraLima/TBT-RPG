import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/domain/campaign'

export class UserProfileServiceError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
    this.name = 'UserProfileServiceError'
  }
}

export async function getMyProfile(): Promise<UserProfile | null> {
  if (!supabase) return null

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[user-profile] getMyProfile error', error)
    throw new UserProfileServiceError('get_failed')
  }

  return data ? mapProfileRow(data) : null
}

export async function getProfileById(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[user-profile] getProfileById error', error)
    return null // treat as "no profile" silently
  }

  return data ? mapProfileRow(data) : null
}

export async function upsertMyProfile(displayName: string): Promise<UserProfile> {
  if (!supabase) throw new UserProfileServiceError('not_authenticated')

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new UserProfileServiceError('not_authenticated')

  const trimmed = displayName.trim()
  if (trimmed.length === 0) throw new UserProfileServiceError('empty_display_name')
  if (trimmed.length > 50) throw new UserProfileServiceError('display_name_too_long')

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      display_name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[user-profile] upsertMyProfile error', error)
    throw new UserProfileServiceError('upsert_failed')
  }

  return mapProfileRow(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfileRow(row: any): UserProfile {
  return {
    userId: row.user_id as string,
    displayName: row.display_name as string,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}
