# Audit C.4 — i18n na v2

## 1. Volume de strings hardcoded

| Categoria | Qtd | Exemplos |
|-----------|-----|----------|
| Labels de seção | 11 | "Atributos", "Combate", "Magias", "Inventário", "História", "PROFICIÊNCIAS", "MOEDAS", "ESPAÇOS DE MAGIA", "Hit Points", "Skills", "Saving Throws" |
| Labels de campo | 23 | "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma", "STR", "DEX", "CON", "INT", "WIS", "CHA", "AC", "INIT", "SPD", "PP", "DC", "PROF", "Traços", "Ideais", "Vínculos", "Defeitos", "Personalidade" |
| Botões e ações | 11 | "Entrar", "Criar conta", "Sair", "Voltar", "+ Heal", "− Damage", "+ Adicionar" (spells), "+ Adicionar" (inventory), "＋", "Entrando…", "⬇ Importar JSON", "⬆ Exportar" |
| Mensagens de estado | 7 | "Carregando…", "Carregando personagens…", "Sincronizado", "Entrar para sincronizar", "Gerar com IA", "Nv" (nível abbreviation), "ft" (feet) |
| Empty states | 6 | "Nenhuma magia cadastrada.", "Nenhum item registrado.", "Nenhuma nota registrada.", "Nenhuma história registrada ainda.", "Nenhum ataque cadastrado.", "Nenhuma feature registrada." |
| Alert placeholders (Phase C) | 7 | "Edição virá na Fase C", "Detalhes virão na Fase C", "Gerar com IA — não implementado nesta fase.", "Exportar — não implementado nesta fase.", "Destravar / Travar — não implementado nesta fase." |
| aria-labels | 6 | "Retrato de {name}", "Slot de nível {level}", "Abrir menu", "Gerar com IA", "Item: {name}, peso: {weight}", "Remover {item}", "Remover magia {name}", "Remover ataque {name}" |
| Strings com interpolação | 8 | "{name}" (character name), "{level}" (spell level), "{current}/{max}" (HP, slots), "{n} salvos" (count), "{n} personagens" (count), "{class} {level}" (meta), "{race} · {class} · {level}" (meta) |
| Pluralização necessária | 4 | "1 personagem" vs "N personagens", "1 magia" vs "N magias", "1 item" vs "N itens", "1 ataque" vs "N ataques" |
| **Total estimado** | **~83** | |

---

## 2. Strings hardcoded por componente

### `v2/src/pages/CharSelect.tsx`
- "TBT·RPG"
- "Mesa virtual · fichas sincronizadas"
- "Sua ficha, facilitada."
- "Gerencie seus personagens de D&D em qualquer dispositivo."
- "HP, magias e inventário a um toque."
- "v2 · Preview"
- "Meus Personagens"
- "Carregando…"
- "{n} salvos"
- "Carregando personagens…"
- "Nenhum personagem encontrado."
- "Crie um na v1 e ele aparecerá aqui."
- `'Criação de personagens ainda não implementada na v2.\nUse a v1: ' + V1_URL` (alert — user-facing, needs translation)
- "Criar novo personagem"
- "⬇ Importar JSON"
- "⬆ Exportar"
- "Ficha completa disponível na versão atual (v1)"
- "Entrar" (button)
- "Criar conta" (button)
- "Sair" (button)

### `v2/src/pages/Login.tsx`
- "TBT·RPG"
- "Entrar na conta"
- "E-mail"
- "Senha"
- "Entrando…"
- "Entrar"
- "Voltar"
- "Falha no login" (error message — user-facing, needs translation)

### `v2/src/components/sheet/Sidebar.tsx`
- "TBT-RPG"
- "v2 · beta"
- "Meus personagens"
- "Páginas"
- "Atributos", "Combate", "Magias", "Inventário", "História"
- "Gerar com IA"
- "Backstory, items, magias"
- "PT", "EN" (language toggle — visual only, no handlers)

