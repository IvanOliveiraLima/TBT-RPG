# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo structure

This repo uses a **lightweight monorepo** with two independent projects:
- Root (`./`) — **v1**, vanilla JS + W3.CSS, the current production version
- `v2/` — **v2 rewrite**, React + TypeScript + Tailwind CSS, in active development

v1 is live at `ivanoliveiralima.github.io/TBT-RPG/`, v2 preview at `.../TBT-RPG/v2/`.

## Commands

### v1 (root)
```bash
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint on js/ folder
npm run test       # Run Vitest (single run)
npm run test:watch # Run tests in watch mode
```

### v2 (cd v2/)
```bash
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run lint       # ESLint
npm run test       # Vitest single run
npm run test:watch
```

CI runs lint + test + build for **both** v1 and v2 on PRs to `main-dev` and `master`.

To redeploy the Cloudflare Worker (manual step — not in CI):

```bash
cd worker && npm run deploy
```

If the production domain changes, update `ALLOWED_ORIGINS` in [worker/src/index.js](worker/src/index.js) before redeploying.

## Architecture

**Vanilla JS SPA** — no framework. Pure DOM manipulation, ES6 modules, Vite for bundling, IndexedDB (via `idb` library) for persistence, PWA-capable. Phases completed: responsive UI, IndexedDB + PWA, multi-character support, AI character generation via Cloudflare Workers (Fase 4), cloud sync via Supabase (auth + PostgreSQL + Storage) (Fase 5). Post-Phase 5 additions: D6 dice icon, bilingual UI (EN/PT) via DOM text walker, AI generation language toggle (EN/PT), and AI security hardening (rate limiting, prompt injection protection, JSON validation).

### Module responsibilities

| File | Role |
|------|------|
| `js/main.js` | Boot sequence: run migrations, check session, route to sheet or character select |
| `js/app.js` | Page navigation, sidebar toggle, expandable sections |
| `js/save.js` | Read DOM → JSON, schema validation, auto-save debounce (800ms) |
| `js/load.js` | JSON → populate DOM form fields |
| `js/changes.js` | Input event handlers, reactive D&D calculations (ability scores → modifiers → skills/saves) |
| `js/add-attack.js` | Add/remove attack and spell rows |
| `js/modules/storage.js` | IndexedDB CRUD abstraction — only module that touches IndexedDB |
| `js/modules/calculations.js` | Pure D&D math (ability modifiers, currency conversion) |
| `js/modules/character-select.js` | Character select screen: create, open, duplicate, delete, import/export |
| `js/modules/utils.js` | Pure helpers: parsers, validators, D&D lookup tables |
| `js/modules/ai-generate.js` | Fetch wrapper for the Cloudflare Worker AI endpoint |
| `js/modules/ai-modal.js` | AI generation modal: open/close/submit, apply generated data to DOM |
| `js/modules/i18n.js` | Dicionário PT-BR aplicado via DOM text walker — sem atributos `data-i18n` |
| `js/modules/supabase.js` | Inicialização do cliente Supabase — null se variáveis não configuradas |
| `js/modules/auth.js` | Autenticação: sign in/up/out, restauração de sessão, listeners de estado |
| `js/modules/auth-modal.js` | Modal de login/cadastro, handlers de formulário |
| `js/modules/sync.js` | Sync bidirecional IndexedDB ↔ Supabase, tombstones, debounce de 15s |
| `worker/src/index.js` | Cloudflare Worker — proxies requests to Workers AI (Llama 3 8B), handles CORS |

### Data flow

```
IndexedDB → loadCharacter(id) → applyLoadedSheet() → DOM
DOM ← changes.js event handlers ← user input
DOM → readFormValues() [save.js] → debounced saveCharacter() → IndexedDB
```

### Boot sequence (`main.js`)

1. Migrate legacy localStorage (`dnd_sheet_v1`) → IndexedDB
2. Migrate legacy `'active'` record → `char_${timestamp}_${random}` ID
3. Check `sessionStorage.activeCharacterId`
4. If found: load character, show `#sheet-wrapper`; if not: show `#character-select-screen`

