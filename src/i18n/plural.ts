import type { TranslationKey } from './types';

/**
 * Returns the correct plural translation key based on count.
 *
 * Expects the dictionary to have two entries:
 *   `${base}_one`   — singular form (count === 1)
 *   `${base}_other` — plural form   (count !== 1)
 *
 * @example
 *   t(pluralKey('charselect.saved_count', 1), { n: 1 })  // → "1 salvo"
 *   t(pluralKey('charselect.saved_count', 3), { n: 3 })  // → "3 salvos"
 */
export function pluralKey(base: string, count: number): TranslationKey {
  const suffix = count === 1 ? '_one' : '_other';
  return `${base}${suffix}` as TranslationKey;
}