### `v2/src/components/sheet/BottomTabBar.tsx`
- "Status", "Combate", "Magias", "Inv", "Lore" (tab labels — mixed PT/EN)

### `v2/src/components/sheet/MobileHeader.tsx`
- "Abrir menu" (aria-label)
- "Gerar com IA" (aria-label)

### `v2/src/components/sheet/DesktopShell.tsx`
- "Nv" (level abbreviation)
- "Sincronizado"
- "Exportar"
- "Destravar" / "🔒 Destravar"
- "Exportar — não implementado nesta fase." (alert)
- "Destravar / Travar — não implementado nesta fase." (alert)

### `v2/src/components/sheet/tabs/StatusTab.tsx`
- "Atributos"
- "Saving Throws" (English — not translated)
- "Skills" (English — not translated)
- "Features & Traits" (English — not translated)
- "Features" (English — not translated)
- "Combate"

### `v2/src/components/sheet/tabs/SpellsTab.tsx`
- "{name} não conjura magias."
- "Esta classe não possui conjuração de magias."
- "Magias são acessadas por classes como Druid, Bard, Cleric, Wizard, Sorcerer e outras."

### `v2/src/components/sheet/parts/HeroCard.tsx`
- "Inspirado"

### `v2/src/components/sheet/parts/HpBlock.tsx`
- "Hit Points" (English — not translated)
- "＋ Heal" (English — not translated)
- "− Damage" (English — not translated)
- "Edição virá na Fase C" (alert)

### `v2/src/components/sheet/parts/CombatStrip.tsx`
- "AC", "INIT", "SPD", "PP", "DC", "PROF"
- "{value} ft" (feet abbreviation)

### `v2/src/components/sheet/parts/AttrGrid.tsx`
- "STR", "DEX", "CON", "INT", "WIS", "CHA"

### `v2/src/components/sheet/parts/SavingThrows.tsx`
- "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma" (full names, English)

### `v2/src/components/sheet/parts/SkillsBlock.tsx`
- Skill names são dinâmicos (vêm do adapter) — sem strings hardcoded

### `v2/src/components/sheet/parts/PersonalityBlock.tsx`
- "Personalidade"
- "Traços"
- "Ideais"
- "Vínculos"
- "Defeitos"

### `v2/src/components/sheet/parts/BackstoryBlock.tsx`
- "História"
- "Nenhuma história registrada ainda."

### `v2/src/components/sheet/parts/NotesBlock.tsx`
- "Notas"
- "Nenhuma nota registrada."

### `v2/src/components/sheet/parts/LoreHero.tsx`
- "Retrato de {name}" (aria-label)
- "Nível {level} · {experience} XP"

### `v2/src/components/sheet/parts/ProficienciesBlock.tsx`
- "PROFICIÊNCIAS"
- "ARMAS E ARMADURAS"
- "FERRAMENTAS"
- "IDIOMAS"
- "OUTRAS"

### `v2/src/components/sheet/parts/SpellHeader.tsx`
- "CLASSE"
- "HABILIDADE"
- "DC DE SALVAGUARDA"
- "BÔNUS DE ATAQUE"

### `v2/src/components/sheet/parts/SpellSlots.tsx`
- "ESPAÇOS DE MAGIA"
- "NÍVEL {level}"
- "Slot de nível {level} ({current} de {max} disponíveis)" (aria-label)

### `v2/src/components/sheet/parts/SpellList.tsx`
- "MAGIAS"
- "Nenhuma magia cadastrada."
- "Adicione cantrips e magias para gerenciar slots."
- "+ Adicionar"
- "TRUQUES" (level 0 spells)
- "NÍVEL {level}"
- "Detalhes virão na Fase C" (alert)
- "Remoção virá na Fase C" (alert)

