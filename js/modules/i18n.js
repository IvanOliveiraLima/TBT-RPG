const STORAGE_KEY = 'dnd_language'
let currentLang = localStorage.getItem(STORAGE_KEY) || 'en'

const translations = {
  pt: {
    // Sidebar
    'Close ×': 'Fechar ×',
    '← My Characters': '← Meus Personagens',
    'Attributes': 'Atributos',
    'Backstory': 'História',
    'Spell Sheet': 'Magias',
    'Notes': 'Notas',
    '✨ Generate with AI': '✨ Gerar com IA',
    'Sign in to sync': 'Entrar para sincronizar',
    'Sign out': 'Sair',
    'Options': 'Opções',
    'Export JSON': 'Exportar JSON',
    'Import JSON': 'Importar JSON',
    'New Blank Sheet': 'Nova Ficha em Branco',
    'Lock/Unlock Sheet': 'Travar/Destravar Ficha',
    'Unlocked': 'Desbloqueado',
    'Locked': 'Bloqueado',
    // Character select
    'My Characters': 'Meus Personagens',
    'Export All': 'Exportar Tudo',
    'Import': 'Importar',
    'Open': 'Abrir',
    '+ New Character': '+ Novo Personagem',
    'No characters yet. Create one to get started!': 'Nenhum personagem ainda. Crie um para começar!',
    'Last edited': 'Editado em',
    // Basic info
    'Character Name': 'Nome do Personagem',
    'Class': 'Classe',
    'Level': 'Nível',
    'Total Level': 'Nível Total',
    '+ Add Class': '+ Adicionar Classe',
    'Race': 'Raça',
    'Background': 'Antecedente',
    'Player Name': 'Nome do Jogador',
    'Experience': 'Experiência',
    'Alignment': 'Alinhamento',
    // Status
    'Status': 'Status',
    'Temporary Health': 'Vida Temporária',
    'Current Health': 'Vida Atual',
    'Maximum Health': 'Vida Máxima',
    'Hit Dice': 'Dado de Vida',
    'Current': 'Atual',
    'Death Saves': 'Testes de Morte',
    'Success': 'Sucesso',
    'Failure': 'Falha',
    'Conditions': 'Condições',
    'Boons': 'Bênçãos',
    // Top bar
    'Proficiency Bonus': 'Bônus de Proficiência',
    'Initiative Bonus': 'Bônus de Iniciativa',
    'Passive Perception': 'Percepção Passiva',
    'Armor Class': 'Classe de Armadura',
    'Speed': 'Deslocamento',
    'Spell Save DC': 'CD de Magia',
    'Insperation': 'Inspiração',
    // Ability scores (appear in labels, saves, skills, selects)
    'Strength': 'Força',
    'Dexterity': 'Destreza',
    'Constitution': 'Constituição',
    'Intelligence': 'Inteligência',
    'Wisdom': 'Sabedoria',
    'Charisma': 'Carisma',
    // Saving throws & skills
    'Saving Throws & Skills': 'Testes de Resistência & Perícias',
    'Saving Throws': 'Testes de Resistência',
    'Athletics': 'Atletismo',
    'Acrobtics': 'Acrobacia',
    'Sleight of Hand': 'Prestidigitação',
    'Stealth': 'Furtividade',
    'Arcana': 'Arcanismo',
    'History': 'História',
    'Investigation': 'Investigação',
    'Religion': 'Religião',
    'Animal Handling': 'Adestrar Animais',
    'Insight': 'Intuição',
    'Medicine': 'Medicina',
    'Nature': 'Natureza',
    'Perception': 'Percepção',
    'Survival': 'Sobrevivência',
    'Deception': 'Enganação',
    'Intimidation': 'Intimidação',
    'Performance': 'Atuação',
    'Persuasion': 'Persuasão',
    // Spell casting select options
    'No Spell Casting': 'Sem Conjuração',
    // Proficiencies
    'Proficiencies': 'Proficiências',
    'Weapons & Armor': 'Armas & Armaduras',
    'Tools': 'Ferramentas',
    'Known Languages': 'Idiomas Conhecidos',
    // Features
    'Features & Traits': 'Habilidades & Traços',
    'Features and Traits': 'Habilidades e Traços',
    // Attacks
    'Attacks': 'Ataques',
    'Attacks and Spells': 'Ataques e Magias',
    'Add a new attack:': 'Adicionar novo ataque:',
    'Name of the attack': 'Nome do ataque',
    'Choose the base Stat': 'Escolha o atributo base',
    'Choose the type of attack': 'Escolha o tipo de ataque',
    'Roll to hit': 'Rolagem de ataque',
    'Save DC': 'CD de resistência',
    'Add Proficency': 'Adicionar proficiência',
    'Use Spell DC?': 'Usar CD de magia?',
    'Set DC': 'Definir CD',
    'Enter Dice': 'Inserir dados',
    'Bonus': 'Bônus',
    'Damage Type': 'Tipo de Dano',
    'Add Attack': 'Adicionar Ataque',
    // Attack table headers
    'Name': 'Nome',
    'Base Stat': 'Atributo',
    'Bonus/DC': 'Bônus/CD',
    'Damage': 'Dano',
    // Inventory
    'Inventory': 'Inventário',
    'Currency': 'Moedas',
    'Copper': 'Cobre',
    'Silver': 'Prata',
    'Gold': 'Ouro',
    'Electrum': 'Eletro',
    'Platinum': 'Platina',
    'Total': 'Total',
    'Equipment': 'Equipamento',
    'Weight': 'Peso',
    'Total Weight': 'Peso Total',
    'Encumberance': 'Encumbramento',
    'Base (STR X 5)': 'Base (FOR × 5)',
    'Encumbered (STR X 10)': 'Encumbrado (FOR × 10)',
    'H. Encumbered (STR X 15)': 'H. Encumbrado (FOR × 15)',
    'Push (STR X 30)': 'Empurrar (FOR × 30)',
    // Mount/Pet
    'Mount/Pet': 'Montaria/Animal',
    'Type': 'Tipo',
    'Health': 'Vida',
    'AC': 'CA',
    'Mount/Pet Attacks and Notes': 'Ataques e Notas de Montaria/Animal',
    // Spell info
    'Spell Info': 'Informações de Magia',
    'Spellcasting Class': 'Classe de Conjuração',
    'Spell Casting Attribute': 'Atributo de Conjuração',
    'Spell Attack Bonus': 'Bônus de Ataque de Magia',
    'Spells': 'Magias',
    'Cantrips': 'Truques',
    'Slots Total': 'Espaços Totais',
    'Slots Remaining': 'Espaços Restantes',
    'Prepared': 'Preparada',
    // Personality & backstory
    'Personality': 'Personalidade',
    'Personality Traits': 'Traços de Personalidade',
    'Ideals': 'Ideais',
    'Bonds': 'Vínculos',
    'Flaws': 'Defeitos',
    'Character Backstory': 'História do Personagem',
    'Character Apperance': 'Aparência do Personagem',
    'Upload Image': 'Enviar Imagem',
    'Remove Image': 'Remover Imagem',
    'Organization or Guild': 'Organização ou Guilda',
    'Symbol': 'Símbolo',
    'Allies and Organizations': 'Aliados e Organizações',
    // Image adjust modal
    'Adjust Image Framing': 'Ajustar Enquadramento',
    'Zoom': 'Zoom',
    'Cancel': 'Cancelar',
    'Apply': 'Aplicar',
    // AI modal
    '✨ Generate Character with AI': '✨ Gerar Personagem com IA',
    'Describe your character': 'Descreva seu personagem',
    'Describe your character concept. Include class, race, personality and backstory ideas. Max 1000 characters.': 'Descreva o conceito do seu personagem. Inclua classe, raça, personalidade e ideias de história. Máx. 1000 caracteres.',
    'Generating your character...': 'Gerando seu personagem...',
    '✨ Generate': '✨ Gerar',
    // Auth modal
    'Sign in': 'Entrar',
    'Create account': 'Criar conta',
    'Email': 'E-mail',
    'Password': 'Senha',
    'Continue with Google': 'Continuar com Google',
    'Forgot password?': 'Esqueceu a senha?',
    'Already have an account? Sign in': 'Já tem uma conta? Entre',
    'Close': 'Fechar',
    // Sync status
    'Synced': 'Sincronizado',
    'Syncing...': 'Sincronizando...',
    'Sync failed — retrying': 'Falha na sync — tentando novamente',
    // JS feedback — ai-modal.js
    'Character generated! Review and save.': 'Personagem gerado! Revise e salve.',
    'Please write at least a short description.': 'Escreva ao menos uma breve descrição.',
    'Generation failed. Please try again.': 'Falha na geração. Tente novamente.',
    // JS feedback — auth-modal.js
    'Signed in — syncing...': 'Conectado — sincronizando...',
    'Signed out': 'Desconectado',
    'Please fill in all fields.': 'Preencha todos os campos.',
    'Sign in failed. Please try again.': 'Falha no login. Tente novamente.',
    'Password must be at least 6 characters.': 'A senha deve ter pelo menos 6 caracteres.',
    'Account created! Check your email to confirm.': 'Conta criada! Verifique seu e-mail para confirmar.',
    'Sign up failed. Please try again.': 'Falha no cadastro. Tente novamente.',
    'Google sign in failed.': 'Falha no login com Google.',
    'Enter your email first.': 'Insira seu e-mail primeiro.',
    'Password reset email sent!': 'E-mail de redefinição enviado!',
    'Failed to send reset email.': 'Falha ao enviar e-mail de redefinição.',
  }
}

