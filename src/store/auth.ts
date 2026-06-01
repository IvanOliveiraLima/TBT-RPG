import { create } from 'zustand'
import { supabase, signIn as supaSignIn, signOut as supaSignOut, type User, type Session } from '@/lib/supabase'

interface AuthState {
  user:    User | null
  session: Session | null
  loading: boolean

  initAuth:   () => Promise<void>
  signIn:     (email: string, password: string) => Promise<void>
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

  signOut: async () => {
    await supaSignOut()
    set({ user: null, session: null })
  },

  signInWithGoogle: async () => {
    // Placeholder — implement in Phase B once OAuth is wired up
    throw new Error('Google sign-in not implemented in Phase A')
  },
}))
