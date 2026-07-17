# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

React 19 + TypeScript + Vite application at the repository root.
v1 (vanilla JS) was removed in the `refactor/promote-v2-to-root` refactor; tag `v1-final`
preserves it for historical reference.

Live at `ivanoliveiralima.github.io/TBT-RPG/`.

### Repository layout (post-promotion)

- `src/` — application source
- `tests/` — test files (Vitest)
- `public/` — static assets
- `worker/` — Cloudflare Worker for AI generation
- `.github/workflows/` — CI/CD (ci.yml + deploy.yml)
- `README.md`, `CLAUDE.md`, `LICENSE`

No `v2/` subdirectory. Pre-promotion state preserved at git tag `v1-final`.

## Commands

```bash
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # tsc -b && vite build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint
npm run test       # Run Vitest (single run)
npm run test:watch # Run tests in watch mode
```

CI runs lint + test + build on PRs to `main-dev` and `master`.

To redeploy the Cloudflare Worker (manual step — not in CI):

```bash
cd worker && npm run deploy
```

If the production domain changes, update `ALLOWED_ORIGINS` in [worker/src/index.js](worker/src/index.js) before redeploying.

## Architecture

**React 19 + TypeScript 6 + Tailwind CSS 3 + Vite 8**

| File | Role |
|------|------|
| `src/domain/character.ts` | Domain model — canonical `Character` shape all UI components consume |
| `src/data/db.ts` | IndexedDB wrapper: `dnd-character-sheet-v2` v10, stores `Character` directly |
| `src/data/canonical/item-categories.ts` | `ITEM_CATEGORIES` array + `isValidCategory()` guard |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/store/auth.ts` | Zustand auth store (initAuth, signIn, signOut, signUp) |
| `src/store/characters.ts` | Zustand characters store — single source of truth for all character data; `updateCharacter(id, partial)` does optimistic in-memory update + 800ms debounced IndexedDB persist |
| `src/store/character.ts` | Zustand UI store — holds only `activeId` (the id of the character open in the sheet) and loading/error state; exports `useActiveCharacter()` derived hook |
| `src/pages/CharSelect.tsx` | Character select screen — first screen, reads from IndexedDB |
| `src/pages/Login.tsx` | Login page (email + password via Supabase) |
| `src/routes.tsx` | React Router v6 config (/, /login, * → /) |
| `src/services/sync.ts` | Sync service — upload + download with LWW, tombstone propagation, debounce, periodic |
| `tests/db.test.ts` | Basic test for IndexedDB wrapper |
| `src/i18n/index.ts` | Re-exports: `I18nProvider`, `useTranslation`, `pluralKey`, types |
| `src/i18n/i18n.tsx` | `I18nProvider` — holds lang state, `setLang`, `t()` function |
| `src/i18n/dictionaries/en.ts` | English dictionary — source of truth for all keys |
| `src/i18n/dictionaries/pt.ts` | Portuguese dictionary — typed `Record<keyof typeof en, string>` |
| `src/i18n/plural.ts` | `pluralKey(base, count)` helper for singular/plural variants |
| `tests/helpers/render.tsx` | `renderWithI18n(ui, lang)` test helper for dual-lang assertions |
| `worker/src/index.js` | Cloudflare Worker — proxies requests to Workers AI (llama-3.3-70b-instruct-fp8-fast), handles CORS |

### store architecture

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

### derived-model philosophy

The v1 codebase treated character sheets as "live calculators" — values like AC,
Initiative, Passive Perception, ability modifiers, skill bonuses, and save
bonuses were computed on-the-fly during render but rarely persisted. When a
user changed an ability score, the displayed bonus updated immediately, but
the saved JSON often contained empty strings for derived fields.

The v2 adopts the opposite approach: **derived-model**.

#### Single source of truth

The domain model (`src/domain/character.ts`) defines the contract. All values —
including derived ones — are fully calculated from base state and persisted.
The architecture ensures **all derived values are calculated from base state**
on every save, regardless of any stale stored values from older schema versions.

Examples of fields always derived (ignoring any stale stored values):

- `ac` — computed as `10 + abilityModifier(dex)` when v1 field is empty/zero
- `initiative` — computed as `abilityModifier(dex)` when v1 field is empty
- `passivePerception` — always `passivePerception(wis, hasPerceptionProf, hasExpertise, profBonus)`
- `proficiencyBonus` — always `proficiencyBonus(totalLevel)`
- `skill.bonus` — always `skillBonus(ability, proficient, expertise, profBonus)`
- `savingThrow.bonus` — always `savingThrowBonus(ability, proficient, profBonus)`

When the user customizes a derived field with a non-default value (e.g., enters
AC 17 because of magical armor), the stored value is respected. The rule is:

- **If stored value is empty/zero/default**: calculate from base state.
- **If stored value is a meaningful override**: use it.

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

Components in `src/components/sheet/` should never recalculate derived
values themselves. The domain is the contract: if `character.ac` is wrong,
fix the domain model or the DB schema upgrade callback.

#### Trade-offs

- **Pro:** v2 is consistent. AC always reflects current DEX. Skill bonuses
  never lag behind ability changes. No "ghost values" from old saves.
- **Pro:** Less manual work for the user. They edit ability scores, the rest
  updates automatically.
- **Con:** Loses fidelity for edge cases the user manually customized in v1.
  Mitigation: when value is meaningfully non-default, the adapter respects it.
- **Con:** More compute on every render (negligible for sheet of one character).

### design reference

The visual source of truth is in `design-reference/tbt-rpg/project/` (in `.gitignore` — not committed). Key files:
- `components/tokens.css` — design tokens (colours, fonts, radii)
- `components/char-select.jsx` — CharSelect prototype (inline styles, exact values)
- `components/primitives.jsx` — T object (token constants) and Section/Label/Field components
- `components/data.jsx` — prototype character shape (`hp: {current, max}`, `classes: [{name, level}]`, etc.)

If `design-reference/` is absent in a new session, ask the user to provide the files.

### IndexedDB strategy

The app uses `dnd-character-sheet-v2` (version 10) and stores `Character` objects
directly (v2-native schema). The app never reads the v1 DB (`dnd-character-sheet`)
at boot or runtime. `adapter.ts` and `migration.ts` have been deleted as part of
the v2 promotion refactor (tag `v1-final` preserves v1 history).

#### Demographics fields

`Character` has `age`, `height`, `weight`, `eyeColor`, `skinColor`,
`hairColor` as v2-native fields (blank by default for older characters).

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

### development phase pattern

Each v2 feature follows a three-step cycle:

1. **Audit** — investigate the v1 schema for the feature area before writing any code. Produces an `AUDIT-B*.md` file documenting raw field paths, schema variants (standard vs. legacy), adapter behavior, and open questions for the user.
2. **Pre-fix** — fix any silent adapter bugs or domain shape issues revealed by the audit (currency long-form fallback, proficiency field merge, allies removal, etc.). Isolated branch, regression tests, merged before the visual phase.
3. **Implementation** — build the visual components with the adapter already correct. Components read from `character.*`, never re-derive.

This order matters: components built on a broken adapter produce invisible data loss.

### key patterns

- **No class names on CharSelect** — uses inline styles matching the prototype exactly (the T object)
- **Tailwind** is available for other components but CharSelect/Login use inline styles for pixel-perfect fidelity
- **exactOptionalPropertyTypes + noUncheckedIndexedAccess** enabled — be careful with optional chaining
- `vite-plugin-pwa` installed with `--legacy-peer-deps` (Vite 8 not yet in peer dep range of v1.2.0)

### internationalization (i18n)

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
`tests/helpers/render.tsx` — pre-sets localStorage and wraps with
`<I18nProvider>`. Most components have **dual-lang test coverage** — same
assertions duplicated for PT and EN expected text. Adding a new translated
component without dual-lang tests is incomplete.

#### Test integrity baseline

After a clean `npm install` (no flags), `npm test` should report:

| Metric | Baseline (after Camp.5 + hotfix — PR #130) |
|--------|---------------------------------------------|
| Test files | 83 |
| Tests | 1661 |

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

### known layout issues (to fix when touching mobile layout)

- **Mobile drawer — PT/EN toggle pushed too far down**: `MobileShell.tsx` uses `marginTop: 'auto'` on the toggle wrapper, which pushes it to the bottom of the drawer via the flex-spacer. On short screens the toggle may be hidden or hard to reach. Consider either moving the toggle closer to the nav menu items or constraining the drawer height so it doesn't rely on `auto` margin.

---

## Phase history (v2)

### Phase C.1.c — Status tab fully editable (COMPLETED — PR #94–#100)

All blocks in the Status tab are now editable in the v2. Sub-phases delivered:

| PR | Sub-phase | Summary |
|----|-----------|---------|
| #94 | C.1.c.1 | Identity + Inspiration: race, background, alignment, classes (multiclass), inspiration, XP |
| #95 | C.1.c.2 | Attributes + Saving Throws with live derived cascade |
| #96 | C.1.c.3 | Skills with proficient + expertise toggles (D&D 5e invariant) |
| #97 | C.1.c.4 | HP + Death Saves + Hit Dice multiclass (DB schema v3) |
| #98 | C.1.c.5 | Languages + Proficiencies arrays + Features full editor (DB schema v4) |
| #99 | C.1.c.6 | HP clamp fix, HP steppers, name/XP moved to HeroCard |
| #100 | C.1.c.7 | Layout overhaul: IdentityBlock removed, identity migrated to HeroCard, B2 grid |

**C.1.c.7 detail:** Extracted `AlignmentSelect` and `ClassEditor` as standalone subcomponents. `IdentityBlock.tsx` deleted. StatusTab reorganized to B2 grid (HeroCard full-width, Features full-width, Skills+Saves side-by-side). Follow-up polish: alphabetical datalists, AlignmentSelect dark theme fix, ClassEditor level input fixed-width (64px), auto-focus on new class, seamless inline editing on AlignmentSelect.

---

### Phase C.1.d — Combat tab editable (COMPLETED — PR #101–#104)

Attacks editable with expand/collapse cards. DB schema bumped to v5.

- `AttackCard` expand/collapse pattern: compact row for scanning; expanded form for full edit
- `AttackKind` union (`melee | ranged | spell`) with visual icon per type
- Datalists for canonical damage types and ranges
- `ConfirmableRemoveButton` primitive introduced (later applied across 5 components)
- `.alignment-select` dark theme class applied to all `<select>` in AttackCard

---

### Phase C.1.e — Spells tab editable (COMPLETED — PR #105)

Editable spells with slots, prepared toggle, and color-coded schools. DB schema bumped to v6.

- `SpellHeader`: spellcasting ability selector (int/wis/cha), derived DC + attack bonus, syncs `spellSaveDC`
- `SpellSlots`: fill-from-left pip toggle, per-level max editor, SlotLevelAdder select
- `SpellList + SpellCard`: grouped by level, prepared toggle (non-cantrips), school color pip, expand/collapse
- `SPELL_SCHOOLS` canonical array + `SCHOOL_COLORS` record
- `CANONICAL_CASTING_TIMES` datalist
- Runtime hotfix: `normalizeSpells()` defends against legacy `spells` sub-object shape on every read
- ~84 new i18n keys (EN + PT) covering section labels, school names, slot actions, SpellCard fields

---

### Phase C.1.f — Inventory tab editable (COMPLETED — PR #106)

Editable inventory with category grouping, weight bar, and EP removal. DB schema bumped to v7.

- `InventoryList`: grouped by all 5 categories (always visible), `ItemCard` expand/collapse, color-coded
  weight bar, per-category add buttons, `ConfirmableRemoveButton`
- `CurrencyBlock`: 4-coin grid (PP/GP/SP/CP — EP removed), editable with `NumberField` per coin
- `isEquippableCategory(category)` in `derived.ts` — only `weapon | armor` return true
- Equipped checkbox restricted to weapon/armor; placeholder span preserves alignment for other categories
- `normalizeInventory()` runtime normalization added alongside `normalizeSpells`
- EP→SP conversion (1:5) in both DB migration and `normalizeInventory`
- `calculateTotalWeight`, `calculateWeightCapacity`, `getWeightLoadLevel`, `groupItemsByCategory` in `derived.ts`
- `WeightLoadLevel` thresholds: >50% moderate, >75% heavy, >100% overburdened (STR × 15 capacity)
- 84 new tests across 4 files + new `inventory-edit.test.tsx` (72 tests)

---

### Phase C.1.x — My Characters: creation flows (COMPLETED — PR #109)

Character selection screen with create-from-scratch and AI-assisted creation.

- **Create from scratch:** `createEmptyCharacter()` factory in `src/domain/factories.ts` produces a
  fully valid `Character` with sensible defaults (one class "Nova classe", all abilities 10, empty arrays).
  Navigates to Status tab on creation.
- **AI-assisted creation:** modal with text description + EN/PT toggle; calls Cloudflare Worker
  (Llama 3.3 70B Fast); merges response into empty base via defensive merge (missing fields stay default).
  Error codes translated via i18n pattern.
- **Kebab menu** (`CharacterCardMenu`) per character card for future per-row actions (delete first).
- `src/services/ai-generate.ts` service layer encapsulates worker fetch + error classification.
- Worker returns `sleight_hand`; domain uses `sleight_of_hand` — mapped in merge function (workaround).

---

### Delete characters sub-phase (COMPLETED — PR #110)

Cascading delete with partial-failure tolerance.

- Kebab menu → confirmation modal → `deleteCharacter()` in `src/services/delete-character.ts`
- 4 steps: (1) local IndexedDB (blocking), (2) tombstone (deferred), (3) Supabase row (best-effort),
  (4) Storage bucket cleanup (best-effort)
- Result reports `localOk`, `cloudOk`, `storageOk` separately. UI confirms success when local OK.
- Storage cleanup explicit because Supabase does not auto-GC uploaded files (50MB account limit).

---

### Cut v1 dependency sub-phase (COMPLETED — PR #111)

v2 fully independent from v1 IndexedDB at runtime.

- `migrateV1Characters()` removed from `main.tsx` boot sequence.
- Ghost-character bug resolved: v1 chars were re-appearing in v2 on each reload via the migration.
- `adapter.ts` and `migration.ts` marked `@deprecated` but kept as reference for potential future
  "Import from v1 DB" feature.

---

### Polish horizontal + hotfix (COMPLETED — PR #112)

Visual and naming consistency pass across the full UI.

- Renamed `.alignment-select` → `.dark-select` (generic name; class used in 7+ components)
- `FeaturesList`: added `.dark-select` to `type` and `source` selects (regression from C.1.d)
- Desktop header buttons and mobile drawer consolidated (chrome consistency)
- Sync badge removed (was placeholder; sync not yet implemented)
- Hotfix: removed duplicated import button that appeared after PR #112 rebase

---

### Auth status badge sub-phase (COMPLETED — PR #113)

Visual-only badge showing login state in header (desktop) and drawer (mobile).

- `StatusBadge` primitive at `src/components/primitives/StatusBadge.tsx` — `success | neutral`
  variants, colored dot indicator, `aria-hidden` decoration, `data-testid`
- `useAuthStatus` hook at `src/hooks/useAuthStatus.ts` — derives `'authenticated' |
  'unauthenticated' | 'loading'` from `useAuthStore` via Zustand selectors; no duplicate listener
- Badge renders `null` during `loading` state (avoids flash on initial auth check)
- 2 new i18n keys: `auth.connected` (Connected/Conectado), `auth.signin_prompt` (Sign in/Entrar)
- Desktop: badge left of Import/Export/Lock buttons; Mobile: badge right of TBT-RPG title in drawer
- CSS classes: `.status-badge`, `.status-badge-success`, `.status-badge-neutral`, `.status-badge-dot`
  in `src/index.css` (hardcoded colors — no CSS variables in codebase)
- 23 new tests across `status-badge.test.tsx` (12) and `auth-badge.test.tsx` (11)

---

### Sync sub-fase 2.1 — Upload + tombstones (COMPLETED — PR #116)

- `sync.ts`: upload local chars to Supabase with LWW guard, tombstone propagation
- Debounced reactive sync (15s after last edit), periodic background sync (30s)
- `deleted_characters` table + `deleted_characters` IndexedDB store for tombstones
- DB schema v9: `deleted_characters` store, createObjectStore in Phase 1 (before awaits)
- Defensive v8 heal guard: broken installs that missed the store creation are fixed on v9 upgrade

### Sync sub-fase 2.2 — Download + multi-device (COMPLETED — PR #117)

- `downloadCharacters()`: fetches cloud chars + tombstones, LWW conflict resolution, propagates cloud tombstones → deletes local chars
- Pre-fetch cloud tombstone IDs before upload loop: prevents re-upload of chars deleted on another device
- `downloadCharacterImages()`: eager image download for chars new to device (idempotent)
- `importCharacter()`: preserves cloud timestamp exactly (no `Date.now()` stamp → no ping-pong re-upload)
- 9 new tests covering upload-phase guard and multi-device delete propagation

### Lock functional sub-phase (COMPLETED — PR #122)

Read-only mode with well-defined permanent vs transient scope.

- `locked?: boolean` added to `Character` domain model (`src/domain/character.ts`)
- DB schema bumped v9 → v10: cursor-based backfill + `normalizeLocked()` runtime defense
- `useCharacterLocked(characterId)` hook in `src/hooks/useCharacterLocked.ts` — thin
  Zustand selector, called directly by leaf components (no prop drilling through tabs)
- Lock toggle button in `DesktopShell` (header, top-right) and `MobileShell` (drawer);
  shows 🔒 Bloquear (unlocked) ↔ 🔓 Destravar (locked) with red-tint visual
- **Permanent stats read-only when locked:** identity fields, abilities, saving throw
  proficiencies, skill proficiencies, features, languages, proficiencies, attacks,
  spell card fields (except prepared toggle), inventory item fields (except quantity
  and equipped), lore/backstory/notes/personality, portrait upload
- **Transient stats always editable:** HP current/temp, ±HP steppers, death saves,
  hit dice current, spell slot pips (current), prepared toggle, equipped toggle,
  item quantity, currency PP/GP/SP/CP, inspiration, XP
- Cards (AttackCard, SpellCard, ItemCard) still expand when locked — form shows with
  `readOnly` inputs so user can consult details during play
- `readOnly = !onUpdate` (preview mode) vs `locked` (lock mode): two distinct concepts;
  `onUpdate` continues to pass when locked (transients need it)
- Hotfix: SpellCard name input lives in the compact header row (outside the
  `{expanded && !readOnly && (...)}` form block). The input was missing `readOnly={locked}`;
  fix added `readOnly={locked}` and `autoFocus={!locked}` to that specific input
- 51 new tests in `tests/lock-mode.test.tsx` (normalizeLocked, DB migration, hook,
  toggle button, field read-only coverage for all permanent and transient fields)

#### Lock mode pattern

Permanent fields receive `readOnly={fieldReadOnly}` or `disabled={fieldReadOnly}`
where `fieldReadOnly = !onUpdate || locked`. Transient fields receive only
`readOnly={transientReadOnly}` where `transientReadOnly = !onUpdate` — lock does NOT
restrict transient fields.

Care must be taken when inputs live **outside** the expanded form block
(e.g. spell name input in the compact row header) — these also need explicit
`readOnly={locked}`.

---

### Auth signup flow (COMPLETED — PR #127)

Dual mode signin/signup integrado em `/login`. Antes do fix, botão "Criar conta" da CharSelect levava pra `/login` sem fluxo de signup real (bug bloqueador).

- Auth store ganha action `signUp(email, password)` retornando `{ status: 'signed_in' | 'email_confirmation_required' | 'error' }`
- `Login.tsx` aceita query param `?mode=signup` ou toggle interno; estado `mode: 'signin' | 'signup'` inicializado via lazy `useState` do query param
- Tela de "aguardando confirmação de email" após signup quando Supabase exige (detecção via `data.session === null` no retorno do signUp)
- Validação client: email regex, password 6+ chars, confirmação igual
- Erros server-side parseados: email já registrado, password fraca, email inválido
- `CharSelect` aponta "Criar conta" pra `/login?mode=signup`
- Email normalizado (trim + lowercase) no signup pra evitar duplicação acidental

---

### Camp.1 — Foundation (COMPLETED — PR #125)

Base do sistema multi-user de campanhas. Tabelas + RLS + service layer + UI inicial.

- Tabelas: `campaigns`, `campaign_members`, `user_profiles`
- RLS recursive bug (42P17) resolvido via SECURITY DEFINER function `is_campaign_member(campaign_id, user_id)` — usada em policies de campaigns, campaign_members, user_profiles e depois reutilizada em characters/storage
- Trigger `on_campaign_created` (AFTER INSERT) insere owner como master member automaticamente — invariante a nível de schema
- `ProfileSetupModal`: upsert de `user_profiles.display_name` na primeira vez que user acessa Campanhas
- `CharSelect` ganhou seção "Minhas Campanhas" com cards compactos e botão "+ Criar"
- Login com `redirectTo` via `useSearchParams`
- Routes `/campaigns` (`CampaignSelect`) + `/campaigns/:id` (`CampaignDetail`)

---

### Camp.2 — Invites (COMPLETED — PR #126)

Sistema de convite por código de 8 caracteres alfanuméricos.

- Coluna `invite_code text UNIQUE` em campaigns + trigger `on_campaign_invite_code` (BEFORE INSERT) pra gerar automático com retry pra unicidade
- Alfabeto seguro (sem 0/O/1/I/L) pra evitar ambiguidade visual
- Função `generate_invite_code()` com retry até encontrar código único
- 3 SECURITY DEFINER functions: `lookup_campaign_by_code` (retorna só id/name/description — sem dados sensíveis), `accept_campaign_invite` (insert atômico bypass RLS), `regenerate_invite_code` (owner-only, gera novo código)
- Hotfix Postgres 42702 (ambiguous column): renomear `RETURNS TABLE` columns pra `r_campaign_id` + `r_status`, aliasing `cm` em queries internas
- `InviteCodeBlock` + `JoinCampaignModal`
- `CampaignDetail` expandida com members list (display_name + role badge)
- Botão "Entrar com código" em `CharSelect` + `/campaigns`

---

### Camp.3 — Vincular chars (COMPLETED — PR #128)

Tabela `campaign_characters` linkando chars locais (IndexedDB) a campanhas (Supabase).

- `character_id` como `text` (não `uuid`) — chars locais usam ID format custom `char_<timestamp>_<random>` (hotfix Postgres 22P02)
- Sem FK pra `characters` table — char canônico vive no IDB, não na cloud; cascade delete tratado em camada de aplicação
- RLS: owner do char + member da campanha pode vincular; owner do char pode desvincular (expandido em Camp.5 pra master também)
- `buildCharacterSummary` deriva "Race — Class Level" a partir do `Character` (snapshot no momento do vínculo)
- Cascade delete em camada de aplicação: `deleteCharacter` chama `unlinkCharacterFromAllCampaigns` antes do row delete
- `LinkCharacterModal` filtra chars já vinculados
- `CampaignDetail` mostra lista de vinculados com owner display name e botão desvincular (próprio user only — expandido em Camp.5)

---

### Camp.4 — Live read-only view (COMPLETED — PR #129)

Mestre visualiza fichas vinculadas em modo read-only universal com polling de 15s.

- Policy adicional em `characters` permite members lerem chars vinculados (via `is_campaign_member`)
- Policy adicional em `storage.objects` permite ler imagens de chars vinculados
- Service `campaign-view.ts` faz fetch sem persistir no IndexedDB (memory only via `useCampaignViewStore`)
- `useCampaignViewStore` com polling silencioso (diff por `updatedAt`); loading state estático na primeira carga, silencioso nos polls seguintes
- `ForceReadOnlyContext` + `useEffectiveReadOnly` hook: locked normal preserva transients editáveis; campaign view bloqueia tudo (HP, slots, equipped — tudo)
- Página `/campaigns/:id/characters/:charId` (`CampaignCharacterView`)
- Hotfix layout: refazer reusing pattern do `DesktopShell`/`MobileShell` via variantes `CampaignDesktopShell` + `CampaignMobileShell` (evita duplicação visual)
- Hotfix leave campaign: novo service `leaveCampaign` (DELETE em `campaign_members`) + cascade unlink + `ConfirmLeaveCampaignModal`
- Char deletado detectado durante polling → redirect automático pro `/campaigns`

---

### Camp.5 — Polish (COMPLETED — PR #130)

Refinamentos finais: kebab por row de member, edit display name, remoção de members pelo master, deep link, expansão do master desvincular chars.

- Nova policy RLS: "Owners can unlink any character in their campaigns" — cascade para master
- `MemberRowMenu` com matriz de visibilidade contextual:
  - Player na própria row: edit name + leave campaign
  - Owner na própria row: edit name + delete campaign
  - Owner em row de player: remove member (com cascade de chars vinculados)
  - Outros casos: sem kebab
- `EditDisplayNameModal`: reusa `upsertMyProfile` do Camp.1
- `removeMember` service com cascade unlink + guard `cannot_remove_self`
- `ConfirmRemoveMemberModal`
- Bloco "Ações da campanha" no rodapé REMOVIDO — centralizado no kebab
- Master agora pode desvincular char de qualquer player (via policy nova)
- Deep link `/join/:code` → `JoinByLink` page → redirect inteligente:
  - Não logado: `/login?redirectTo=/campaigns?openJoin=CODE`
  - Logado: `/campaigns?openJoin=CODE` → `JoinCampaignModal` abre pré-preenchido
- `CampaignSelect` lê `openJoin` param via lazy `useState` (evita setState-in-effect); cleanup do param após abrir
- Hotfix copy link: `InviteCodeBlock` ganha 2 botões — primário "Copiar link" (URL com `import.meta.env.BASE_URL`) + secundário "Copiar código"
- Estado `copiedTarget: 'link' | 'code' | null` isola feedback "Copiado!" por botão sem cross-contamination
- Hotfix lint: cleanup de `renderDetail` + `CampaignDetail` import + `Routes, Route` orphaned após remoção dos describe blocks

---

### v2 promotion to root — v1 removal (COMPLETED — PR #118)

Structural reorganisation: v2 becomes the root application; v1 is removed from the repository.

- Tag `v1-final` preserves v1 history before removal
- `v2/` contents moved to root via `git mv` (preserves file history)
- v1 files removed: `css/`, `js/`, `public/`, `index.html`, `vite.config.js`, `eslint.config.js`, `scripts/`, v1 `tests/`, v1 `package.json`
- `adapter.ts`, `migration.ts`, `schema-v1.ts` deleted (were `@deprecated`); `attack-helpers.test.ts` and `adapter.test.ts` and `migration.test.ts` removed
- Migration helpers (`migrateProfString`, `inferAttackKind`, `parseBonusString`) inlined as private functions in `db.ts` (still needed for v3/v4 schema upgrade callbacks)
- `vite.config.ts` base: `/TBT-RPG/v2/` → `/TBT-RPG/`
- Router basename: `/TBT-RPG/v2` → `/TBT-RPG`
- Deploy workflow: single root build (no v1/v2 parallel steps)
- CharSelect: badge "v2 · Preview" removed; empty state → "Nenhum personagem ainda. Vamos começar?"; v1 footer link removed
- Test count: 1363 → 1200 (removed adapter.test.ts: 1097 lines, migration.test.ts: 148 lines, attack-helpers.test.ts: 167 lines)

### Auth email confirmation + SPA fallback (COMPLETED — PR #140)
- 404.html (spa-github-pages, `pathSegmentsToKeep=1`) + snippet de decode no `index.html`.
- `emailRedirectTo` derivado de origin+BASE_URL; Site URL do Supabase corrigido pro subpath `/TBT-RPG/`.
- Banner verde de confirmação na CharSelect; captura genérica de `type` no boot.
- Fecha o 404 de confirmação de email + hard refresh + deep links `/join/CODE`.

### Auth forgot password + recovery reset (COMPLETED — PR #142)
- Modo `forgot` no Login (mensagem neutra anti-enumeração); página full-screen `ResetPassword` gated
  por `authCallbackType === 'recovery'`; ações `requestPasswordReset` / `updatePassword`.
- `DismissibleBanner` reutilizável (tone success/error, auto-dismiss 10s, action button com stopPropagation).
- Hotfix incluído: `src/auth-callback.ts` captura o hash ANTES do `createClient()` (que consome o hash no
  import-time); banner âmbar acionável pra link expirado/usado (`otp_expired`) + deep link `?mode=forgot`.

### Hit die PT-BR localization (COMPLETED — PR #144)
- `getHitDie`/`CLASS_HIT_DIE` por nomes EN + PT-BR (PHB-PT), case- e accent-insensitive (NFD strip).
- Forward-only; `db.ts` intocado. Resolve a OQ de produção de dados de vida.

### Class level label + total-level differentiation (COMPLETED — PR #147)
- Header de coluna "NÍVEL" sobre o input de nível por classe (`ClassEditor`, `aria-hidden`).
- HeroCard total → `hero.total_level_label` ("Nível Total"); `LoreHero` mantém `hero.level_label`.

### Account deletion + login UX (COMPLETED — PR #149)
- Exclusão de conta orquestrada (campanhas → storage → cloud chars → IndexedDB → RPC → signOut),
  modal com confirmação por e-mail, função SQL `delete_own_account` (SECURITY DEFINER, `auth.uid()`).
- `PasswordInput` reutilizável (mostrar/ocultar senha) no Login e ResetPassword.
- Submit-on-Enter via `<form onSubmit>` com `preventDefault` (botões secundários `type="button"`).

### Campaign maps — foundation + viewer (COMPLETED — PR #152)
- Tabela `campaign_maps` + RLS por membership via helpers SECURITY DEFINER
  (`is_campaign_member`/`is_campaign_owner`); bucket privado `campaign-maps` com RLS de storage que
  extrai o campaign_id do 1º segmento do path (`{campaignId}/{mapId}.{ext}`).
- Service (upload com dimensões medidas no browser, list, delete, signed URL 1h); viewer react-leaflet v5
  `CRS.Simple` + `ImageOverlay`; seção "Mapas" na CampaignDetail (dono sobe/remove, membro vê).
  Storage-only (sem cópia offline).

### Campaign maps — markers (COMPLETED — PR #153)
- Tabela `campaign_map_markers` (FK `map_id → campaign_maps ON DELETE CASCADE`) + RLS via helpers
  `is_map_member`/`is_map_owner` (resolvem a campanha pelo mapa).
- Coords em pixel (x=lng, y=lat no `CRS.Simple`), render em `[y,x]`; `L.divIcon` SVG (contorna o ícone
  default do Leaflet no bundler); click-to-add + popup rename/remove pro dono, leitura pro membro.
  Label-only.

### Campaign maps — polish (COMPLETED — PR #154)
- Limpeza de storage no `deleteCampaign` ANTES de apagar a linha (RLS ainda válida), best-effort —
  herdada pelo `delete-account`; cota de ≤20 mapas por campanha no upload; polling 15s **só pra membro**
  (lista na section + marcadores no viewer); ajustes mobile (inputs `fontSize:16`). Fecha a v1 de mapas.

### Tactical maps — grid (COMPLETED — PR #157)
- Grade quadrada configurável por mapa via COLUNAS em `campaign_maps`
  (`grid_enabled/size/offset_x/offset_y/color`) — reusa a RLS existente (membro lê a linha do mapa, dono
  escreve), sem tabela/policy nova.
- Overlay `SVGOverlay` (viewBox em pixels, `pointer-events:none`, `vector-effect=non-scaling-stroke`);
  painel de config colapsável do dono com preview ao vivo; propagação otimista do save ao cache da section
  (dono não tem polling, então precisa refletir a própria edição).

### Tactical maps — tokens (COMPLETED — PR #158)
- Tabela `campaign_map_tokens` (FK `map_id` cascade) + RLS via `is_map_member`/`is_map_owner`. Disco
  colorido + rótulo + `size` em células (1–5).
- Dono adiciona por botão (o clique-no-mapa é do marcador), arrasta com `snapToGrid` (helper puro) ao
  centro da célula, edita/remove; membro read-only via polling 5s. Toolbar vertical à direita.

### Tactical maps — manual fog (COMPLETED — PR #159)
- Tabela `campaign_map_fog` (1 linha/mapa, `revealed` jsonb de "col,row") + RLS via `is_map_*`. Fog por
  célula (exige grid).
- Máscara SVG única (não N rects), assimétrica: dono `fill-opacity` ~0.5, membro opaco. Modo de edição com
  Pointer Events (drag-paint desktop + touch, `touch-action:none`, pan travado, cursor crosshair); flip de
  Y na entrada do clique (`height - lat`); persistência única no `pointerup`. LOS dinâmico fora de escopo.

### Map viewer — expand/maximize (COMPLETED — PR #162)
- Botão maximizar/restaurar no header do modal (CSS-maximize `96vw × 94vh`; não Fullscreen API — iOS não
  suporta em elemento arbitrário). `InvalidateOnChange` (filho do `MapContainer`) chama
  `map.invalidateSize()` ~150ms após o toggle, preservando pan/zoom e mantendo a conversão de coordenada
  correta. `expanded` reseta ao fechar o modal.

### Spell slots — remoção no mobile (COMPLETED — PR #163)
- Remover um nível de espaço de magia dependia de reduzir a 0 (setas do `input type=number`, ausentes no
  mobile). `ConfirmableRemoveButton` (dois cliques) por nível chamando `onMaxChange(0)` (reusa o
  `updateMax(0)` que já apaga); o input segue disponível no desktop.

### Tactical maps — token zoom scale (COMPLETED — PR #165)
- Token deixa de ter tamanho fixo em px: `<Marker>` + divIcon com o diâmetro recomputado no `zoomend` via
  `pxPerUnit` (projeção de dois pontos `latLngToLayerPoint`), ficando proporcional à célula em qualquer
  zoom. Helper puro `tokenDiameterPx`; a chave do cache do ícone inclui o tamanho.

### Tactical maps — tokens under fog (COMPLETED — PR #166)
- Pros jogadores, tokens em células não-reveladas ficam ocultos (regra do **centro**:
  `pointToCell(tok.x, map.height - tok.y, localGrid)` — mesmo flip de Y do fog). Mestre sempre vê tudo;
  frescor pelo polling de 5s existente.

### Tactical maps — token images (COMPLETED — PR #167)
- Upload próprio por token no bucket `campaign-maps` sob `{campaignId}/tokens/{tokenId}.{ext}` (RLS de
  storage reusada — 1º segmento = campaignId; coluna `image_path`). Render circular + anel na cor, fallback
  disco colorido, escala com o zoom, oculta sob fog igual. Signed URL 1h cacheada por path; limpeza de
  órfãos no replace, no delete do token e varrendo `tokens/` no delete de campanha.

### CI — de-flake campaign-character-view (COMPLETED — PR #170)
- Testes do sidebar esperavam o container `campaign-view-char-list` e consultavam os botões `char-nav-*`
  com `getAllByTestId` síncrono (corrida com o render async). Trocado por consultas assíncronas
  (`findAllByTestId` / asserção dentro de `waitFor`). Sem mudança de produção.

### Tactical maps — marker double-click (COMPLETED — PR #171)
- Criação de marcador passou de clique simples (marcador à toa) para **duplo-clique**
  (`useMapEvents({ dblclick })`) + `doubleClickZoom={false}` no `MapContainer` (pra o duplo-clique não dar
  zoom). Fluxo do marcador pendente (popup/label) inalterado.

### Tactical maps — token portrait from linked character (COMPLETED — PR #172)
- No popup do token, o mestre escolhe um personagem vinculado e o **retrato é copiado** como imagem do
  token (`setTokenImageFromCharacterPortrait`: data URL → blob → `image_path`), reusando bucket/RLS/limpeza/
  render/escala/ocultar-sob-fog. Personagem sem retrato fica desabilitado no seletor. **Cópia**, não
  referência ao vivo.

### Sheet — auto-growing description textareas (COMPLETED — PR #177)
- Primitivo `AutoGrowTextarea`: ajusta a altura via `scrollHeight` no `useLayoutEffect`[value] + no `resize`
  do window; `rows` como mínimo; sem scroll interno nem alça de arrastar. Aplicado às descrições de magia,
  característica, ataque e item.

### Sheet — single-open accordion for card lists (COMPLETED — PR #178)
- Expansão de card subiu pra `openId` no nível da lista (SpellList/AttacksList/InventoryList) + fechar em
  `pointerdown` fora da lista. Corrige o bug em que, com um card aberto (A), clicar num card **abaixo** (B)
  só retraía A: o `onBlur` por card retraía A e deslocava o layout antes do clique em B completar. Card novo
  abre pelo `openId`; single-open por lista.

### Sheet — collapsible features + shrink name field (COMPLETED — PR #179)
- Características adotaram o mesmo acordeão (resumo fechado: nome + fonte + tipo + usos; expandido com a
  descrição em `AutoGrowTextarea`). Nas 4 listas (magia/ataque/característica/item), o campo de nome passou a
  `flex:'0 1 auto'` + `maxWidth: min(60%,320px)`, com um `header-gap` clicável que retrai o item.

### Tactical maps — token preset library (COMPLETED — PR #184)
- Biblioteca de tokens prontos **por campanha**: tabela `campaign_token_presets`
  (label/color/size/image_path) + RLS via `is_campaign_owner` (só o dono). Service CRUD + upload de imagem em
  `campaign-maps/{campaignId}/presets/{presetId}.{ext}` (RLS de storage reusada); `deleteCampaign` passou a
  varrer também `presets/`. Seção "Tokens prontos" no CampaignDetail (só dono): criar/editar/excluir.

### Tactical maps — place tokens from presets (COMPLETED — PR #185)
- Paleta de presets no viewer (só dono): armar um preset (destaque + cursor crosshair) e cada **clique
  simples** no mapa coloca um token via `createMapToken` + `snapToGrid` (sem flip de Y), copiando
  nome/cor/tamanho. Se o preset tem imagem, ela é **copiada** pro token (`uploadTokenImageBlob`) —
  desacoplando do preset. Fica armado (coloca vários) até "Concluir"; o duplo-clique do marcador é ignorado
  enquanto armado. Toolbar reordenado (Adicionar token + Tokens prontos juntos).

### Tactical maps — token status conditions (COMPLETED — PR #188)
- Coluna `conditions jsonb` em `campaign_map_tokens` (14 condições fixas de 5e; módulo
  `src/domain/conditions.ts` com cor por condição). Chips de abreviação renderizados **abaixo** do token (até
  3 + "+N"); `iconAnchor` fica no **centro do círculo** (`[d/2,d/2]`) — só a **altura** do `iconSize` cresce,
  então snap/drag/escala/ocultar-sob-fog não mudam. A chave do cache do `getTokenIcon` passou a incluir as
  condições. Toggle no popup (só dono); membros veem via polling de 5s.

### Tactical maps — shared AoE area shapes (COMPLETED — PR #189)
- Formas de área compartilhadas por mapa: tabela `campaign_map_areas` (`shape` 'circle'|'square', centro
  `x`/`y`, `radius`, `color`) + RLS `is_map_*`. Desenho por **arraste do centro** (`AreaInteraction`, mesmo
  padrão de Pointer Events do fog + `touch-action:none`, pan travado); centro guardado em **espaço de viewBox**
  (`x=lng`, `y=height-lat`), **raio = distância euclidiana** (invariante ao flip). `SVGOverlay`
  (`pointer-events:none`) renderiza círculo/rect + preview pra todos; membros via polling de 5s; "Limpar
  tudo". `areaMode` exclusivo com fog/preset.
  - Hotfix (desenho não aparecia): handler de gesto não pode depender de estado que muda durante o arraste —
    `handleAreaEnd` lia `areaPreview` (mudava a cada move) → o `useEffect` do `AreaInteraction` remontava no
    meio, resetando `dragging`/pointer-capture. Fix: `areaPreviewRef` + tirar `areaPreview` das deps do `onEnd`
    (mesma lição do `fogRef`).
  - Hotfix (token arrastava ao desenhar): `draggable={isOwner && !areaMode && !fogMode}` — token
    não-arrastável nos modos de desenho, aí o `pointerdown` borbulha ao container e a área/fog inicia mesmo
    começando sobre um token.

### Tactical maps — broadcast screen (COMPLETED — PR #192)
- Resolve o vazamento de compartilhar a tela do mestre (a vista dele revela névoa/segredos). Rota nova
  `/campaigns/:id/maps/:mapId/broadcast` (`CampaignMapBroadcast`) que o mestre abre em **segunda janela**
  (`window.open`) e joga no projetor / compartilha só ela; renderiza o mapa em **perspectiva de jogador**
  (névoa opaca, tokens ocultos somem, sem toolbar/popups, tela cheia).
- Sync por **BroadcastChannel** `tbt-map-{mapId}` (mesma origem/navegador/máquina — nada vaza pra outros
  usuários). A janela de controle (dono) é **emissor**: posta o **estado completo** (`tokens/fog/areas/grid`)
  no mount, a cada mudança, e em resposta ao `hello`. A janela de transmissão é **receptor**: aplica o
  snapshot e posta `hello` no mount; todos os fetch/poll do Supabase ficam sob `if (broadcast) return` —
  **zero estado ao vivo do Supabase** (só resolve a signed URL da imagem via `getCampaignMap`+`image_path`).
- Handshake nas duas ordens de abertura; estado-completo (não delta) auto-corrige qualquer dessincronia.
  Sem polling/Realtime. É um passo manual do mestre (abrir a janela).

### Tactical maps — AoE line & cone + size label + per-area removal (COMPLETED — PR #197)
- Completa as formas de área: além de círculo/quadrado (centro + `radius`), agora **linha** e **cone** —
  formas de **dois pontos** (com direção). Schema ganhou `x2`/`y2` **nulos** (linha = começo→fim, cone =
  ápice→ponta); `radius` mantido pra círculo/quadrado — **retrocompatível** com as áreas já salvas.
- Desenho de linha/cone **arrasta do começo**, com **flip de Y nos dois pontos**; render `<line>`
  (stroke-width = célula) e `<polygon>` (cone 5e: base centrada na ponta, meia-largura `L/2` → largura na
  ponta = comprimento). Círculo/quadrado inalterados.
- Melhorias: **rótulo de tamanho** durante o arraste ("N ft (M□)", `font-size = 12/pxPerUnit`, dependente do
  grid) e **remover área individual** pela lista do painel (`deleteMapArea` + filtro), além do "Limpar tudo".
  Linha/cone aparecem na tela de transmissão automaticamente (areas já no snapshot).

### Dice — engine + manual tray + local history (COMPLETED — PR #202)
- Motor `src/domain/dice.ts`: parser `NdM±K`, RNG justo por `crypto.getRandomValues` + rejection sampling
  (`rng` injetável p/ teste); vantagem/desvantagem só em d20 (2d20 keep high/low, descartado com `kept:false`);
  crit 20/1; `RollResult` **serializável**. Store `useDiceStore` (histórico cap 20; `lastResult` como **fonte
  única** do card — evita card congelado em rolagem contextual). Bandeja manual (d4…d100 + quantidade/modificador
  via `NumberField` com steppers, amigável no mobile) + FAB; painel limitado à viewport (flex + `minHeight:0`,
  só o histórico rola).

### Dice — contextual sheet rolls (COMPLETED — PR #203)
- Tocar em perícia / resistência / atributo / iniciativa / ataque / dano / teste-de-morte / dado-de-vida rola
  via o motor (helper de ficha), com affordance de dado (ícone + hover + aria) por superfície. Seletor visível
  Normal/Vantagem/Desvantagem (`rollMode`, **fonte única** no store, só afeta d20). Ataque com nat 20 → botão
  "dano crítico" (`doubleDiceCount`, dobra só os dados). **Não muta a ficha** (não gasta dado de vida nem marca
  teste de morte — isso segue nos controles manuais).

### Dice — shared campaign roll log (COMPLETED — PRs #204–#206)
- Log compartilhado por campanha: tabela `campaign_dice_rolls` (`result` jsonb) + RLS `is_campaign_member`
  (insert com `user_id = auth.uid()`) + **retenção por trigger** (TTL 12h + teto 50/campanha) — sem cron/cliente.
  Rolagem na ficha de personagem vinculado insere **uma linha por campanha vinculada** (`addRoll`
  fire-and-forget; sem vínculo → só local). Painel `CampaignRollLog` (polling 5s; dono limpa) no CampaignDetail
  **e** no viewer (ausente no `broadcast`). Mestre rola da página ou do viewer como "Mestre" — o
  **CampaignDetail é o dono do contexto** de dados (o viewer só **usa**, nunca seta, pra não limpá-lo ao fechar).
  Layout do CampaignDetail responsivo (grid 2-col no desktop via `auto-fit minmax(min(100%,460px),1fr)`,
  empilhado no mobile).

### Sheet — clearer attack/damage roll buttons on mobile (COMPLETED — PR #209)
- Na linha de ataque, os gatilhos minúsculos (bônus "+3" + ícone de dado) viraram **dois botões rotulados**
  ("Atacar +3" / "Dano 1d10"), maiores (≥36px), à esquerda (fora do canto do FAB). Conteúdo do MobileShell
  ganhou `paddingBottom` pra o último card clarear o FAB. Só apresentação; lógica de rolagem intacta.

### Sheet — localized fixed-list class select (COMPLETED — PR #211)
- Campo de classe deixou de ser texto-livre e virou **lista fixa localizada**: guarda a **chave canônica**
  (`CANONICAL_CLASSES`) e exibe o **rótulo traduzido** (PT/EN) via i18n. `getCanonicalClass` (EN+PT, acento/
  case-insensível) reconhece legados (Bruxo→Warlock) — que passam a traduzir sozinhos; homebrew/typo cru via
  `__custom__`. `classLabel(name,t)` localiza a exibição (`formatClassesShort` com resolver + `HitDicePool`).
  Dado de vida sempre de valor reconhecido (fim do bug de classe em PT). Campo com `maxWidth` no desktop, sem
  "Nova classe" (placeholder). `SpellHeader` intacto.

### Auth — logout limpa fichas locais (COMPLETED — PR #212)
- No **logout explícito**: `syncAll()` (flush) → `supaSignOut()` → **se o flush deu certo** →
  `clearAllLocalData()` + reset dos stores em memória (`useCharactersStore.reset()`, `clearCharacter`,
  sessionStorage). **Se offline/flush falhou** → mantém as fichas e sinaliza (`localKept`) pra evitar perda de
  edição. Não limpa em SIGNED_OUT por expiração de sessão. Resolve o "lixo" e a contaminação entre contas no
  mesmo dispositivo.

### Campaigns — vida dos vinculados por polling (COMPLETED — PR #213)
- `CampaignDetail` passou a repetir `loadLinkedDetails` por `setInterval` (~10s, limpo no unmount), além do
  fetch de mount — a vida (HP) dos personagens vinculados atualiza sem recarregar a página. Imagens seguem lazy
  (não repolidas).

---

## Patterns established during C.1.c

These patterns are in use across the Status tab and will repeat in C.1.d+.

#### State-local string for number inputs

Number inputs use a local string state to allow intermediate empty state during typing
without contaminating the domain model with invalid values. The domain only updates with
valid parsed numbers; derived displays always read from the domain (last valid state).

`NumberField` in `src/components/primitives/NumberField.tsx` implements this. See
`AttrGrid.tsx` for the canonical in-component application, and `HpBlock`, `HitDicePool`,
`ClassEditor` (level), and `LoreHero` (XP) for additional usages.

#### Seamless inline editing

Inputs have a transparent border at rest and a visible border on hover/focus. Pattern:

```tsx
const SEAMLESS_INPUT: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 6,
  padding: '4px 6px',
  // ...
}
// Tailwind hover/focus on top:
className="hover:border-[#2A2537] focus:border-[#2A2537] transition-colors"
```

`AlignmentSelect` uses the same pattern but must use `backgroundColor` (not `background`
shorthand) to preserve the `backgroundImage` chevron SVG as a separate CSS property.

#### Toggle pattern (pip-based)

Boolean toggles use `<button>` wrapping a pip/circle visual. See `SavingThrows`,
`SkillsBlock`, `DeathSaves`. Gap of 6px between adjacent pips for touch comfort.

#### List editing pattern (add/update/remove)

Arrays use:
- Append on add (push to end)
- Map with **item identity by name** for classes/hitDice, **by UUID** for features,
  **by index** for languages/proficiencies/other simple lists
- Filter on remove

Default values for name-identified items must be **non-empty** (invariant from
C.1.c.4 follow-up: prevents "ghost" hitDice entries with empty className).
Deduplication: if default name already exists, append ` 2`, ` 3`, etc.

#### Auto-focus after add

When an add action creates a new row, focus the new input after render using
`useRef<number | null>(null)` + `useEffect` (no deps array):

```tsx
const newlyAddedIndexRef = useRef<number | null>(null)

