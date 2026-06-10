import { create } from 'zustand'
import { supabase, signIn as supaSignIn, signOut as supaSignOut, type User, type Session } from '@/lib/supabase'

export type SignUpResult =
  | { status: 'signed_in' }
  | { status: 'email_confirmation_required' }
  | { status: 'error'; code: string }

interface AuthState {
  user:    User | null
  session: Session | null
  loading: boolean

  initAuth:   () => Promise<void>
  signIn:     (email: string, password: string) => Promise<void>
  signUp:     (email: string, password: string) => Promise<SignUpResult>
  signOut:    () => Promise<void>
  /** Placeholder — Supabase OAuth not wired in Phase A */
  signInWithGoogle: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  session: null,
  loading: true,

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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
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
    await supaSignOut()
    set({ user: null, session: null })
  },

  signInWithGoogle: async () => {
    // Placeholder — implement in Phase B once OAuth is wired up
    throw new Error('Google sign-in not implemented in Phase A')
  },
}))
