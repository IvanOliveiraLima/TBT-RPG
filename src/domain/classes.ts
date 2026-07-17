/**
 * Hit die per D&D 5e class (PHB core + Artificer), keyed by English and
 * Brazilian-Portuguese (PHB-PT) class names.
 *
 * Lookup via getHitDie() is case- AND accent-insensitive, so "Clérigo",
 * "clerigo" and "CLÉRIGO" all resolve to the same value. Default fallback
 * is d8 for unrecognised / homebrew classes.
 */

/** Strip case and diacritics so accented and unaccented input both match. */
function normalizeClassName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Source map: human-readable EN + PT-BR names. Keys are normalized below. */
const HIT_DIE_SOURCE: Record<string, number> = {
  // d12
  barbarian: 12,  bárbaro: 12,
  // d10
  fighter: 10,    guerreiro: 10,
  paladin: 10,    paladino: 10,
  ranger: 10,     patrulheiro: 10,
  // d8
  artificer: 8,   artífice: 8,
  bard: 8,        bardo: 8,
  cleric: 8,      clérigo: 8,
  druid: 8,       druida: 8,
  monk: 8,        monge: 8,
  rogue: 8,       ladino: 8,
  warlock: 8,     bruxo: 8,
  // d6
  sorcerer: 6,    feiticeiro: 6,
  wizard: 6,      mago: 6,
}

/**
 * Hit die lookup keyed by normalized (lowercase, accent-free) class name.
 * Exposed for tests / introspection.
 */
export const CLASS_HIT_DIE: Record<string, number> = Object.fromEntries(
  Object.entries(HIT_DIE_SOURCE).map(([name, die]) => [normalizeClassName(name), die]),
)

/**
 * Returns the hit die size for a class name in English or PT-BR.
 * Case- and accent-insensitive. Returns 8 (d8) for unrecognised classes.
 */
export function getHitDie(className: string): number {
  return CLASS_HIT_DIE[normalizeClassName(className)] ?? 8
}

import type { CanonicalClass } from '@/data/canonical/classes'
import { CANONICAL_CLASSES } from '@/data/canonical/classes'

/**
 * Synonym map: normalized EN + PT-BR names → canonical class key.
 * Keys are pre-normalized (lowercase, accent-free).
 */
const CANONICAL_SYNONYM_SOURCE: Record<string, CanonicalClass> = {
  // Barbarian
  barbarian: 'Barbarian',   barbaro: 'Barbarian',
  // Bard
  bard: 'Bard',             bardo: 'Bard',
  // Cleric
  cleric: 'Cleric',         clerigo: 'Cleric',
  // Druid
  druid: 'Druid',           druida: 'Druid',
  // Fighter
  fighter: 'Fighter',       guerreiro: 'Fighter',
  // Monk
  monk: 'Monk',             monge: 'Monk',
  // Paladin
  paladin: 'Paladin',       paladino: 'Paladin',
  // Ranger
  ranger: 'Ranger',         patrulheiro: 'Ranger',
  // Rogue
  rogue: 'Rogue',           ladino: 'Rogue',
  // Sorcerer
  sorcerer: 'Sorcerer',     feiticeiro: 'Sorcerer',
  // Warlock
  warlock: 'Warlock',       bruxo: 'Warlock',
  // Wizard
  wizard: 'Wizard',         mago: 'Wizard',
  // Artificer
  artificer: 'Artificer',   artifice: 'Artificer',
  // Blood Hunter
  'blood hunter': 'Blood Hunter',
  // Gunslinger
  gunslinger: 'Gunslinger',
}

// Auto-register all canonical classes as self-synonyms (no-op for already-listed)
for (const c of CANONICAL_CLASSES) {
  const key = normalizeClassName(c)
  if (!(key in CANONICAL_SYNONYM_SOURCE)) {
    CANONICAL_SYNONYM_SOURCE[key] = c
  }
}

/**
 * Resolves a class name (EN or PT-BR, any case/accents) to its canonical key.
 * Returns null for homebrew / unrecognised names.
 *
 * Examples:
 *   getCanonicalClass('Bruxo')   → 'Warlock'
 *   getCanonicalClass('clerigo') → 'Cleric'
 *   getCanonicalClass('Wizard')  → 'Wizard'
 *   getCanonicalClass('MyBrew')  → null
 */
export function getCanonicalClass(name: string): CanonicalClass | null {
  return CANONICAL_SYNONYM_SOURCE[normalizeClassName(name)] ?? null
}