function add() {
  newlyAddedIndexRef.current = list.length  // index of the new entry
  onUpdate({ ... })
}

useEffect(() => {
  if (newlyAddedIndexRef.current !== null) {
    const input = document.querySelector(`[data-testid="...-${newlyAddedIndexRef.current}"]`) as HTMLInputElement | null
    input?.focus()
    input?.select?.() ?? input?.setSelectionRange(0, input.value.length)
    newlyAddedIndexRef.current = null
  }
})
```

Using `useRef` (not state) avoids triggering a re-render for the focus side-effect.

#### Class/hitDice sync invariants

`classes` and `hitDice` are parallel arrays but linked by `className` (not index):
- Rename: `hitDice.map(hd => hd.className === oldName ? { ...hd, className: newName, dieSize: getHitDie(newName) } : hd)`
- Remove: `hitDice.filter(hd => hd.className !== removedName)`
- Level reduce: clamp `hitDice.current` to `Math.min(hd.current, newLevel)`
- `getHitDie(name)` in `src/domain/classes.ts` — returns canonical die size (8 default)

#### Database schema versions

| Version | DB | Change |
|---------|-----|--------|
| v1 | `dnd-character-sheet` | v1 legacy shape (frozen) |
| v2 | `dnd-character-sheet-v2` | initial v2-native `Character` shape |
| v3 | `dnd-character-sheet-v2` | adds `className` to hitDice entries |
| v4 | `dnd-character-sheet-v2` | proficiencies as arrays + languages top-level + features `id`/source/type/uses |
| v5 | `dnd-character-sheet-v2` | attacks expanded with kind/range/properties/notes (C.1.d) |
| v6 | `dnd-character-sheet-v2` | spells expanded with school/castingTime/range/prepared; spellcasting ability/class top-level (C.1.e) |
| v7 | `dnd-character-sheet-v2` | inventory items with category/equipped; EP removed from currency (C.1.f) |
| v8 | `dnd-character-sheet-v2` | BUGGY — `deleted_characters` store was placed after async cursor ops; versionchange tx auto-committed before createObjectStore ran for some install paths |
| v9 | `dnd-character-sheet-v2` | `deleted_characters` store (tombstones for sync sub-fase 2.1); createObjectStore moved to synchronous Phase 1 of upgrade callback before any `await`; also heals broken v8 installs via defensive `< 9` guard |
| v10 | `dnd-character-sheet-v2` | adds `locked: boolean` field to `Character`; cursor-based backfill sets `locked: false` on existing characters; `normalizeLocked()` runtime defense added to read path (lock functional sub-phase) |

Each schema bump is a cursor-based upgrade callback in `src/data/db.ts`, idempotent.

**Critical invariant:** ALL `createObjectStore` / `deleteObjectStore` calls must live in the synchronous "Phase 1" header of the `upgrade` callback, before any `await`. Data migrations (cursor-based) go in "Phase 2" after all stores are declared. See db.ts comments.

**Note:** Camp.1-5 sub-phases did NOT modify IndexedDB schema. All campaign data lives in Supabase tables (`campaigns`, `campaign_members`, `user_profiles`, `campaign_characters`). Character data continues in IndexedDB v10; only the link between char and campaign is in Supabase.

---

## Patterns established during C.1.d / C.1.e / C.1.f

#### Compact card + expand/collapse per item

Used in `AttackCard`, `SpellCard`, `ItemCard`. Pattern:

- Compact mode: read-optimized for scanning in play
- Expanded mode: full edit form with all fields
- Click on card body expands; clicks on inputs/buttons/checkboxes do not propagate
- Focus blur outside the card collapses
- One card expanded at a time per list (natural via blur)

```tsx
const [expanded, setExpanded] = useState(false)

