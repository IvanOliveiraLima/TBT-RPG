/**
 * Canonical D&D 5e backgrounds for autocomplete suggestions.
 * See races.ts for the policy on free-text vs. canonical values.
 */
export const CANONICAL_BACKGROUNDS = [
  // PHB
  'Acolyte',
  'Charlatan',
  'Criminal',
  'Entertainer',
  'Folk Hero',
  'Guild Artisan',
  'Hermit',
  'Noble',
  'Outlander',
  'Sage',
  'Sailor',
  'Soldier',
  'Urchin',

  // Sword Coast Adventurer's Guide
  'City Watch',
  'Clan Crafter',
  'Cloistered Scholar',
  'Courtier',
  'Faction Agent',
  'Far Traveler',
  'Inheritor',
  'Knight of the Order',
  'Mercenary Veteran',
  'Urban Bounty Hunter',
  'Uthgardt Tribe Member',
  'Waterdhavian Noble',

  // Tomb of Annihilation / other expansions
  'Anthropologist',
  'Archaeologist',

  // PHB variants / common adaptations
  'Gladiator',
  'Guild Merchant',
  'Knight',
  'Pirate',
  'Spy',
] as const

export type CanonicalBackground = typeof CANONICAL_BACKGROUNDS[number]
