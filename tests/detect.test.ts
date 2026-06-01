import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { detectInitialLang, saveLangPreference } from '@/i18n/detect'

describe('detectInitialLang', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns "pt" from localStorage when saved as pt', () => {
    localStorage.setItem('tbt-rpg-v2-lang', 'pt')
    expect(detectInitialLang()).toBe('pt')
  })

  it('returns "en" from localStorage when saved as en', () => {
    localStorage.setItem('tbt-rpg-v2-lang', 'en')
    expect(detectInitialLang()).toBe('en')
  })

  it('ignores invalid localStorage value and falls through', () => {
    localStorage.setItem('tbt-rpg-v2-lang', 'fr')
    // Should not return 'fr' — falls through to navigator or fallback
    const result = detectInitialLang()
    expect(['pt', 'en']).toContain(result)
    expect(result).not.toBe('fr')
  })

  it('detects pt from navigator.language "pt-BR"', () => {
    vi.stubGlobal('navigator', { language: 'pt-BR' })
    expect(detectInitialLang()).toBe('pt')
  })

  it('detects pt from navigator.language "pt-PT"', () => {
    vi.stubGlobal('navigator', { language: 'pt-PT' })
    expect(detectInitialLang()).toBe('pt')
  })

  it('detects en from navigator.language "en-US"', () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    expect(detectInitialLang()).toBe('en')
  })

  it('detects en from navigator.language "en-GB"', () => {
    vi.stubGlobal('navigator', { language: 'en-GB' })
    expect(detectInitialLang()).toBe('en')
  })

  it('falls back to pt for unknown navigator.language', () => {
    vi.stubGlobal('navigator', { language: 'fr-FR' })
    expect(detectInitialLang()).toBe('pt')
  })

  it('falls back to pt when navigator.language is empty string', () => {
    vi.stubGlobal('navigator', { language: '' })
    expect(detectInitialLang()).toBe('pt')
  })

  it('prefers localStorage over navigator.language', () => {
    localStorage.setItem('tbt-rpg-v2-lang', 'en')
    vi.stubGlobal('navigator', { language: 'pt-BR' })
    expect(detectInitialLang()).toBe('en')
  })
})

describe('saveLangPreference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves "pt" to localStorage', () => {
    saveLangPreference('pt')
    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('pt')
  })

  it('saves "en" to localStorage', () => {
    saveLangPreference('en')
    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('en')
  })

  it('overwrites previous preference', () => {
    saveLangPreference('pt')
    saveLangPreference('en')
    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('en')
  })
})