### Key patterns

- **State:** No global store — UI state lives in DOM form fields. Active character ID in `sessionStorage`. All persistent data in IndexedDB (schema version 2).
- **Lock mode:** `LOCKED` flag in `changes.js` disables auto-recalculation so users can manually override computed fields.
- **Multi-class:** `basic_info.classes` is an array of `{name, level}`; `calculateTotalClassLevel()` sums them. Legacy single-class strings are migrated on load.
- **Images:** Stored as data URLs inside the character JSON, max 2MB, capped at 600px (character) / 300px (symbol).
- **Background skill proficiencies:** `BACKGROUND_FIXED_SKILLS_MAP` and `BACKGROUND_FLEXIBLE_SET` in `changes.js` auto-apply proficiency checkboxes when background changes, and undo them on background change.
- **Inline `onclick`:** Many HTML elements use `onclick="..."` calling functions exposed on `window` in `main.js`. This is intentional — don't refactor to `addEventListener` in bulk.
- **Sync offline-first:** IndexedDB é sempre a fonte primária. Supabase é camada opcional. App funciona sem credenciais configuradas.
- **Bilingual UI:** `i18n.js` walks the DOM replacing English text with PT-BR from a dictionary. No `data-i18n` attributes — it scans text nodes directly and is called explicitly at boot and after dynamic content renders.  Language preference persists in `localStorage`.
- **AI language toggle:** The generation modal includes an EN/PT radio toggle that passes `lang` to the Worker. When `lang === 'pt'`, the Worker uses `SYSTEM_PROMPT_PT` to instruct Llama 3 to produce free-text fields (personality, ideals, bonds, flaws, backstory) in Brazilian Portuguese.
- **Worker security hardening:** Rate limiting per IP, prompt injection protection on the user input, structural validation of the returned JSON via `validateCharacterJSON`, and user-friendly error messages. `max_tokens` kept at 1024 — occasional truncation is handled gracefully by the validator.
- **Tombstones:** exclusões enquanto logado criam registro em `deleted_characters` no IndexedDB. O sync propaga o delete para o Supabase e limpa o tombstone. Exclusões offline não geram tombstone.
- **Variáveis de ambiente:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via `.env.local` (não commitado). Secrets configurados no GitHub Actions para CI e deploy.

### Testing

Tests live in `/tests/`. The `idb` library is mocked via `vi.mock('idb')` with an in-memory `Map`. Tests cover pure calculations (`calculations.test.js`), storage CRUD + migrations (`storage.test.js`), and utility functions (`utils.test.js`).

## v2 Architecture

**React 19 + TypeScript 6 + Tailwind CSS 3 + Vite 8**

| File | Role |
|------|------|
| `v2/src/types/character.ts` | TypeScript interfaces mirroring v1 IndexedDB schema exactly |
| `v2/src/data/db.ts` | IndexedDB wrapper: v2-native, stores `Character` directly (version 2) |
| `v2/src/data/migration.ts` | One-time v1→v2 migration via `migrateV1Characters()` |
| `v2/src/lib/supabase.ts` | Supabase client singleton (same project as v1) |
| `v2/src/store/auth.ts` | Zustand auth store (initAuth, signIn, signOut) |
| `v2/src/store/characters.ts` | Zustand characters store — single source of truth for all character data; `updateCharacter(id, partial)` does optimistic in-memory update + 800ms debounced IndexedDB persist |
| `v2/src/store/character.ts` | Zustand UI store — holds only `activeId` (the id of the character open in the sheet) and loading/error state; exports `useActiveCharacter()` derived hook |
| `v2/src/pages/CharSelect.tsx` | Character select screen — first screen, reads from IndexedDB |
| `v2/src/pages/Login.tsx` | Login page (email + password via Supabase) |
| `v2/src/routes.tsx` | React Router v6 config (/, /login, * → /) |
| `v2/tests/db.test.ts` | Basic test for IndexedDB wrapper |
| `v2/src/i18n/index.ts` | Re-exports: `I18nProvider`, `useTranslation`, `pluralKey`, types |
| `v2/src/i18n/i18n.tsx` | `I18nProvider` — holds lang state, `setLang`, `t()` function |
| `v2/src/i18n/dictionaries/en.ts` | English dictionary — source of truth for all keys |
| `v2/src/i18n/dictionaries/pt.ts` | Portuguese dictionary — typed `Record<keyof typeof en, string>` |
| `v2/src/i18n/plural.ts` | `pluralKey(base, count)` helper for singular/plural variants |
| `v2/tests/helpers/render.tsx` | `renderWithI18n(ui, lang)` test helper for dual-lang assertions |

