const en = {
  // Common UI (only entries with active usage)
  'common.back': 'Back',
  'common.level_abbr': 'Lv',

  // Ability score abbreviations
  'ability.str': 'STR',
  'ability.dex': 'DEX',
  'ability.con': 'CON',
  'ability.int': 'INT',
  'ability.wis': 'WIS',
  'ability.cha': 'CHA',

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
  'topbar.synced': 'Synced',

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

  // Individual skill names (18, via template literal t(`skills.${k}`))
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

  // Skills section label (used in StatusTab mobile/desktop labels)
  'skills.label': 'Skills',

  // Attributes section
  'attributes.section_title': 'Attributes',

  // Hero card
  'hero.inspired_badge': 'Inspired',

  // Combat stats strip labels
  'combat.ac': 'AC',
  'combat.initiative': 'INIT',
  'combat.speed': 'SPD',
  'combat.passive_perception': 'PP',
  'combat.spell_save_dc': 'DC',
  'combat.proficiency_bonus': 'PROF',

  // Features & Traits
  'features.label': 'Features & Traits',
  'features.title': 'Features',
  'features.empty': 'No features recorded.',

  // Attacks
  'attacks.section_title': 'ATTACKS',
  'attacks.add_button': 'Add',
  'attacks.empty_state_title': 'No attacks registered.',
  'attacks.empty_state_hint': 'Add an attack to register your weapons and offensive spells.',
  'attacks.count_label': '({count})',
  'attacks.row_aria': 'Attack {name}, {bonus_or_dc}, {damage}',

  // SpellHeader cell labels
  'spells.header.class': 'CLASS',
  'spells.header.ability': 'ABILITY',
  'spells.header.save_dc': 'SAVE DC',
  'spells.header.attack_bonus': 'ATTACK BONUS',

  // SpellSlots
  'spell_slots.section_title': 'SPELL SLOTS',
  'spell_slots.level_label': 'LEVEL {level}',
  'spell_slots.count_label': '{current}/{max}',
  'spell_slots.pip_aria': 'Level {level} slot ({current} of {max} available)',

  // SpellList
  'spells.section_title': 'SPELLS',
  'spells.add_button': 'Add',
  'spells.count_label': '({count})',
  'spells.cantrips_section': 'CANTRIPS',
  'spells.level_section': 'LEVEL {level}',
  'spells.section_count': '{count}',
  'spells.empty_state_title': 'No spells registered.',
  'spells.empty_state_hint': 'Add cantrips and spells to manage slots.',

  // SpellRow
  'spells.row.unprepared_aria': 'Not prepared',
  'spells.row.row_aria': 'Spell {name}',

  // SpellsTab non-caster
  'spells.non_caster_title': 'This class does not cast spells.',
  'spells.non_caster_hint': 'Spells are accessed by classes like Druid, Bard, Cleric, Wizard, Sorcerer and others.',

  // Inventory — InventoryList + ItemRow
  'inventory.section_title':     'ITEMS',
  'inventory.add_button':        'Add',
  'inventory.count_label':       '({count})',
  'inventory.empty_state_title': 'No items recorded.',
  'inventory.empty_state_hint':  'Add your equipment, consumables, and treasure.',

  // Currency — CurrencyBlock
  'currency.section_title': 'CURRENCY',
  'currency.pp_label':      'PP',
  'currency.gp_label':      'GP',
  'currency.ep_label':      'EP',
  'currency.sp_label':      'SP',
  'currency.cp_label':      'CP',
  'currency.pp_aria':       'Platinum: {count}',
  'currency.gp_aria':       'Gold: {count}',
  'currency.ep_aria':       'Electrum: {count}',
  'currency.sp_aria':       'Silver: {count}',
  'currency.cp_aria':       'Copper: {count}',

  // Proficiencies
  'proficiencies.label': 'PROFICIENCIES',
  'proficiencies.weapons_armor': 'WEAPONS & ARMOR',
  'proficiencies.tools': 'TOOLS',
  'proficiencies.languages': 'LANGUAGES',
  'proficiencies.other': 'OTHER',

  // Lore hero — LoreHero
  'lore.hero.level_xp': 'Level {level} · {xp} XP',

  // Backstory — BackstoryBlock
  'backstory.section_title':     'BACKSTORY',
  'backstory.empty_state_title': 'No story recorded yet.',
  'backstory.empty_state_hint':  "Document your character's past, motivations, and pivotal moments.",

  // Personality — PersonalityBlock
  'personality.section_title': 'PERSONALITY',
  'personality.traits_label':  'Traits',
  'personality.ideals_label':  'Ideals',
  'personality.bonds_label':   'Bonds',
  'personality.flaws_label':   'Flaws',

  // Notes — NotesBlock
  'notes.section_title':     'NOTES',
  'notes.empty_state_title': 'No notes yet.',
  'notes.empty_state_hint':  'Use this space for session notes, NPCs, and reminders.',
  // Aria labels (accessibility)
  'aria.portrait': 'Portrait of {name}',
  'aria.open_menu': 'Open menu',
  'aria.generate_ai': 'Generate with AI',
  'aria.item_weight':   'Item: {name}, weight: {weight}',
  'aria.remove_item':   'Remove {name}',
  'aria.remove_spell':  'Remove spell {name}',
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