### `v2/src/components/sheet/parts/InventoryList.tsx`
- "ITENS ({count})"
- "Nenhum item registrado."
- "Adicione itens para gerenciar seu inventário."
- "+ Adicionar"
- "Detalhes virão na Fase C" (alert)
- "Edição virá na Fase C" (alert)
- "Item: {name}, peso: {weight}" (aria-label)
- "Remover {name}" (aria-label)

### `v2/src/components/sheet/parts/AttacksList.tsx`
- "Ataques"
- "+ Adicionar"
- "Nenhum ataque cadastrado."
- "Adicione um ataque para registrar suas armas e magias ofensivas."
- "Detalhes do ataque virão na Fase C" (alert)
- "Remover ataque {name}" (aria-label)

### `v2/src/components/sheet/parts/FeaturesList.tsx`
- "Nenhuma feature registrada."

### `v2/src/components/sheet/parts/CurrencyBlock.tsx`
- "MOEDAS"
- "PP" (Platinum), "GP" (Gold), "EP" (Electrum), "SP" (Silver), "CP" (Copper)
- "Platina", "Ouro", "Electrum", "Prata", "Cobre" (aria-labels)

### `v2/src/components/sheet/parts/DeathSaves.tsx`
- "Death Saves" (English — not translated)

### `v2/src/components/sheet/parts/HitDicePool.tsx`
- "Hit Dice" (English — not translated)

---

## 3. Strings que precisam de interpolação

| Chave sugerida | PT-BR | EN | Parâmetros |
|---------------|-------|-----|------------|
| `portrait.aria_label` | "Retrato de {name}" | "Portrait of {name}" | `name: string` |
| `spell_slot.aria_label` | "Slot de nível {level} ({current} de {max} disponíveis)" | "Level {level} slot ({current} of {max} available)" | `level: number, current: number, max: number` |
| `spell_level.label` | "NÍVEL {level}" | "LEVEL {level}" | `level: number` |
| `character.not_caster` | "{name} não conjura magias." | "{name} does not cast spells." | `name: string` |
| `lore.meta` | "Nível {level} · {xp} XP" | "Level {level} · {xp} XP" | `level: number, xp: number` |
| `characters.count` | "{n} salvos" | "{n} saved" | `n: number` |
| `inventory.items_count` | "ITENS ({count})" | "ITEMS ({count})" | `count: number` |
| `item.aria_label` | "Item: {name}, peso: {weight}" | "Item: {name}, weight: {weight}" | `name: string, weight: number` |
| `item.remove_label` | "Remover {name}" | "Remove {name}" | `name: string` |
| `spell.remove_label` | "Remover magia {name}" | "Remove spell {name}" | `name: string` |
| `attack.remove_label` | "Remover ataque {name}" | "Remove attack {name}" | `name: string` |

---

## 4. Strings que precisam de pluralização

| Chave sugerida | Singular PT | Plural PT | Singular EN | Plural EN |
|----------------|-------------|-----------|-------------|-----------|
| `characters.saved` | "1 salvo" | "{n} salvos" | "1 saved" | "{n} saved" |
| `spells.count` | "1 magia" | "{n} magias" | "1 spell" | "{n} spells" |
| `inventory.count` | "1 item" | "{n} itens" | "1 item" | "{n} items" |
| `attacks.count` | "1 ataque" | "{n} ataques" | "1 attack" | "{n} attacks" |
| `features.count` | "1 habilidade" | "{n} habilidades" | "1 feature" | "{n} features" |

---

## 5. Dicionário v1 — análise

- **Estrutura:** Objeto plano com chaves em inglês (como aparecem na UI em EN), valores como strings em PT-BR. Usadas via DOM text walker que varre text nodes e substitui diretamente — sem atributos `data-i18n`. Placeholders de `input`/`textarea` tratados por `walkAndReplacePlaceholders`.
- **Total de entradas:** ~200 pares
- **Entradas reutilizáveis na v2:** ~85 (~42%) — abilities, skills, proficiências, personality fields, currency names, spell labels, attack labels, auth actions
- **Entradas v1-specific (não portáveis):** ~115 (~58%) — referências a IDs HTML v1, v1-only features (mount/pet, allies/organizations), conceitos sem equivalente na v2