function handleCardClick(e: React.MouseEvent) {
  if ((e.target as HTMLElement).closest('input, button, textarea, select, [role="checkbox"]')) return
  setExpanded(prev => !prev)
}

function handleBlur(e: React.FocusEvent) {
  if (!cardRef.current?.contains(e.relatedTarget as Node)) setExpanded(false)
}
```

#### UUIDs for list items

All list-managed items (attacks, spells, inventory items, features) use
`crypto.randomUUID()` for stable identification. Index-based identification
is an anti-pattern (caused "ghost" hitDice bug in C.1.c.4).

Exception: languages and proficiencies items use index since they're plain
strings. A refactor to UUID is on the table (OQ).

#### Color-coded visual indicators

Multiple uses across phases:

- Spell schools (C.1.e): 8 colors in `SCHOOL_COLORS` map
- Weight load levels (C.1.f): 4 colors via `getWeightLoadLevel`
- HP bar (C.1.c.4): green + purple temp HP overlay
- Pip filled/empty (death saves, skill expertise, slot tracking)

Pattern: centralize in a map/helper, apply via `style={{ backgroundColor }}`.

#### ConfirmableRemoveButton for destructive actions

`src/components/primitives/ConfirmableRemoveButton.tsx` — inline two-step
confirmation (click × → "Confirmar?" → click confirms). Click outside cancels.
Auto-reset after 5s timeout. Applied to: `AttacksList`, `FeaturesList`,
`ClassEditor`, `EditableStringList`, `SpellList`, `InventoryList`.

#### Schema migration cursor pattern

Each DB version bump uses cursor iteration through all characters with
defensive defaults:

```ts
if (oldVersion < N) {
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  let cursor = await store.openCursor()

  while (cursor) {
    const char = cursor.value
    // Normalize: detect old shape, apply new defaults, never lose data
    await cursor.update(char)
    cursor = await cursor.continue()
  }
}
```

Each migration must be **idempotent** — running twice must not corrupt data.
Tests explicitly cover idempotency for each migration.

#### Runtime normalization as defense-in-depth

After the C.1.e hotfix (`character.spells is not iterable`), runtime normalizer
functions were added as a second line of defense:

- `normalizeHitDice()` — runs on every read
- `normalizeSpells()` — runs on every read
- `normalizeInventory()` — runs on every read

These have a fast-path (returns immediately if all fields are already valid).
Justified: migrations can miss in-progress dev builds; runtime guard prevents
crashes from malformed data reaching components.

#### Independent from v1 DB at runtime

**The app never reads v1 IndexedDB at boot or runtime.** `adapter.ts`,
`migration.ts`, and `schema-v1.ts` have been deleted as part of the v2
promotion refactor (tag `v1-final` preserves v1 history). Migration helpers
(`migrateProfString`, `inferAttackKind`, `parseBonusString`) are inlined as
private functions in `src/data/db.ts` — used only in DB schema upgrade
callbacks (v3→v4 and v4→v5) and not accessible outside that module.

If you find code re-introducing a v1 IndexedDB read, that's re-introducing
the ghost-character bug.

#### Latent values preserved when UI controls hidden

When a UI control is hidden conditionally (e.g. equipped checkbox only for
weapon/armor), the underlying domain field is NOT mutated. Value persists
latent and reappears when the condition changes.

Example: item with `equipped: true` keeps the value when category changes
to consumable (UI hides checkbox). Changing back to weapon reveals the
checkbox already marked.

#### Decimal value preservation in currency migrations

When removing a currency type (C.1.f removed EP), the value is preserved via
conversion: 1 EP = 5 SP. No data loss; user sees the expected total in the
remaining denominations.

---

---

## Patterns established during C.1.x and beyond

#### Factory function for empty entities

`createEmptyCharacter()` in `src/domain/factories.ts` produces a fully
valid `Character` with sensible defaults. Used by both manual creation
("Criar do zero") and AI-assisted creation (as base before merging AI response).

Preserves invariants:
- Classes always have non-empty name ("Nova classe" default)
- HitDice synced with classes
- Spell slots initialized for all 9 levels (max 0)
- Standard array abilities (all 10)
- Empty arrays for spells, items, attacks, features
- Currency at zero

#### Service layer for external integrations

External operations (AI generation, cascading delete) live in
`src/services/` as pure async functions with typed error classes:

```ts
export class XError extends Error {
  constructor(public code: string) { super(code) }
}

