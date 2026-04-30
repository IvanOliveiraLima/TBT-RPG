const en = {
  // Common UI
  'common.loading': 'Loading…',
  'common.error': 'Error',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.add': '+ Add',
  'common.remove': 'Remove',
  'common.empty_dash': '—',
  'common.back': 'Back',
  'common.level_abbr': 'Lv',
  'common.feet_abbr': 'ft',

  // Ability scores
  'ability.str': 'STR',
  'ability.dex': 'DEX',
  'ability.con': 'CON',
  'ability.int': 'INT',
  'ability.wis': 'WIS',
  'ability.cha': 'CHA',
  'ability.strength': 'Strength',
  'ability.dexterity': 'Dexterity',
  'ability.constitution': 'Constitution',
  'ability.intelligence': 'Intelligence',
  'ability.wisdom': 'Wisdom',
  'ability.charisma': 'Charisma',

  // Navigation / sidebar
  'nav.my_characters': 'My characters',
  'nav.pages': 'Pages',
  'nav.attributes': 'Attributes',
  'nav.combat': 'Combat',
  'nav.spells': 'Spells',
  'nav.inventory': 'Inventory',
  'nav.lore': 'Lore',
  'nav.generate_with_ai': 'Generate with AI',
  'nav.ai_subtitle': 'Backstory, items, spells',

  // Bottom tab bar (short labels)
  'tab.status': 'Status',
  'tab.combat': 'Combat',
  'tab.spells': 'Spells',
  'tab.inventory': 'Inv',
  'tab.lore': 'Lore',

  // Auth
  'auth.sign_in': 'Sign in',
  'auth.sign_out': 'Sign out',
  'auth.create_account': 'Create account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.signing_in': 'Signing in…',
  'auth.sign_in_title': 'Sign in',
  'auth.sign_in_failed': 'Sign in failed',
  'auth.sync_prompt': 'Sign in to sync',

  // Topbar actions
  'topbar.export': 'Export',
  'topbar.unlock': 'Unlock',
  'topbar.lock': 'Lock',
  'topbar.synced': 'Synced',

  // Sync status
  'sync.synced': 'Synced',
  'sync.syncing': 'Syncing…',
  'sync.offline': 'Offline',

  // CharSelect
  'charselect.headline': 'Your sheet,\neffortlessly.',
  'charselect.tagline': 'Virtual table · synced sheets',
  'charselect.subline': 'Manage your D&D characters from any device.',
  'charselect.feature_hint': 'HP, spells and inventory at a tap.',
  'charselect.my_characters': 'My Characters',
  'charselect.loading': 'Loading…',
  'charselect.loading_characters': 'Loading characters…',
  'charselect.empty': 'No characters found.',
  'charselect.empty_hint': 'Create one in v1 and it will appear here.',
  'charselect.create': 'Create new character',
  'charselect.create_unavailable': 'Character creation is not yet available in v2.\nUse v1: {url}',
  'charselect.import': '⬇ Import JSON',
  'charselect.export': '⬆ Export',
  'charselect.v1_notice': 'Full sheet available in the current version (v1)',
  'charselect.saved_singular': '1 saved',
  'charselect.saved_plural': '{n} saved',
  'charselect.inspired': 'Inspired',

  // Combat stats (strip labels)
  'combat.ac': 'AC',
  'combat.initiative': 'INIT',
  'combat.speed': 'SPD',
  'combat.passive_perception': 'PP',
  'combat.spell_save_dc': 'DC',
  'combat.proficiency_bonus': 'PROF',
  'combat.hit_points': 'Hit Points',
  'combat.death_saves': 'Death Saves',
  'combat.hit_dice': 'Hit Dice',
  'combat.heal': '+ Heal',
  'combat.damage': '− Damage',
  'combat.saving_throws': 'Saving Throws',

  // Skills section
  'skills.label': 'Skills',

  // Features & Traits
  'features.label': 'Features & Traits',
  'features.empty': 'No features recorded.',

  // Attacks
  'attacks.label': 'Attacks',
  'attacks.add': '+ Add',
  'attacks.empty': 'No attacks recorded.',
  'attacks.empty_hint': 'Add an attack to record your weapons and offensive spells.',

  // Spells
  'spells.label': 'Spells',
  'spells.cantrips': 'CANTRIPS',
  'spells.level_label': 'LEVEL {level}',
  'spells.slots_label': 'SPELL SLOTS',
  'spells.header_class': 'CLASS',
  'spells.header_ability': 'ABILITY',
  'spells.header_save_dc': 'SPELL SAVE DC',
  'spells.header_attack_bonus': 'ATTACK BONUS',
  'spells.not_caster': '{name} does not cast spells.',
  'spells.no_spellcasting': 'This class does not have spellcasting.',
  'spells.caster_hint': 'Spells are accessed by classes such as Druid, Bard, Cleric, Wizard, Sorcerer, and others.',
  'spells.empty': 'No spells recorded.',
  'spells.empty_hint': 'Add cantrips and spells to manage slots.',

  // Inventory
  'inventory.label': 'ITEMS ({count})',
  'inventory.empty': 'No items recorded.',
  'inventory.empty_hint': 'Add items to manage your inventory.',
  'inventory.add': '+ Add',

  // Currency
  'currency.label': 'CURRENCY',
  'currency.pp': 'Platinum',
  'currency.gp': 'Gold',
  'currency.ep': 'Electrum',
  'currency.sp': 'Silver',
  'currency.cp': 'Copper',

  // Proficiencies
  'proficiencies.label': 'PROFICIENCIES',
  'proficiencies.weapons_armor': 'WEAPONS & ARMOR',
  'proficiencies.tools': 'TOOLS',
  'proficiencies.languages': 'LANGUAGES',
  'proficiencies.other': 'OTHER',

  // Lore / backstory
  'lore.history_label': 'History',
  'lore.backstory_empty': 'No history recorded yet.',
  'lore.notes_label': 'Notes',
  'lore.notes_empty': 'No notes recorded.',
  'lore.personality_label': 'Personality',
  'lore.traits': 'Traits',
  'lore.ideals': 'Ideals',
  'lore.bonds': 'Bonds',
  'lore.flaws': 'Flaws',
  'lore.level_xp': 'Level {level} · {xp} XP',

  // Aria labels (accessibility)
  'aria.portrait': 'Portrait of {name}',
  'aria.open_menu': 'Open menu',
  'aria.generate_ai': 'Generate with AI',
  'aria.item_weight': 'Item: {name}, weight: {weight}',
  'aria.remove_item': 'Remove {name}',
  'aria.remove_spell': 'Remove spell {name}',
  'aria.remove_attack': 'Remove attack {name}',
  'aria.spell_slot': 'Level {level} slot ({current} of {max} available)',

  // Phase C placeholder alerts
  'phase_c.editing_coming_soon': 'Editing will come in Phase C',
  'phase_c.details_coming_soon': 'Details will come in Phase C',
  'phase_c.ai_unavailable': 'Generate with AI — not implemented in this phase.',
  'phase_c.export_unavailable': 'Export — not implemented in this phase.',
  'phase_c.lock_unavailable': 'Unlock / Lock — not implemented in this phase.',
} as const;

export default en;