### Mapeamento sugerido (v1 key → v2 key)

| v1 key | PT-BR value | v2 key sugerida |
|--------|-------------|-----------------|
| "Strength" | "Força" | `abilities.strength` |
| "Dexterity" | "Destreza" | `abilities.dexterity` |
| "Constitution" | "Constituição" | `abilities.constitution` |
| "Intelligence" | "Inteligência" | `abilities.intelligence` |
| "Wisdom" | "Sabedoria" | `abilities.wisdom` |
| "Charisma" | "Carisma" | `abilities.charisma` |
| "Personality Traits" | "Traços de Personalidade" | `personality.traits` |
| "Ideals" | "Ideais" | `personality.ideals` |
| "Bonds" | "Vínculos" | `personality.bonds` |
| "Flaws" | "Defeitos" | `personality.flaws` |
| "Proficiencies" | "Proficiências" | `section.proficiencies` |
| "Weapons & Armor" | "Armas & Armaduras" | `proficiencies.weapons_armor` |
| "Tools" | "Ferramentas" | `proficiencies.tools` |
| "Known Languages" | "Idiomas Conhecidos" | `proficiencies.languages` |
| "Spells" | "Magias" | `section.spells` |
| "Cantrips" | "Truques" | `spells.cantrips` |
| "Attacks" | "Ataques" | `section.attacks` |
| "Inventory" | "Inventário" | `section.inventory` |
| "Copper" | "Cobre" | `currency.cp` |
| "Silver" | "Prata" | `currency.sp` |
| "Gold" | "Ouro" | `currency.gp` |
| "Electrum" | "Electrum" | `currency.ep` |
| "Platinum" | "Platina" | `currency.pp` |
| "Spell Save DC" | "CD de Magia" | `combat.spell_save_dc` |
| "Armor Class" | "Classe de Armadura" | `combat.ac` |
| "Sign in" | "Entrar" | `auth.sign_in` |
| "Sign out" | "Sair" | `auth.sign_out` |
| "Athletics" | "Atletismo" | `skills.athletics` |
| "Acrobatics" | "Acrobacia" | `skills.acrobatics` |
| "Sleight of Hand" | "Prestidigitação" | `skills.sleight_of_hand` |
| "Stealth" | "Furtividade" | `skills.stealth` |
| "Arcana" | "Arcanismo" | `skills.arcana` |
| "History" | "História" | `skills.history` |
| "Investigation" | "Investigação" | `skills.investigation` |
| "Nature" | "Natureza" | `skills.nature` |
| "Religion" | "Religião" | `skills.religion` |
| "Insight" | "Percepção de Motivos" | `skills.insight` |
| "Medicine" | "Medicina" | `skills.medicine` |
| "Perception" | "Percepção" | `skills.perception` |
| "Survival" | "Sobrevivência" | `skills.survival` |
| "Deception" | "Enganação" | `skills.deception` |
| "Intimidation" | "Intimidação" | `skills.intimidation` |
| "Performance" | "Atuação" | `skills.performance` |
| "Persuasion" | "Persuasão" | `skills.persuasion` |
| "Animal Handling" | "Adestrar Animais" | `skills.animal_handling` |

---

## 6. Toggle PT/EN atual

- **Localização:** `v2/src/components/sheet/Sidebar.tsx`, seção inferior do sidebar
- **Estado atual:** **Visual only — sem funcionalidade.** PT renderizado como "active" (fundo roxo, texto branco); EN renderizado como "inactive" (fundo transparente, borda sutil). Nenhum estado de idioma gerenciado.
- **Handler atual:** Nenhum `onClick`. Buttons puramente decorativos.