export async function operationX(input): Promise<Result> {
  try {
    // ... operation
    return result
  } catch (err) {
    throw new XError(parseToCode(err))
  }
}
```

Components catch the typed error and i18n-translate the code.

#### Structured error codes + i18n translation

External operations return error codes; frontend translates. Pattern:

```ts
// Service throws with code
throw new AIGenerationError('rate_limit')

// Component catches and translates
catch (err) {
  setErrorCode(parseErrorCode(err))
  // UI: t(`ai_modal.error_${errorCode}`)
}
```

Codes in use: `description_too_short`, `rate_limit`, `invalid_request`,
`server_error`, `invalid_response`, `timeout`, `network_error`, `unknown`,
`local_delete_failed`, `cloud_delete_failed`, `storage_delete_failed`.

#### Defensive merge with empty base (AI generation)

AI response may have partial fields. Merge into empty base produced by factory;
let the user complete missing fields manually:

```ts
const base = createEmptyCharacter(ai.name ?? '')
if (ai.race) base.race = ai.race
if (ai.class && ai.level) {
  base.classes = [{ name: ai.class, level: ai.level, hitDie: inferHitDie(ai.class) }]
}
// ...
return base
```

Worker can omit fields without breaking the result.

#### Cascading delete with partial-failure tolerance

`deleteCharacter()` (`src/services/delete-character.ts`) has 4 steps:
1. Local IndexedDB delete (REQUIRED — throws if fails)
2. Tombstone (deferred to sync sub-phase — not yet implemented)
3. Supabase row delete (best-effort)
4. Storage bucket delete (best-effort)

Steps 3–4 are non-blocking. Result reports `localOk`, `cloudOk`, `storageOk`
separately. UI confirms success when local OK, even if cloud has partial
failures — sync will retry in future.

Storage cleanup must be explicit: Supabase does not auto-GC uploaded files
(50MB account limit).

#### Kebab menu for per-row actions

For per-item destructive actions (delete, future: duplicate), use a kebab
dropdown (`CharacterCardMenu`):

```tsx
<CharacterCardMenu
  characterId={char.id}
  characterName={char.name}
  onDelete={handleRequestDelete}
