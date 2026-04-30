import { useState, useCallback, type ReactNode } from 'react';
import en from './dictionaries/en';
import pt from './dictionaries/pt';
import { detectInitialLang, saveLangPreference } from './detect';
import { I18nContext } from './context';
import type { Lang, TranslateFn, TranslationKey } from './types';

const dictionaries = { en, pt } as const;

/**
 * Replaces `{placeholder}` occurrences in a template string with values from
 * params. Unmatched placeholders are left intact (visible in UI — helps surface
 * missing params during development).
 */
function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Provides translation function and language state to the component tree.
 * Must wrap any component that calls `useTranslation()`.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitialLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveLangPreference(next);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => {
      const dict = dictionaries[lang];
      const template = (dict as Record<TranslationKey, string>)[key];
      if (template === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] Missing translation: "${key}" (lang="${lang}")`);
        }
        return key;
      }
      return interpolate(template, params);
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