```tsx
// Comportamento atual em Sidebar.tsx:
<button style={{
  flex: 1, background: T.purple, color: '#fff',
  border: 'none', borderRadius: 6, padding: 6,
  fontSize: 10, fontWeight: 700, cursor: 'pointer',
}}>
  PT
</button>
<button style={{
  flex: 1, background: 'transparent', color: T.textMuted,
  border: `1px solid ${T.borderSubtle}`, borderRadius: 6,
  padding: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
}}>
  EN
</button>
```

O mesmo padrão deve estar no drawer mobile (não verificado, mas esperado).

---

## 7. Strings de dev (sem tradução)

As seguintes strings são internas e **não precisam de i18n**:

- `console.error(...)` — mensagens de debug em stores e auth
- `throw new Error("...")` — erros de runtime para desenvolvedores
- `console.warn(...)` — warnings de migração de schema
- Keys de `data-testid` — strings de teste, nunca visíveis ao usuário
- `key={...}` props de React — identificadores internos
- Variáveis de ambiente em comentários — documentação interna

Atenção: `alert('Criação de personagens ainda não implementada na v2.\nUse a v1: ' + V1_URL)` em `CharSelect.tsx` **É** user-facing e **precisa** de i18n, apesar de ser um `alert()`.

---

## 8. localStorage existente na v2

**Nenhum `localStorage` encontrado explicitamente em `v2/src/`.**

- A v2 ainda não persiste language preference
- A v1 usa `localStorage.setItem('dnd_language', lang)` com chave `'dnd_language'`
- **Recomendação:** v2 lê `'dnd_language'` (v1) na primeira visita como fallback, persiste em `'tbt-rpg-v2-lang'` após primeira escolha explícita

---

## 9. Recomendações para a C.4

### 9.1 Estrutura de pasta

```
v2/src/i18n/
├── dictionaries/
│   ├── pt.json       ← PT-BR (língua principal / source of truth)
│   ├── en.json       ← EN
│   └── index.ts      ← re-exporta os dicionários
├── i18n.tsx          ← TranslationContext + TranslationProvider
├── useTranslation.ts ← hook público
└── types.ts          ← TranslationKey union type
```

### 9.2 Hook proposto

```tsx
// v2/src/i18n/useTranslation.ts
export function useTranslation(): {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  lang: 'pt' | 'en'
  setLang: (lang: 'pt' | 'en') => void
}
```

### 9.3 Assinatura de `t`

```tsx
// Simples:
t('section.spells')              // → "Magias" (PT) / "Spells" (EN)

// Com interpolação:
t('portrait.aria_label', { name: 'Eira' })
// PT: "Retrato de Eira"
// EN: "Portrait of Eira"

t('spell_slot.aria_label', { level: 3, current: 2, max: 4 })
// PT: "Slot de nível 3 (2 de 4 disponíveis)"
// EN: "Level 3 slot (2 of 4 available)"
```

Interpolação implementada via substituição simples de `{param}`:
```ts
function interpolate(str: string, params: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? key))
}
```

### 9.4 Tipagem forte

```ts
// v2/src/i18n/types.ts — gerado a partir das chaves do dicionário PT
import pt from './dictionaries/pt.json'

type FlattenKeys<T, Prefix extends string = ''> =
  T extends string
    ? Prefix
    : { [K in keyof T & string]: FlattenKeys<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`> }[keyof T & string]

export type TranslationKey = FlattenKeys<typeof pt>
```

### 9.5 Persistência

```
Primeira visita:
  1. Ler localStorage['tbt-rpg-v2-lang']
  2. Se não existir: ler localStorage['dnd_language'] (v1)
  3. Se não existir: detectar navigator.language ('pt-BR' | 'pt' → 'pt', 'en-*' → 'en')
  4. Default: 'pt'

