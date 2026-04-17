# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint on js/ folder
npm run test       # Run Vitest (single run)
npm run test:watch # Run tests in watch mode
```

CI runs `npm ci && npm run lint && npm run test && npm run build` on PRs to `main-dev` and `master`.

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
