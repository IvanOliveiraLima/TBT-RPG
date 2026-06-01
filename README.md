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

**Sincronização (opcional):**

- **Login com email/senha** via Supabase Auth
- **Upload reactive** — edições sobem pra cloud 15s após (debounced)
- **Upload periodic** — background a cada 30s pra garantir consistência
- **Download** — chars da cloud baixam pro IndexedDB local no login + periodic
- **Conflict resolution** — Last-write-wins por `updatedAt`
- **Imagens** — upload/download eager via Supabase Storage (base64 ↔ blob)
- **Tombstones** — deleções propagam entre devices (com limitação conhecida)
- **Auth status badge** — indicador visual de Conectado/Entrar + status de sync

**Outras funcionalidades:**

- Image upload (character portrait via canvas-based modal)
- Bilíngue PT/EN com toggle persistente
- PWA instalável
- Importar/Exportar JSON

### Roadmap

- **Lock funcional** — modo read-only vs editable pra evitar edição acidental em jogo
- **Polish sync** — persistent error state, manual refresh button, edge cases
- **Auth status interativo** — click no badge abre menu (sair, conta)
- **Worker AI expansion** — incluir items + spells na geração

### Limitações conhecidas

- **Delete multi-device pode falhar em propagar.** Char deletado em Device A
  pode voltar em Device B após sync. Workaround: deletar manualmente em cada
  device. Investigação futura quando virar prioridade.
- **Bloquear é stub.** Botão presente, funcionalidade real (read-only mode) pendente.
- **Worker AI não gera items nem spells** — campos ficam vazios.
- **Items importados ganham category "misc"** — user reclassifica manualmente.
- **Race, classe, antecedente, alinhamento são free-text** com sugestões — não
  traduzidos automaticamente entre PT/EN.
- **Initiative deriva sempre de DEX** sem campo de override.
- **Spellcasting ability única por character** — multiclass spellcasters com
  abilities diferentes anotam no description.

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
- O toggle aplica um dicionário PT-BR — não é necessário recarregar a página
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
- **Funcionalidade em desenvolvimento.** O botão está presente; o modo read-only real será implementado em versão futura.

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
- **Vitest** — ~1200 testes unitários e de integração
- **CI via GitHub Actions** — lint, testes e build validados automaticamente em todo Pull Request
- **Segurança no Worker** — rate limiting, proteção contra prompt injection e validação estrutural do JSON retornado pela IA, com mensagens de erro amigáveis ao usuário final

## Contribuição

Pull requests são bem-vindos.

Se encontrar algum problema:

- Abra uma issue
- Descreva como reproduzir
