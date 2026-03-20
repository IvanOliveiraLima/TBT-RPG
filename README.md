# Ficha de Personagem de Dungeons & Dragons 5ª Edição

Uma ficha de personagem moderna, offline e com persistência automática para Dungeons & Dragons 5e.

## Sobre

Este projeto tem como objetivo oferecer uma ficha de personagem:

- Simples de usar
- Totalmente funcional offline
- Com salvamento automático
- Com importação/exportação de dados
- Com suporte a imagens diretamente pelo navegador

A aplicação roda inteiramente no navegador e utiliza:

- HTML, CSS (W3.css) e JavaScript
- jQuery para manipulação da ficha
- `localStorage` para persistência de dados

## Funcionalidades Principais

- Autosave automático no navegador
- Importação e exportação de ficha em JSON
- Criação rápida de ficha em branco
- Upload de imagens com ajuste (zoom + posição)
- Suporte a multiclasse com nível por classe e nível total automático
- Layout responsivo
- Versionamento de schema (`schemaVersion`)
- Compatibilidade com fichas antigas

## Como Usar

### 1. Iniciar o projeto

Clone o repositório ou baixe os arquivos:

```bash
git clone <repo>
```

Abra o arquivo `index.html` no navegador
ou rode um servidor local (recomendado):

```bash
python3 -m http.server 8000
```

Acesse:

```text
http://localhost:8000
```

### 2. Criar uma ficha

- Preencha os campos normalmente
- A ficha é salva automaticamente no navegador

### 3. Salvamento automático

- Qualquer alteração é salva automaticamente no `localStorage`
- Ao recarregar a página, a ficha é restaurada
- Se não houver dados salvos, uma ficha em branco será carregada

### 4. Nova ficha (limpar tudo)

- Menu -> `Options` -> `New Blank Sheet`
- Remove todos os dados atuais
- Inicia uma nova ficha vazia

### 5. Backup (Import/Export)

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

### 6. Imagens (Character Appearance e Symbol)

- Vá até a aba `Backstory`
- Use os botões de upload
- Ajuste a imagem (zoom + posição)
- Clique em `Apply`

As imagens:

- São salvas no navegador
- Entram no JSON exportado
- São restauradas ao importar

Formatos suportados:

- `jpg`, `jpeg`, `png`, `webp`

Limite:

- `2MB` por imagem

### 7. Lock da ficha

- Menu -> `Options` -> `Lock`
- Desativa cálculos automáticos
- Permite edição totalmente manual

## Estrutura de Dados

As fichas utilizam o campo:

```json
"schemaVersion": 1
```

Isso permite:

- Compatibilidade com versões antigas
- Futuras migrações de estrutura

`basic_info.classes` armazena a lista de classes com níveis individuais, e `basic_info.total_level` mantém o nível total calculado automaticamente.

## Observações Importantes

Alguns campos são intencionalmente manuais:

- Armor Class (AC)
- Initiative Bonus
- Proficiency Bonus
- Hit Points
- Max Health

Isso acontece porque dependem de regras específicas (classe, itens, etc.).

## Créditos

Este projeto é um fork de:

- https://github.com/lckynmbsrn/DnD-5e-Character-Sheet

Créditos ao autor original e ao trabalho com jQuery que serviu de base.

## Contribuição

Pull requests são bem-vindos.

Se encontrar algum problema:

- Abra uma issue
- Descreva como reproduzir
