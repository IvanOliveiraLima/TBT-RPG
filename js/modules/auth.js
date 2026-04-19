import { supabase, isSupabaseEnabled } from './supabase.js'

// Estado local do usuário
let currentUser = null
const authListeners = []

export function getCurrentUser() {
  return currentUser
}

export function isLoggedIn() {
  return currentUser !== null
}

export function onAuthChange(callback) {
  authListeners.push(callback)
  return () => {
    const idx = authListeners.indexOf(callback)
    if (idx > -1) authListeners.splice(idx, 1)
  }
}

function notifyListeners(user) {
  currentUser = user
  authListeners.forEach(fn => fn(user))
}

export async function initAuth() {
  if (!isSupabaseEnabled()) return

  // Restaurar sessão existente
  const { data: { session } } = await supabase.auth.getSession()
  notifyListeners(session?.user ?? null)

  // Escutar mudanças de auth
  supabase.auth.onAuthStateChange((_event, session) => {
    if (_event === 'TOKEN_REFRESHED') return
    notifyListeners(session?.user ?? null)
  })
}

export async function signUpWithEmail(email, password) {
  if (!isSupabaseEnabled()) throw new Error('Sync not available in offline mode')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInWithEmail(email, password) {
  if (!isSupabaseEnabled()) throw new Error('Sync not available in offline mode')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  throw new Error('Google sign in not configured yet.')
}

export async function signOut() {
  if (!isSupabaseEnabled()) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email) {
  if (!isSupabaseEnabled()) throw new Error('Sync not available in offline mode')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname + '?reset=true'
  })
  if (error) throw error
}
