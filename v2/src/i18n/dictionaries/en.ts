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
  // Sidebar version badge
  'sidebar.version_badge': 'v2 · beta',

  // Bottom tab bar (short labels)
  'tab.status': 'Status',
  'tab.combat': 'Combat',
  'tab.spells': 'Spells',
  'tab.inventory': 'Inv',
  'tab.lore': 'Lore',

  // Drawer / Sidebar chrome actions
  'drawer.export_json': 'Export',
  'drawer.import_json': 'Import',
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
  'hp.current_label': 'Current',
  'hp.max_label': 'Max',
  'hp.temp_label': '+{n} temp',
  'hp.temp_input_label': 'Temp',

  // Hit Dice
  'hit_dice.section_title': 'Hit Dice',
  'hit_dice.total_label': 'Total: {current}/{max}',

  // Death saves
  'deathsaves.section_title': 'Death Saves',
  'deathsaves.success_label': 'Successes',
  'deathsaves.failure_label': 'Failures',

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
  'hero.name_label':     'Name',
  'hero.level_label':    'Level',
  'hero.xp_label':       'XP',

  // Combat stats strip labels
  'combat.ac': 'AC',
  'combat.initiative': 'INIT',
  'combat.speed': 'SPD',
  'combat.passive_perception': 'PP',
  'combat.spell_save_dc': 'DC',
  'combat.proficiency_bonus': 'PROF',

  // Combat — attack editing (C.1.d)
  'combat.attack_name_placeholder': 'Attack name',
  'combat.unnamed_attack':          '(unnamed attack)',
  'combat.kind_label':              'Type',
  'combat.kind_melee':              'Melee',
  'combat.kind_ranged':             'Ranged',
  'combat.kind_spell':              'Spell',
  'combat.ability_label':           'Ability',
  'combat.ability_none':            '—',
  'combat.attack_bonus_label':      'Bonus',
  'combat.damage_label':            'Damage',
  'combat.damage_type_label':       'Damage type',
  'combat.range_label':             'Range',
  'combat.properties_label':        'Properties',
  'combat.properties_placeholder':  'Versatile, Finesse, Light…',
  'combat.notes_label':             'Notes',
  'combat.notes_placeholder':       'Special effects, mechanics…',

  // Features & Traits
  'features.label': 'Features & Traits',
  'features.title': 'Features',
  'features.empty': 'No features recorded.',
  'features.section_title':            'Features and Traits',
  'features.add_button':               '+ Add feature',
  'features.name_placeholder':         'Feature name',
  'features.description_placeholder':  'Description, mechanics...',
  'features.source_placeholder':       'Source (Class, Race...)',
  'features.empty_state_hint':         'No features registered.',
  'features.uses_hint':                'uses',
  'features.type_passive':             'Passive',
  'features.type_active':              'Active',
  'features.type_reaction':            'Reaction',
  'features.source_class':             'Class',
  'features.source_race':              'Race',
  'features.source_background':        'Background',
  'features.source_feat':              'Feat',
  'features.source_item':              'Item',

  // Languages
  'languages.section_title':    'Languages',
  'languages.add_button':       '+ Add language',
  'languages.placeholder':      'Language name',
  'languages.empty_state_hint': 'No languages added yet.',

  // Proficiencies (editable lists)
  'proficiencies.section_title':         'Proficiencies',
  'proficiencies.weapons_label':         'Weapons',
  'proficiencies.armor_label':           'Armor',
  'proficiencies.tools_label':           'Tools',
  'proficiencies.other_label':           'Other',
  'proficiencies.add_button':            '+ Add',
  'proficiencies.weapons_placeholder':   'Weapon proficiency',
  'proficiencies.armor_placeholder':     'Armor proficiency',
  'proficiencies.tools_placeholder':     'Tool proficiency',
  'proficiencies.other_placeholder':     'Other proficiency',
  'proficiencies.weapons_empty_hint':    'No weapon proficiencies.',
  'proficiencies.armor_empty_hint':      'No armor proficiencies.',
  'proficiencies.tools_empty_hint':      'No tool proficiencies.',
  'proficiencies.other_empty_hint':      'No other proficiencies.',

  // Attacks
  'attacks.section_title': 'ATTACKS',
  'attacks.add_button': 'Add',
  'attacks.empty_state_title': 'No attacks registered.',
  'attacks.empty_state_hint': 'Add an attack to register your weapons and offensive spells.',
  'attacks.count_label': '({count})',
  'attacks.row_aria': 'Attack {name}, {bonus_or_dc}, {damage}',

  // SpellcastingHeader (editable)
  'spells.header.class':        'CLASS',
  'spells.header.ability':      'ABILITY',
  'spells.header.save_dc':      'SAVE DC',
  'spells.header.attack_bonus': 'ATTACK BONUS',
  'spells.class_label':         'Class',
  'spells.class_placeholder':   'Druid, Cleric...',
  'spells.ability_label':       'Ability',
  'spells.no_ability':          '— None —',
  'spells.save_dc_label':       'Save DC',
  'spells.attack_bonus_label':  'Attack Bonus',

  // SpellSlotsBlock (editable)
  'spell_slots.section_title': 'SPELL SLOTS',
  'spell_slots.level_label':   'LEVEL {level}',
  'spell_slots.count_label':   '{current}/{max}',
  'spell_slots.pip_aria':      'Level {level} slot ({current} of {max} available)',
  'spells.slots_section_title': 'Spell Slots',
  'spells.no_slots_hint':       'No spell slots configured.',
  'spells.add_slot_level':      '+ Add level',
  'spells.level':               'Level {n}',

  // SpellsList
  'spells.section_title':       'SPELLS',
  'spells.add_button':          'Add',
  'spells.count_label':         '({count})',
  'spells.cantrips_section':    'CANTRIPS',
  'spells.level_section':       'LEVEL {level}',
  'spells.section_count':       '{count}',
  'spells.empty_state_title':   'No spells registered.',
  'spells.empty_state_hint':    'Add cantrips and spells to manage slots.',
  'spells.cantrips':            'Cantrips',
  'spells.cantrip':             'Cantrip',
  'spells.unnamed_spell':       '(unnamed)',
  'spells.prepared_hint':       'Prepared today',
  'spells.add_cantrip':         '+ Add cantrip',
  'spells.add_at_level':        '+ Add level {n} spell',
  'spells.name_placeholder':    'Spell name',
  'spells.level_label':         'Level',
  'spells.school_label':        'School',
  'spells.casting_time_label':  'Casting time',
  'spells.range_label':         'Range',
  'spells.description_label':   'Description',
  'spells.description_placeholder': 'Effects, mechanics...',

  // SpellRow (legacy keys kept for compatibility)
  'spells.row.unprepared_aria': 'Not prepared',
  'spells.row.row_aria':        'Spell {name}',

  // Spell schools
  'spells.school_abjuration':   'Abjuration',
  'spells.school_conjuration':  'Conjuration',
  'spells.school_divination':   'Divination',
  'spells.school_enchantment':  'Enchantment',
  'spells.school_evocation':    'Evocation',
  'spells.school_illusion':     'Illusion',
  'spells.school_necromancy':   'Necromancy',
  'spells.school_transmutation': 'Transmutation',

  // SpellsTab non-caster (kept for reference, no longer shown)
  'spells.non_caster_title': 'This class does not cast spells.',
  'spells.non_caster_hint': 'Spells are accessed by classes like Druid, Bard, Cleric, Wizard, Sorcerer and others.',

  // Inventory — InventoryList + ItemCard (C.1.f)
  'inventory.section_title':           'ITEMS',
  'inventory.add_button':              'Add',
  'inventory.count_label':             '({count})',
  'inventory.empty_state_title':       'No items registered.',
  'inventory.empty_state_hint':        'Add your equipment, consumables, and treasure.',
  'inventory.unnamed_item':            '(unnamed)',
  'inventory.equipped_hint':           'Equipped',
  'inventory.per_unit':                '(per unit)',
  'inventory.name_placeholder':        'Item name',
  'inventory.quantity_label':          'Quantity',
  'inventory.weight_label':            'Weight',
  'inventory.category_label':          'Category',
  'inventory.description_label':       'Description',
  'inventory.description_placeholder': 'Effects, special properties…',

  // Item categories
  'inventory.category_weapon':         'Weapons',
  'inventory.category_armor':          'Armor',
  'inventory.category_consumable':     'Consumables',
  'inventory.category_tool':           'Tools',
  'inventory.category_misc':           'Miscellaneous',

  // Per-category add buttons
  'inventory.add_weapon':              '+ Add weapon',
  'inventory.add_armor':               '+ Add armor',
  'inventory.add_consumable':          '+ Add consumable',
  'inventory.add_tool':                '+ Add tool',
  'inventory.add_misc':                '+ Add item',

  // Currency — CurrencyBlock (4 coins — EP removed; converts to SP)
  'currency.section_title': 'CURRENCY',
  'currency.pp_label':      'PP',
  'currency.gp_label':      'GP',
  'currency.sp_label':      'SP',
  'currency.cp_label':      'CP',
  'currency.pp_aria':       'Platinum: {count}',
  'currency.gp_aria':       'Gold: {count}',
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
  'backstory.placeholder':       "Document your character's past...",

  // Personality — PersonalityBlock
  'personality.section_title':          'PERSONALITY',
  'personality.traits_label':           'Traits',
  'personality.ideals_label':           'Ideals',
  'personality.bonds_label':            'Bonds',
  'personality.flaws_label':            'Flaws',
  'personality.traits.placeholder':     'Personality traits...',
  'personality.ideals.placeholder':     'Ideals...',
  'personality.bonds.placeholder':      'Bonds...',
  'personality.flaws.placeholder':      'Flaws...',

  // Notes — NotesBlock
  'notes.section_title':     'NOTES',
  'notes.empty_state_title': 'No notes yet.',
  'notes.empty_state_hint':  'Use this space for session notes, NPCs, and reminders.',
  'notes.placeholder':       'Session notes, NPCs, reminders...',

  // Image modal — CharacterImageModal
  'image.modal.title':            'Edit character image',
  'image.modal.select_file':      'Select image',
  'image.modal.zoom_label':       'Zoom',
  'image.modal.apply':            'Apply',
  'image.modal.cancel':           'Cancel',
  'image.modal.error.too_large':  'Image exceeds 2 MB limit',
  'image.modal.error.bad_format': 'Unsupported format. Use JPG, PNG, or WebP.',
  'image.modal.drag_hint':        'Drag to reposition',

  // Identity block — IdentityBlock
  'identity.section_title':           'IDENTITY',
  'identity.race_label':              'Race',
  'identity.background_label':        'Background',
  'identity.alignment_label':         'Alignment',
  'identity.alignment_unselected':    'Select alignment…',
  'identity.alignment_custom_label':  'Custom: {value}',
  'identity.classes_label':           'Classes',
  'identity.class_name_placeholder':  'Class name',
  'identity.add_class_button':        '+ Add class',
  'identity.class_default_name':      'New class',
  'identity.inspiration_label':       'Inspiration',

  // Aria labels (accessibility)
  'aria.portrait': 'Portrait of {name}',
  'aria.open_menu': 'Open menu',
  'aria.item_weight':        'Item: {name}, weight: {weight}',
  'aria.remove_item':        'Remove {name}',
  'aria.item_name':          'Item name',
  'aria.item_quantity':      'Item quantity',
  'aria.item_weight_input':  'Item weight per unit',
  'aria.item_category':      'Item category',
  'aria.item_description':   'Item description',
  'aria.item_equipped':      '{name} equipped',
  'aria.weight_bar':         'Carried weight: {current} of {max} pounds',
  'aria.remove_spell':                 'Remove spell {name}',
  'aria.spellcasting_class_input':     'Spellcasting class',
  'aria.spellcasting_ability_select':  'Spellcasting ability',
  'aria.spell_name':                   'Spell name',
  'aria.spell_prepared':               'Spell prepared today',
  'aria.slot_pip':                     'Slot {n} of level {level}',
  'aria.slot_max_input':               'Max slots for level {level}',
  'aria.add_slot_level':               'Add new slot level',
  'aria.remove_attack':      'Remove attack {name}',
  'aria.attack_name':        'Attack name',
  'aria.attack_bonus_input': 'Attack bonus',
  'aria.damage_input':       'Damage',
  'aria.damage_type_input':  'Damage type',
  'aria.range_input':        'Range',
  'aria.kind_select':        'Attack type',
  'aria.ability_select':     'Associated ability',
  'aria.spell_slot': 'Level {level} slot ({current} of {max} available)',
  'aria.edit_image':           'Edit character image',
  'aria.character_name_input': 'Character name',
  'aria.xp_input':             'Experience points',
  'aria.race_input':           'Character race',
  'aria.background_input':     'Character background',
  'aria.alignment_input':      'Character alignment',
  'aria.class_name_input':     'Class {index} name',
  'aria.class_level_input':    'Class {index} level',
  'aria.remove_class':         'Remove class {name}',
  'aria.inspiration_toggle':   'Toggle inspiration',
  'aria.ability_score_input':        '{ability} score',
  'aria.save_proficiency_toggle':    'Toggle {ability} saving throw proficiency',
  'aria.skill_proficient_toggle':    'Toggle {skill} proficiency',
  'aria.skill_expertise_toggle':     'Toggle {skill} expertise',
  'aria.hp_current_input':           'Current HP',
  'aria.hp_max_input':               'Maximum HP',
  'aria.hp_temp_input':              'Temporary HP',
  'aria.deathsave_success_toggle':   'Toggle death save success {n}',
  'aria.deathsave_failure_toggle':   'Toggle death save failure {n}',
  'aria.hitdice_class_input':        'Hit dice remaining for {className}',

  // Languages & Proficiencies
  'aria.language_input':       'Language {index}',
  'aria.remove_language':      'Remove language {name}',
  'aria.proficiency_input':    'Proficiency {index}',
  'aria.remove_proficiency':   'Remove proficiency {name}',
  'aria.weapons_list':   'Weapons proficiencies',
  'aria.armor_list':     'Armor proficiencies',
  'aria.tools_list':     'Tools proficiencies',
  'aria.other_list':     'Other proficiencies',

  // Features
  'aria.feature_name':        'Feature name',
  'aria.feature_source':      'Feature source',
  'aria.feature_type':        'Feature type',
  'aria.feature_description': 'Feature description',
  'aria.remove_feature':      'Remove feature {name}',
  'aria.feature_uses_left':   'Uses remaining',
  'aria.feature_uses_max':    'Uses maximum',
  'aria.decrement_value':     'Decrement',
  'aria.increment_value':     'Increment',

  // Remove confirmation (ConfirmableRemoveButton)
  'remove.confirm':           'Confirm?',
  'remove.confirm_aria':      'Confirm deletion',

  // Phase C placeholder alerts
  'phase_c.editing_coming_soon': 'Editing will come in Phase C',
  'phase_c.details_coming_soon': 'Details will come in Phase C',
  'phase_c.export_unavailable': 'Export — not implemented in this phase.',
  'phase_c.lock_unavailable': 'Unlock / Lock — not implemented in this phase.',

  // Common
  'common.cancel': 'Cancel',

  // My Characters — create buttons
  'charselect.create_from_scratch': 'Create from scratch',
  'charselect.create_with_ai':      'Create with AI',

  // AI Generation Modal
  'ai_modal.title':                  'Generate character with AI',
  'ai_modal.description_label':      'Character description',
  'ai_modal.description_placeholder': 'A wood elf druid who grew up in an ancient forest, haunted by a dark secret…',
  'ai_modal.description_hint':       'Be specific about race, class, personality, and background.',
  'ai_modal.language_label':         'Generation language',
  'ai_modal.generate_button':        'Generate',
  'ai_modal.generating_button':      'Generating…',
  'ai_modal.generating':             'Generating your character…',
  'ai_modal.generating_hint':        'This may take 10–30 seconds.',

  // AI errors
  'ai_modal.error_description_too_short': 'Description must be at least 10 characters.',
  'ai_modal.error_rate_limit':            'Too many requests. Please wait a moment and try again.',
  'ai_modal.error_invalid_request':       'The request was rejected. Try rephrasing your description.',
  'ai_modal.error_server_error':          'Server error. Please try again in a moment.',
  'ai_modal.error_invalid_response':      'The generation was incomplete. Please try again.',
  'ai_modal.error_timeout':               'Generation took too long. Try a shorter description.',
  'ai_modal.error_network_error':         'Network error. Check your connection and try again.',
  'ai_modal.error_unknown':               'An unexpected error occurred. Please try again.',

  // Aria
  'aria.ai_description_input':  'Character description for AI generation',
  'aria.create_with_ai':        'Create new character with AI',
  'aria.create_from_scratch':   'Create new character from scratch',
  'aria.close_modal':           'Close modal',

  // Character card menu
  'characters.options_for': 'Options for {name}',
  'characters.delete':      'Delete',
  'characters.unnamed':     '(unnamed)',

  // Confirm delete modal
  'delete_modal.title':    'Delete character?',
  'delete_modal.warning':  'Are you sure you want to delete "{name}"?',
  'delete_modal.note':     'This action cannot be undone. The character will be permanently removed from this device.',
  'delete_modal.confirm':  'Delete',
  'delete_modal.deleting': 'Deleting…',

  // Delete errors
  'delete_modal.error_local_delete_failed': 'Could not delete the character. Please try again.',
  'delete_modal.error_unknown':             'An unexpected error occurred. Please try again.',

  // Aria — delete flow
  'aria.character_options': 'Character options',
  'aria.confirm_delete':    'Confirm deletion',
  'aria.cancel_delete':     'Cancel deletion',
} as const;

export default en;
