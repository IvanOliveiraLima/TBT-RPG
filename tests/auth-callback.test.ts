import { describe, it, expect } from 'vitest'
import { parseAuthCallback } from '@/auth-callback'

describe('parseAuthCallback', () => {
  it('returns nulls for empty hash', () => {
    expect(parseAuthCallback('')).toEqual({ type: null, error: null, errorCode: null })
  })

  it('returns nulls for hash with only #', () => {
    expect(parseAuthCallback('#')).toEqual({ type: null, error: null, errorCode: null })
  })

  it('parses type from successful recovery hash', () => {
    const hash = '#access_token=abc&type=recovery&refresh_token=xyz'
    expect(parseAuthCallback(hash)).toMatchObject({ type: 'recovery', error: null, errorCode: null })
  })

  it('parses type=signup from successful signup confirmation hash', () => {
    const hash = '#access_token=abc&type=signup&refresh_token=xyz'
    expect(parseAuthCallback(hash)).toMatchObject({ type: 'signup', error: null, errorCode: null })
  })

  it('parses error and error_code from expired link hash', () => {
    const hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid'
    const result = parseAuthCallback(hash)
    expect(result).toEqual({ type: null, error: 'access_denied', errorCode: 'otp_expired' })
  })

  it('handles hash without leading #', () => {
    const hash = 'type=recovery&access_token=abc'
    expect(parseAuthCallback(hash)).toMatchObject({ type: 'recovery' })
  })

  it('returns null type when hash has error but no type', () => {
    const hash = '#error=access_denied&error_code=otp_expired'
    expect(parseAuthCallback(hash).type).toBeNull()
  })

  it('returns null errorCode when only error is present', () => {
    const hash = '#error=some_error'
    const result = parseAuthCallback(hash)
    expect(result.error).toBe('some_error')
    expect(result.errorCode).toBeNull()
  })
})
