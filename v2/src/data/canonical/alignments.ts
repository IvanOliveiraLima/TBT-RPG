/**
 * D&D 5e alignment grid — fixed 9 options.
 * Unlike races/classes/backgrounds, alignments use a <select> in the UI
 * because the set is small, fixed, and normalization matters
 * ("lawful good" vs "Lawful Good" vs "LG" are all the same value).
 */
export const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
] as const

export type Alignment = typeof ALIGNMENTS[number]

/**
 * Migration helper for characters that may have stored alignment in
 * non-canonical forms (lowercase, abbreviated, etc.).
 * Returns the canonical value, or the original string if no match found
 * (free-text fallback — caller decides whether to apply silently).
 */
export function normalizeAlignment(input: string): string {
  if (!input) return ''
  const trimmed = input.trim()

  // Exact match
  if (ALIGNMENTS.includes(trimmed as Alignment)) return trimmed

  // Case-insensitive match
  const ci = ALIGNMENTS.find(a => a.toLowerCase() === trimmed.toLowerCase())
  if (ci) return ci

  // Abbreviation map
  const abbrev: Record<string, Alignment> = {
    'LG': 'Lawful Good',
    'NG': 'Neutral Good',
    'CG': 'Chaotic Good',
    'LN': 'Lawful Neutral',
    'N':  'Neutral',
    'TN': 'Neutral',
    'CN': 'Chaotic Neutral',
    'LE': 'Lawful Evil',
    'NE': 'Neutral Evil',
    'CE': 'Chaotic Evil',
  }
  const fromAbbrev = abbrev[trimmed.toUpperCase()]
  if (fromAbbrev) return fromAbbrev

  // No match — preserve original (free-text)
  return trimmed
}
