import { create } from 'zustand'
import { supabase, signIn as supaSignIn, signOut as supaSignOut, type User, type Session } from '@/lib/supabase'
import { deleteAccountService } from '@/services/delete-account'
import { clearAllLocalData } from '@/data/db'
import { syncAll } from '@/services/sync'
import { useCharactersStore } from './characters'
import { useCharacterStore } from './character'

export type SignUpResult =
  | { status: 'signed_in' }
  | { status: 'email_confirmation_required' }
  | { status: 'error'; code: string }

export type RequestResetResult  = { status: 'sent' }    | { status: 'error'; code: string }
export type UpdatePasswordResult = { status: 'updated' } | { status: 'error'; code: string }

interface AuthState {
  user:    User | null
  session: Session | null
  loading: boolean
  /** Transient — set on boot from URL hash, cleared when consumed. */
  authCallbackType: string | null
  /** Transient — set on boot when the auth callback hash carries an error; cleared on dismiss. */
  authCallbackError: string | null
  /** Transient — set true after a successful password update; cleared on banner dismiss. */
  passwordResetSuccess: boolean
  /**
   * Transient — set true when explicit logout couldn't flush sync (offline or error).
   * The UI may use this to warn the user that local characters were kept on device.
   */
  localKept: boolean

  initAuth:             () => Promise<void>
  signIn:               (email: string, password: string) => Promise<void>
  signUp:               (email: string, password: string) => Promise<SignUpResult>
  signOut:              () => Promise<void>
  requestPasswordReset: (email: string)       => Promise<RequestResetResult>
  updatePassword:       (newPassword: string) => Promise<UpdatePasswordResult>
  deleteAccount: () => Promise<void>
  /** Placeholder — Supabase OAuth not wired in Phase A */
  signInWithGoogle: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user:                 null,
  session:              null,
  loading:              true,
  authCallbackType:     null,
  authCallbackError:    null,
  passwordResetSuccess: false,
  localKept:            false,

  initAuth: async () => {
    if (!supabase) {
      set({ loading: false })
      return
    }

    const { data } = await supabase.auth.getSession()
    set({
      session: data.session,
      user:    data.session?.user ?? null,
      loading: false,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supaSignIn(email, password)
      if (error) throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email, password) => {
    if (!supabase) {
      return { status: 'error', code: 'not_configured' }
    }

    const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo },
    })

    if (error) {
      console.error('[auth] signUp error', error)
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return { status: 'error', code: 'email_already_registered' }
      }
      if (error.message.includes('Password should be')) {
        return { status: 'error', code: 'password_too_weak' }
      }
      if (error.message.includes('invalid email') || error.message.includes('Invalid email')) {
        return { status: 'error', code: 'invalid_email' }
      }
      return { status: 'error', code: 'signup_failed' }
    }

    if (data.session) {
      set({ user: data.user, loading: false })
      return { status: 'signed_in' }
    }

    return { status: 'email_confirmation_required' }
  },

  signOut: async () => {
    // 1. Flush pending edits while session is still valid.
    let synced = false
    if (navigator.onLine) {
      try {
        await syncAll()
        synced = true
      } catch {
        // syncAll threw unexpectedly — treat as failed flush
      }
    }

    // 2. Invalidate the Supabase session.
    await supaSignOut()

    // 3. If flush succeeded, wipe local data and reset in-memory stores.
    if (synced) {
      try { await clearAllLocalData() } catch { /* best-effort */ }
      useCharactersStore.getState().reset()
      useCharacterStore.getState().clearCharacter()
    }

    // 4. Clear auth state; surface warning if local chars were kept.
    set({ user: null, session: null, localKept: !synced })
  },

  requestPasswordReset: async (email) => {
    if (!supabase) return { status: 'error', code: 'not_configured' }
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
    if (error) {
      console.error('[auth] resetPasswordForEmail error', error)
      return { status: 'error', code: 'reset_request_failed' }
    }
    return { status: 'sent' }
  },

  updatePassword: async (newPassword) => {
    if (!supabase) return { status: 'error', code: 'not_configured' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      console.error('[auth] updateUser error', error)
      if (error.message.includes('Password should be')) return { status: 'error', code: 'password_too_weak' }
      return { status: 'error', code: 'update_password_failed' }
    }
    set({ authCallbackType: null, passwordResetSuccess: true })
    return { status: 'updated' }
  },

  deleteAccount: async () => {
    await deleteAccountService()
    // signOut is called inside deleteAccountService; onAuthStateChange propagates SIGNED_OUT
  },

  signInWithGoogle: async () => {
    // Placeholder — implement in Phase B once OAuth is wired up
    throw new Error('Google sign-in not implemented in Phase A')
  },
}))