/>
```

Pattern: button (⋮) → dropdown with menu items → action via callback.
`stopPropagation` prevents card navigation. Outside click closes.
`role="menu"` + `aria-haspopup` for a11y.

#### Visual status badge primitive

`<StatusBadge>` for binary visual states (auth: connected/disconnected;
future: sync status, etc.):

```tsx
<StatusBadge variant="success">Conectado</StatusBadge>
<StatusBadge variant="neutral">Entrar</StatusBadge>
```

Visual only (no click), with colored dot indicator. Variants define complete
appearance. CSS classes in `src/index.css` (hardcoded colors — no CSS
variables in codebase).

#### Derived hook from store (no duplicate listeners)

When deriving a partial view of state already in a Zustand store, prefer a
thin hook with selectors over re-creating listeners:

```ts
export function useAuthStatus(): AuthStatus {
  const loading = useAuthStore(s => s.loading)
  const user = useAuthStore(s => s.user)
  if (loading) return 'loading'
  return user ? 'authenticated' : 'unauthenticated'
}
```

Avoids `onAuthStateChange` listener duplication that could cause memory leaks
or inconsistent updates.

---

## Patterns established during sync sub-phases

#### Sync service architecture

Service layer at `src/services/sync.ts` with:

- `syncStatus` global (idle/syncing/offline/error) + listener pattern
- Triggers: `scheduleEditSync` (15s debounce), `startPeriodicSync` (30s
  interval), online/offline events
- Single `syncAll()` that orchestrates: tombstones → upload (with LWW guard)
  → download (with decision matrix)

#### IndexedDB migration: schema changes sync first

`createObjectStore` / `deleteObjectStore` calls MUST happen **before** any
`await` in the `upgrade` callback. The versionchange transaction auto-commits
when there are no IDB requests pending and the event loop returns. Pattern:

```ts
async upgrade(db, oldVersion, _newVersion, transaction) {
  // ── PHASE 1: sync — schema changes ──
  if (oldVersion < 1) db.createObjectStore('characters', { keyPath: 'id' });
  if (oldVersion < 9) {
    if (!db.objectStoreNames.contains('deleted_characters')) {
      db.createObjectStore('deleted_characters', { keyPath: 'id' });
    }
  }

  // ── PHASE 2: async — cursor migrations ──
  if (oldVersion < 3) { /* await store.openCursor() ... */ }
  // ... other data migrations
}
```

#### Defensive schema bump for healing

When a migration fails (broken install), the next version bump can include
a guard that verifies/recreates stores that should have existed:

```ts
if (oldVersion < 9) {
  // Creates store that should exist in v8 but migration failed for some installs
  if (!db.objectStoreNames.contains('deleted_characters')) {
    db.createObjectStore('deleted_characters', { keyPath: 'id' });
  }
}
```

#### LWW (Last-write-wins) conflict resolution

For simple bidirectional sync (typical single user), LWW by `updatedAt` is
the pragmatic choice. Newer value wins. Trade-offs: an offline edit that
coincides with a remote delete is lost. Accepted for current scope.

#### Tombstone server-side propagation

`deleted_characters` table in Supabase mirrors local tombstones. Insert
BEFORE deleting the row in `characters`. Other devices query this table to
learn about deliberate deletions. Keeps propagation even if the delete from
`characters` fails.

#### Eager image download

Images (portraits, symbols) download during sync to ensure offline-ready on
a new device. Idempotent: skip if the local char already has data. Trade-off:
larger initial data in exchange for complete offline UX.

#### Pre-fetch optimization for cross-cutting checks

When multiple operations need to query the same dataset (e.g. cloud tombstones
checked in both upload and download phases), pre-fetch once at the start of the
cycle to avoid N+1 queries.

---

## Patterns established during Camp.1-5 (multi-user)

### Multi-user database patterns (Supabase)

#### Postgres SECURITY DEFINER functions for controlled RLS bypass

Cenários onde RLS estrita bloqueia operações legítimas:

1. **Recursive RLS** — policies que consultam a mesma tabela onde estão definidas geram erro 42P17 (infinite recursion). Solução: SECURITY DEFINER function que bypassa RLS pra fazer a query crítica.

   Exemplo: `is_campaign_member(campaign_id, user_id)` — usado em policies de campaigns, campaign_members, user_profiles, characters, storage.objects.

2. **Public lookup com filtragem** — qualquer user logado precisa buscar info de campanha por código sem ser member ainda. `lookup_campaign_by_code` retorna apenas (id, name, description), nada sensível.

3. **Operações atômicas multi-step** — `accept_campaign_invite` verifica existência, verifica se já é member, e insere — tudo numa transação que precisa bypassar RLS do INSERT (RLS de campaign_members exige ownership).

4. **Ownership checks com side-effects** — `regenerate_invite_code` valida ownership, gera novo código único, faz UPDATE — tudo via function.

Pattern: `GRANT EXECUTE` pra `authenticated` apenas. Functions SECURITY DEFINER são executadas com privilégios do owner da function, então não rodam policies durante sua execução.

#### Postgres column type for foreign keys to non-Postgres sources

`campaign_characters.character_id` é `text` (não `uuid`) porque chars vivem no IndexedDB local com format custom `char_<timestamp>_<random>`. Postgres aceita qualquer string. Sem FK pra `characters` table porque char canônico vive no IDB, não na cloud. Cascade delete tratado em camada de aplicação no `deleteCharacter` service.

#### Trigger-based invariants

Triggers no Postgres garantem invariantes sem depender da app:

1. `on_campaign_created` (AFTER INSERT em campaigns) → insere owner como master member. Garante que toda campanha tem ao menos 1 master.
2. `on_campaign_invite_code` (BEFORE INSERT em campaigns) → popula `invite_code` se for null. Garante que toda campanha tem código. Com retry interno pra unicidade.

Pattern: invariantes que devem valer no schema, não na app.

#### RETURNS TABLE column naming to avoid ambiguity

Quando uma SECURITY DEFINER function usa `RETURNS TABLE(campaign_id, ...)` e a query interna também referencia colunas com o mesmo nome, Postgres lança 42702 (ambiguous column). Solução: prefixar os nomes das colunas do RETURNS TABLE com `r_` (ex: `r_campaign_id`, `r_status`) e usar alias de tabela nas queries internas.

---

### Multi-user UI patterns

#### Memory-only stores for remote data

Quando um user precisa ver dados que NÃO são seus (ex: char de outro player na view de campanha), persistir no IndexedDB local poluiria estado pessoal.

`useCampaignViewStore` mantém char remoto em memory only. Quando user sai da view, `clear()` no unmount descarta estado. Trade-off: dados perdidos em reload (re-fetch necessário). Aceitável quando o ciclo de vida da view é curto e dados são live.

#### Silent polling with diff-based updates

Polling de 15s consulta o servidor, mas só atualiza state se algo realmente mudou (diff por `updatedAt`). Evita re-renders desnecessários. Loading state não muda durante polling silencioso — só na primeira carga.

```ts
const current = get().character;
if (!current || char.updatedAt > current.updatedAt) {
  set({ character: char, lastFetchedAt: Date.now() });
}
```

#### Force read-only context overriding lock

`useEffectiveReadOnly` compõe lock normal + ForceReadOnly context:

- Lock normal: `fieldReadOnly = !onUpdate || locked` (permanents); `transientReadOnly = !onUpdate` (HP/slots editáveis)
- Force read-only (via `ForceReadOnlyContext`): `fieldReadOnly = true; transientReadOnly = true` (TUDO bloqueado)

Pattern usado na `CampaignCharacterView`: mestre não deveria editar nem transients de chars de outros players.

#### Role-based UI visibility matrix

Quando ações dependem de role (owner vs player) E contexto (self vs other), matriz explícita evita lógica espalhada por condicional. Componente recebe `isCurrentUserOwner`, `member`, `currentUserId` e renderiza ações com `if-else` explícito por combinação:

| Olhando | Self | Other player |
|---------|------|--------------|
| Player | edit name + leave | sem kebab |
| Owner | edit name + delete | remove member |

#### Deep link via query param pattern

Deep links como `/join/CODE` preservam intent através de auth redirect via query params:

1. `/join/CODE` → `JoinByLink` page
2. Não logado: `/login?redirectTo=%2Fcampaigns%3FopenJoin%3DCODE`
3. Após login: `/campaigns?openJoin=CODE`
4. `CampaignSelect` lê query param via lazy `useState`, abre modal com `prefilledCode`
5. Cleanup do query param após abrir (evita re-abrir em reload)

URL é fonte de verdade. State follow URL, não o contrário.

#### Lazy useState for URL params (avoids setState-in-effect)

Para ler um query param apenas na montagem e evitar `setState` dentro de `useEffect` (react lint rule), inicializar via função:

```tsx
const [searchParams] = useSearchParams()
const [prefilledCode] = useState<string | undefined>(
  () => searchParams.get('openJoin') ?? undefined
)
```

Estado é congelado no valor inicial. Cleanup do param é side-effect no `useEffect` sem setState.

#### Cascade delete in application layer

Quando FK + cascade Postgres não está disponível (ex: char no IDB sem FK real pra Supabase), cascade vira responsabilidade da camada de aplicação. Pattern:

```ts
async function deleteCharacter(id) {
  await db.delete(id);                          // 1. local IDB (blocking)
  await unlinkCharacterFromAllCampaigns(id);    // 2. cascade Supabase (best-effort)
  await supabase.from('characters').delete()...; // 3. cloud row
  await storage.remove(...);                    // 4. images cleanup
}
```

#### Dual mode auth screen

`/login` aceita query param `?mode=signup` ou toggle interno:

```tsx
const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
// renderiza campos compartilhados (email, password) + condicional (confirm pra signup)
```

Compartilha ~80% da UI. Toggle preserva email entre modes (resetando password+error). Evita duplicação de rotas/componentes.

#### Copy-with-feedback isolation

Quando há múltiplos botões de copiar na mesma área, usar discriminador em vez de boolean:

```tsx
const [copiedTarget, setCopiedTarget] = useState<'link' | 'code' | null>(null);

