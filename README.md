# TBT-RPG — Ficha de Personagem de Dungeons & Dragons 5ª Edição

Uma ficha de personagem moderna, offline e com persistência automática para Dungeons & Dragons 5e.

## Demo

[https://ivanoliveiralima.github.io/TBT-RPG/](https://ivanoliveiralima.github.io/TBT-RPG/)

## Funcionalidades

Uma reescrita completa em React 19 + TypeScript + Vite, com
derived-model architecture e UX moderna. Totalmente independente do
banco v1 — cada personagem vive no seu próprio IndexedDB v2.

### Funcionalidades implementadas

**Criação e edição de personagens:**

- **Criar do zero** — personagem com defaults sensatos navegando direto pra
  Status
- **Criar com IA** — geração via Cloudflare Worker (Llama 3 8B): backstory,
  classe, nível, atributos, perícias. Modal com descrição + toggle PT/EN +
  estados de loading/erro traduzidos
- **Editar personagem existente** — todas as 6 abas totalmente editáveis
- **Excluir personagem** — kebab menu + modal de confirmação. Cascade local +
  Supabase row + Storage bucket cleanup
- **Importar/Exportar JSON** — backup e restore manual

**Status totalmente editável:**

- Identidade no HeroCard (nome, raça, antecedente, alinhamento, classes
  multiclass, inspiração, XP)
- Atributos com cascata derivada (modifier, save, skill, PP, initiative,
  AC, spell DC)
- Saves com toggles de proficiência
- Perícias com proficient + expertise
- HP com bar dual (current + temp overlay) e botões +/-
- Death saves, hit dice multiclass
- Características com editor completo (name, source, type, uses)
- Idiomas e proficiências como listas estruturadas

**Combate, Magias, Inventário, Lore:** todos editáveis com patterns
estabelecidos (expand/collapse cards, datalists canônicos, UUIDs estáveis,
ConfirmableRemoveButton).

**Outras funcionalidades:**

- Upload de retrato via modal com zoom + posição
- Interface bilíngue EN/PT com alternância instantânea (sem reload)
- Auth status badge no header (Conectado/Entrar)
- Auth Supabase (login/registro/logout)
- ~1200 testes unitários e de integração
- PWA instalável

### Limitações conhecidas

- **Sync bidirectional implementado (sub-fase 2.2).** Upload + download com
  LWW conflict resolution e propagação de tombstones entre devices. Sub-fase
  2.3 (polish + lock funcional) ainda pendente.
- **Localização de valores livres:** labels da UI traduzem entre PT e EN,
  mas valores livres armazenados no personagem (raça, classe, antecedente,
  alinhamento) permanecem como o usuário digitou — não são traduzidos.
- **Initiative sem override:** sempre derivada do modificador de DEX. Builds
  com feats como Alert exigirão um campo de bônus separado (não modelado ainda).
- **Spellcasting ability única por personagem:** multiclasse com abilities
  diferentes (ex: Druid + Wizard) requer anotação manual no campo description.
- **Items importados ganham category "misc":** itens migrados da v1 recebem
  category "misc" por padrão — o usuário reclassifica manualmente.
- **Encumbrance rules opcionais não implementadas:** apenas indicação visual
  pela barra de peso; penalidades de movimento não modeladas.
- **Lock é stub:** botão presente mas modo read-only real virá em sub-fase futura.
- **Worker AI não gera items nem spells** — campos ficam vazios para o user
  preencher manualmente.

### Roadmap

- **Sync sub-fase 2.3 — polish:** realtime updates, retry com backoff, UI de status
- **Lock funcional:** modo read-only vs editable pra evitar edição acidental
- **Auth status interativo:** click no badge abre menu (sair, conta)
- **Internacionalização de canonical names** (raça, classe, antecedente — hoje
  free-text não traduzido)
- **Ampliação do worker de IA** (items + spells na geração)

### Stack

Vite + React 19 + TypeScript + Tailwind + Zustand + Supabase + IndexedDB.

```
ivanoliveiralima.github.io/TBT-RPG/   → aplicação
```

Para desenvolver:
```bash
npm install && npm run dev
# Acesse http://localhost:5173
```

## Sobre

Este projeto tem como objetivo oferecer uma ficha de personagem:

- Simples de usar
- Totalmente funcional offline
- Com salvamento automático
- Com importação/exportação de dados
- Com suporte a imagens diretamente pelo navegador
- Suporte a múltiplos personagens com tela de seleção
- Interface bilíngue (EN/PT) com alternância rápida

A aplicação roda inteiramente no navegador e utiliza:

- React 19 + TypeScript + Vite como framework e bundler
- `IndexedDB` (via `idb`) para persistência local (sem limite prático de tamanho)
- PWA instalável (via `vite-plugin-pwa`) — funciona offline após primeira visita
- Cloudflare Workers AI (Llama 3 8B) como backend da geração por IA — grátis para o usuário, sem chave de API
- Supabase para sincronização em nuvem e autenticação (opcional)
- ESLint, Vitest e CI via GitHub Actions

## Funcionalidades Principais

- Autosave automático no navegador
- Importação e exportação de ficha em JSON
- Criação rápida de ficha em branco
- Upload de imagens com ajuste (zoom + posição)
- Suporte a multiclasse com nível por classe e nível total automático
- Layout responsivo
- Versionamento de schema (`schemaVersion`)
- Compatibilidade com fichas antigas
- Gerenciamento de múltiplos personagens (criar, abrir, duplicar, excluir)
- Export/import em lote de todos os personagens
- Geração automática de personagem com IA (descreva e a IA preenche a ficha)
- Sincronização automática em nuvem entre dispositivos (opcional, requer conta)
- Autenticação com email e senha
- Interface bilíngue com toggle EN/PT no menu lateral
- Geração com IA com escolha de idioma (inglês ou português)

## Como Usar

### 1. Iniciar o projeto

Clone o repositório:

```bash
git clone <repo>
cd <repo>
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse:

```
http://localhost:5173
```

### 2. Build para produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

Para visualizar o build localmente:

```bash
npm run preview
```

### 3. Instalar como app (PWA)

O app pode ser instalado diretamente no celular ou desktop:

- **Chrome/Android**: acesse o site e toque em "Adicionar à tela inicial"
- **Chrome/Desktop**: clique no ícone de instalar na barra de endereço

O app instalado funciona offline e se comporta como um aplicativo nativo.

### 4. Criar uma ficha

- Preencha os campos normalmente
- A ficha é salva automaticamente no navegador

### 5. Salvamento automático

- Qualquer alteração é salva automaticamente no `IndexedDB`
- Ao recarregar a página, a ficha é restaurada
- Se não houver dados salvos, uma ficha em branco será carregada

### 6. Nova ficha (limpar tudo)

- Menu -> `Options` -> `New Blank Sheet`
- Remove todos os dados atuais
- Inicia uma nova ficha vazia

### 7. Backup (Import/Export)

#### Exportar

- Menu -> `Options` -> `Export JSON`
- Baixa um arquivo `.json` com a ficha atual
- O nome do arquivo usa o nome do personagem

#### Importar

- Menu -> `Options` -> `Import JSON`
- Carrega um arquivo `.json`
- Valida o formato antes de aplicar
- Substitui os dados atuais
- Recarrega automaticamente a ficha

### 8. Múltiplos personagens

Ao abrir o app sem um personagem ativo, a tela "My Characters" é exibida.

- **Criar:** clique em "+ New Character"
- **Abrir:** clique em "Open" no card do personagem
- **Duplicar:** clique no ícone de duplicar no card
- **Excluir:** clique no "✕" vermelho no card
- **Voltar:** clique em "← My Characters" no menu lateral

#### Export em lote
- Na tela "My Characters", clique em **Export All**
- Baixa um único JSON com todos os personagens

#### Import em lote
- Na tela "My Characters", clique em **Import**
- Escolha um arquivo JSON exportado anteriormente
- Selecione **Replace** para substituir tudo ou **Merge** para mesclar com os existentes

### 9. Gerar personagem com IA

- Abra um personagem e clique em "✨ Generate with AI" no menu lateral
- Descreva seu personagem em até 1000 caracteres
- Clique em "Generate" e aguarde alguns segundos
- No modal, é possível escolher o idioma da geração (EN ou PT) antes de clicar em Generate — em PT, os campos de texto livre (personalidade, ideais, vínculos, defeitos, história) vêm em português
- A IA preenche automaticamente: nome, raça, background, alinhamento, classe, atributos, perícias, proficiências, traços de personalidade e história

A geração usa Cloudflare Workers AI (Llama 3) como backend — sem custo para o usuário, sem necessidade de conta ou chave de API.

### 10. Sincronização em nuvem (opcional)

A sincronização é completamente opcional — o app funciona 100% offline sem conta.

#### Criar conta
- No menu lateral, clique em **Sign in to sync**
- Clique em **Create account** e informe email e senha
- Confirme o email recebido na caixa de entrada

#### Fazer login
- No menu lateral, clique em **Sign in to sync**
- Informe email e senha e clique em **Sign in**
- Após o login, os personagens sincronizam automaticamente em background

#### Comportamento do sync
- Sincronização automática a cada 30 segundos quando logado
- Alterações na ficha sincronizam 15 segundos após a última edição
- Estratégia last-write-wins — o dado mais recente prevalece
- Exclusões só propagam para a nuvem quando o usuário está logado
- Ao fazer logout, dados locais permanecem intactos

#### Imagens
- Imagens dos personagens sincronizam via Supabase Storage
- Limite de 50MB por conta

### 11. Idiomas (EN/PT)

- No menu lateral, clique em **EN** ou **PT** para alternar o idioma da interface
- O toggle aplica um dicionário PT-BR via DOM walker — não é necessário recarregar a página
- A preferência é salva no navegador e restaurada em visitas futuras
- Textos gerados pela IA podem ser produzidos já em português escolhendo o idioma no modal de geração (seção 9)

### 12. Imagens (Character Appearance e Symbol)

- Vá até a aba `Backstory`
- Use os botões de upload
- Ajuste a imagem (zoom + posição)
- Clique em `Apply`

As imagens:

- São salvas no navegador
- Entram no JSON exportado
- São restauradas ao importar

Formatos suportados: `jpg`, `jpeg`, `png`, `webp`

Limite: `2MB` por imagem

### 13. Lock da ficha

- Menu -> `Options` -> `Lock`
- Desativa cálculos automáticos
- Permite edição totalmente manual

## Estrutura do Projeto

```
/
├── index.html
├── vite.config.js
├── eslint.config.js
├── CLAUDE.md
├── public/
│   ├── favicon.png
│   └── icons/
│       ├── icon.svg
│       ├── icon-192.png
│       └── icon-512.png
├── scripts/
│   └── generate-icons.js       # Gera PNGs a partir do SVG via sharp
├── css/
│   ├── w3.css
│   └── app.css
├── js/
│   ├── main.js
│   ├── app.js
│   ├── changes.js
│   ├── save.js
│   ├── load.js
│   ├── add-attack.js
│   ├── extra.js
│   └── modules/
│       ├── calculations.js
│       ├── storage.js
│       ├── utils.js
│       ├── character-select.js
│       ├── ai-generate.js
│       ├── ai-modal.js
│       ├── i18n.js              # Sistema de traduções via DOM walker
│       ├── supabase.js          # Cliente Supabase
│       ├── auth.js              # Autenticação
│       ├── auth-modal.js        # Modal de login/cadastro
│       └── sync.js              # Sincronização IndexedDB ↔ Supabase
├── worker/
│   ├── src/
│   │   └── index.js
│   └── wrangler.toml
└── tests/
    ├── calculations.test.js
    ├── storage.test.js
    └── utils.test.js
```

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Visualiza o build localmente |
| `npm run lint` | Executa o ESLint |
| `npm run test` | Executa os testes unitários |
| `npm run test:watch` | Executa os testes em modo watch |

## Qualidade de Código

O projeto conta com:

- **ESLint** — análise estática com regras para JavaScript moderno
- **Vitest** — testes unitários para funções de cálculo, armazenamento e utilitários
- **CI via GitHub Actions** — lint, testes e build validados automaticamente em todo Pull Request
- **Segurança no Worker** — rate limiting, proteção contra prompt injection e validação estrutural do JSON retornado pela IA, com mensagens de erro amigáveis ao usuário final

## Estrutura de Dados

As fichas utilizam o campo:

```json
"schemaVersion": 1
```

Isso permite compatibilidade com versões antigas e futuras migrações de estrutura.

`basic_info.classes` armazena a lista de classes com níveis individuais, e `basic_info.total_level` mantém o nível total calculado automaticamente.

## Observações Importantes

Alguns campos são intencionalmente manuais:

- Armor Class (AC)
- Initiative Bonus
- Proficiency Bonus
- Hit Points
- Max Health

Isso acontece porque dependem de regras específicas de classe, itens e builds.

## Créditos

Este projeto é um fork, significativamente expandido, de:

- https://github.com/lckynmbsrn/DnD-5e-Character-Sheet

## Contribuição

Pull requests são bem-vindos.

Se encontrar algum problema:

- Abra uma issue
- Descreva como reproduzir
