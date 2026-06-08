import type en from './en';

const pt: Record<keyof typeof en, string> = {
  // Common UI (only entries with active usage)
  'common.back': 'Voltar',
  'common.level_abbr': 'Nv',

  // Ability score abbreviations (PT padrão PHB-PT)
  'ability.str': 'FOR',
  'ability.dex': 'DES',
  'ability.con': 'CON',
  'ability.int': 'INT',
  'ability.wis': 'SAB',
  'ability.cha': 'CAR',

  // Navigation / sidebar
  'nav.my_characters': 'Meus personagens',
  'nav.pages': 'Páginas',
  'nav.attributes': 'Atributos',
  'nav.combat': 'Combate',
  'nav.spells': 'Magias',
  'nav.inventory': 'Inventário',
  'nav.lore': 'História',
  // Sidebar version badge
  'sidebar.version_badge': 'v2 · beta',

  // Bottom tab bar (short labels)
  'tab.status': 'Status',
  'tab.combat': 'Combate',
  'tab.spells': 'Magias',
  'tab.inventory': 'Inv',
  'tab.lore': 'Histórico',

  // Drawer / Sidebar chrome actions
  'drawer.export_json': 'Exportar',
  'drawer.import_json': 'Importar',
  'drawer.lock': 'Bloquear',
  'chrome.unlock': 'Destravar',

  // Auth
  'auth.connected':     'Conectado',
  'auth.syncing':       'Sincronizando…',
  'auth.offline':       'Offline',
  'auth.sync_error':    'Erro de sincronização',
  'auth.signin_prompt': 'Entrar',
  'auth.sign_in': 'Entrar',
  'auth.sign_out': 'Sair',
  'auth.create_account': 'Criar conta',
  'auth.email': 'E-mail',
  'auth.password': 'Senha',
  'auth.password_confirm': 'Confirmar senha',
  'auth.signing_in': 'Entrando…',
  'auth.sign_in_title': 'Entrar na conta',
  'auth.sign_in_failed': 'Falha no login',
  'auth.signup': 'Criar conta',
  'auth.signup_title': 'Crie sua conta',
  'auth.submitting': 'Enviando…',
  'auth.no_account_yet': 'Não tem conta? Criar conta',
  'auth.already_have_account': 'Já tem conta? Entrar',
  'auth.back_to_signin': 'Voltar para entrar',
  'auth.signup_success_title': 'Conta criada!',
  'auth.signup_success_message': 'Enviamos um link de confirmação para {email}. Clique no link da sua caixa de entrada para ativar sua conta.',
  'auth.signup_success_hint': 'Não esqueça de verificar a pasta de spam caso não encontre o e-mail.',
  'auth.error_invalid_credentials': 'E-mail ou senha inválidos.',
  'auth.error_email_already_registered': 'Este e-mail já está cadastrado. Tente entrar.',
  'auth.error_password_too_weak': 'Senha muito fraca. Use ao menos 6 caracteres.',
  'auth.error_invalid_email': 'E-mail inválido.',
  'auth.error_signup_failed': 'Não foi possível criar a conta. Tente novamente.',
  'auth.error_signin_failed': 'Não foi possível entrar. Tente novamente.',
  'auth.error_not_configured': 'Autenticação não configurada.',
  'auth.error_invalid_email_format': 'Digite um e-mail válido.',
  'auth.error_password_too_short': 'Senha deve ter ao menos 6 caracteres.',
  'auth.error_passwords_do_not_match': 'As senhas não coincidem.',
  'auth.error_unknown': 'Ocorreu um erro inesperado.',

  // CharSelect
  'charselect.hero_line1': 'Sua ficha,',
  'charselect.hero_line2': 'facilitada.',
  'charselect.tagline': 'Mesa virtual · fichas sincronizadas',
  'charselect.subline': 'Gerencie seus personagens de D&D em qualquer dispositivo.',
  'charselect.feature_hint': 'HP, magias e inventário a um toque.',
  'charselect.preview_badge': '',
  'charselect.my_characters': 'Meus Personagens',
  'charselect.loading': 'Carregando…',
  'charselect.loading_characters': 'Carregando personagens…',
  'charselect.saved_count_one': '{n} salvo',
  'charselect.saved_count_other': '{n} salvos',
  'charselect.empty': 'Nenhum personagem ainda. Vamos começar?',
  'charselect.empty_hint': '',
  'charselect.import': '⬇ Importar JSON',
  'charselect.import_unavailable': 'Importar JSON — em breve.',
  'charselect.export': '⬆ Exportar',
  'charselect.export_unavailable': 'Exportar — em breve.',
  'charselect.v1_prefix': '',
  'charselect.v1_link': '',

  // State screens
  'screens.loading_character': 'Carregando personagem…',
  'screens.error_title': 'Erro ao carregar',
  'screens.not_found_title': 'Personagem não encontrado',
  'screens.not_found_hint': 'Este personagem não existe ou foi removido.',
  'screens.back_to_list': 'Voltar para lista',

  // HP block
  'hp.section_title': 'Pontos de Vida',
  'hp.current_label': 'Atual',
  'hp.max_label': 'Máx',
  'hp.temp_label': '+{n} temp',
  'hp.temp_input_label': 'Temp',

  // Hit Dice
  'hit_dice.section_title': 'Dados de Vida',
  'hit_dice.total_label': 'Total: {current}/{max}',

  // Death saves
  'deathsaves.section_title': 'Testes de Morte',
  'deathsaves.success_label': 'Sucessos',
  'deathsaves.failure_label': 'Falhas',

  // Saving throws section
  'saves.section_title': 'Testes de Resistência',
  'saves.ability.str': 'Força',
  'saves.ability.dex': 'Destreza',
  'saves.ability.con': 'Constituição',
  'saves.ability.int': 'Inteligência',
  'saves.ability.wis': 'Sabedoria',
  'saves.ability.cha': 'Carisma',

  // Individual skill names (18, padrão PHB-PT, via template literal t(`skills.${k}`))
  'skills.acrobatics': 'Acrobacia',
  'skills.animal_handling': 'Adestrar Animais',
  'skills.arcana': 'Arcanismo',
  'skills.athletics': 'Atletismo',
  'skills.deception': 'Enganação',
  'skills.history': 'História',
  'skills.insight': 'Intuição',
  'skills.intimidation': 'Intimidação',
  'skills.investigation': 'Investigação',
  'skills.medicine': 'Medicina',
  'skills.nature': 'Natureza',
  'skills.perception': 'Percepção',
  'skills.performance': 'Atuação',
  'skills.persuasion': 'Persuasão',
  'skills.religion': 'Religião',
  'skills.sleight_of_hand': 'Prestidigitação',
  'skills.stealth': 'Furtividade',
  'skills.survival': 'Sobrevivência',

  // Skills section label (used in StatusTab mobile/desktop labels)
  'skills.label': 'Perícias',

  // Attributes section
  'attributes.section_title': 'Atributos',

  // Hero card
  'hero.inspired_badge': 'Inspirado',
  'hero.name_label':     'Nome',
  'hero.level_label':    'Nível',
  'hero.xp_label':       'XP',

  // Combat stats strip labels
  'combat.ac': 'CA',
  'combat.initiative': 'INIC',
  'combat.speed': 'VEL',
  'combat.passive_perception': 'PP',
  'combat.spell_save_dc': 'DC',
  'combat.proficiency_bonus': 'PROF',

  // Combat — edição de ataques (C.1.d)
  'combat.attack_name_placeholder': 'Nome do ataque',
  'combat.unnamed_attack':          '(ataque sem nome)',
  'combat.kind_label':              'Tipo',
  'combat.kind_melee':              'Corpo a corpo',
  'combat.kind_ranged':             'À distância',
  'combat.kind_spell':              'Magia',
  'combat.ability_label':           'Habilidade',
  'combat.ability_none':            '—',
  'combat.attack_bonus_label':      'Bônus',
  'combat.damage_label':            'Dano',
  'combat.damage_type_label':       'Tipo de dano',
  'combat.range_label':             'Alcance',
  'combat.properties_label':        'Propriedades',
  'combat.properties_placeholder':  'Versátil, Acuidade, Leve…',
  'combat.notes_label':             'Notas',
  'combat.notes_placeholder':       'Efeitos especiais, mecânicas…',

  // Features & Traits
  'features.label': 'Características & Traços',
  'features.title': 'Características',
  'features.empty': 'Nenhuma feature registrada.',
  'features.section_title':            'Características e Traços',
  'features.add_button':               '+ Adicionar característica',
  'features.name_placeholder':         'Nome da característica',
  'features.description_placeholder':  'Descrição, mecânica...',
  'features.source_placeholder':       'Fonte (Classe, Raça...)',
  'features.empty_state_hint':         'Nenhuma característica registrada.',
  'features.uses_hint':                'usos',
  'features.type_passive':             'Passiva',
  'features.type_active':              'Ativa',
  'features.type_reaction':            'Reação',
  'features.source_class':             'Classe',
  'features.source_race':              'Raça',
  'features.source_background':        'Antecedente',
  'features.source_feat':              'Talento',
  'features.source_item':              'Item',

  // Languages
  'languages.section_title':    'Idiomas',
  'languages.add_button':       '+ Adicionar idioma',
  'languages.placeholder':      'Nome do idioma',
  'languages.empty_state_hint': 'Nenhum idioma adicionado ainda.',

  // Proficiencies (editable lists)
  'proficiencies.section_title':         'Proficiências',
  'proficiencies.weapons_label':         'Armas',
  'proficiencies.armor_label':           'Armaduras',
  'proficiencies.tools_label':           'Ferramentas',
  'proficiencies.other_label':           'Outras',
  'proficiencies.add_button':            '+ Adicionar',
  'proficiencies.weapons_placeholder':   'Proficiência em arma',
  'proficiencies.armor_placeholder':     'Proficiência em armadura',
  'proficiencies.tools_placeholder':     'Proficiência em ferramenta',
  'proficiencies.other_placeholder':     'Outra proficiência',
  'proficiencies.weapons_empty_hint':    'Nenhuma proficiência em armas.',
  'proficiencies.armor_empty_hint':      'Nenhuma proficiência em armaduras.',
  'proficiencies.tools_empty_hint':      'Nenhuma proficiência em ferramentas.',
  'proficiencies.other_empty_hint':      'Nenhuma outra proficiência.',

  // Attacks
  'attacks.section_title': 'ATAQUES',
  'attacks.add_button': 'Adicionar',
  'attacks.empty_state_title': 'Nenhum ataque cadastrado.',
  'attacks.empty_state_hint': 'Adicione um ataque para registrar suas armas e magias ofensivas.',
  'attacks.count_label': '({count})',
  'attacks.row_aria': 'Ataque {name}, {bonus_or_dc}, {damage}',

  // SpellcastingHeader (editable)
  'spells.header.class':        'CLASSE',
  'spells.header.ability':      'HABILIDADE',
  'spells.header.save_dc':      'DC DE SALVAGUARDA',
  'spells.header.attack_bonus': 'BÔNUS DE ATAQUE',
  'spells.class_label':         'Classe',
  'spells.class_placeholder':   'Druida, Clérigo...',
  'spells.ability_label':       'Habilidade',
  'spells.no_ability':          '— Nenhuma —',
  'spells.save_dc_label':       'CD de Salvaguarda',
  'spells.attack_bonus_label':  'Bônus de Ataque',

  // SpellSlotsBlock (editable)
  'spell_slots.section_title': 'ESPAÇOS DE MAGIA',
  'spell_slots.level_label':   'NÍVEL {level}',
  'spell_slots.count_label':   '{current}/{max}',
  'spell_slots.pip_aria':      'Espaço de nível {level} ({current} de {max} disponíveis)',
  'spells.slots_section_title': 'Espaços de Magia',
  'spells.no_slots_hint':       'Nenhum espaço de magia configurado.',
  'spells.add_slot_level':      '+ Adicionar nível',
  'spells.level':               'Nível {n}',

  // SpellsList
  'spells.section_title':       'MAGIAS',
  'spells.add_button':          'Adicionar',
  'spells.count_label':         '({count})',
  'spells.cantrips_section':    'TRUQUES',
  'spells.level_section':       'NÍVEL {level}',
  'spells.section_count':       '{count}',
  'spells.empty_state_title':   'Nenhuma magia cadastrada.',
  'spells.empty_state_hint':    'Adicione truques e magias para gerenciar espaços.',
  'spells.cantrips':            'Truques',
  'spells.cantrip':             'Truque',
  'spells.unnamed_spell':       '(sem nome)',
  'spells.prepared_hint':       'Preparada hoje',
  'spells.add_cantrip':         '+ Adicionar truque',
  'spells.add_at_level':        '+ Adicionar magia nível {n}',
  'spells.name_placeholder':    'Nome da magia',
  'spells.level_label':         'Nível',
  'spells.school_label':        'Escola',
  'spells.casting_time_label':  'Tempo de conjuração',
  'spells.range_label':         'Alcance',
  'spells.description_label':   'Descrição',
  'spells.description_placeholder': 'Efeitos, mecânica...',

  // SpellRow (legacy keys kept for compatibility)
  'spells.row.unprepared_aria': 'Não preparada',
  'spells.row.row_aria':        'Magia {name}',

  // Spell schools
  'spells.school_abjuration':   'Abjuração',
  'spells.school_conjuration':  'Conjuração',
  'spells.school_divination':   'Adivinhação',
  'spells.school_enchantment':  'Encantamento',
  'spells.school_evocation':    'Evocação',
  'spells.school_illusion':     'Ilusão',
  'spells.school_necromancy':   'Necromancia',
  'spells.school_transmutation': 'Transmutação',

  // SpellsTab non-caster (kept for reference)
  'spells.non_caster_title': 'Esta classe não possui conjuração de magias.',
  'spells.non_caster_hint': 'Magias são acessadas por classes como Druid, Bard, Cleric, Wizard, Sorcerer e outras.',

  // Inventory — InventoryList + ItemCard (C.1.f)
  'inventory.section_title':           'ITENS',
  'inventory.add_button':              'Adicionar',
  'inventory.count_label':             '({count})',
  'inventory.empty_state_title':       'Nenhum item registrado.',
  'inventory.empty_state_hint':        'Adicione seus equipamentos, consumíveis e tesouros.',
  'inventory.unnamed_item':            '(sem nome)',
  'inventory.equipped_hint':           'Equipado',
  'inventory.per_unit':                '(por unidade)',
  'inventory.name_placeholder':        'Nome do item',
  'inventory.quantity_label':          'Quantidade',
  'inventory.weight_label':            'Peso',
  'inventory.category_label':          'Categoria',
  'inventory.description_label':       'Descrição',
  'inventory.description_placeholder': 'Efeitos, propriedades especiais…',

  // Item categories
  'inventory.category_weapon':         'Armas',
  'inventory.category_armor':          'Armaduras',
  'inventory.category_consumable':     'Consumíveis',
  'inventory.category_tool':           'Ferramentas',
  'inventory.category_misc':           'Diversos',

  // Per-category add buttons
  'inventory.add_weapon':              '+ Adicionar arma',
  'inventory.add_armor':               '+ Adicionar armadura',
  'inventory.add_consumable':          '+ Adicionar consumível',
  'inventory.add_tool':                '+ Adicionar ferramenta',
  'inventory.add_misc':                '+ Adicionar item',

  // Currency — CurrencyBlock (4 moedas — EP removido; converte para SP)
  'currency.section_title': 'MOEDAS',
  'currency.pp_label':      'PP',
  'currency.gp_label':      'GP',
  'currency.sp_label':      'SP',
  'currency.cp_label':      'CP',
  'currency.pp_aria':       'Platina: {count}',
  'currency.gp_aria':       'Ouro: {count}',
  'currency.sp_aria':       'Prata: {count}',
  'currency.cp_aria':       'Cobre: {count}',

  // Proficiencies
  'proficiencies.label': 'PROFICIÊNCIAS',
  'proficiencies.weapons_armor': 'ARMAS E ARMADURAS',
  'proficiencies.tools': 'FERRAMENTAS',
  'proficiencies.languages': 'IDIOMAS',
  'proficiencies.other': 'OUTRAS',

  // Lore hero — LoreHero
  'lore.hero.level_xp': 'Nível {level} · {xp} XP',

  // Backstory — BackstoryBlock
  'backstory.section_title':     'HISTÓRIA',
  'backstory.empty_state_title': 'Nenhuma história registrada ainda.',
  'backstory.empty_state_hint':  'Documente o passado, motivações e momentos marcantes do seu personagem.',
  'backstory.placeholder':       'Documente o passado do seu personagem...',

  // Personality — PersonalityBlock
  'personality.section_title':          'PERSONALIDADE',
  'personality.traits_label':           'Traços',
  'personality.ideals_label':           'Ideais',
  'personality.bonds_label':            'Vínculos',
  'personality.flaws_label':            'Defeitos',
  'personality.traits.placeholder':     'Traços de personalidade...',
  'personality.ideals.placeholder':     'Ideais...',
  'personality.bonds.placeholder':      'Vínculos...',
  'personality.flaws.placeholder':      'Defeitos...',

  // Notes — NotesBlock
  'notes.section_title':     'NOTAS',
  'notes.empty_state_title': 'Nenhuma nota registrada ainda.',
  'notes.empty_state_hint':  'Use este espaço para anotações de sessão, NPCs e lembretes.',
  'notes.placeholder':       'Anotações de sessão, NPCs, lembretes...',

  // Image modal — CharacterImageModal
  'image.modal.title':            'Editar imagem do personagem',
  'image.modal.select_file':      'Selecionar imagem',
  'image.modal.zoom_label':       'Zoom',
  'image.modal.apply':            'Aplicar',
  'image.modal.cancel':           'Cancelar',
  'image.modal.error.too_large':  'Imagem excede o limite de 2 MB',
  'image.modal.error.bad_format': 'Formato não suportado. Use JPG, PNG ou WebP.',
  'image.modal.drag_hint':        'Arraste para reposicionar',

  // Identity block — IdentityBlock
  'identity.section_title':           'IDENTIDADE',
  'identity.race_label':              'Raça',
  'identity.background_label':        'Antecedente',
  'identity.alignment_label':         'Alinhamento',
  'identity.alignment_unselected':    'Selecione um alinhamento…',
  'identity.alignment_custom_label':  'Customizado: {value}',
  'identity.classes_label':           'Classes',
  'identity.class_name_placeholder':  'Nome da classe',
  'identity.add_class_button':        '+ Adicionar classe',
  'identity.class_default_name':      'Nova classe',
  'identity.inspiration_label':       'Inspiração',

  // Aria labels (accessibility)
  'aria.portrait': 'Retrato de {name}',
  'aria.open_menu': 'Abrir menu',
  'aria.item_weight':   'Item: {name}, peso: {weight}',
  'aria.remove_item':        'Remover {name}',
  'aria.item_name':          'Nome do item',
  'aria.item_quantity':      'Quantidade do item',
  'aria.item_weight_input':  'Peso por unidade',
  'aria.item_category':      'Categoria do item',
  'aria.item_description':   'Descrição do item',
  'aria.item_equipped':      '{name} equipado',
  'aria.weight_bar':         'Peso carregado: {current} de {max} libras',
  'aria.remove_spell':                 'Remover magia {name}',
  'aria.spellcasting_class_input':     'Classe conjuradora',
  'aria.spellcasting_ability_select':  'Habilidade conjuradora',
  'aria.spell_name':                   'Nome da magia',
  'aria.spell_prepared':               'Magia preparada hoje',
  'aria.slot_pip':                     'Espaço {n} de nível {level}',
  'aria.slot_max_input':               'Máx espaços do nível {level}',
  'aria.add_slot_level':               'Adicionar nível de espaço',
  'aria.remove_attack':      'Remover ataque {name}',
  'aria.attack_name':        'Nome do ataque',
  'aria.attack_bonus_input': 'Bônus de ataque',
  'aria.damage_input':       'Dano',
  'aria.damage_type_input':  'Tipo de dano',
  'aria.range_input':        'Alcance',
  'aria.kind_select':        'Tipo de ataque',
  'aria.ability_select':     'Habilidade associada',
  'aria.spell_slot': 'Slot de nível {level} ({current} de {max} disponíveis)',
  'aria.edit_image':           'Editar imagem do personagem',
  'aria.character_name_input': 'Nome do personagem',
  'aria.xp_input':             'Pontos de experiência',
  'aria.race_input':           'Raça do personagem',
  'aria.background_input':     'Antecedente do personagem',
  'aria.alignment_input':      'Alinhamento do personagem',
  'aria.class_name_input':     'Nome da classe {index}',
  'aria.class_level_input':    'Nível da classe {index}',
  'aria.remove_class':         'Remover classe {name}',
  'aria.inspiration_toggle':   'Alternar inspiração',
  'aria.ability_score_input':        'Pontuação de {ability}',
  'aria.save_proficiency_toggle':    'Alternar proficiência do teste de {ability}',
  'aria.skill_proficient_toggle':    'Alternar proficiência em {skill}',
  'aria.skill_expertise_toggle':     'Alternar especialização em {skill}',
  'aria.hp_current_input':           'PV atual',
  'aria.hp_max_input':               'PV máximo',
  'aria.hp_temp_input':              'PV temporário',
  'aria.deathsave_success_toggle':   'Alternar sucesso {n} de teste de morte',
  'aria.deathsave_failure_toggle':   'Alternar falha {n} de teste de morte',
  'aria.hitdice_class_input':        'Dados de vida restantes de {className}',

  // Aria — languages
  'aria.language_input':       'Idioma {index}',
  'aria.remove_language':      'Remover idioma {name}',
  'aria.proficiency_input':    'Proficiência {index}',
  'aria.remove_proficiency':   'Remover proficiência {name}',

  // Aria — proficiency sub-lists
  'aria.weapons_list':   'Proficiências em armas',
  'aria.armor_list':     'Proficiências em armaduras',
  'aria.tools_list':     'Proficiências em ferramentas',
  'aria.other_list':     'Outras proficiências',

  // Aria — features
  'aria.feature_name':        'Nome da característica',
  'aria.feature_source':      'Fonte da característica',
  'aria.feature_type':        'Tipo de característica',
  'aria.feature_description': 'Descrição da característica',
  'aria.feature_uses_left':   'Usos restantes',
  'aria.feature_uses_max':    'Usos máximos',
  'aria.remove_feature':      'Remover característica {name}',
  'aria.decrement_value':     'Diminuir',
  'aria.increment_value':     'Aumentar',

  // Remove confirmation (ConfirmableRemoveButton)
  'remove.confirm':           'Confirmar?',
  'remove.confirm_aria':      'Confirmar exclusão',

  // Phase C placeholder alerts
  'phase_c.editing_coming_soon': 'Edição virá na Fase C',
  'phase_c.details_coming_soon': 'Detalhes virão na Fase C',
  'phase_c.export_unavailable': 'Exportar — não implementado nesta fase.',

  // Common
  'common.cancel': 'Cancelar',

  // My Characters — create buttons
  'charselect.create_from_scratch': 'Criar do zero',
  'charselect.create_with_ai':      'Criar com IA',

  // AI Generation Modal
  'ai_modal.title':                  'Gerar personagem com IA',
  'ai_modal.description_label':      'Descrição do personagem',
  'ai_modal.description_placeholder': 'Um druida elfo da floresta que cresceu em uma floresta ancestral, assombrado por um segredo sombrio…',
  'ai_modal.description_hint':       'Seja específico sobre raça, classe, personalidade e antecedente.',
  'ai_modal.language_label':         'Idioma da geração',
  'ai_modal.generate_button':        'Gerar',
  'ai_modal.generating_button':      'Gerando…',
  'ai_modal.generating':             'Gerando seu personagem…',
  'ai_modal.generating_hint':        'Isso pode levar de 10 a 30 segundos.',

  // AI errors
  'ai_modal.error_description_too_short': 'A descrição deve ter pelo menos 10 caracteres.',
  'ai_modal.error_rate_limit':            'Muitas requisições. Aguarde um momento e tente novamente.',
  'ai_modal.error_invalid_request':       'A requisição foi rejeitada. Tente reformular sua descrição.',
  'ai_modal.error_server_error':          'Erro do servidor. Tente novamente em alguns instantes.',
  'ai_modal.error_invalid_response':      'A geração foi incompleta. Tente novamente.',
  'ai_modal.error_timeout':               'A geração demorou muito. Tente uma descrição mais curta.',
  'ai_modal.error_network_error':         'Erro de rede. Verifique sua conexão e tente novamente.',
  'ai_modal.error_unknown':               'Ocorreu um erro inesperado. Tente novamente.',

  // Aria
  'aria.ai_description_input':  'Descrição do personagem para geração por IA',
  'aria.create_with_ai':        'Criar novo personagem com IA',
  'aria.create_from_scratch':   'Criar novo personagem do zero',
  'aria.close_modal':           'Fechar modal',

  // Character card menu
  'characters.options_for': 'Opções para {name}',
  'characters.delete':      'Excluir',
  'characters.unnamed':     '(sem nome)',

  // Confirm delete modal
  'delete_modal.title':    'Excluir personagem?',
  'delete_modal.warning':  'Tem certeza que deseja excluir "{name}"?',
  'delete_modal.note':     'Esta ação não pode ser desfeita. O personagem será removido permanentemente deste dispositivo.',
  'delete_modal.confirm':  'Excluir',
  'delete_modal.deleting': 'Excluindo…',

  // Delete errors
  'delete_modal.error_local_delete_failed': 'Não foi possível excluir o personagem. Tente novamente.',
  'delete_modal.error_unknown':             'Ocorreu um erro inesperado. Tente novamente.',

  // Aria — delete flow
  'aria.character_options': 'Opções do personagem',
  'aria.confirm_delete':    'Confirmar exclusão',
  'aria.cancel_delete':     'Cancelar exclusão',

  // Navigation — campaigns
  'chrome.my_campaigns': 'Minhas Campanhas',

  // Campaign select page
  'campaigns.my_campaigns':    'Minhas Campanhas',
  'campaigns.count_one':       '{count} campanha',
  'campaigns.count_other':     '{count} campanhas',
  'campaigns.create':          'Criar Campanha',
  'campaigns.empty_state':     'Nenhuma campanha ainda. Crie a sua primeira!',
  'campaigns.detail_placeholder':      'Conteúdo da campanha em breve.',
  'campaigns.detail_placeholder_hint': 'Convidar jogadores e adicionar personagens estará disponível em breve.',

  // Create campaign modal
  'create_campaign.title':              'Criar Nova Campanha',
  'create_campaign.name_label':         'Nome da Campanha',
  'create_campaign.name_placeholder':   'A Mina Perdida de Phandelver',
  'create_campaign.description_label':  'Descrição (opcional)',
  'create_campaign.description_placeholder': 'Uma breve descrição da campanha...',
  'create_campaign.create_button':      'Criar',
  'create_campaign.creating':           'Criando…',
  'create_campaign.error_create_failed': 'Não foi possível criar a campanha. Tente novamente.',
  'create_campaign.error_not_authenticated': 'Você precisa estar conectado para criar uma campanha.',

  // Delete campaign modal
  'delete_campaign.title':   'Excluir Campanha?',
  'delete_campaign.warning': 'Tem certeza que deseja excluir "{name}"?',
  'delete_campaign.note':    'Esta ação não pode ser desfeita. Todos os membros serão removidos.',
  'delete_campaign.confirm': 'Excluir',
  'delete_campaign.deleting': 'Excluindo…',
  'delete_campaign.error_delete_failed': 'Não foi possível excluir a campanha. Tente novamente.',

  // Profile setup modal
  'profile_setup.title':              'Bem-vindo(a)!',
  'profile_setup.description':        'Escolha um nome de exibição. É assim que outros membros da campanha verão você.',
  'profile_setup.display_name_label': 'Nome de exibição',
  'profile_setup.display_name_placeholder': 'Seu nome ou apelido',
  'profile_setup.save':               'Continuar',
  'profile_setup.saving':             'Salvando…',
  'profile_setup.error_empty_display_name':    'Nome de exibição não pode ficar vazio.',
  'profile_setup.error_display_name_too_long': 'Nome muito longo (máx 50 caracteres).',
  'profile_setup.error_upsert_failed':         'Não foi possível salvar. Tente novamente.',
  'profile_setup.error_not_authenticated':     'Você precisa estar conectado.',
  'profile_setup.error_unknown':               'Ocorreu um erro inesperado.',

  // Aria — campaigns
  'aria.create_campaign':       'Criar nova campanha',
  'aria.delete_campaign':       'Excluir campanha {name}',
  'aria.campaign_options':      'Opções da campanha {name}',
  'aria.compact_campaign_card': 'Campanha {name}',

  // CharSelect — campaigns section
  'characters_screen.my_campaigns':           'Minhas Campanhas',
  'characters_screen.campaigns_empty':        'Nenhuma campanha ainda. Crie a sua primeira!',
  'characters_screen.campaigns_login_prompt': 'Entre para criar e gerenciar campanhas.',
};

export default pt;
