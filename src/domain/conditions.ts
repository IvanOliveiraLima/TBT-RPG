export const CONDITION_KEYS = [
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated', 'invisible',
  'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
] as const

export type ConditionKey = typeof CONDITION_KEYS[number]

export const CONDITION_COLOR: Record<ConditionKey, string> = {
  blinded:       '#6B7280',
  charmed:       '#EC4899',
  deafened:      '#9CA3AF',
  frightened:    '#A855F7',
  grappled:      '#F59E0B',
  incapacitated: '#6B7280',
  invisible:     '#38BDF8',
  paralyzed:     '#EF4444',
  petrified:     '#78716C',
  poisoned:      '#22C55E',
  prone:         '#92400E',
  restrained:    '#EAB308',
  stunned:       '#FACC15',
  unconscious:   '#1F2937',
}
