import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { I18nProvider, useTranslation } from '@/i18n'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
)

describe('useTranslation — provider guard', () => {
  it('throws when used outside <I18nProvider>', () => {
    expect(() => renderHook(() => useTranslation())).toThrow(/I18nProvider/)
  })
})

describe('useTranslation — language switching', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns a valid translation string for any supported key', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    const text = result.current.t('nav.attributes')
    expect(['Atributos', 'Attributes']).toContain(text)
  })

  it('switches to EN and returns English strings', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(result.current.t('nav.attributes')).toBe('Attributes')
    expect(result.current.t('nav.spells')).toBe('Spells')
    expect(result.current.t('nav.lore')).toBe('Lore')
  })

  it('switches to PT and returns Portuguese strings', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('pt'))
    expect(result.current.t('nav.attributes')).toBe('Atributos')
    expect(result.current.t('nav.spells')).toBe('Magias')
    expect(result.current.t('nav.lore')).toBe('História')
  })

  it('reflects lang value after setLang call', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(result.current.lang).toBe('en')
    act(() => result.current.setLang('pt'))
    expect(result.current.lang).toBe('pt')
  })

  it('round-trips PT → EN → PT correctly', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('pt'))
    expect(result.current.t('ability.str')).toBe('FOR')
    act(() => result.current.setLang('en'))
    expect(result.current.t('ability.str')).toBe('STR')
    act(() => result.current.setLang('pt'))
    expect(result.current.t('ability.str')).toBe('FOR')
  })
})

describe('useTranslation — localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists "en" to localStorage after setLang', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('en')
  })

  it('persists "pt" to localStorage after setLang', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('pt'))
    expect(localStorage.getItem('tbt-rpg-v2-lang')).toBe('pt')
  })

  it('initialises from localStorage when "en" is stored', () => {
    localStorage.setItem('tbt-rpg-v2-lang', 'en')
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.lang).toBe('en')
    expect(result.current.t('nav.attributes')).toBe('Attributes')
  })

  it('initialises from localStorage when "pt" is stored', () => {
    localStorage.setItem('tbt-rpg-v2-lang', 'pt')
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.lang).toBe('pt')
    expect(result.current.t('nav.attributes')).toBe('Atributos')
  })
})

describe('useTranslation — interpolation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('substitutes a single string placeholder', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(result.current.t('aria.portrait', { name: 'Eira' }))
      .toBe('Portrait of Eira')
  })

  it('substitutes a single string placeholder in PT', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('pt'))
    expect(result.current.t('aria.portrait', { name: 'Eira' }))
      .toBe('Retrato de Eira')
  })

  it('substitutes multiple placeholders', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(
      result.current.t('aria.spell_slot', { level: 3, current: 2, max: 4 })
    ).toBe('Level 3 slot (2 of 4 available)')
  })

  it('substitutes multiple placeholders in PT', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('pt'))
    expect(
      result.current.t('aria.spell_slot', { level: 3, current: 2, max: 4 })
    ).toBe('Slot de nível 3 (2 de 4 disponíveis)')
  })

  it('substitutes numeric placeholders', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(result.current.t('lore.hero.level_xp', { level: 5, xp: 6500 }))
      .toBe('Level 5 · 6500 XP')
  })

  it('leaves unmatched placeholder intact when param missing', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    // Provide no params — {name} should stay as-is
    expect(result.current.t('aria.portrait')).toBe('Portrait of {name}')
  })

  it('returns key when translation is missing at runtime', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    // @ts-expect-error: testing runtime behaviour for unknown key
    const text = result.current.t('nonexistent.key')
    expect(text).toBe('nonexistent.key')
  })
})

describe('useTranslation — ability abbreviations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns localised PT-BR ability abbreviations', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('pt'))
    expect(result.current.t('ability.str')).toBe('FOR')
    expect(result.current.t('ability.dex')).toBe('DES')
    expect(result.current.t('ability.wis')).toBe('SAB')
    expect(result.current.t('ability.cha')).toBe('CAR')
  })

  it('returns standard EN ability abbreviations', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(result.current.t('ability.str')).toBe('STR')
    expect(result.current.t('ability.dex')).toBe('DEX')
    expect(result.current.t('ability.wis')).toBe('WIS')
    expect(result.current.t('ability.cha')).toBe('CHA')
  })
})