async function handleCopyLink() {
  await navigator.clipboard.writeText(buildInviteLink());
  setCopiedTarget('link');
  setTimeout(() => setCopiedTarget(null), 2000);
}
```

Cada botão verifica `copiedTarget === 'mine'` pra mostrar feedback. Único state, sem cross-contamination.

#### Invite URL with BASE_URL

Para gerar URLs absolutas de convite que funcionem em dev e prod (GitHub Pages usa `/TBT-RPG/`):

```ts
function buildInviteLink(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}/join/${inviteCode}`
}
```

`BASE_URL.replace(/\/$/, '')` evita double-slash quando BASE_URL termina com `/` (ex: `/TBT-RPG/` → `/TBT-RPG`).

---

## Decisions that must remain

| Decision | Introduced | Rationale |
|----------|-----------|-----------|
| Initiative always derived from DEX modifier | C.1.c.2 follow-up | RAW D&D 5e; feats like Alert not yet modeled |
| HP max not auto-recalculated when CON changes | C.1.c.2 Q1=A | User maintains manual control over HP max |
| Current HP capped at max base (not max + temp) | C.1.c.6 | D&D 5e RAW: temp HP is a separate barrier, not added capacity |
| Header HP % ignores temp HP | C.1.c.5 | Shows real HP %, not inflated capacity |
| Class always has non-empty name | C.1.c.4 follow-up | Prevents hitDice entries with empty className ("ghost" dice) |
| HitDice linked to class by name, not index | C.1.c.4 | Rename during incremental typing must stay in sync |
| Race/class/background as free-text + datalist | C.1.c.1 Q5=C | Supports homebrew; no forced canonical lock-in |
| 9 fixed canonical alignments + custom value support | C.1.c.1 | Most chars use canonical; edge case (custom) shown as disabled option |
| Background change does NOT auto-apply skill proficiencies | C.1.c.3 Q2=B | User has full manual control over skill proficiencies |
| `patchCharacter` is an anti-pattern | C.1.b retrospective | Dual-write to two stores caused silent persistence bugs; use `updateCharacter` only |
| `exactOptionalPropertyTypes` requires conditional spread for partials | C.1.c.2 build fix | Prefer over adding `\| undefined` to field types |
| Attack bonus user-entered (no auto-calc) | C.1.d Q4=A | Simple and transparent; no hidden math |
| Damage as string ("1d8+3") | C.1.d Q3 | Flexible; no dice roller required |
| Attack kind inferred from ability in legacy migration | C.1.d | Heuristic acceptable; user adjusts manually |
| Spellcasting ability single per character | C.1.e Q4=A | Multiclass spellcaster with differing abilities is a minority case |
| Cantrips do not show "prepared" checkbox | C.1.e Q8=A | Cantrips are always available per D&D 5e |
| Schools color-coded via SCHOOL_COLORS map | C.1.e Q9 | Visual aid for scanning in combat |
| Add spell button per level group | C.1.e Q10=B | Explicit level placement |
| No filter/search for spells | C.1.e Q6 | Add only if it becomes a user request |
| Item weight per unit (not total) | C.1.f Q2.1=A | D&D RAW; UI displays calculated total |
| EP removed; old EP → SP × 5 in migration | C.1.f Q3 | Electrum is rarely used in practice |
| Item categories: weapon/armor/consumable/tool/misc | C.1.f Q5 | Covers 95%+ of items |
| Items default to "misc" on migration | C.1.f | Heuristic categorization is too brittle; user reclassifies |
| Equipped checkbox only for weapon/armor | C.1.f polish | Conceptually accurate per D&D 5e |
| Equipped value preserved when category changes | C.1.f polish | No data mutation in UI-only changes |
| Weight bar caps at 100% visually with red overburdened state | C.1.f Q8 | Visual feedback without bar distortion |
| All `<select>` elements use `.dark-select` class | Polish horizontal | Renamed from `.alignment-select`; generic naming for dark-theme option lists |
| Character creation has 2 flows: from scratch + AI | C.1.x | Same endpoint (Status tab); AI is "fill initially", not modify |
| AI never modifies existing characters | C.1.x | Simpler logic, no merge conflicts |
| AI merge is "dumb": copy what came, default what didn't | C.1.x | Worker can evolve fields without breaking existing merge |
| Empty character starts with one class "Nova classe" | C.1.x | Preserves invariant: classes never empty |
| Delete is local-blocking, cloud-best-effort | Delete sub-phase | Local feedback immediate; cloud retries in future sync |
| Storage cleanup explicit on delete | Delete sub-phase | Supabase does not auto-GC files; 50MB account limit |
| `adapter.ts`, `migration.ts`, `schema-v1.ts` are deleted | v2 promotion refactor | v1 completely removed; tag v1-final preserves history |
| App root is `/TBT-RPG/` (not `/TBT-RPG/v2/`) | v2 promotion refactor | v2 is the application; v1 path is gone |
| Auth badge is visual-only (no click action yet) | Auth badge sub-phase | Click action deferred to future iteration |
| Auth badge text "Conectado"/"Entrar" (not "Sincronizado") | Auth badge sub-phase | Doesn't promise sync that doesn't exist yet |
| Auth badge renders null during loading (no flash) | Auth badge sub-phase | `useAuthStore` initial state has `loading: true`; prevents FOUC |
| Lock button is stub until functional sub-phase | Polish horizontal | Labels consistent; behavior placeholder |
| Lock scope: permanent vs transient stats | Lock sub-phase | Play-session use case — track HP/slots without altering permanent stats |
| Lock visual feedback subtle (button label + red tint, no banner) | Lock sub-phase | Non-intrusive; lock destroys nothing so no alarming UI needed |
| Lock toggle direct (no confirmation modal) | Lock sub-phase | Lock is reversible instantly; accidental destravar has no consequence |
| Cards (AttackCard/SpellCard/ItemCard) expand even when locked | Lock sub-phase | User consults details during play without unlocking |
| Lock persisted per-character via IndexedDB schema v10 | Lock sub-phase | Lock state survives reload independently per character |
| Item quantity is transient (editable when locked) | Lock sub-phase | Consumibles spent during play |
| Item equipped toggle is transient (editable when locked) | Lock sub-phase | Equipping/unequipping happens during play |
| Spell prepared toggle is transient (editable when locked) | Lock sub-phase | Long rest preparation may happen mid-session |
| `useCharacterLocked` hook reads from `useCharactersStore` directly | Lock sub-phase | No prop drilling through tabs; each leaf component subscribes independently |
| Sync upload reactive 15s + periodic 30s | Sub-fase 2.1 | Reactive captures active edits; periodic self-heals idle sessions |
| Tombstones created only when user is logged in | Sub-fase 2.1 | Offline deletes don't propagate (intentional) |
| Sync silent by default | Sub-fase 2.1 | Intrusive UI is annoying; automatic retry covers transients |
| Cloud tombstone inserted BEFORE characters row delete | Sub-fase 2.2 | Guarantees propagation even if characters delete fails |
| LWW conflict resolution by updatedAt | Sub-fase 2.2 | Pragmatic for single user; simultaneous edit trade-off accepted |
| Eager image download | Sub-fase 2.2 | Offline-ready complete; idempotent avoids re-download |
| Pre-fetch cloud tombstones at start of syncAll | Sub-fase 2.2 hotfix | Prevents re-upload of char deleted on another device |
| Ambiguous case (local without cloud or tombstone) keeps local | Sub-fase 2.2 | Conservative; next upload reconciles |
| v1 removed from repo after promotion | Promotion refactor | Tag v1-final preserves history via git |
| adapter.ts, migration.ts, schema-v1.ts deleted | Promotion refactor | v1 completely removed; helpers inlined in db.ts as private |
| v1 IndexedDB in browser not touched | Promotion refactor | No data loss risk; eventually GC'd by browser |
| Build path /TBT-RPG/ (not /TBT-RPG/v2/) | Promotion refactor | v2 is the default application; old path is gone |
| Dual mode signin/signup in /login | Auth signup | Shares ~80% of UI; no duplicated routes |
| Email confirmation detects via data.session === null | Auth signup | Supabase returns null session when confirmation required |
| Email normalized (trim + lowercase) on signup | Auth signup | Prevents accidental duplicate accounts |
| 4 Supabase tables for campaigns | Camp.1 | campaigns, members, profiles, characters — separated concerns |
| SECURITY DEFINER to bypass recursive RLS | Camp.1 | is_campaign_member as shared helper across 5+ policies |
| Owner always added as master member via trigger | Camp.1 | Schema-level invariant; app can't bypass it |
| display_name in dedicated table (user_profiles) | Camp.1 | Avoids exposing email to other members |
| Invite codes: 8 alphanumeric chars no ambiguous | Camp.2 | Short enough to dictate; excludes 0/O/1/I/L |
| One active code per campaign (no multi-code) | Camp.2 | Single user case; regenerate replaces |
| Code permanent until regenerated (no expiry) | Camp.2 | Time-based expiry adds friction; revoke manually |
| SECURITY DEFINER for accept_campaign_invite | Camp.2 | Atomic insert that bypasses RLS |
| RETURNS TABLE columns prefixed r_ | Camp.2 hotfix | Avoids Postgres 42702 ambiguous column |
| Join button in CharSelect + /campaigns | Camp.2 | Dual entry points for discoverability |
| character_id as text (not uuid) in Supabase | Camp.3 hotfix | Local chars use custom format char_<ts>_<rand> |
| Cascade delete in application layer | Camp.3 | No FK because char lives in IDB; deleteCharacter handles cascade |
| Only char owner + campaign member can link | Camp.3 | RLS guarantees; double-checked in service |
| Char can be linked to multiple campaigns | Camp.3 | No unique constraint; no business reason to block |
| character_name + summary are snapshots | Camp.3 | Live data comes from Camp.4 polling; snapshot for list display |
| Memory-only store for remote chars | Camp.4 | Avoids polluting "Meus Personagens" with others' chars |
| 15s polling (Realtime deferred) | Camp.4 | Simplicity; acceptable latency for tabletop |
| Force read-only in campaign view (incl. transients) | Camp.4 | Master must not interfere with player agency |
| Campaign members can read linked chars (additive RLS) | Camp.4 | Players can see each other's sheets |
| Deleted char detected by polling → redirect | Camp.4 | Stop polling + navigate to /campaigns automatically |
| Reuse shell variants pattern (Caminho B) | Camp.4 hotfix | Visual consistency; isolated shell for campaign context |
| Leave campaign via DELETE on campaign_members | Camp.4 hotfix | Owner deletes campaign; player removes only membership |
| Cascade unlinks on leave | Camp.4 hotfix | Avoids ghost chars visible to master after player leaves |
| Kebab per member row with contextual matrix | Camp.5 | Centralizes actions; visibility explicit per role+context |
| Footer actions block removed | Camp.5 | Centralized in kebab; less visual clutter |
| Master can unlink any player's char | Camp.5 | Additive RLS policy; camp.3 owner-only expanded |
| removeMember cascades char unlinks | Camp.5 | Reuses unlink service; no ghost chars after removal |
| Deep link /join/:code via query param redirect | Camp.5 | Preserves intent through login redirect |
| Copy link primary, copy code secondary | Camp.5 hotfix | Link is more useful now with deep link support |
| Invite URL uses import.meta.env.BASE_URL | Camp.5 hotfix | Works in dev (/) and prod (/TBT-RPG/) |
| copiedTarget discriminator isolates copy feedback | Camp.5 hotfix | Single state prevents cross-contamination between 2 copy buttons |
| **Auth redirects no GitHub Pages:** o Site URL do Supabase DEVE incluir o subpath (`/TBT-RPG/`), não só o apex — senão o redirect de confirmação/recovery cai no apex e dá 404. `emailRedirectTo`/`redirectTo` derivam sempre de `window.location.origin + import.meta.env.BASE_URL`. | PR #140 | Afeta qualquer fluxo auth com redirect (confirmação, recovery) |
| **Captura de auth callback:** `createClient()` consome/limpa o hash da URL no import-time (durante a avaliação do módulo). Qualquer leitura de `type`/`error` do hash precisa rodar num módulo que **não** importe o cliente Supabase e seja importado **antes** de tudo no `main.tsx` (`src/auth-callback.ts`). Ler o hash depois do import do store/App é tarde demais. | PR #142 hotfix | Afeta qualquer fluxo que use hash-based tokens do Supabase |
| **Mapas — RLS por membership:** tabela e storage usam helpers SECURITY DEFINER (`is_campaign_member/owner`, `is_map_member/owner`) — dono escreve, membro lê. Path `{campaignId}/{mapId}.{ext}`; o 1º segmento carrega o campaign_id pras policies de storage. | PR #152/#153 | Qualquer recurso novo escopado por campanha/mapa reusa esses helpers |
| **Mapas — limpeza de storage:** deletar campanha/mapa NÃO cascateia o storage. `deleteCampaign` remove os objetos sob `{campaignId}/` ANTES de apagar a linha (senão a RLS `is_campaign_owner` já falha). | PR #154 | Delete de recurso com arquivos precisa limpar storage explicitamente, na ordem certa |
| **Mapas — Leaflet:** react-leaflet v5 (Hippocratic 2.1; Leaflet core BSD-2), `CRS.Simple`, CSS importado; usar `L.divIcon` (o ícone default quebra no bundler). Coords em pixel: x=lng, y=lat; render em `[y,x]`. | PR #152/#153 | Trabalho futuro no viewer (tokens/grid) herda essas restrições |
| **Tático — grid em colunas:** a grade é config por mapa em COLUNAS de `campaign_maps` (não tabela nova), reusando a RLS do mapa (membro lê / dono escreve). Overlay `SVGOverlay` com `pointer-events:none`. | PR #157 | Config 1:1 com o mapa vai em colunas + reuso de RLS |
| **Tático — coordenada de fog (flip Y):** o clique vem do Leaflet (`CRS.Simple`, y para cima) e o render é SVG viewBox (y para baixo); converter a entrada com `height - lat` antes de mapear pra célula. Tokens/marcadores não precisam (posicionados pelo Leaflet). | PR #159 | Qualquer render SVG derivado de clique precisa do flip de Y |
| **Tático — pintura por gesto:** drag-paint usa Pointer Events nativos no container + `touch-action:none` + `dragging.disable()` (eventos de mouse não cobrem touch). Persistir uma vez no `pointerup`, não por célula. | PR #159 | Interação de arraste no mapa usa pointer events, não mouse |
| **Tático — escala de token:** token é `<Marker>` + divIcon com o tamanho recomputado no `zoomend` (px de tela = célula × `pxPerUnit`), não `<Circle>` (perderia o drag). Cache do ícone inclui o tamanho. | PR #165 | Overlay que escala "por unidade de mapa" com Marker exige recompute no zoom |
| **Tático — imagem de token:** reusa o bucket `campaign-maps` sob `{campaignId}/tokens/{tokenId}.{ext}` — como o 1º segmento do path é o campaignId, a RLS de storage existente cobre; a limpeza deve varrer a subpasta `tokens/`. | PR #167 | Conteúdo de campanha novo no storage vai sob `{campaignId}/...` pra reusar RLS; limpeza varre subpastas |
| **Ficha — acordeão single-open:** listas de card (magias/ataques/características/itens) guardam `openId` no nível da lista e fecham em `pointerdown` fora — NÃO usar `onBlur`/estado por card (retrair o aberto desloca o layout e "engole" o clique no item de baixo). | PR #178 | Lista de card expansível usa openId na lista + pointerdown-fora, nunca blur |
| **Tático — presets de token:** biblioteca **por campanha** (`campaign_token_presets`, RLS `is_campaign_owner`); imagem sob `campaign-maps/{campaignId}/presets/`; ao colocar, a imagem do preset é **copiada** pro token (`{campaignId}/tokens/…`), nunca referenciada — excluir o preset não afeta tokens já postos. | PR #184/#185 | Biblioteca por campanha; placement copia a imagem (desacopla token do preset) |
| **Tático — âncora dos chips de condição:** condições viram chips abaixo do token, mas o `iconAnchor` fica no **centro do círculo** (`[d/2,d/2]`); só a altura do `iconSize` cresce. A chave do cache do `getTokenIcon` inclui as condições. | PR #188 | Overlay no token (chips) nunca move a âncora; posição lógica = centro do círculo; cache-key inclui o overlay |
| **Tático — coordenada da AoE + drag por modo:** área guarda o **centro em viewBox** (`x=lng`, `y=height-lat`) e **raio = distância** (invariante ao flip); render SVG em viewBox com `pointer-events:none`. Token fica **não-arrastável** em `areaMode`/`fogMode` (senão o `<Marker>` captura o `pointerdown`). | PR #189 | Formas derivadas de clique: centro flipado + raio=distância; em modo de desenho, desabilitar drag de Marker pra o gesto borbular ao container |
| **Tático — tela de transmissão:** espelho na **perspectiva de jogador** via `BroadcastChannel('tbt-map-'+mapId)` (mesma máquina). Emissor (dono) posta **estado completo** (tokens/fog/areas/grid) no mount + a cada mudança + em resposta ao `hello`; receptor aplica e pede `hello` no mount. **Sem** estado ao vivo do Supabase na transmissão (só a signed URL da imagem); sem polling/Realtime. | PR #192 | Segunda-tela = espelho estado-completo por-mapa, perspectiva de jogador, sem estado ao vivo do Supabase |
| **Tático — AoE de dois pontos (linha/cone):** formas com direção guardam um **2º ponto** `x2`/`y2` (nulos p/ círculo/quadrado), com **flip de Y nos dois**; render `<line>`/`<polygon>` em viewBox (cone 5e: meia-largura `L/2`, largura na ponta = comprimento). `radius` permanece pra círculo/quadrado (retrocompatível). | PR #197 | Formas com direção = dois pontos flipados + geometria em viewBox; manter os campos das formas antigas (não migrar) |
| **Dados — rolagem não muta a ficha:** as rolagens (motor + contextuais) só rolam e mostram; nunca gastam dado de vida, marcam teste de morte ou alteram estado do personagem. `RollResult` é **serializável** e reusado no motor, no contexto e no log. | PRs #202–#203 | Rolagem é read-only sobre a ficha; RollResult serializável reusado em todas as fatias |
| **Dados — log compartilhado:** por campanha (`campaign_dice_rolls`, RLS `is_campaign_member`, insert com `user_id=auth.uid()`); **retenção por trigger** no banco (TTL 12h + teto 50), não por cliente/cron; transporte por **polling 5s** (Realtime deferido); a rolagem registra em **todas** as campanhas vinculadas do personagem. | PRs #204–#205 | Log por campanha via tabela+polling; retenção no banco (trigger); registra em todos os vínculos |
| **Dados — dono do contexto:** o **CampaignDetail** seta/limpa o contexto de dados da campanha (ator "Mestre"); o viewer (modal filho) só **usa** o contexto, nunca seta — senão o limparia ao fechar. | PR #206 | Contexto de dados pertence à página persistente, não ao modal filho |
| **Classe — chave canônica + exibição localizada:** o campo de classe é lista fixa que guarda a chave canônica (`CANONICAL_CLASSES`) e exibe rótulo traduzido; legados PT reconhecidos por `getCanonicalClass`, homebrew cru. Dado de vida sempre de valor reconhecido (`getHitDie`). | PR #211 | Sem typo no dado de vida; nomes de classe traduzíveis; sem migração (normaliza na exibição/seleção) |
| **Logout limpa o local (flush-first):** logout explícito faz flush de sync e, se OK, apaga fichas locais + reseta stores; se offline, mantém e avisa. Não limpa em expiração de sessão. | PR #212 | Evita "lixo"/contaminação entre contas sem perder edição offline |
| **Vinculados por polling:** a vida dos personagens vinculados no CampaignDetail atualiza por polling (~10s), não só no reload. | PR #213 | Acompanhamento em tempo (quase) real, consistente com o resto do VTT |