Ao trocar idioma (setLang):
  localStorage.setItem('tbt-rpg-v2-lang', lang)
```

### 9.6 Hot-reload via Context

- `setLang(lang)` atualiza estado no Context → todos componentes que chamam `useTranslation()` re-renderizam
- **Sem page refresh**
- Provider deve ficar em `App.tsx` ou no root do layout

### 9.7 Pluralização

Estratégia simples com keys `.singular` / `.plural`:

```ts
// Opção A (simples, recomendada):
function plural(
  t: (key: TranslationKey, p?: Record<string, string | number>) => string,
  baseKey: string,
  count: number
): string {
  const key = count === 1 ? `${baseKey}.singular` : `${baseKey}.plural`
  return t(key as TranslationKey, { n: count })
}

// Uso:
plural(t, 'characters.saved', 3)  // → "3 salvos" / "3 saved"
```

### 9.8 Migração componente a componente

Ordem sugerida:
1. `Sidebar.tsx` — ativa o toggle, primeira strings migradas
2. `BottomTabBar.tsx` — tab names
3. `StatusTab.tsx` — labels de seção (mais visíveis)
4. `CombatTab.tsx`, `SpellsTab.tsx`, `InventoryTab.tsx`, `LoreTab.tsx`
5. `CharSelect.tsx`, `Login.tsx`
6. Componentes part: HpBlock, CombatStrip, PersonalityBlock, etc.

### 9.9 Dicionário inicial (estrutura JSON)

```json
{
  "section": {
    "attributes": "Atributos",
    "combat": "Combate",
    "spells": "Magias",
    "inventory": "Inventário",
    "history": "História",
    "proficiencies": "Proficiências",
    "coins": "Moedas",
    "spell_slots": "Espaços de Magia",
    "attacks": "Ataques",
    "notes": "Notas",
    "personality": "Personalidade"
  },
  "abilities": {
    "str": "FOR",
    "dex": "DES",
    "con": "CON",
    "int": "INT",
    "wis": "SAB",
    "cha": "CAR",
    "strength": "Força",
    "dexterity": "Destreza",
    "constitution": "Constituição",
    "intelligence": "Inteligência",
    "wisdom": "Sabedoria",
    "charisma": "Carisma"
  },
  "personality": {
    "traits": "Traços",
    "ideals": "Ideais",
    "bonds": "Vínculos",
    "flaws": "Defeitos"
  },
  "combat": {
    "ac": "CA",
    "init": "INIC",
    "speed": "VEL",
    "passive_perception": "PP",
    "spell_save_dc": "DC",
    "proficiency_bonus": "PROF",
    "hit_points": "Pontos de Vida",
    "death_saves": "Testes de Morte",
    "hit_dice": "Dados de Vida",
    "heal": "+ Curar",
    "damage": "− Dano"
  },
  "spells": {
    "cantrips": "TRUQUES",
    "not_caster": "{name} não conjura magias.",
    "no_spellcasting": "Esta classe não possui conjuração de magias.",
    "caster_hint": "Magias são acessadas por classes como Druid, Bard, Cleric, Wizard, Sorcerer e outras.",
    "level_label": "NÍVEL {level}",
    "empty": "Nenhuma magia cadastrada.",
    "empty_hint": "Adicione cantrips e magias para gerenciar slots."
  },
  "skills": {
    "athletics": "Atletismo",
    "acrobatics": "Acrobacia",
    "sleight_of_hand": "Prestidigitação",
    "stealth": "Furtividade",
    "arcana": "Arcanismo",
    "history": "História",
    "investigation": "Investigação",
    "nature": "Natureza",
    "religion": "Religião",
    "insight": "Percepção de Motivos",
    "medicine": "Medicina",
    "perception": "Percepção",
    "survival": "Sobrevivência",
    "deception": "Enganação",
    "intimidation": "Intimidação",
    "performance": "Atuação",
    "persuasion": "Persuasão",
    "animal_handling": "Adestrar Animais"
  },
  "proficiencies": {
    "label": "PROFICIÊNCIAS",
    "weapons_armor": "ARMAS E ARMADURAS",
    "tools": "FERRAMENTAS",
    "languages": "IDIOMAS",
    "other": "OUTRAS"
  },
  "currency": {
    "label": "MOEDAS",
    "pp": "Platina",
    "gp": "Ouro",
    "ep": "Electrum",
    "sp": "Prata",
    "cp": "Cobre"
  },
  "inventory": {
    "label": "ITENS ({count})",
    "empty": "Nenhum item registrado.",
    "empty_hint": "Adicione itens para gerenciar seu inventário.",
    "add": "+ Adicionar"
  },
  "attacks": {
    "label": "Ataques",
    "empty": "Nenhum ataque cadastrado.",
    "empty_hint": "Adicione um ataque para registrar suas armas e magias ofensivas.",
    "add": "+ Adicionar"
  },
  "lore": {
    "level_xp": "Nível {level} · {xp} XP",
    "backstory_empty": "Nenhuma história registrada ainda.",
    "notes_empty": "Nenhuma nota registrada.",
    "features_empty": "Nenhuma feature registrada."
  },
  "aria": {
    "portrait": "Retrato de {name}",
    "open_menu": "Abrir menu",
    "generate_ai": "Gerar com IA",
    "item_weight": "Item: {name}, peso: {weight}",
    "remove_item": "Remover {name}",
    "remove_spell": "Remover magia {name}",
    "remove_attack": "Remover ataque {name}",
    "spell_slot": "Slot de nível {level} ({current} de {max} disponíveis)"
  },
  "spell_header": {
    "class": "CLASSE",
    "ability": "HABILIDADE",
    "save_dc": "DC DE SALVAGUARDA",
    "attack_bonus": "BÔNUS DE ATAQUE"
  },
  "nav": {
    "my_characters": "Meus Personagens",
    "pages": "Páginas",
    "generate_ai": "Gerar com IA",
    "ai_hint": "Backstory, items, magias"
  },
  "auth": {
    "sign_in": "Entrar",
    "sign_up": "Criar conta",
    "sign_out": "Sair",
    "signing_in": "Entrando…",
    "sync_prompt": "Entrar para sincronizar",
    "title": "Entrar na conta",
    "email": "E-mail",
    "password": "Senha",
    "back": "Voltar",
    "sign_in_failed": "Falha no login"
  },
  "status": {
    "loading": "Carregando…",
    "loading_characters": "Carregando personagens…",
    "synced": "Sincronizado",
    "level_abbr": "Nv"
  },
  "charselect": {
    "tagline": "Mesa virtual · fichas sincronizadas",
    "headline": "Sua ficha, facilitada.",
    "subline": "Gerencie seus personagens de D&D em qualquer dispositivo.",
    "feature_hint": "HP, magias e inventário a um toque.",
    "empty": "Nenhum personagem encontrado.",
    "empty_hint": "Crie um na v1 e ele aparecerá aqui.",
    "create_v2_unavailable": "Criação de personagens ainda não implementada na v2.\nUse a v1: {url}",
    "create": "Criar novo personagem",
    "import": "⬇ Importar JSON",
    "export": "⬆ Exportar",
    "v1_notice": "Ficha completa disponível na versão atual (v1)",
    "count_singular": "1 salvo",
    "count_plural": "{n} salvos",
    "inspired": "Inspirado"
  },
  "tabs": {
    "status": "Status",
    "combat": "Combate",
    "spells": "Magias",
    "inventory": "Inv",
    "lore": "Lore"
  },
  "phase_c": {
    "edit": "Edição virá na Fase C",
    "details": "Detalhes virão na Fase C",
    "ai_unavailable": "Gerar com IA — não implementado nesta fase.",
    "export_unavailable": "Exportar — não implementado nesta fase.",
    "lock_unavailable": "Destravar / Travar — não implementado nesta fase."
  }
}
```

---

## 10. Dúvidas em aberto

1. **Termos D&D canônicos em EN:**
   - "Truques" → "Cantrips" (D&D standard) ou "Tricks"?
   - "Espaços de Magia" → "Spell Slots" (D&D standard)?
   - "Ficha" → "Sheet" ou "Character"?
   - "Atributos" → "Abilities" (D&D standard) ou "Attributes"?
   - "Perícias" → "Skills" (D&D standard)?

2. **Abreviações de atributos em PT:**
   - STR/DEX/CON/INT/WIS/CHA devem virar FOR/DES/CON/INT/SAB/CAR em PT (como no livro BR)?
   - Ou manter abreviações EN em ambos idiomas (mais common em grupos online)?

3. **Detecção automática na primeira visita:**
   - Respeitar `navigator.language` silenciosamente?
   - Ou default sempre PT (já que o app é primariamente BR)?

4. **Plurais EN — cobrir zero:**
   - "no items", "1 item", "2+ items"?
   - Ou apenas singular ("1 item") / plural ("{n} items")?

5. **Death Saves, Hit Dice em PT:**
   - "Testes de Morte" e "Dados de Vida"?
   - Ou manter termos EN mesmo em PT (muitos jogadores BR usam os termos originais)?

6. **Tabs EN (BottomTabBar):**
   - "Status", "Combat", "Spells", "Inv", "Lore" em EN?
   - "Status", "Combate", "Magias", "Inv", "Histórico" em PT?
   - "Lore" é já em EN — traduzir para "Passado"? "Lore"?

7. **Compartilhar localStorage entre v1 e v2:**
   - v2 deve ler `'dnd_language'` (v1) como fallback ou partir do zero?

8. **Scope do Phase C placeholder alerts:**
   - Incluir tradução de alerts "virá na Fase C" no escopo da C.4?
   - Ou traduzir junto com a feature quando for implementada?

---

## Checklist de implementação

- [ ] Criar `v2/src/i18n/` com estrutura de pastas
- [ ] Criar `dictionaries/pt.json` com ~100 chaves iniciais
- [ ] Criar `dictionaries/en.json` com equivalentes EN
- [ ] Implementar `TranslationContext` + `TranslationProvider`
- [ ] Implementar `useTranslation()` hook
- [ ] Implementar `interpolate(str, params)` helper
- [ ] Gerar `TranslationKey` union type a partir do JSON PT
- [ ] Integrar `TranslationProvider` em `App.tsx`
- [ ] Ativar handlers PT/EN em `Sidebar.tsx` (e drawer mobile)
- [ ] Configurar persistência em `localStorage['tbt-rpg-v2-lang']`
- [ ] Migrar `Sidebar.tsx` → strings via `t()`
- [ ] Migrar `BottomTabBar.tsx`
- [ ] Migrar `StatusTab.tsx` + parts (HpBlock, CombatStrip, AttrGrid, SavingThrows, SkillsBlock)
- [ ] Migrar `CombatTab.tsx` + parts (AttacksList, DeathSaves, HitDicePool)
- [ ] Migrar `SpellsTab.tsx` + parts (SpellHeader, SpellSlots, SpellList)
- [ ] Migrar `InventoryTab.tsx` + parts (InventoryList, CurrencyBlock, ProficienciesBlock)
- [ ] Migrar `LoreTab.tsx` + parts (LoreHero, BackstoryBlock, PersonalityBlock, NotesBlock)
- [ ] Migrar `CharSelect.tsx` e `Login.tsx`
- [ ] Implementar helper `plural(t, key, count)`
- [ ] Escrever testes para `useTranslation` hook e `t` function
- [ ] Verificar: nenhuma string PT-BR hardcoded remanescente em `.tsx`