### v2 store architecture

The v2 uses two Zustand stores with clearly separated responsibilities and a
derived hook that composes them at read time. There is no duplication of
character state.

| Store | Responsibility |
|-------|---------------|
| `useCharactersStore` | List of all characters. `updateCharacter(id, partial)` is the **single write path** for any character mutation: applies the partial optimistically in memory, then debounces a full persist to IndexedDB after 800 ms. |
| `useCharacterStore` | Holds only `activeId` (the id currently open in the sheet) and loading/error state. Never stores the character object itself. |

The active character is exposed through a **derived hook** that composes
both stores at read time:

```ts
export function useActiveCharacter(): Character | null {
  const activeId = useCharacterStore(s => s.activeId)
  return useCharactersStore(s =>
    activeId ? (s.characters.find(c => c.id === activeId) ?? null) : null
  )
}
```

Any component that calls `useActiveCharacter()` re-renders automatically
whenever `updateCharacter` mutates the matching entry in `characters[]`.
No secondary patch or synchronization is needed.

#### Why derived

A previous iteration kept a copy of the active character in `useCharacterStore`
in parallel with `useCharactersStore.characters[]`. Keeping the two stores
in sync required a dual-call pattern (`patchCharacter` for memory +
`updateCharacter` for DB) and caused silent persistence bugs when the
character list was empty.

Deriving the active character eliminates the second source of truth.

#### The one write path

```ts
const character = useActiveCharacter()
const updateCharacter = useCharactersStore(s => s.updateCharacter)

function onEditField(partial: Partial<Character>) {
  if (!character) return
  void updateCharacter(character.id, partial)
  // Component re-renders via Zustand selector; DB persists after 800 ms debounce
}
```

#### Critical invariant

**Do not introduce a separate state field for the active character.** If
during a feature you feel the need for a `patchCharacter`-style action that
updates only memory, that is a sign something downstream is reading from the
wrong source — find and fix that reader instead.

#### loadCharacter

`loadCharacter(id)` reads from IndexedDB and inserts the character into
`useCharactersStore.characters[]` if not already present. This guarantees
that `updateCharacter` can locate the character via
`characters.find(c => c.id === id)` on every subsequent edit.

### v2 derived-model philosophy

The v1 codebase treated character sheets as "live calculators" — values like AC,
Initiative, Passive Perception, ability modifiers, skill bonuses, and save
bonuses were computed on-the-fly during render but rarely persisted. When a
user changed an ability score, the displayed bonus updated immediately, but
the saved JSON often contained empty strings for derived fields.

The v2 adopts the opposite approach: **derived-model**.

#### Single source of truth

The adapter (`v2/src/data/adapter.ts`) is the boundary. It reads the v1 raw
schema (which may contain stale or empty derived fields) and produces a domain
`Character` (`v2/src/domain/character.ts`) with **all derived values calculated
from base state**, regardless of what the v1 saved.

Examples of fields always derived in v2 (ignoring v1 stored values):

