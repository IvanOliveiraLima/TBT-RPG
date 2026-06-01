/**
 * Canonical D&D 5e races for autocomplete suggestions.
 * Includes PHB, Tasha's Cauldron of Everything, Mordenkainen Presents:
 * Monsters of the Multiverse, and other commonly-used sources.
 *
 * NOTE: This is a SUGGESTION list, not a validation list. Characters may
 * have custom race strings (e.g. "Half-Elf Variant", homebrew) — the
 * datalist autocompletes from this list but accepts any free-text input.
 */
export const CANONICAL_RACES = [
  // PHB core
  'Dragonborn',
  'Dwarf',
  'Elf',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Halfling',
  'Human',
  'Tiefling',

  // PHB sub-races (commonly used as race in many tools)
  'Hill Dwarf',
  'Mountain Dwarf',
  'High Elf',
  'Wood Elf',
  'Drow',
  'Lightfoot Halfling',
  'Stout Halfling',
  'Rock Gnome',
  'Forest Gnome',

  // Expanded (Volo's, Tasha's, MotM)
  'Aasimar',
  'Aarakocra',
  'Bugbear',
  'Centaur',
  'Changeling',
  'Eladrin',
  'Fairy',
  'Firbolg',
  'Genasi',
  'Genasi (Air)',
  'Genasi (Earth)',
  'Genasi (Fire)',
  'Genasi (Water)',
  'Githyanki',
  'Githzerai',
  'Goblin',
  'Goliath',
  'Harengon',
  'Hobgoblin',
  'Kenku',
  'Kobold',
  'Leonin',
  'Lizardfolk',
  'Loxodon',
  'Minotaur',
  'Orc',
  'Owlin',
  'Satyr',
  'Sea Elf',
  'Shadar-kai',
  'Shifter',
  'Tabaxi',
  'Tortle',
  'Triton',
  'Yuan-ti',

  // MotM/Spelljammer additions
  'Autognome',
  'Giff',
  'Hadozee',
  'Plasmoid',
  'Thri-kreen',
] as const

export type CanonicalRace = typeof CANONICAL_RACES[number]
