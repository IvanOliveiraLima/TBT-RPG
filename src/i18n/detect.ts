import type { Lang } from './types';

const STORAGE_KEY = 'tbt-rpg-v2-lang';

/**
 * Detect initial language preference.
 *
 * Priority:
 *   1. localStorage saved preference ('pt' | 'en')
 *   2. navigator.language (starts with 'pt' → 'pt', starts with 'en' → 'en')
 *   3. Fallback: 'pt' (BR-first audience)
 */
export function detectInitialLang(): Lang {
  // 1. localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    // localStorage may throw in private/restricted contexts — proceed
  }

  // 2. navigator.language
  const navLang =
    typeof navigator !== 'undefined' ? (navigator.language ?? '') : '';
  if (navLang.toLowerCase().startsWith('pt')) return 'pt';
  if (navLang.toLowerCase().startsWith('en')) return 'en';

  // 3. Fallback
  return 'pt';
}

/**
 * Persist user language preference to localStorage for future sessions.
 */
export function saveLangPreference(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private/restricted context — silently no-op
  }
}