- `ac` — computed as `10 + abilityModifier(dex)` when v1 field is empty/zero
- `initiative` — computed as `abilityModifier(dex)` when v1 field is empty
- `passivePerception` — always `passivePerception(wis, hasPerceptionProf, hasExpertise, profBonus)`
- `proficiencyBonus` — always `proficiencyBonus(totalLevel)`
- `skill.bonus` — always `skillBonus(ability, proficient, expertise, profBonus)`
- `savingThrow.bonus` — always `savingThrowBonus(ability, proficient, profBonus)`

When the user customizes a derived field with a non-default value (e.g., enters
AC 17 because of magical armor), the adapter respects it. The rule is:

- **If v1 value is empty/zero/default**: calculate from state.
- **If v1 value is a meaningful override**: use it.

#### Per-field override policy (C.1.c.2+)

After C.1.c.2, the sheet components support **live editing of ability scores**.
This makes the override policy concrete — each derived field either **always
re-derives** from live base stats, or **respects a stored override**.

| Field | Policy | Reason |
|-------|--------|--------|
| `initiative` | **Always derived** — `abilityModifier(dex)` | No override UI; editing DEX is the correct way to change initiative |
| `passivePerception` | **Always derived** — PP formula | Derived live; too complex for manual override |
| `proficiencyBonus` | **Always derived** — from total class level | Always rule-legal; no freeform override |
| `savingThrow.bonus` | **Always derived** — from ability + profBonus | Bonus is the formula; user edits ability score or toggling proficiency |
| `skill.bonus` | **Always derived** — from ability + profBonus | Same as saves |
| `ability.mod` | **Always derived** — `abilityModifier(score)` | Never stored; computed at render |
| `ac` | **Respects stored override** | User may wear non-formula armor |
| `spellSaveDC` | **Respects stored override** | May depend on class features not modeled yet |

**Implication for components:** never add an `initiative` input field. If a user
wants a custom initiative bonus, it belongs in a separate bonus field (not yet
modeled). The `CombatStrip` component must always display `abilityModifier(dex)`.

#### Why this matters for future fields

When implementing new fields/components, **always ask**: is this derivable from
base state, or is it user-entered data?

- **Derivable** (calculate it, ignore v1 stale value): hp.max from CON+class,
  spell save DC from spellcasting ability, attack bonus from STR/DEX+prof.
- **User-entered** (read from v1 directly): character name, race, class
  selection, attack damage dice, inventory items, backstory text.

Components in `v2/src/components/sheet/` should never recalculate derived
values themselves. The domain is the contract: if `character.ac` is wrong,
fix the adapter.

#### Trade-offs

- **Pro:** v2 is consistent. AC always reflects current DEX. Skill bonuses
  never lag behind ability changes. No "ghost values" from old saves.
- **Pro:** Less manual work for the user. They edit ability scores, the rest
  updates automatically.
- **Con:** Loses fidelity for edge cases the user manually customized in v1.
  Mitigation: when value is meaningfully non-default, the adapter respects it.
- **Con:** More compute on every render (negligible for sheet of one character).

### v2 design reference

The visual source of truth is in `design-reference/tbt-rpg/project/` (in `.gitignore` — not committed). Key files:
- `components/tokens.css` — design tokens (colours, fonts, radii)
- `components/char-select.jsx` — CharSelect prototype (inline styles, exact values)
- `components/primitives.jsx` — T object (token constants) and Section/Label/Field components
- `components/data.jsx` — prototype character shape (`hp: {current, max}`, `classes: [{name, level}]`, etc.)

If `design-reference/` is absent in a new session, ask the user to provide the files.

### v2 IndexedDB strategy (Phase C.1.0 — v2-native)

The v2 uses its own database (`dnd-character-sheet-v2`, version 2) and stores
domain `Character` objects directly (v2-native schema). The v1 database
(`dnd-character-sheet`, version 3) is read **once** during boot migration and
is never written to from v2.

#### Contract table

|             | v1 DB | v2 DB |
|-------------|-------|-------|
| v1 reads    | yes   | no    |
| v1 writes   | yes   | no    |
| v2 reads    | migration only | yes |
| v2 writes   | never | yes   |

#### Migration (`v2/src/data/migration.ts`)

