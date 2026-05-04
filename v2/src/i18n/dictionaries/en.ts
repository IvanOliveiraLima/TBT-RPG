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

  // Sidebar version badge
  'sidebar.version_badge': 'v2 · beta',

  // Bottom tab bar (short labels)
  'tab.status': 'Status',
  'tab.combat': 'Combat',
  'tab.spells': 'Spells',
  'tab.inventory': 'Inv',
  'tab.lore': 'Lore',

  // Mobile drawer items
  'drawer.export_json': 'Export JSON',
  'drawer.import_json': 'Import JSON',
  'drawer.new_sheet': 'New sheet',
  'drawer.lock': 'Lock',

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
  'charselect.hero_line1': 'Your sheet,',
  'charselect.hero_line2': 'effortlessly.',
  'charselect.tagline': 'Virtual table · synced sheets',
  'charselect.subline': 'Manage your D&D characters from any device.',
  'charselect.feature_hint': 'HP, spells and inventory at a tap.',
  'charselect.preview_badge': 'v2 · Preview',
  'charselect.my_characters': 'My Characters',
  'charselect.loading': 'Loading…',
  'charselect.loading_characters': 'Loading characters…',
  'charselect.saved_count_one': '{n} saved',
  'charselect.saved_count_other': '{n} saved',
  'charselect.empty': 'No characters found.',
  'charselect.empty_hint': 'Create one in v1 and it will appear here.',
  'charselect.create': 'Create new character',
  'charselect.create_unavailable': 'Character creation is not yet available in v2.\nUse v1: {url}',
  'charselect.import': '⬇ Import JSON',
  'charselect.import_unavailable': 'Import JSON — not yet available in v2.',
  'charselect.export': '⬆ Export',
  'charselect.export_unavailable': 'Export — not yet available in v2.',
  'charselect.v1_prefix': 'Full sheet available in the',
  'charselect.v1_link': 'current version (v1) →',
  'charselect.inspired': 'Inspired',

  // State screens
  'screens.loading_character': 'Loading character…',
  'screens.error_title': 'Failed to load',
  'screens.not_found_title': 'Character not found',
  'screens.not_found_hint': 'This character no longer exists or was deleted.',
  'screens.back_to_list': 'Back to list',

  // HP block
  'hp.section_title': 'Hit Points',
  'hp.heal_button': 'Heal',
  'hp.damage_button': 'Damage',
  'hp.temp_label': '+{n} temp',

  // Hit Dice
  'hit_dice.section_title': 'Hit Dice',

  // Saving throws section
  'saves.section_title': 'Saving Throws',
  'saves.ability.str': 'Strength',
  'saves.ability.dex': 'Dexterity',
  'saves.ability.con': 'Constitution',
  'saves.ability.int': 'Intelligence',
  'saves.ability.wis': 'Wisdom',
  'saves.ability.cha': 'Charisma',

  // Individual skill names (18)
  'skills.section_title': 'Skills',
  'skills.acrobatics': 'Acrobatics',
  'skills.animal_handling': 'Animal Handling',
  'skills.arcana': 'Arcana',
  'skills.athletics': 'Athletics',
  'skills.deception': 'Deception',
  'skills.history': 'History',
  'skills.insight': 'Insight',
  'skills.intimidation': 'Intimidation',
  'skills.investigation': 'Investigation',
  'skills.medicine': 'Medicine',
  'skills.nature': 'Nature',
  'skills.perception': 'Perception',
  'skills.performance': 'Performance',
  'skills.persuasion': 'Persuasion',
  'skills.religion': 'Religion',
  'skills.sleight_of_hand': 'Sleight of Hand',
  'skills.stealth': 'Stealth',
  'skills.survival': 'Survival',

  // Attributes section
  'attributes.section_title': 'Attributes',

  // Hero card
  'hero.inspired_badge': 'Inspired',

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
  'combat.heal': '＋ Heal',
  'combat.damage': '− Damage',
  'combat.saving_throws': 'Saving Throws',

  // Skills section (legacy label key)
  'skills.label': 'Skills',

  // Features & Traits
  'features.label': 'Features & Traits',
  'features.title': 'Features',
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
