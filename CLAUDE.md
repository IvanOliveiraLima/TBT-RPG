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
| `v2/src/lib/db.ts` | IndexedDB wrapper: reads v1 DB read-only, writes to v2 DB |
| `v2/src/lib/supabase.ts` | Supabase client singleton (same project as v1) |
| `v2/src/store/auth.ts` | Zustand auth store (initAuth, signIn, signOut) |
| `v2/src/store/characters.ts` | Zustand characters store (fetchCharacters) |
| `v2/src/pages/CharSelect.tsx` | Character select screen — first screen, reads from IndexedDB |
| `v2/src/pages/Login.tsx` | Login page (email + password via Supabase) |
| `v2/src/routes.tsx` | React Router v6 config (/, /login, * → /) |
| `v2/tests/db.test.ts` | Basic test for IndexedDB wrapper |

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

### v2 IndexedDB strategy

- v1 DB: `dnd-character-sheet` (version 3) — **read-only** from v2
- v2 DB: `dnd-character-sheet-v2` (version 1) — read + write
- `listCharacters()` merges both; v2 records win on id collision
- `copyFromV1(id)` migrates one character to v2 DB before first edit
- Character HP is stored as strings in v1 (`page1.status.current_health`, `max_health`, `temp_health`)
- `CharacterSummary` adapter normalises to `{ hp: { current, max, temp } }` as numbers

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
