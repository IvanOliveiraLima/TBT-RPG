# TBT-RPG — Ficha de Personagem de Dungeons & Dragons 5ª Edição

Uma ficha de personagem moderna, offline e com persistência automática para Dungeons & Dragons 5e.

## Demo

[https://ivanoliveiralima.github.io/TBT-RPG/](https://ivanoliveiralima.github.io/TBT-RPG/)

## Sobre

TBT-RPG é uma mesa virtual para fichas de D&D 5e. Aplicação web client-side
com sincronização opcional na nuvem, offline-first, bilíngue (PT/EN),
PWA instalável.

### Funcionalidades

**Criação e edição de personagens:**

- **Criar do zero** — char com defaults sensatos, edição completa em todas as abas
- **Criar com IA** — geração via Cloudflare Worker (Llama 3 8B) com backstory,
  classe, nível, atributos. Modal com toggle de idioma e estados de erro traduzidos
- **Edição completa** — Status, Combate, Magias, Inventário, Lore, todas com
  expand/collapse, datalists canônicos, UUIDs estáveis
- **Excluir character** — kebab menu + modal de confirmação. Cascade local +
  Supabase + Storage cleanup

**Lock (modo leitura):**

- Botão "Bloquear" no header (desktop) ou drawer (mobile)
- Stats permanentes ficam read-only: atributos, classe, features, ataques, spells, itens, história, portrait
- Stats transientes continuam editáveis: HP, slots de magia (uso), equipped, currency, "preparada", XP
- Persiste por personagem via IndexedDB
- "Destravar" restaura edição completa

**Campanhas (multi-user):**

- **Criar campanha** — Mestre cria uma campanha pra organizar jogadores e seus personagens
- **Convite por código** — Cada campanha tem um código único formato `XXXX-XXXX`; mestre compartilha com jogadores
- **Link de convite** — Mestre também pode copiar um link direto que abre a tela de entrada já preenchida
- **Entrar em campanha** — Jogador entra com o código (ou link), passa a ser visível na lista de membros
- **Vincular personagens** — Jogador escolhe quais de seus personagens fazem parte da campanha
- **Visualização ao vivo (modo mestre)** — Mestre acessa a ficha completa de cada personagem vinculado em modo somente-leitura; mudanças do jogador refletem no mestre a cada ~15s
- **Sair de campanha** — Jogador pode sair a qualquer momento (vinculações de chars são removidas)
- **Excluir campanha** — Apenas o mestre; cascade remove todos os membros e vinculações
- **Mestre remove jogador** — Mestre pode remover qualquer jogador da campanha
- **Nome de exibição editável** — Cada user define um nome visível pros membros das suas campanhas
- **Mapas de campanha** — Mestre sobe mapas (imagem) e adiciona marcadores com rótulo; membros visualizam com pan/zoom (react-leaflet)

**Sincronização (opcional):**

- **Login com email/senha** via Supabase Auth — criar conta integrada no fluxo de login
- **Recuperação de senha** — fluxo "Esqueci minha senha" com email de redefinição e tela dedicada de nova senha
- **Confirmação de email** — o link de confirmação aterrissa no app sem erro (SPA fallback no GitHub Pages)
- **Upload reactive** — edições sobem pra cloud 15s após (debounced)
- **Upload periodic** — background a cada 30s pra garantir consistência
- **Download** — chars da cloud baixam pro IndexedDB local no login + periodic
- **Conflict resolution** — Last-write-wins por `updatedAt`
- **Imagens** — upload/download eager via Supabase Storage (base64 ↔ blob)
- **Tombstones** — deleções propagam entre devices (com limitação conhecida)
- **Auth status badge** — indicador visual de Conectado/Entrar + status de sync
- **Excluir conta** — remoção permanente da conta, personagens e campanhas criadas, com confirmação por e-mail
- **Mostrar/ocultar senha** no login e submissão com a tecla Enter

**Outras funcionalidades:**

- Image upload (character portrait via canvas-based modal)
- Bilíngue PT/EN com toggle persistente
- PWA instalável

### Roadmap

- **Import/Export JSON** — exportar e importar fichas individuais em JSON
- **Polish sync** — persistent error state, manual refresh button, edge cases
- **Auth status interativo** — click no badge abre menu (sair, conta, etc.)
- **Worker AI expansion** — incluir items e magias na geração de personagem
- **Transfer ownership de campanha** — Mestre passa a campanha pra outro membro
- **Realtime via Supabase Channels** — Substituir polling por subscribe em mudanças
- **QR code do convite** — Geração visual de QR code com o link de convite

### Limitações conhecidas

- **Delete multi-device pode falhar em propagar.** Char deletado em Device A
  pode voltar em Device B após sync. Workaround: deletar manualmente em cada
  device. Investigação futura quando virar prioridade.
- **Worker AI não gera items nem spells** — campos ficam vazios.
- **Items importados ganham category "misc"** — user reclassifica manualmente.
- **Race, classe, antecedente, alinhamento são free-text** com sugestões — não
  traduzidos automaticamente entre PT/EN.
- **Initiative deriva sempre de DEX** sem campo de override.
- **Spellcasting ability única por character** — multiclass spellcasters com
  abilities diferentes anotam no description.
- **Polling de campanha a 15s** — Mestre vê edições do jogador com até 15s de atraso.
- **Mestre não pode transferir ownership** — Apenas excluir a campanha.
- **Sem QR code do convite** — Apenas código texto + link copiável.

### Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Zustand (state management)
- IndexedDB via idb (storage local)
- Supabase (auth + PostgreSQL + Storage)
- Cloudflare Workers (AI generation)
- ESLint + Vitest

```
ivanoliveiralima.github.io/TBT-RPG/   → aplicação
```

Para desenvolver:
```bash
npm install && npm run dev
# Acesse http://localhost:5173
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Sem essas variáveis, a app funciona offline (sem sync, sem campanhas). Com elas, sync e
campanhas ficam disponíveis após criar conta.

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

### 4. Criar um personagem

Na tela inicial ("Meus Personagens"), escolha:

- **Criar do zero** — abre uma ficha em branco pronta para edição
- **Criar com IA** — descreva seu personagem e a IA preenche automaticamente
  nome, raça, classe, atributos, perícias e história (ver seção 7)

A ficha abre automaticamente na aba Status após a criação.

### 5. Editar e salvar

- Clique em qualquer card na tela "Meus Personagens" para abrir a ficha
- Navegue entre as abas: Status, Combate, Magias, Inventário, Lore
- As alterações são salvas automaticamente no `IndexedDB`
- Ao recarregar a página, a ficha é restaurada

### 6. Múltiplos personagens

A tela inicial lista todos os personagens salvos.

- **Criar:** clique em "Criar do zero" ou "Criar com IA"
- **Abrir:** clique no card do personagem
- **Excluir:** clique no kebab (⋮) no canto do card → "Excluir" → confirme no modal
- **Voltar à lista:** botão "← Meus Personagens" no menu lateral (desktop)
  ou drawer hambúrguer (mobile)

### 7. Gerar personagem com IA

- Na tela "Meus Personagens", clique em **Criar com IA**
- Descreva seu personagem em até 1000 caracteres
- Escolha o idioma da geração (PT ou EN) antes de gerar — em PT, os campos de
  texto livre (personalidade, ideais, vínculos, defeitos, história) vêm em português
- Clique em **Gerar** e aguarde alguns segundos

A IA preenche automaticamente: nome, raça, background, alinhamento, classe, atributos,
perícias, proficiências, traços de personalidade e história. Items e magias ficam
vazios para preenchimento manual.

A geração usa Cloudflare Workers AI (Llama 3) como backend — sem custo para o
usuário, sem necessidade de conta ou chave de API.

### 8. Campanhas

#### Como mestre

1. Logar na conta
2. No menu lateral ou na tela inicial → "Minhas Campanhas"
3. Clicar **+ Criar Campanha** → preencher nome e descrição
4. Na tela da campanha, copiar o **link** ou **código de convite** e compartilhar com jogadores
5. Conforme jogadores entram, eles aparecem na lista de membros
6. Conforme jogadores vinculam personagens, aparecem na seção "Personagens vinculados"
7. Clicar em um personagem vinculado para abrir a ficha em modo somente-leitura
8. A ficha atualiza automaticamente a cada ~15s com mudanças do jogador

#### Como jogador

1. Receber o link ou código de convite do mestre
2. Logar na conta (criar uma se necessário, no fluxo de signup)
3. Clicar no link **OU** ir em "Minhas Campanhas" e clicar em **Entrar com código**
4. Inserir o código → ver preview da campanha → clicar em **Entrar**
5. Na tela da campanha, clicar em **+ Vincular personagem** → escolher um dos seus personagens
6. O mestre passa a ver a sua ficha em tempo real

#### Editar nome de exibição

1. Na tela de uma campanha, clicar no kebab (⋮) ao lado do seu próprio nome na lista de membros
2. Escolher "Editar nome"
3. Digitar novo nome → salvar
4. O novo nome aparece pros outros membros após próximo refresh deles

#### Sair de campanha

1. Na lista de campanhas (ou na própria campanha) → kebab → "Sair da campanha"
2. Confirmar → suas vinculações de personagens são removidas

### 9. Sincronização em nuvem (opcional)

A sincronização é completamente opcional — o app funciona 100% offline sem conta.

#### Criar conta / Fazer login

- Na tela "Meus Personagens", role até o rodapé e clique em **Criar conta** ou **Entrar**
- Informe email e senha
- Para novas contas, confirme o email recebido na caixa de entrada
- Esqueceu a senha? Toque em "Esqueci minha senha" na tela de login — você recebe um link por email para definir uma nova

#### Comportamento do sync

- Sincronização automática a cada 30 segundos quando logado
- Alterações na ficha sincronizam 15 segundos após a última edição
- Estratégia last-write-wins — o dado mais recente prevalece
- Exclusões só propagam para a nuvem quando o usuário está logado
- Ao fazer logout, dados locais permanecem intactos

#### Imagens

- Imagens dos personagens sincronizam via Supabase Storage
- Limite de 50MB por conta

### 10. Idiomas (EN/PT)

- **Desktop:** clique em **PT** ou **EN** na parte inferior da barra lateral (visível
  ao abrir qualquer ficha)
- **Mobile:** abra o menu hambúrguer (☰) → clique em **PT** ou **EN** no rodapé do drawer
- A preferência é salva no navegador e restaurada em visitas futuras
- Textos gerados pela IA podem ser produzidos em português escolhendo PT no modal
  de geração (seção 7)

### 11. Imagem do personagem

- Abra a aba **Lore** de qualquer personagem
- Clique no retrato grande (avatar) no topo da aba
- O modal de imagem abre: carregue um arquivo, ajuste zoom e posição, clique em **Aplicar**

Formatos suportados: `jpg`, `jpeg`, `png`, `webp`

Limite: `2MB` por imagem

### 12. Lock da ficha (modo leitura)

Use o lock durante sessões de jogo para evitar edição acidental em stats permanentes.

**Desktop:** clique em **Bloquear** no header superior direito

**Mobile:** abra o menu hambúrguer (☰) → clique em **Bloquear**

Quando bloqueada:

- Stats permanentes ficam read-only: atributos, classes, habilidades, features,
  proficiências, ataques, spells (exceto "preparada"), itens (exceto quantidade e
  equipped), lore, portrait
- Stats transientes continuam editáveis: HP atual/temp, inspiração, dados de vida
  (current), slots de magia (uso), "preparada", equipped, quantidade de items,
  currency (PP/GP/SP/CP), XP

Clique em **Destravar** para voltar ao modo de edição completa. O lock persiste por
personagem — cada ficha tem seu estado independente.

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

- **ESLint** — análise estática com regras para TypeScript moderno
- **Vitest** — ~1661 testes unitários e de integração (83 arquivos)
- **CI via GitHub Actions** — lint, testes e build validados automaticamente em todo Pull Request
- **Segurança no Worker** — rate limiting, proteção contra prompt injection e validação estrutural do JSON retornado pela IA, com mensagens de erro amigáveis ao usuário final

## Contribuição

Pull requests são bem-vindos.

Se encontrar algum problema:

- Abra uma issue
- Descreva como reproduzir