`migrateV1Characters()` runs once per boot:
1. Reads all characters from v1 DB (read-only; no upgrade callback — v2 never touches v1 schema)
2. For each v1 character whose id is not already in v2 DB:
   - Runs `adaptCharacter()` to produce a domain `Character`
   - Persists to v2 DB via `saveCharacter()`
3. Idempotent — subsequent boots skip already-migrated characters
4. Graceful when v1 DB does not exist (fresh install): returns `{ migrated: 0, skipped: 0 }`

After migration, v2 reads and writes only its own DB. The v1 DB stays
untouched as a historical snapshot.

#### v1 status

The v1 app at `/TBT-RPG/` is **frozen**. It continues to function with the
v1 DB exclusively, unaware of v2's existence. New edits made in v2 do not
propagate back to v1. v1 will eventually be replaced by v2.

#### Schema upgrade (v1 → v2)

v2 DB version was bumped from 1 to 2 because stored records changed shape
from `V1Character` (C.1.a era) to `Character` (v2-native). The upgrade
handler deletes and recreates the object store so migration can repopulate
from v1 DB with correctly adapted records. This only affects dev environments
that had C.1.a phase data.

#### v2 adapter role

`adapter.ts` is now exclusively a **migration utility**. It runs once per
character during `migrateV1Characters()` and is not part of the runtime read
path. Once migrated, the v2 reads and writes domain `Character` directly.

If new fields are added to `Character` after initial migration, a backfill
migration step may be needed — plan for that explicitly.

#### Demographics fields

`Character` has `age`, `height`, `weight`, `eyeColor`, `skinColor`,
`hairColor` as v2-native fields. The v1 schema has no equivalents — migrated
characters start with these fields as empty strings. v2 edit flow (Phase C.1.b+)
will allow users to fill them in.

### Local validation before push

Before pushing any branch, run all three checks in order:

```bash
npm run lint   # ESLint — catches style and hook rule violations
npm run test   # Vitest — unit/integration tests (transpile-only, no full tsc)
npm run build  # tsc -b + vite build — full type check including strict flags
```

The build step is the critical one: Vitest uses transpile-only mode and does
**not** enforce strict TypeScript flags such as `exactOptionalPropertyTypes`
or `noUncheckedIndexedAccess`. Errors from those flags only surface in
`npm run build`. Skipping the build before push is the most common cause of
CI failures on branches that have passing tests locally.

### v2 development phase pattern

Each v2 feature follows a three-step cycle:

1. **Audit** — investigate the v1 schema for the feature area before writing any code. Produces an `AUDIT-B*.md` file documenting raw field paths, schema variants (standard vs. legacy), adapter behavior, and open questions for the user.
2. **Pre-fix** — fix any silent adapter bugs or domain shape issues revealed by the audit (currency long-form fallback, proficiency field merge, allies removal, etc.). Isolated branch, regression tests, merged before the visual phase.
3. **Implementation** — build the visual components with the adapter already correct. Components read from `character.*`, never re-derive.

This order matters: components built on a broken adapter produce invisible data loss.

### v2 key patterns

- **No class names on CharSelect** — uses inline styles matching the prototype exactly (the T object)
- **Tailwind** is available for other components but CharSelect/Login use inline styles for pixel-perfect fidelity
- **exactOptionalPropertyTypes + noUncheckedIndexedAccess** enabled — be careful with optional chaining
- `vite-plugin-pwa` installed with `--legacy-peer-deps` (Vite 8 not yet in peer dep range of v1.2.0)

### v2 internationalization (i18n)

The v2 ships with a **custom Context-based i18n system** — no react-i18next,
no external library. Built incrementally across Fase C.4 (sub-phases C.4.0
through C.4.2), reached ~202 keys covering all five tabs by the end.

#### Type safety

`pt.ts` is typed as `Record<keyof typeof en, string>` — TypeScript fails the
build if PT is missing any EN key. `en.ts` is the source of truth; PT mirrors
it exactly. This guarantees no production-time "missing key" surprises.

