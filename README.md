# Ficha de Personagem de Dungeons & Dragons 5ª Edição

Uma ficha de personagem moderna, offline e com persistência automática para Dungeons & Dragons 5e.

## Demo

[https://ivanoliveiralima.github.io/DnD-5e-Character-Sheet/](https://ivanoliveiralima.github.io/DnD-5e-Character-Sheet/)

## Sobre

Este projeto tem como objetivo oferecer uma ficha de personagem:

- Simples de usar
- Totalmente funcional offline
- Com salvamento automático
- Com importação/exportação de dados
- Com suporte a imagens diretamente pelo navegador
- Suporte a múltiplos personagens com tela de seleção

A aplicação roda inteiramente no navegador e utiliza:

- HTML, CSS (W3.css) e JavaScript vanilla (sem frameworks)
- Vite como bundler e ferramenta de build
- `IndexedDB` para persistência de dados (sem limite prático de tamanho)

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

### 8. Gerar personagem com IA

- Abra um personagem e clique em "✨ Generate with AI" no menu lateral
- Descreva seu personagem em até 1000 caracteres
- Clique em "Generate" e aguarde alguns segundos
- A IA preenche automaticamente: nome, raça, background, alinhamento, classe, atributos, perícias, proficiências, traços de personalidade e história

A geração usa Cloudflare Workers AI (Llama 3) como backend — sem custo para o usuário, sem necessidade de conta ou chave de API.

### 9. Imagens (Character Appearance e Symbol)

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

### 9. Lock da ficha

- Menu -> `Options` -> `Lock`
- Desativa cálculos automáticos
- Permite edição totalmente manual

## Estrutura do Projeto

```
/
├── index.html
├── vite.config.js
├── eslint.config.js
├── css/
│   ├── w3.css
│   └── app.css
├── js/
│   ├── main.js           # Entry point
│   ├── app.js            # Navegação entre páginas
│   ├── changes.js        # Event handlers e cálculos
│   ├── save.js           # Serialização da ficha
│   ├── load.js           # Carregamento e população da UI
│   ├── add-attack.js     # Gerenciamento de ataques e magias
│   ├── extra.js          # Utilitários
│   └── modules/
│       ├── calculations.js   # Funções de cálculo puras (D&D)
│       ├── storage.js        # Wrapper do localStorage
│       └── utils.js          # Funções utilitárias puras
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

Este projeto é um fork de:

- https://github.com/lckynmbsrn/DnD-5e-Character-Sheet

## Contribuição

Pull requests são bem-vindos.

Se encontrar algum problema:

- Abra uma issue
- Descreva como reproduzir
