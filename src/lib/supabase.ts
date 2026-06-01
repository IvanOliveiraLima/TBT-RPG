import { createClient, type SupabaseClient, type Session, type User } from '@supabase/supabase-js'

const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined
const key = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined

/**
 * Supabase singleton. null when env vars are not configured — same behaviour
 * as v1: the app works offline without Supabase credentials.
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

/* ── Auth helpers ─────────────────────────────────────────────────────── */

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export type { User, Session }