#### Key naming convention

Modern pattern established from Fase C.4.1c onwards:

- `<section>.section_title` — visible header (`'STATUS'`, `'COMBATE'`, `'MAGIAS'`)
- `<section>.add_button` — primary CTA (`'Add'` / `'Adicionar'`)
- `<section>.empty_state_title` and `<section>.empty_state_hint` — empty UI states
- `<section>.row.row_aria` — aria-label for clickable rows
- `<section>.count_label` — usually `({count})`

When in doubt, look at C.4.1d (Spells) or C.4.1e (Inventory/Lore) for the
canonical examples.

#### Reuse over duplication

Before creating a new `aria.*` key, grep existing ones — generic keys like
`aria.remove_attack`, `aria.remove_spell`, `aria.item_weight`, `aria.portrait`
are intentionally cross-component. Adding a duplicate with a slightly
different name is a code smell.

#### Detection order

Initial language is determined by `detectInitialLang()`:

1. `localStorage.getItem('tbt-rpg-v2-lang')` — explicit user preference (highest priority)
2. `navigator.language.startsWith('pt')` — browser locale
3. Fallback: `'pt'`

Once the user clicks PT or EN in the Sidebar/MobileShell, localStorage takes
over permanently for that browser.

#### Translation policy

- **Translated:** UI labels, ability abbreviations (FOR/DES/CON/INT/SAB/CAR
  in PT, STR/DEX/CON/INT/WIS/CHA in EN), skill names following PHB-PT
  (Atletismo, Furtividade, Prestidigitação...), saves ("Testes de
  Resistência"), Hit Dice ("Dados de Vida"), empty state messages, aria-labels.
- **Not translated** (free-text from adapter): character name, race, class,
  alignment, item names, spell names, damage type, backstory text, notes.
- **Not translated** (international D&D standards): currency abbreviations
  (PP/GP/EP/SP/CP), speed unit (FT), weight unit (lb).

When adding a new field, decide which bucket it falls into. Free-text from
the adapter is the most common case for "do not translate".

#### Toggle activation

PT/EN buttons in `Sidebar.tsx` (desktop) and `MobileShell.tsx` (mobile drawer)
call `setLang()` from the I18n context. The switch is **instant via React
re-render** — no page reload. The active button has `aria-pressed="true"` and
visual highlight (gold border + elevated background).

#### Testing pattern

Components are rendered via `renderWithI18n(ui, 'pt' | 'en')` from
`v2/tests/helpers/render.tsx` — pre-sets localStorage and wraps with
`<I18nProvider>`. Most components have **dual-lang test coverage** — same
assertions duplicated for PT and EN expected text. Adding a new translated
component without dual-lang tests is incomplete.

#### Test integrity baseline

After a clean `npm install` (no flags), `npm test` should report:

| Metric | Baseline (end of C.1.c.1) |
|--------|--------------------------|
| Test files | 43 |
| Tests | 774 |

These numbers grow with each phase — check the latest merged PR for the
current baseline. If `npm test` reports significantly fewer test files,
a peer dependency is likely missing from `node_modules`.

Run `npx vitest list` to see which files Vitest detects. If a file is on
disk but not listed, an import error is silently failing — check that
file's imports against `node_modules`.

All testing-related packages are declared explicitly in `devDependencies`
(`@testing-library/dom`, `@testing-library/react`, `@testing-library/jest-dom`,
`@testing-library/user-event`, `jsdom`, `vitest`) — `npm install` without
any flags should produce a complete environment. No `--legacy-peer-deps`
required.

### v2 known layout issues (to fix when touching mobile layout)

- **Mobile drawer — PT/EN toggle pushed too far down**: `MobileShell.tsx` uses `marginTop: 'auto'` on the toggle wrapper, which pushes it to the bottom of the drawer via the flex-spacer. On short screens the toggle may be hidden or hard to reach. Consider either moving the toggle closer to the nav menu items or constraining the drawer height so it doesn't rely on `auto` margin.
