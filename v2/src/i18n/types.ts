import type en from './dictionaries/en';

export type Lang = 'en' | 'pt';

export type Dictionary = typeof en;

/**
 * Union of all valid translation keys, inferred from the EN dictionary
 * (source of truth). PT must provide the same set of keys — enforced via
 * `Record<keyof typeof en, string>` in pt.ts.
 */
export type TranslationKey = keyof Dictionary;

/**
 * Translation function. Accepts an optional params map for {placeholder}
 * substitution in the translated string.
 *
 * @example
 *   t('nav.attributes')
 *   t('aria.portrait', { name: 'Eira' })
 *   t('aria.spell_slot', { level: 3, current: 2, max: 4 })
 */
export type TranslateFn = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;
