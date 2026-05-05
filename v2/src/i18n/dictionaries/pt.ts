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
  'nav.generate_with_ai': 'Gerar com IA',
  'nav.ai_subtitle': 'Backstory, items, magias',

  // Sidebar version badge
  'sidebar.version_badge': 'v2 · beta',

  // Bottom tab bar (short labels)
  'tab.status': 'Status',
  'tab.combat': 'Combate',
  'tab.spells': 'Magias',
  'tab.inventory': 'Inv',
  'tab.lore': 'Histórico',

  // Mobile drawer items
  'drawer.export_json': 'Exportar JSON',
  'drawer.import_json': 'Importar JSON',
  'drawer.new_sheet': 'Nova ficha',
  'drawer.lock': 'Bloquear',

  // Auth
  'auth.sign_in': 'Entrar',
  'auth.sign_out': 'Sair',
  'auth.create_account': 'Criar conta',
  'auth.email': 'E-mail',
  'auth.password': 'Senha',
  'auth.signing_in': 'Entrando…',
  'auth.sign_in_title': 'Entrar na conta',
  'auth.sign_in_failed': 'Falha no login',
  'auth.sync_prompt': 'Entrar para sincronizar',

  // Topbar actions
  'topbar.export': 'Exportar',
  'topbar.unlock': 'Destravar',
  'topbar.synced': 'Sincronizado',

  // CharSelect
  'charselect.hero_line1': 'Sua ficha,',
  'charselect.hero_line2': 'facilitada.',
  'charselect.tagline': 'Mesa virtual · fichas sincronizadas',
  'charselect.subline': 'Gerencie seus personagens de D&D em qualquer dispositivo.',
  'charselect.feature_hint': 'HP, magias e inventário a um toque.',
  'charselect.preview_badge': 'v2 · Preview',
  'charselect.my_characters': 'Meus Personagens',
  'charselect.loading': 'Carregando…',
  'charselect.loading_characters': 'Carregando personagens…',
  'charselect.saved_count_one': '{n} salvo',
  'charselect.saved_count_other': '{n} salvos',
  'charselect.empty': 'Nenhum personagem encontrado.',
  'charselect.empty_hint': 'Crie um na v1 e ele aparecerá aqui.',
  'charselect.create': 'Criar novo personagem',
  'charselect.create_unavailable': 'Criação de personagens ainda não implementada na v2.\nUse a v1: {url}',
  'charselect.import': '⬇ Importar JSON',
  'charselect.import_unavailable': 'Importar JSON — não implementado na v2 ainda.',
  'charselect.export': '⬆ Exportar',
  'charselect.export_unavailable': 'Exportar — não implementado na v2 ainda.',
  'charselect.v1_prefix': 'Ficha completa disponível na',
  'charselect.v1_link': 'versão atual (v1) →',

  // State screens
  'screens.loading_character': 'Carregando personagem…',
  'screens.error_title': 'Erro ao carregar',
  'screens.not_found_title': 'Personagem não encontrado',
  'screens.not_found_hint': 'Este personagem não existe ou foi removido.',
  'screens.back_to_list': 'Voltar para lista',

  // HP block
  'hp.section_title': 'Pontos de Vida',
  'hp.heal_button': 'Curar',
  'hp.damage_button': 'Dano',
  'hp.temp_label': '+{n} temp',

  // Hit Dice
  'hit_dice.section_title': 'Dados de Vida',

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

  // Combat stats strip labels
  'combat.ac': 'CA',
  'combat.initiative': 'INIC',
  'combat.speed': 'VEL',
  'combat.passive_perception': 'PP',
  'combat.spell_save_dc': 'DC',
  'combat.proficiency_bonus': 'PROF',

  // Features & Traits
  'features.label': 'Características & Traços',
  'features.title': 'Características',
  'features.empty': 'Nenhuma feature registrada.',

  // Attacks
  'attacks.section_title': 'ATAQUES',
  'attacks.add_button': 'Adicionar',
  'attacks.empty_state_title': 'Nenhum ataque cadastrado.',
  'attacks.empty_state_hint': 'Adicione um ataque para registrar suas armas e magias ofensivas.',
  'attacks.count_label': '({count})',
  'attacks.row_aria': 'Ataque {name}, {bonus_or_dc}, {damage}',

  // SpellHeader cell labels
  'spells.header.class': 'CLASSE',
  'spells.header.ability': 'HABILIDADE',
  'spells.header.save_dc': 'DC DE SALVAGUARDA',
  'spells.header.attack_bonus': 'BÔNUS DE ATAQUE',

  // SpellSlots
  'spell_slots.section_title': 'ESPAÇOS DE MAGIA',
  'spell_slots.level_label': 'NÍVEL {level}',
  'spell_slots.count_label': '{current}/{max}',
  'spell_slots.pip_aria': 'Espaço de nível {level} ({current} de {max} disponíveis)',

  // SpellList
  'spells.section_title': 'MAGIAS',
  'spells.add_button': 'Adicionar',
  'spells.count_label': '({count})',
  'spells.cantrips_section': 'TRUQUES',
  'spells.level_section': 'NÍVEL {level}',
  'spells.section_count': '{count}',
  'spells.empty_state_title': 'Nenhuma magia cadastrada.',
  'spells.empty_state_hint': 'Adicione truques e magias para gerenciar espaços.',

  // SpellRow
  'spells.row.unprepared_aria': 'Não preparada',
  'spells.row.row_aria': 'Magia {name}',

  // SpellsTab non-caster
  'spells.non_caster_title': 'Esta classe não possui conjuração de magias.',
  'spells.non_caster_hint': 'Magias são acessadas por classes como Druid, Bard, Cleric, Wizard, Sorcerer e outras.',

  // Proficiencies
  'proficiencies.label': 'PROFICIÊNCIAS',
  'proficiencies.weapons_armor': 'ARMAS E ARMADURAS',
  'proficiencies.tools': 'FERRAMENTAS',
  'proficiencies.languages': 'IDIOMAS',
  'proficiencies.other': 'OUTRAS',

  // Aria labels (accessibility)
  'aria.portrait': 'Retrato de {name}',
  'aria.open_menu': 'Abrir menu',
  'aria.generate_ai': 'Gerar com IA',
  'aria.remove_spell': 'Remover magia {name}',
  'aria.remove_attack': 'Remover ataque {name}',
  'aria.spell_slot': 'Slot de nível {level} ({current} de {max} disponíveis)',

  // Phase C placeholder alerts
  'phase_c.editing_coming_soon': 'Edição virá na Fase C',
  'phase_c.details_coming_soon': 'Detalhes virão na Fase C',
  'phase_c.ai_unavailable': 'Gerar com IA — não implementado nesta fase.',
  'phase_c.export_unavailable': 'Exportar — não implementado nesta fase.',
  'phase_c.lock_unavailable': 'Destravar / Travar — não implementado nesta fase.',
};

export default pt;