---

## Open questions (for future phases)

- **OQ-5 — Stable IDs for classes/hitDice.** Currently classes are identified by name.
  Edge case: two classes with the same name (rare homebrew). Refactor candidate when
  complexity justifies — needs UUID-based linking instead of name-based.

- **OQ-6 — Header HP % clarity.** Discrepancy between header (current/max) and bar
  (shows temp HP overlay). Decided: header stays current/max only; no change planned.

- **OQ — HP +/- buttons for combat tracking.** Deferred to future UX polish pass.

- **OQ — Tooltip "HP not auto-recalculated with CON".** Deferred.

- **OQ — Spell save DC editor.** Will surface in C.1.e (Spells); needs spellcasting
  ability selector to be modeled first.

- **OQ — Initiative override field.** For builds with Alert feat or manual override.
  Not modeled yet; current policy is DEX-always-derived. Requires a separate bonus
  field (not a replacement for the derived value).

- **OQ — Localization of canonical names.** **Classes: resolvido (PR #211)** — lista fixa que guarda chave
  canônica e exibe rótulo traduzido (PT/EN), com `getCanonicalClass` reconhecendo legados. **Raça e
  antecedente seguem free-text** (localização deferida — mesma complexidade de valores custom/reverse lookup).

- **OQ — Character creation flow.** "Meus Personagens" screen still requires migrating
  from v1 or editing existing characters. Requires defaults definition and creation UI
  (blank-sheet flow).

New from C.1.d / C.1.e / C.1.f:

- ~~**OQ — FeaturesList `<select>` without dark theme class.**~~ *Resolved in polish
  horizontal — `.dark-select` applied to FeaturesList selects.*
- ~~**OQ — Rename `.alignment-select` to `.dark-select`.**~~ *Resolved in polish horizontal.*
- **OQ — Heuristic categorization of inventory items on migration.** All imported items
  default to "misc". Could infer from name ("Quarterstaff" → weapon) but is brittle.
  Deferred.
- **OQ — Subcategory `focus` for inventory items.** Druidic Focus, Holy Symbol, Component
  Pouch currently become `tool` or `misc` without equipped capability. Decision deferred.
- **OQ — Encumbered / Heavily Encumbered rules.** Today only visual weight bar color
  feedback. D&D RAW movement penalties not implemented.
- **OQ — Multiple equipped items max rule.** Currently any number of items can be marked
  equipped — user manages manually (main hand + off hand, etc.).
- **OQ — Item value field (`value`, `valueUnit`).** Would enable shopkeeper interactions.
  Not implemented.
- **OQ — Item attunement (max 3 attuned).** D&D 5e magic items rule. Not implemented.
- **OQ — Integration tests for migration pipeline.** C.1.e hotfix revealed a gap: tests
  rendered components against fixtures with new shape, but never exercised the migration
  pipeline with real-world legacy data. Consider integration tests that boot characters
  "from IndexedDB" to force the migration path.
- **OQ — Spellcasting per-class abilities.** Druid + Wizard with WIS + INT simultaneously.
  Currently single ability per character.

New from C.1.x, delete, cut-v1, polish, auth-badge:

- ~~**OQ — Sync Supabase: upload + download + tombstones.**~~ *Implemented in sub-fase 2.1 (PR #116) and 2.2 (PR #117). Sub-fase 2.3 (realtime, retry backoff, UI polish) remains.*
- ~~**OQ — Promoção real.**~~ *Resolved. v2 is the official application (PR #118). Tag v1-final preserves history.*
- **OQ — Multi-device delete propagation parcial.** Char deletado em Device A pode
  voltar em Device B após sync. Hipóteses não validadas (RLS, schema sutil, insert
  silenciosamente falha em `deleted_characters`). Workaround para single user: deletar
  manualmente em cada device. Investigar quando virar prioridade. Sintoma reproduzível.
- ~~**OQ — Lock functional (read-only mode).**~~ *Resolved. Permanent stats read-only
  when locked; transients always editable. DB schema v10. PR #122.*
- **OQ — Auth status interactive.** Click on badge could open a menu (logout, account
  info). Deferred per Q4.1 (visual-only decision).
- **OQ — Worker AI expansion (items + spells).** Worker template currently doesn't
  include these fields. Fields stay empty on AI creation for user to fill manually.
- **OQ — Worker AI `sleight_hand` normalization.** Worker returns `sleight_hand` but
  domain uses `sleight_of_hand`. Mapped in merge function as workaround; worker-side
  fix would be cleaner.
- **OQ — Cloudflare Workers AI: deprecação em batches + reasoning silencioso + variabilidade de envelope.** Three intertwined risks discovered the hard way:

  **Risk 1 — Family deprecation:** Cloudflare deprecates entire model FAMILIES in
  coordinated batches, not individual models. Migrating to a sibling in the same
  family fails with the same `AiError 5028`.

  **Risk 2 — Silent reasoning models:** Many newer models (GLM 4.7 Flash, gpt-oss-20b,
  kimi, etc.) are reasoning models that return content in `message.reasoning_content`
  or `message.reasoning`, NOT in `message.content`. Naive `.content` extraction yields
  empty string with no error. Variants ending in `-fast` (e.g. `llama-3.3-70b-instruct-fp8-fast`)
  are typically NON-reasoning and were the refuge during this migration.

  **Risk 3 — Envelope variability:** Different models return different envelope shapes.
  Llama 3.3 70B Fast returns BOTH `response` (pre-parsed object) AND `choices[]`
  (OpenAI Chat string). Fallback extraction must verify TYPE, not just truthy, to
  avoid `TypeError` on non-string values.

  Migration timeline (2026-06-17 to 2026-06-19):
  1. `@cf/meta/llama-3-8b-instruct` → failed (AiError 5028, deprecated)
  2. → `@cf/meta/llama-3.1-8b-instruct` → failed (same deprecation batch)
  3. → `@cf/zai-org/glm-4.7-flash` → failed (reasoning model, content in `reasoning`)
  4. → `@cf/openai/gpt-oss-20b` → failed (reasoning model, content in `reasoning_content`)
  5. → `@cf/meta/llama-3.3-70b-instruct-fp8-fast` → SUCCESS (non-reasoning,
       Playground-validated; pickText helper for type-safe extraction)

  7 Lessons learned:
  1. **Cloudflare deprecates families, not models.** Migration to sibling fails.
  2. **Many new Cloudflare models are silently reasoning.** Test envelope shape before committing.
  3. **`-fast` variants are temporary refuge for non-reasoning** — no guarantee for future.
  4. **TEST IN PLAYGROUND BEFORE CODING.** 5 minutes saves hours of deploy-fail-redeploy.
  5. **Diagnostic logs of response shape are CRITICAL DEFENSE, not optional.**
     Without them, reasoning misuse is invisible for weeks.
  6. **System prompt size matters.** Lean prompts (~250 tokens) vs bloated (~700-800)
     improve latency and consistency.
  7. **Type safety in fallbacks matters.** Helper `pickText` rejects non-string values;
     truthy-only check breaks with `TypeError` downstream.

  Pattern of mitigation: Monitor https://developers.cloudflare.com/workers-ai/changelog/
  quarterly. Test in Playground before each migration. Keep `AI_MODEL` extracted to
  constant. Keep diagnostic logs active for weeks after migration. Maintain `pickText`
  helper for type-safe extraction. Prefer non-reasoning models for structured JSON output.

  Symptoms:
  - **Deprecation:** HTTP 500 + `AiError 5028` in outer catch log
  - **Reasoning misuse:** `rawSample: ""` in parse failed log; shape log shows
    `message.content: null` and content in `reasoning_content` or `reasoning`
  - **Envelope variability:** `TypeError: text.replace is not a function`
    (`response.response` is object, not string)

  Long-term mitigation (deferred sub-phase): adapter that tries fallback models on
  `AiError 5028` and extracts text from `content`, `reasoning_content`, `reasoning`,
  and `response` with type checking.

- **OQ — Logs info `[worker] AI response shape` e `response.response type` podem ser
  removidos quando Llama 3.3 70B Fast estiver estável.** Adicionados em 2026-06-18
  como defesa diagnóstica. Manter ativos por pelo menos 4 semanas (~meados julho/2026).
  Se nenhum incidente novo, remover os 2 logs de `console.log` (manter os 3 de
  `console.error` como defesa permanente).

- **OQ — Explorar `response.response` pré-parseado em modelos Cloudflare modernos.**
  Llama 3.3 70B Fast retorna `response.response` como object JSON já parseado. Atualmente
  o código rejeita via `pickText` e usa `choices[0].message.content` (string). Possível
  otimização: usar `response.response` diretamente evita o `JSON.parse(clean)`. Trade-off:
  menos defensivo contra modelos que não pré-parseiam. Avaliar se performance virar
  preocupação real.
- **OQ — Multi-tab edition coordination.** Character can be edited in 2 browser tabs
  simultaneously; no locking. Best-effort via debounced saves.
- **OQ — Tombstone cleanup TTL.** Tombstones accumulate indefinitely. Decision:
  no TTL (permanent) — revisit if storage becomes an issue.
- **OQ — Versionamento futuro do app.** Atualmente sem versioning visível ao usuário.
  Considerar `/about` page com versão, links, créditos quando fizer sentido.

New from Auth signup + Camp.1-5:

- ~~**OQ — Auth signup flow quebrado.**~~ *Resolved. Dual mode signin/signup in /login. PR #127.*
- ~~**OQ — Sistema de Campanhas.**~~ *Resolved. Camp.1-5 delivered (PRs #125–#130). Remaining OQs listed below.*
- **OQ — Transfer ownership de campanha.** Mestre passa a campanha pra outro membro. Deferred to future sub-phase.
- **OQ — Realtime via Supabase Channels.** Upgrade do polling 15s pra subscribe em mudanças de chars vinculados. Deferred.
- **OQ — QR code do convite.** Geração visual de QR code com o link de convite. Deferred.
- **OQ — Promote player to master.** Multi-master support. Não modelado.
- ~~**OQ — Password reset / forgot password.**~~ *Resolved (PR #142).* Modo `forgot` no Login (mensagem neutra anti-enumeração) + página full-screen `ResetPassword` gated por `authCallbackType === 'recovery'` + tratamento de link expirado/usado (`otp_expired`) com banner âmbar e deep link `?mode=forgot`.
- **OQ — OAuth providers.** Google, Discord. Não implementado.
- ~~**OQ — Account deletion via UI.**~~ *Resolved (PR #149).* Modal com confirmação por digitação do e-mail; serviço orquestrado num clique (campanhas → storage → cloud chars → IndexedDB → RPC `delete_own_account` → signOut). Função SQL `SECURITY DEFINER` com `auth.uid()`; cleanup best-effort, RPC define sucesso.
- **OQ — Re-send confirmation email.** Não implementado.
- ~~**OQ — Expandir/fullscreen do viewer de mapa.**~~ *Resolved (PR #162).* Botão maximizar/restaurar no header do modal (CSS-maximize; não Fullscreen API — iOS). `InvalidateOnChange` chama `map.invalidateSize()` no toggle, preservando pan/zoom.
- ~~**OQ — Imagens nos tokens.**~~ *Resolved (PR #167).* Upload próprio por token no bucket `campaign-maps` sob `{campaignId}/tokens/{tokenId}.{ext}` (RLS reusada; coluna `image_path`); render circular + anel na cor, fallback disco; escala com o zoom; limpeza de órfãos. *(Puxar do personagem vinculado segue como OQ abaixo.)*
- ~~**OQ — Puxar imagem do token do personagem vinculado.**~~ *Resolved (PR #172).* Retrato do personagem vinculado copiado como imagem do token (data URL → blob → `image_path`), reusando todo o pipeline de imagem de token; personagem sem retrato não selecionável. Cópia (não referência ao vivo).
- ~~**OQ — Tokens escalam com o zoom.**~~ *Resolved (PR #165).* `<Marker>` + divIcon com tamanho recomputado no `zoomend` via `pxPerUnit`; helper `tokenDiameterPx`.
- ~~**OQ — Marcador por duplo-clique.**~~ *Resolved (PR #171).* Marcador criado por duplo-clique (`dblclick`); `doubleClickZoom={false}` evita zoom no duplo-clique.
- **OQ — Visibilidade de mapa por mapa (publicar).** Mestre habilitar/desabilitar um mapa na lista da campanha, pra preparar mapa + grid antes de os jogadores verem. Deferred.
- **OQ — Biblioteca de tokens por-usuário (global).** Hoje os presets são por campanha; permitir uma biblioteca pessoal do mestre reutilizável entre campanhas (exige repensar storage/RLS por-usuário). Deferred.
- **OQ — Iniciativa / turnos.** Lista ordenada de combatentes com valor de iniciativa e destaque do turno atual (próximo/anterior); painel, compartilhado com os jogadores. Bloco maior, não mexe em coordenada. Deferred.
- **OQ — Régua / medir distância.** Medir distância em células/pés entre dois pontos; pode ser efêmera e só do mestre (sem tabela/sync). Extra barato. Deferred.
- **OQ — Ping / destacar ponto.** Mestre solta um marcador temporário pros jogadores; depende de tempo real — fraco com polling de 5s, então fica junto de Realtime channels. Deferred.
- **OQ — Rolagem secreta do mestre.** Hoje toda rolagem em campanha é pública pra mesa; permitir que o mestre role escondido (só ele vê). Deferred.
- ~~**OQ — Tokens sob a névoa.**~~ *Resolved (PR #166).* Pros jogadores, token em célula não-revelada fica oculto (regra do centro, mesmo flip `height - y` do fog); mestre sempre vê; frescor no polling de 5s.

New from production feedback (observed bugs):

- ~~**OQ — Email confirmation link returns 404 on GitHub Pages.** [PRIORIDADE ALTA]~~
  *Resolved (PR #140).* 404.html SPA fallback (técnica spa-github-pages, `pathSegmentsToKeep=1`) +
  snippet de decode no `index.html` rodando antes do bundle; `emailRedirectTo` derivado de
  `window.location.origin + import.meta.env.BASE_URL`; **Site URL do Supabase corrigido** pra incluir o
  subpath `/TBT-RPG/` (estava no apex → caía no 404). Resolve junto a OQ irmã "hard refresh SPA" e os
  deep links `/join/CODE` compartilháveis. BrowserRouter mantido (HashRouter conflita com os tokens do
  fluxo implícito do Supabase, que também vêm no hash).

- ~~**OQ — Dados de vida (d6/d8/d10/d12) não reconhecem nomes de classe em PT-BR.** [PRIORIDADE MÉDIA]~~
  *Resolved (PR #144).* `getHitDie`/`CLASS_HIT_DIE` agora indexados por nomes EN **e** PT-BR (PHB-PT),
  com normalização case- **e** accent-insensitive (`normalize('NFD')` + strip de diacríticos). 13 classes
  (12 PHB + Artificer→Artífice). **Forward-only**: personagens já salvos não são reescritos — corrigem ao
  reeditar a classe (o `ClassEditor` recalcula via `getHitDie`) ou em nova geração. `db.ts` intocado.

- ~~**OQ — Bloco de classe não tem label "Nível" no input do level individual.** [PRIORIDADE BAIXA]~~
  *Resolved (PR #147).* Header de coluna "NÍVEL" sobre o input de nível por classe (`ClassEditor`,
  `LABEL_STYLE`, `aria-hidden`); o nível total no `HeroCard` passou a "Nível Total"
  (`hero.total_level_label`) pra diferenciar. `LoreHero` mantém "Nível {n}" via `hero.level_label`.

---

## Supabase schema

### Tables

| Table | Since | Purpose |
|-------|-------|---------|
| `characters` | Sync 2.1 | Cloud sync de personagens (mirror do IDB) |
| `deleted_characters` | Sync 2.1 | Tombstones pra propagação de deleções entre devices |
| `user_profiles` | Camp.1 | Display name por user (evita expor email a outros members) |
| `campaigns` | Camp.1 | Campanhas com nome, descrição, ownerId, invite_code |
| `campaign_members` | Camp.1 | Membership user ↔ campanha com role (master/player) |
| `campaign_characters` | Camp.3 | Vinculações char ↔ campanha (character_id como text) |

### Storage buckets

| Bucket | Purpose |
|--------|---------|
| `character-images` | Imagens de personagens (portrait, symbol) |

### Functions SECURITY DEFINER

| Function | Since | Purpose |
|----------|-------|---------|
| `is_campaign_member(campaign_id uuid, user_id uuid) returns boolean` | Camp.1 | Helper pra bypassa RLS recursivo. Usado em policies de campaigns, campaign_members, user_profiles, characters, storage.objects |
| `generate_invite_code() returns text` | Camp.2 | Gera código 8-char alfanumérico seguro (sem 0/O/1/I/L) com retry pra unicidade |
| `lookup_campaign_by_code(p_code text) returns table(r_id, r_name, r_description)` | Camp.2 | Busca campanha por código. Retorna apenas id/name/description (sem dados sensíveis) |
| `accept_campaign_invite(p_code text) returns table(r_campaign_id, r_status)` | Camp.2 | Aceita convite atomicamente: verifica código, verifica se já é member, insere membership |
| `regenerate_invite_code(p_campaign_id uuid) returns text` | Camp.2 | Owner-only. Gera novo código único e faz UPDATE na campanha |

### Triggers

| Trigger | Table | When | Action |
|---------|-------|------|--------|
| `on_campaign_created` | campaigns | AFTER INSERT | Insere owner como master member automaticamente |
| `on_campaign_invite_code` | campaigns | BEFORE INSERT | Popula invite_code com retry pra unicidade se vier null |

### RLS policy overview

All tables use Row Level Security. Key patterns:
- **campaigns**: owner full CRUD; members read-only
- **campaign_members**: owner can insert/delete others; members read own row; acceptance via SECURITY DEFINER function
- **user_profiles**: owner read/write own; members read others in shared campaigns (via `is_campaign_member`)
- **campaign_characters**: char owner can link/unlink; campaign owner can unlink any (Camp.5 additive policy)
- **characters**: owner full CRUD; campaign members can read chars linked to shared campaigns (Camp.4 additive policy)
- **storage.objects**: owner read/write own images; campaign members can read images of linked chars (Camp.4 additive policy)
