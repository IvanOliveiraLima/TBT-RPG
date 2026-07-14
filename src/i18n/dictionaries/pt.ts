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
  'auth.email_confirmed_title': 'E-mail confirmado!',
  'auth.email_confirmed_message': 'Sua conta está ativa. Bem-vindo!',
  'auth.forgot_password_link': 'Esqueci minha senha',
  'auth.forgot_title': 'Recuperar senha',
  'auth.forgot_submit': 'Enviar link',
  'auth.forgot_email_sent_title': 'Verifique seu e-mail',
  'auth.forgot_email_sent_message': 'Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.',
  'auth.reset_title': 'Definir nova senha',
  'auth.reset_new_password': 'Nova senha',
  'auth.reset_confirm_password': 'Confirmar nova senha',
  'auth.reset_submit': 'Salvar senha',
  'auth.reset_signout': 'Sair',
  'auth.password_reset_title': 'Senha alterada!',
  'auth.password_reset_message': 'Sua nova senha está ativa.',
  'auth.error_reset_request_failed': 'Não foi possível enviar o link. Tente mais tarde.',
  'auth.error_update_password_failed': 'Não foi possível atualizar a senha. Tente novamente.',
  'auth.link_error_title': 'Link expirado',
  'auth.link_error_message': 'Este link de recuperação expirou ou já foi usado.',
  'auth.link_error_action': 'Solicitar novo link',
  'auth.password_show': 'Mostrar senha',
  'auth.password_hide': 'Ocultar senha',

  // Account management
  'account.delete_link':          'Excluir conta',
  'account.delete_title':         'Excluir conta',
  'account.delete_warning':       'Isto apaga permanentemente sua conta, seus personagens e as campanhas que você criou. Não há como desfazer.',
  'account.delete_confirm_label': 'Digite seu e-mail para confirmar',
  'account.delete_button':        'Excluir conta permanentemente',
  'account.delete_cancel':        'Cancelar',
  'account.delete_in_progress':   'Excluindo…',
  'account.delete_error':         'Não foi possível excluir a conta. Tente novamente.',

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
  'hero.inspired_badge':      'Inspirado',
  'hero.name_label':          'Nome',
  'hero.level_label':         'Nível',
  'hero.total_level_label':   'Nível Total',
  'hero.xp_label':            'XP',

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
  'spell_slots.remove_level':  'Remover nível {level}',
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
  'identity.class_level_label':       'Nível',
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

  // Invite code block (owner view in CampaignDetail)
  'invite.title':              'Código de convite',
  'invite.description':        'Compartilhe este código com os jogadores para convidá-los para a campanha.',
  'invite.copy_link':          'Copiar link',
  'invite.link_copied':        'Link copiado!',
  'invite.copy_code':          'Copiar código',
  'invite.code_copied':        'Código copiado!',
  'invite.regenerate':         'Regenerar código',
  'invite.regenerating':       'Regenerando…',
  'invite.regenerate_confirm': 'Regenerar código? O código anterior deixará de funcionar.',
  'invite.regenerate_error':   'Não foi possível regenerar. Tente novamente.',

  // Join campaign modal
  'join_campaign.title':                  'Entrar em campanha com código',
  'join_campaign.description':            'Digite o código de convite compartilhado pelo mestre da campanha.',
  'join_campaign.code_label':             'Código de convite',
  'join_campaign.join':                   'Entrar',
  'join_campaign.joining':                'Entrando…',
  'join_campaign.error_not_found':        'Código não encontrado. Verifique e tente novamente.',
  'join_campaign.error_lookup_failed':    'Não foi possível buscar o código. Tente novamente.',
  'join_campaign.error_accept_failed':    'Não foi possível entrar na campanha. Tente novamente.',
  'join_campaign.error_not_authenticated':'Você precisa estar logado para entrar em uma campanha.',
  'join_campaign.error_unknown':          'Erro inesperado. Tente novamente.',
  'join_campaign.already_member_note':    'Você já é membro desta campanha.',

  // Campaign detail
  'campaign_detail.members':           'Membros',
  'campaign_detail.role_master':       'Mestre',
  'campaign_detail.role_player':       'Jogador',
  'campaign_detail.unknown_member':      'Membro desconhecido',
  'campaign_detail.unknown_character':   'Personagem desconhecido',
  'campaign_detail.chars_placeholder':   'Visualização de personagens em breve.',

  // Buttons — join with code
  'campaigns.join_with_code': 'Entrar com código',

  // Aria — invite
  'aria.copy_invite_link':       'Copiar link de convite',
  'aria.copy_invite_code':       'Copiar código de convite',
  'aria.regenerate_invite_code': 'Regenerar código de convite',
  'aria.invite_code_input':      'Campo de código de convite',

  // Campaign detail — linked chars section
  'campaign_chars.title':               'Personagens vinculados',
  'campaign_chars.link_button':         'Vincular personagem',
  'campaign_chars.empty_state':         'Nenhum personagem vinculado ainda.',
  'campaign_chars.owner_label':         'Jogador',
  'campaign_chars.unlink':              'Desvincular',
  'campaign_chars.unlinking':           'Desvinculando…',
  'campaign_chars.unlink_confirm':      'Desvincular este personagem da campanha?',
  'campaign_chars.unlink_failed':       'Não foi possível desvincular. Tente novamente.',
  'campaign_chars.full_view_coming_soon': 'Visualização completa em breve.',

  // Campaign maps section
  'campaign_maps.section_title':    'Mapas',
  'campaign_maps.add':              'Adicionar mapa',
  'campaign_maps.name_label':       'Nome do mapa',
  'campaign_maps.empty':            'Nenhum mapa ainda.',
  'campaign_maps.upload_error_type': 'Use uma imagem PNG, JPG ou WebP.',
  'campaign_maps.upload_error_size':  'Imagem muito grande (máx. 10 MB).',
  'campaign_maps.upload_error_quota': 'Limite de mapas atingido (máx. 20 por campanha).',
  'campaign_maps.loading':          'Carregando mapa…',
  'campaign_maps.remove_confirm':   'Remover este mapa?',
  'campaign_maps.marker_add_hint':          'Clique duas vezes no mapa para adicionar um marcador',
  'campaign_maps.marker_label_placeholder': 'Rótulo do marcador',
  'campaign_maps.marker_save':              'Adicionar',
  'campaign_maps.marker_cancel':            'Cancelar',
  'campaign_maps.marker_rename':            'Renomear',
  'campaign_maps.marker_remove':            'Remover',
  'campaign_maps.marker_empty_label':       '(sem rótulo)',
  'campaign_maps.grid_title':     'Grade',
  'campaign_maps.grid_enable':    'Mostrar grade',
  'campaign_maps.grid_cell_size': 'Tamanho da célula (px)',
  'campaign_maps.grid_offset_x':  'Offset X',
  'campaign_maps.grid_offset_y':  'Offset Y',
  'campaign_maps.grid_color':     'Cor da grade',
  'campaign_maps.grid_save':      'Salvar grade',
  'campaign_maps.grid_collapse':  'Recolher',
  'campaign_maps.token_add':    'Adicionar token',
  'campaign_maps.token_label':  'Rótulo do token',
  'campaign_maps.token_color':  'Cor do token',
  'campaign_maps.token_size':   'Tamanho (células)',
  'campaign_maps.token_save':   'Salvar',
  'campaign_maps.token_remove': 'Remover',
  'campaign_maps.token_image':        'Imagem',
  'campaign_maps.token_image_upload': 'Enviar imagem',
  'campaign_maps.token_image_remove': 'Remover imagem',
  'campaign_maps.token_image_from_character':  'Usar retrato de personagem',
  'campaign_maps.token_image_pick_character':  'Escolher personagem',
  'campaign_maps.token_image_no_portrait':     'Sem retrato',

  'campaign_maps.fog_title':         'Névoa',
  'campaign_maps.fog_enable':        'Ativar névoa',
  'campaign_maps.fog_brush_reveal':  'Revelar',
  'campaign_maps.fog_brush_hide':    'Ocultar',
  'campaign_maps.fog_reveal_all':    'Revelar tudo',
  'campaign_maps.fog_hide_all':      'Ocultar tudo',
  'campaign_maps.fog_requires_grid': 'Ative a grade primeiro',
  'campaign_maps.fog_paint_hint':    'Clique nas células para revelar/ocultar',
  'campaign_maps.fog_done':          'Concluir',
  'campaign_maps.expand':            'Expandir',
  'campaign_maps.restore':           'Restaurar',

  // Link character modal
  'link_character.title':               'Vincular personagem',
  'link_character.description':         'Selecione um de seus personagens para vincular a esta campanha.',
  'link_character.no_chars_at_all':     'Você não tem nenhum personagem ainda. Crie um primeiro.',
  'link_character.all_already_linked':  'Todos os seus personagens já estão vinculados a esta campanha.',
  'link_character.confirm':             'Vincular',
  'link_character.linking':             'Vinculando…',
  'link_character.error_already_linked':    'Este personagem já está vinculado.',
  'link_character.error_link_failed':       'Não foi possível vincular. Tente novamente.',
  'link_character.error_not_authenticated': 'Você precisa estar logado.',
  'link_character.error_unknown':           'Erro inesperado.',

  // Aria — campaign chars
  'aria.unlink_character': 'Desvincular personagem {name}',

  // Campaign char view page (Camp.4)
  'campaign_view.back_to_campaign':        'Voltar para campanha',
  'campaign_view.linked_characters':       'Personagens vinculados',
  'campaign_view.viewing_as_master':       'Visualizando como mestre',
  'campaign_view.viewing_own_char_hint':   'Este é seu próprio personagem. Para editar, vá em "Meus Personagens".',
  'campaign_view.char_not_found':          'O personagem não existe mais.',
  'campaign_view.redirecting':             'Voltando para a campanha…',
  'campaign_view.error_not_authenticated': 'Você precisa estar logado.',
  'campaign_view.error_fetch_failed':      'Não foi possível carregar o personagem.',
  'campaign_view.error_unknown':           'Erro inesperado.',

  // Aria — campaign view
  'aria.linked_char_view':  'Visualizar personagem {name}',
  'aria.campaign_char_nav': 'Ir para personagem {name}',

  // Leave campaign
  'campaigns.leave':              'Sair',
  'leave_campaign.title':         'Sair da Campanha?',
  'leave_campaign.warning':       'Tem certeza que deseja sair de "{name}"?',
  'leave_campaign.note':          'Seus personagens vinculados serão desvinculados desta campanha.',
  'leave_campaign.confirm':       'Sair',
  'leave_campaign.leaving':       'Saindo…',
  'leave_campaign.error':         'Não foi possível sair da campanha. Tente novamente.',

  // Campaign detail — actions section
  'campaign_detail.actions':       'Ações',
  'campaign_detail.delete_warning': 'Exclui permanentemente a campanha e remove todos os membros.',
  'campaign_detail.leave_warning':  'Remove você desta campanha.',

  // Member row menu
  'member_menu.edit_name':     'Editar nome de exibição',
  'member_menu.remove_member': 'Remover membro',

  // Edit display name modal
  'edit_display_name.title':       'Editar nome de exibição',
  'edit_display_name.description': 'Este nome é visível para outros membros das campanhas das quais você participa.',
  'edit_display_name.save':        'Salvar',
  'edit_display_name.saving':      'Salvando…',

  // Remove member modal
  'remove_member.title':    'Remover membro?',
  'remove_member.warning':  'Tem certeza que deseja remover {name} desta campanha?',
  'remove_member.note':     'Os personagens vinculados também serão desvinculados. Eles podem voltar com o código de convite.',
  'remove_member.confirm':  'Remover',
  'remove_member.removing': 'Removendo…',
  'remove_member.error':    'Não foi possível remover. Tente novamente.',

  // Aria — member row
  'aria.member_row_menu':          'Ações para {name}',
  'aria.edit_display_name_input':  'Nome de exibição',

  // Aria — combat
  'aria.ac_input': 'Classe de Armadura',
  'aria.speed_input': 'Velocidade em pés',

  // Export
  'export.empty_warning': 'Nenhum personagem para exportar.',

  // Import
  'import.choose_mode_title':        'Escolher modo de importação',
  'import.payload_summary':          'Arquivo contém {count} personagens.',
  'import.mode_merge_title':         'Mesclar',
  'import.mode_merge_description':   'Adiciona novos personagens e atualiza os existentes por ID. Seguro para dados existentes.',
  'import.mode_replace_title':       'Substituir tudo',
  'import.mode_replace_description': 'Remove todos os personagens atuais e substitui pelos importados.',
  'import.replace_warning':          'Isso vai apagar todos os seus personagens atuais. Esta ação não pode ser desfeita localmente (sync da nuvem pode restaurar se você estiver logado).',
  'import.confirm':                  'Importar',
  'import.success_title':            'Importação concluída',
  'import.success_summary':          'Importados {imported} novos, atualizados {replaced} existentes.',
  'import.success_close':            'Fechar',
  'import.error_title':              'Falha na importação',
  'import.error_read_failed':        'Não foi possível ler o arquivo.',
  'import.error_invalid_json':       'O arquivo não é um JSON válido.',
  'import.error_invalid_schema':     'Formato de arquivo não reconhecido.',
  'import.error_incompatible_version': 'Este arquivo foi exportado de uma versão incompatível. Use uma exportação recente.',
  'import.error_apply_failed':       'Não foi possível importar. Tente novamente.',
  'import.error_unknown':            'Erro inesperado.',

  // Token presets section
  'token_presets.section_title': 'Tokens prontos',
  'token_presets.add':           'Adicionar token',
  'token_presets.name':          'Nome',
  'token_presets.color':         'Cor',
  'token_presets.size':          'Tamanho',
  'token_presets.empty':         'Nenhum token pronto ainda.',
  'token_presets.image_upload':  'Enviar imagem',
  'token_presets.image_remove':  'Remover imagem',
  'token_presets.upload_error_type': 'Use uma imagem PNG, JPG ou WebP.',
  'token_presets.upload_error_size': 'Imagem muito grande (máx. 10 MB).',
  'token_presets.palette':       'Tokens prontos',
  'token_presets.place_hint':    'Clique no mapa para colocar • {name}',
  'token_presets.place_done':    'Concluir',
  'token_presets.palette_empty': 'Nenhum token pronto — adicione na campanha',

  // ── Token conditions ──────────────────────────────────────────────────────────
  'token_conditions_title': 'Condições',
  'conditions.blinded.name':       'Cego',          'conditions.blinded.abbr':       'CEG',
  'conditions.charmed.name':       'Enfeitiçado',   'conditions.charmed.abbr':       'ENF',
  'conditions.deafened.name':      'Surdo',         'conditions.deafened.abbr':      'SUR',
  'conditions.frightened.name':    'Amedrontado',   'conditions.frightened.abbr':    'AMD',
  'conditions.grappled.name':      'Agarrado',      'conditions.grappled.abbr':      'AGA',
  'conditions.incapacitated.name': 'Incapacitado',  'conditions.incapacitated.abbr': 'INC',
  'conditions.invisible.name':     'Invisível',     'conditions.invisible.abbr':     'INV',
  'conditions.paralyzed.name':     'Paralisado',    'conditions.paralyzed.abbr':     'PAR',
  'conditions.petrified.name':     'Petrificado',   'conditions.petrified.abbr':     'PET',
  'conditions.poisoned.name':      'Envenenado',    'conditions.poisoned.abbr':      'ENV',
  'conditions.prone.name':         'Caído',         'conditions.prone.abbr':         'CAI',
  'conditions.restrained.name':    'Impedido',      'conditions.restrained.abbr':    'IMP',
  'conditions.stunned.name':       'Atordoado',     'conditions.stunned.abbr':       'ATD',
  'conditions.unconscious.name':   'Inconsciente',  'conditions.unconscious.abbr':   'INS',

  // ── Map areas ─────────────────────────────────────────────────────────────────
  'areas.title':       'Áreas',
  'areas.shape_circle': 'Círculo',
  'areas.shape_square': 'Quadrado',
  'areas.shape_line':   'Linha',
  'areas.shape_cone':   'Cone',
  'areas.color':       'Cor',
  'areas.clear':       'Limpar tudo',
  'areas.remove_one':  'Remover',
  'areas.draw_hint':   'Arraste no mapa para desenhar',
  'areas.done':        'Concluir',

  // ── Broadcast screen ──────────────────────────────────────────────────────────
  'broadcast.open':        'Abrir tela de transmissão',
  'broadcast.waiting':     'Aguardando a tela principal…',
  'broadcast.unsupported': 'Este navegador não suporta a tela de transmissão',
};

export default pt;
