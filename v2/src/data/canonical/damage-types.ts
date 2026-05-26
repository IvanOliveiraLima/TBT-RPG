export const CANONICAL_DAMAGE_TYPES = [
  // Physical
  'Slashing',
  'Piercing',
  'Bludgeoning',
  // Elemental
  'Fire',
  'Cold',
  'Lightning',
  'Thunder',
  'Acid',
  // Magical / other
  'Poison',
  'Necrotic',
  'Radiant',
  'Psychic',
  'Force',
] as const

export type DamageType = typeof CANONICAL_DAMAGE_TYPES[number]
