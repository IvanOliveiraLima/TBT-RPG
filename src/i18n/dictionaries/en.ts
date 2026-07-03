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
  'drawer.lock': 'Lock',
  'chrome.unlock': 'Unlock',

  // Auth
  'auth.connected':     'Connected',
  'auth.syncing':       'Syncing…',
  'auth.offline':       'Offline',
  'auth.sync_error':    'Sync error',
  'auth.signin_prompt': 'Sign in',
  'auth.sign_in': 'Sign in',
  'auth.sign_out': 'Sign out',
  'auth.create_account': 'Create account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.password_confirm': 'Confirm password',
  'auth.signing_in': 'Signing in…',
  'auth.sign_in_title': 'Sign in',
  'auth.sign_in_failed': 'Sign in failed',
  'auth.signup': 'Create account',
  'auth.signup_title': 'Create your account',
  'auth.submitting': 'Submitting…',
  'auth.no_account_yet': "Don't have an account? Create one",
  'auth.already_have_account': 'Already have an account? Sign in',
  'auth.back_to_signin': 'Back to sign in',
  'auth.signup_success_title': 'Account created!',
  'auth.signup_success_message': 'We sent a confirmation link to {email}. Click the link in your inbox to activate your account.',
  'auth.signup_success_hint': "Don't forget to check your spam folder if you don't see the email.",
  'auth.error_invalid_credentials': 'Invalid email or password.',
  'auth.error_email_already_registered': 'This email is already registered. Try signing in instead.',
  'auth.error_password_too_weak': 'Password is too weak. Use at least 6 characters.',
  'auth.error_invalid_email': 'Invalid email address.',
  'auth.error_signup_failed': 'Could not create account. Please try again.',
  'auth.error_signin_failed': 'Could not sign in. Please try again.',
  'auth.error_not_configured': 'Authentication is not configured.',
  'auth.error_invalid_email_format': 'Please enter a valid email address.',
  'auth.error_password_too_short': 'Password must be at least 6 characters.',
  'auth.error_passwords_do_not_match': 'Passwords do not match.',
  'auth.error_unknown': 'An unexpected error occurred.',
  'auth.email_confirmed_title': 'Email confirmed!',
  'auth.email_confirmed_message': 'Your account is active. Welcome!',
  'auth.forgot_password_link': 'Forgot password?',
  'auth.forgot_title': 'Reset password',
  'auth.forgot_submit': 'Send reset link',
  'auth.forgot_email_sent_title': 'Check your email',
  'auth.forgot_email_sent_message': "If an account exists for this email, we've sent a reset link.",
  'auth.reset_title': 'Set a new password',
  'auth.reset_new_password': 'New password',
  'auth.reset_confirm_password': 'Confirm new password',
  'auth.reset_submit': 'Save password',
  'auth.reset_signout': 'Sign out',
  'auth.password_reset_title': 'Password changed!',
  'auth.password_reset_message': 'Your new password is active.',
  'auth.error_reset_request_failed': "Couldn't send the reset link. Try again later.",
  'auth.error_update_password_failed': "Couldn't update the password. Try again.",
  'auth.link_error_title': 'Link expired',
  'auth.link_error_message': 'This recovery link has expired or was already used.',
  'auth.link_error_action': 'Request a new link',
  'auth.password_show': 'Show password',
  'auth.password_hide': 'Hide password',

  // Account management
  'account.delete_link':          'Delete account',
  'account.delete_title':         'Delete account',
  'account.delete_warning':       'This permanently deletes your account, characters, and the campaigns you created. This cannot be undone.',
  'account.delete_confirm_label': 'Type your email to confirm',
  'account.delete_button':        'Delete account permanently',
  'account.delete_cancel':        'Cancel',
  'account.delete_in_progress':   'Deleting…',
  'account.delete_error':         "Couldn't delete the account. Try again.",

  // CharSelect
  'charselect.hero_line1': 'Your sheet,',
  'charselect.hero_line2': 'effortlessly.',
  'charselect.tagline': 'Virtual table · synced sheets',
  'charselect.subline': 'Manage your D&D characters from any device.',
  'charselect.feature_hint': 'HP, spells and inventory at a tap.',
  'charselect.preview_badge': '',
  'charselect.my_characters': 'My Characters',
  'charselect.loading': 'Loading…',
  'charselect.loading_characters': 'Loading characters…',
  'charselect.saved_count_one': '{n} saved',
  'charselect.saved_count_other': '{n} saved',
  'charselect.empty': 'No characters yet. Let\'s get started?',
  'charselect.empty_hint': '',
  'charselect.import': '⬇ Import JSON',
  'charselect.import_unavailable': 'Import JSON — coming soon.',
  'charselect.export': '⬆ Export',
  'charselect.export_unavailable': 'Export — coming soon.',
  'charselect.v1_prefix': '',
  'charselect.v1_link': '',

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
  'hero.inspired_badge':      'Inspired',
  'hero.name_label':          'Name',
  'hero.level_label':         'Level',
  'hero.total_level_label':   'Total Level',
  'hero.xp_label':            'XP',

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
  'spell_slots.remove_level':  'Remove level {level}',
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
  'identity.class_level_label':       'Level',
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

  // Navigation — campaigns
  'chrome.my_campaigns': 'My Campaigns',

  // Campaign select page
  'campaigns.my_campaigns':    'My Campaigns',
  'campaigns.count_one':       '{count} campaign',
  'campaigns.count_other':     '{count} campaigns',
  'campaigns.create':          'Create Campaign',
  'campaigns.empty_state':     "No campaigns yet. Create your first one!",
  'campaigns.detail_placeholder':      'Campaign content coming soon.',
  'campaigns.detail_placeholder_hint': 'Inviting players and adding characters will be available shortly.',

  // Create campaign modal
  'create_campaign.title':              'Create New Campaign',
  'create_campaign.name_label':         'Campaign Name',
  'create_campaign.name_placeholder':   'The Lost Mine of Phandelver',
  'create_campaign.description_label':  'Description (optional)',
  'create_campaign.description_placeholder': 'A brief description of the campaign...',
  'create_campaign.create_button':      'Create',
  'create_campaign.creating':           'Creating…',
  'create_campaign.error_create_failed': 'Could not create campaign. Please try again.',
  'create_campaign.error_not_authenticated': 'You must be signed in to create a campaign.',

  // Delete campaign modal
  'delete_campaign.title':   'Delete Campaign?',
  'delete_campaign.warning': 'Are you sure you want to delete "{name}"?',
  'delete_campaign.note':    'This action cannot be undone. All members will be removed.',
  'delete_campaign.confirm': 'Delete',
  'delete_campaign.deleting': 'Deleting…',
  'delete_campaign.error_delete_failed': 'Could not delete campaign. Please try again.',

  // Profile setup modal
  'profile_setup.title':              'Welcome!',
  'profile_setup.description':        'Choose a display name. This is how other campaign members will see you.',
  'profile_setup.display_name_label': 'Display name',
  'profile_setup.display_name_placeholder': 'Your name or nickname',
  'profile_setup.save':               'Continue',
  'profile_setup.saving':             'Saving…',
  'profile_setup.error_empty_display_name':    'Display name cannot be empty.',
  'profile_setup.error_display_name_too_long': 'Display name is too long (max 50 chars).',
  'profile_setup.error_upsert_failed':         'Could not save profile. Please try again.',
  'profile_setup.error_not_authenticated':     'You must be signed in.',
  'profile_setup.error_unknown':               'An unexpected error occurred.',

  // Aria — campaigns
  'aria.create_campaign':       'Create new campaign',
  'aria.delete_campaign':       'Delete campaign {name}',
  'aria.campaign_options':      'Options for campaign {name}',
  'aria.compact_campaign_card': 'Campaign {name}',

  // CharSelect — campaigns section
  'characters_screen.my_campaigns':           'My Campaigns',
  'characters_screen.campaigns_empty':        'No campaigns yet. Create your first one!',
  'characters_screen.campaigns_login_prompt': 'Sign in to create and manage campaigns.',

  // Invite code block (owner view in CampaignDetail)
  'invite.title':              'Invite code',
  'invite.description':        'Share this code with players to invite them to the campaign.',
  'invite.copy_link':          'Copy link',
  'invite.link_copied':        'Link copied!',
  'invite.copy_code':          'Copy code',
  'invite.code_copied':        'Code copied!',
  'invite.regenerate':         'Regenerate code',
  'invite.regenerating':       'Regenerating…',
  'invite.regenerate_confirm': 'Regenerate code? The previous code will stop working.',
  'invite.regenerate_error':   'Could not regenerate. Please try again.',

  // Join campaign modal
  'join_campaign.title':                  'Join campaign with code',
  'join_campaign.description':            'Enter the invite code shared by the campaign master.',
  'join_campaign.code_label':             'Invite code',
  'join_campaign.join':                   'Join',
  'join_campaign.joining':                'Joining…',
  'join_campaign.error_not_found':        'Code not found. Please check and try again.',
  'join_campaign.error_lookup_failed':    'Could not look up code. Please try again.',
  'join_campaign.error_accept_failed':    'Could not join campaign. Please try again.',
  'join_campaign.error_not_authenticated':'You must be signed in to join a campaign.',
  'join_campaign.error_unknown':          'Unexpected error. Please try again.',
  'join_campaign.already_member_note':    'You are already a member of this campaign.',

  // Campaign detail
  'campaign_detail.members':           'Members',
  'campaign_detail.role_master':       'Master',
  'campaign_detail.role_player':       'Player',
  'campaign_detail.unknown_member':      'Unknown member',
  'campaign_detail.unknown_character':   'Unknown character',
  'campaign_detail.chars_placeholder':   'Character viewing coming soon.',

  // Buttons — join with code
  'campaigns.join_with_code': 'Join with code',

  // Aria — invite
  'aria.copy_invite_link':       'Copy invite link',
  'aria.copy_invite_code':       'Copy invite code',
  'aria.regenerate_invite_code': 'Regenerate invite code',
  'aria.invite_code_input':      'Invite code input',

  // Campaign detail — linked chars section
  'campaign_chars.title':               'Linked characters',
  'campaign_chars.link_button':         'Link character',
  'campaign_chars.empty_state':         'No characters linked yet.',
  'campaign_chars.owner_label':         'Player',
  'campaign_chars.unlink':              'Unlink',
  'campaign_chars.unlinking':           'Unlinking…',
  'campaign_chars.unlink_confirm':      'Unlink this character from the campaign?',
  'campaign_chars.unlink_failed':       'Could not unlink. Please try again.',
  'campaign_chars.full_view_coming_soon': 'Full character view coming soon.',

  // Campaign maps section
  'campaign_maps.section_title':    'Maps',
  'campaign_maps.add':              'Add map',
  'campaign_maps.name_label':       'Map name',
  'campaign_maps.empty':            'No maps yet.',
  'campaign_maps.upload_error_type': 'Use a PNG, JPG or WebP image.',
  'campaign_maps.upload_error_size':  'Image is too large (max 10 MB).',
  'campaign_maps.upload_error_quota': 'Map limit reached (max 20 per campaign).',
  'campaign_maps.loading':          'Loading map…',
  'campaign_maps.remove_confirm':   'Remove this map?',
  'campaign_maps.marker_add_hint':          'Click the map to add a marker',
  'campaign_maps.marker_label_placeholder': 'Marker label',
  'campaign_maps.marker_save':              'Add',
  'campaign_maps.marker_cancel':            'Cancel',
  'campaign_maps.marker_rename':            'Rename',
  'campaign_maps.marker_remove':            'Remove',
  'campaign_maps.marker_empty_label':       '(no label)',
  'campaign_maps.grid_title':     'Grid',
  'campaign_maps.grid_enable':    'Show grid',
  'campaign_maps.grid_cell_size': 'Cell size (px)',
  'campaign_maps.grid_offset_x':  'Offset X',
  'campaign_maps.grid_offset_y':  'Offset Y',
  'campaign_maps.grid_color':     'Grid color',
  'campaign_maps.grid_save':      'Save grid',
  'campaign_maps.grid_collapse':  'Collapse',
  'campaign_maps.token_add':    'Add token',
  'campaign_maps.token_label':  'Token label',
  'campaign_maps.token_color':  'Token color',
  'campaign_maps.token_size':   'Size (cells)',
  'campaign_maps.token_save':   'Save',
  'campaign_maps.token_remove': 'Remove',

  'campaign_maps.fog_title':         'Fog',
  'campaign_maps.fog_enable':        'Enable fog',
  'campaign_maps.fog_brush_reveal':  'Reveal',
  'campaign_maps.fog_brush_hide':    'Hide',
  'campaign_maps.fog_reveal_all':    'Reveal all',
  'campaign_maps.fog_hide_all':      'Hide all',
  'campaign_maps.fog_requires_grid': 'Enable the grid first',
  'campaign_maps.fog_paint_hint':    'Click cells to reveal/hide',
  'campaign_maps.fog_done':          'Done',
  'campaign_maps.expand':            'Expand',
  'campaign_maps.restore':           'Restore',

  // Link character modal
  'link_character.title':               'Link a character',
  'link_character.description':         'Select one of your characters to link to this campaign.',
  'link_character.no_chars_at_all':     "You don't have any characters yet. Create one first.",
  'link_character.all_already_linked':  'All your characters are already linked to this campaign.',
  'link_character.confirm':             'Link',
  'link_character.linking':             'Linking…',
  'link_character.error_already_linked':    'This character is already linked.',
  'link_character.error_link_failed':       'Could not link character. Please try again.',
  'link_character.error_not_authenticated': 'You must be signed in.',
  'link_character.error_unknown':           'Unexpected error.',

  // Aria — campaign chars
  'aria.unlink_character': 'Unlink character {name}',

  // Campaign char view page (Camp.4)
  'campaign_view.back_to_campaign':        'Back to campaign',
  'campaign_view.linked_characters':       'Linked characters',
  'campaign_view.viewing_as_master':       'Viewing as master',
  'campaign_view.viewing_own_char_hint':   "This is your own character. To edit, go to 'My Characters'.",
  'campaign_view.char_not_found':          'Character no longer exists.',
  'campaign_view.redirecting':             'Returning to campaign…',
  'campaign_view.error_not_authenticated': 'You must be signed in.',
  'campaign_view.error_fetch_failed':      'Could not load character.',
  'campaign_view.error_unknown':           'Unexpected error.',

  // Aria — campaign view
  'aria.linked_char_view':  'View character {name}',
  'aria.campaign_char_nav': 'Navigate to character {name}',

  // Leave campaign
  'campaigns.leave':              'Leave',
  'leave_campaign.title':         'Leave Campaign?',
  'leave_campaign.warning':       'Are you sure you want to leave "{name}"?',
  'leave_campaign.note':          'Your linked characters will be unlinked from this campaign.',
  'leave_campaign.confirm':       'Leave',
  'leave_campaign.leaving':       'Leaving…',
  'leave_campaign.error':         'Could not leave campaign. Please try again.',

  // Campaign detail — actions section
  'campaign_detail.actions':       'Actions',
  'campaign_detail.delete_warning': 'Permanently deletes the campaign and removes all members.',
  'campaign_detail.leave_warning':  'Removes you from this campaign.',

  // Member row menu
  'member_menu.edit_name':     'Edit display name',
  'member_menu.remove_member': 'Remove member',

  // Edit display name modal
  'edit_display_name.title':       'Edit display name',
  'edit_display_name.description': 'This name is visible to other members of campaigns you belong to.',
  'edit_display_name.save':        'Save',
  'edit_display_name.saving':      'Saving…',

  // Remove member modal
  'remove_member.title':    'Remove member?',
  'remove_member.warning':  'Are you sure you want to remove {name} from this campaign?',
  'remove_member.note':     'Their linked characters will also be unlinked. They can rejoin with the invite code.',
  'remove_member.confirm':  'Remove',
  'remove_member.removing': 'Removing…',
  'remove_member.error':    'Could not remove member. Please try again.',

  // Aria — member row
  'aria.member_row_menu':          'Actions for {name}',
  'aria.edit_display_name_input':  'Display name',

  // Aria — combat
  'aria.ac_input': 'Armor Class',

  // Export
  'export.empty_warning': 'No characters to export.',

  // Import
  'import.choose_mode_title':        'Choose import mode',
  'import.payload_summary':          'File contains {count} characters.',
  'import.mode_merge_title':         'Merge',
  'import.mode_merge_description':   'Add new characters and update existing ones by ID. Safe for existing data.',
  'import.mode_replace_title':       'Replace all',
  'import.mode_replace_description': 'Remove all current characters and replace with the imported ones.',
  'import.replace_warning':          'This will delete all your current characters. This action cannot be undone locally (cloud sync may restore them later if you are signed in).',
  'import.confirm':                  'Import',
  'import.success_title':            'Import complete',
  'import.success_summary':          'Imported {imported} new, updated {replaced} existing.',
  'import.success_close':            'Close',
  'import.error_title':              'Import failed',
  'import.error_read_failed':        'Could not read the file.',
  'import.error_invalid_json':       'File is not valid JSON.',
  'import.error_invalid_schema':     'File format is not recognized.',
  'import.error_incompatible_version': 'This file was exported from an incompatible version. Please use a recent export.',
  'import.error_apply_failed':       'Could not import characters. Please try again.',
  'import.error_unknown':            'Unexpected error.',
} as const;

export default en;
