# Ficha de Personagem de Dungeons & Dragons 5ª Edição
### Uma ficha de personagem nova e moderna para Dungeons & Dragons 5ª edição.
#### Sobre:
A principal ideia por trás desta ficha é oferecer acesso fácil às informações comuns do personagem e o cálculo/preenchimento automático dos campos. Para ver uma demonstração, [clique aqui](https://lckynmbrsvn.github.io/DnD-5e-Character-Sheet/)

Atualmente, isto foi pensado para ser uma ficha offline para o jogo Dungeons and Dragons. Ela foi reescrita para ter um layout responsivo moderno usando o CSS leve do W3.

A única parte que depende de conexão online é o uso do FontAwesome, que é usado apenas no menu suspenso. Ela utiliza jQuery para carregar um personagem e preencher automaticamente a maior parte da ficha com base nos seus atributos.

Uma Ficha de Personagem padrão foi criada para mostrar como este formulário deve ser usado. Isso inclui um `saveSheet.json`.

#### Créditos:
Este projeto foi um fork de [aqui](https://github.com/Chee32/5e-Character-Sheet). O crédito vai para Chee32 pelo jQuery, que permanece em grande parte inalterado.

## Coisas para saber ao usar esta ficha.
### Como fazer:
#### Criar sua própria ficha de personagem:
1. Baixe ou clone o repositório.
2. Preencha todos os campos, começando por Bônus de Proficiência e Atributos.
3. A ficha é salva automaticamente no navegador enquanto você edita.

#### Salvar automaticamente e carregar a ficha:
1. Clique nas barras de “hambúrguer” para abrir o menu.
2. Ao alterar qualquer campo, a ficha é salva automaticamente no `localStorage` (chave `dnd_sheet_v1`).
3. Ao atualizar a página, os dados salvos são carregados automaticamente.
4. Se não houver nada salvo no navegador, a ficha padrão de `sheet/savedSheet.json` será usada como fallback.
5. O cabeçalho principal agora usa campos separados para `Class` e `Level`, e o campo `Deity` foi removido dessa área.
6. A seção `Class Resources, Ammo, & Charges` foi removida da página principal; dados antigos desse bloco são ignorados na interface.

#### Backup (Export/Import JSON):
1. Em `Options`, clique em `Export JSON` para baixar um backup da ficha atual.
2. Em `Options`, clique em `Import JSON` para carregar um backup local (`.json`).
3. O `Import JSON` valida o formato mínimo da ficha; arquivos inválidos são rejeitados sem sobrescrever o que já está salvo.
4. Após importar um arquivo válido, os dados são salvos no `localStorage` e a página é recarregada automaticamente.
5. `Clear Saved Sheet` remove a ficha salva localmente e recarrega a página usando o fallback padrão.
6. Fichas salvas/exportadas agora incluem `schemaVersion` para compatibilidade com futuras migrações de estrutura.

#### Alterar imagens do Personagem e da Aliança:
1. Vá para a seção `Backstory` e use os botões de upload em `Character Apperance` e `Symbol`.
2. Após selecionar a imagem, ajuste o enquadramento (arrastar + zoom) e confirme em `Apply`.
3. A pré-visualização é atualizada imediatamente no navegador.
4. As imagens enviadas ficam salvas no `localStorage` junto com a ficha e entram no `Export JSON` / `Import JSON`.
5. Use `Remove Image` para remover a imagem salva e voltar ao placeholder vazio.
6. Apenas `jpg`, `jpeg`, `png` e `webp` são aceitos (limite de 2MB por imagem).
7. Se nenhuma imagem personalizada estiver salva, a ficha mostra placeholders (`No character image` e `No symbol uploaded`).

#### Para “travar” a ficha:
O travamento impede que os scripts rodem na ficha, caso você queira calcular todas as informações manualmente.
Para ativar o travamento:
1. Clique nas barras de “hambúrguer” para abrir o menu.
2. No menu suspenso `Options`, clique em `Lock`.
    - Atualmente, isso precisa ser configurado toda vez que você carregar a ficha.

### Campos que não são preenchidos automaticamente.
Alguns campos não são preenchidos automaticamente com base nos atributos.
#### Alguns dos menos óbvios são:
- AC (CA): O motivo é que sua armadura e os recursos de classe determinam principalmente sua CA. Achei melhor deixar isso para você definir.
- Bônus de Iniciativa: Novamente, muitas coisas podem alterar isso além dos atributos.
- Bônus de Proficiência: Isso muda principalmente com o nível, então considerei simples definir manualmente.
- Dados de Vida Atuais: Novamente, isso é principalmente baseado no nível e não nos atributos.
- Vida Máxima: Isso é principalmente baseado em classe e nível. Também pode ser rolado, se você escolher, então não quis que isso mudasse caso alguém adicionasse mais dados de vida.

---

## Alterações e atualizações planejadas.
### Alterações:
##### Hotfix -v2.1.3
- Hotfix para navegação quebrada.
##### Melhorias no jQuery e mais -v2.1.2
- Atualização do jQuery para expandir e recolher painéis.
- Adicionado um botão de `Scroll To Top`.
##### Hotfixes -v2.1.1:
- Corrigido um problema em que os dados da ficha de personagem `.json` não carregavam.
- Caixas de entrada que são preenchidas ou ajustadas automaticamente agora são destacadas com uma cor diferente.
- O menu agora tem uma seção `Help` (para explicar, por exemplo, o destaque por cor).
##### Correções e formatação -v2.1:
- Corrigida a seção `Attack` que não era exibida.
- Arquivos HTML, CSS e JS formatados para facilitar leitura e manter espaçamento/tabulação consistentes.
- Ajustado o layout da página `Attributes`.
- Adicionada uma seção extra `Mount/Pet` para facilitar o gerenciamento de múltiplos pets/montarias.
- Corrigidos alguns erros de ortografia.
- Ajustado o design da página de Inventário e Montaria.
##### Commit inicial -v2.0:
- HTML e CSS retrabalhados para usar o layout responsivo do W3.
- A ficha agora deve ser utilizável em 95% dos casos em qualquer tamanho de tela.
- Layout dos campos reestruturado para, com sorte, facilitar o acesso aos atributos e informações mais usados.
- 90% do CSS foi reescrito para uma proposta de design mais moderna.
- Menu refeito para ser mais fácil de usar e servir como navegação.
- Elementos principais foram divididos em “páginas” separadas em vez de tudo ficar em uma única página longa.
- jQuery existente atualizado para funcionar com as mudanças.
- JS adicional adicionado para incluir recursos:
    - Novo design de menu.
    - Cartões de seção podem ser recolhidos.
    - Alternância entre “páginas” (exibindo/ocultando `<div>`s).
- Adicionada uma seção extra `Class/Level` para facilitar multiclasse.
- Informações básicas do personagem permanecem no topo da página como cabeçalho.
- Adicionada uma página `Notes` para anotações gerais.

### Atualizações futuras e objetivos:
- Limpeza de código: grande parte do HTML e CSS precisa ser limpa para remover referências depreciadas, ganhar consistência e ficar mais legível.
- Ajustes finos e melhorias de UI.
- Melhor documentação daqui para frente.
- Adicionar Ajuda e documentação como item de menu e/ou página.
- Adicionar funcionalidades extras:
    - Calcular automaticamente mais campos.
    - Melhor manipulação e seleção de imagens.
    - Permitir que o usuário selecione uma ficha salva para carregar.
    - Tornar utilizável online.
    - Tooltips ao passar o mouse sobre os campos.

---

## Relato de problemas e Pull Requests.
### Issues:
Se você encontrar algum problema, sinta-se à vontade para reportar e tentarei corrigir. Inclua o máximo de detalhes possível sobre como reproduzir o problema, obrigado!

### Pull Requests e forks:
Sinta-se à vontade para contribuir ou fazer fork deste projeto. Só peço que dê crédito ao autor original e a mim. Obrigado!
