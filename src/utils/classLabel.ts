import { getCanonicalClass } from '@/domain/classes'
import type { TranslateFn } from '@/i18n/types'

/**
 * Returns a localized display label for a class name.
 *
 * - Canonical or recognised synonym (EN/PT-BR) → translated via i18n key.
 * - Unknown / homebrew → returned as-is (raw string).
 *
 * @param name  Class name stored on the character (canonical key or legacy PT-BR value)
 * @param t     Translation function from useTranslation()
 */
export function classLabel(name: string, t: TranslateFn): string {
  const canon = getCanonicalClass(name)
  if (!canon) return name
  // Keys like 'class.blood_hunter' — dynamic but valid (all registered in en.ts / pt.ts)
  const key = `class.${canon.toLowerCase().replace(/\s+/g, '_')}` as Parameters<TranslateFn>[0]
  return t(key)
}