function walkAndReplace(root, dict) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName
        if (['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT'].includes(tag))
          return NodeFilter.FILTER_REJECT
        // Skip spell level headers (1st Level, 2nd Level, etc.) to avoid
        // partial replacement of " Level" text nodes
        if (parent.classList && parent.classList.contains('level'))
          return NodeFilter.FILTER_REJECT
        if (parent.id?.startsWith('lang-btn'))
          return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    const trimmed = node.textContent.trim()
    if (trimmed && dict[trimmed]) {
      node.textContent = node.textContent.replace(trimmed, dict[trimmed])
    }
  }
}

function walkAndReplacePlaceholders(root, dict) {
  root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    if (dict[el.placeholder]) el.placeholder = dict[el.placeholder]
  })
}

export function applyTranslations() {
  const dict = currentLang === 'en' ? {} : (translations[currentLang] || {})
  walkAndReplace(document.body, dict)
  walkAndReplacePlaceholders(document.body, dict)
}

export function updateLangButtons() {
  const current = getLang()
  const btnEn = document.getElementById('lang-btn-en')
  const btnPt = document.getElementById('lang-btn-pt')
  if (!btnEn || !btnPt) return
  btnEn.classList.toggle('lang-btn-active', current === 'en')
  btnPt.classList.toggle('lang-btn-active', current === 'pt')
}

export function setLang(lang) {
  currentLang = lang
  localStorage.setItem(STORAGE_KEY, lang)
  location.reload()
}

export function getLang() {
  return currentLang
}
