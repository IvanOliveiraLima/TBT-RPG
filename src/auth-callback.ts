// Parsed once at module load time — intentionally no import of lib/supabase
// so this runs BEFORE createClient() (which is called at import time in supabase.ts).

export interface AuthCallback {
  type:      string | null
  error:     string | null
  errorCode: string | null
}

export function parseAuthCallback(hash: string): AuthCallback {
  if (!hash || hash.length < 2) return { type: null, error: null, errorCode: null }
  const p = new URLSearchParams(hash.replace(/^#/, ''))
  return {
    type:      p.get('type'),
    error:     p.get('error'),
    errorCode: p.get('error_code'),
  }
}

// Captured at module evaluation — before any Supabase client is constructed.
export const authCallback = parseAuthCallback(window.location.hash)
