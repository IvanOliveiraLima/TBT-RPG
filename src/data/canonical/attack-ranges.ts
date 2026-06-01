export const CANONICAL_RANGES = [
  '5 ft',
  '10 ft',
  '15 ft',
  '20/60 ft',
  '30/120 ft',
  '60/120 ft',
  '80/320 ft',
  '100/400 ft',
  '150/600 ft',
  'Touch',
  'Self',
  '30 ft cone',
  '60 ft line',
  '20 ft sphere',
] as const

export type AttackRange = typeof CANONICAL_RANGES[number]
