import type { SpellSchool } from '@/domain/character'

export const SPELL_SCHOOLS: SpellSchool[] = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
]

// Discrete palette designed for the dark theme background (#1B1725)
export const SCHOOL_COLORS: Record<SpellSchool, string> = {
  abjuration:    '#4A90E2',  // blue
  conjuration:   '#D4A017',  // gold/yellow
  divination:    '#9B7BCB',  // soft violet
  enchantment:   '#E96BA8',  // pink
  evocation:     '#E85D3C',  // red/orange
  illusion:      '#7B4FCF',  // deep purple
  necromancy:    '#5B9F55',  // muted green
  transmutation: '#C4944A',  // amber/sepia
}
