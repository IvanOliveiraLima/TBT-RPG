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
| `src/data/db.ts` | IndexedDB wrapper: `dnd-character-sheet-v2` v9, stores `Character` directly |
| `src/data/canonical/item-categories.ts` | `ITEM_CATEGORIES` array + `isValidCategory()` guard |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/store/auth.ts` | Zustand auth store (initAuth, signIn, signOut) |
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
| `worker/src/index.js` | Cloudflare Worker — proxies requests to Workers AI (Llama 3 8B), handles CORS |

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

The app uses `dnd-character-sheet-v2` (version 9) and stores `Character` objects
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

| Metric | Baseline (after promote-v2-to-root refactor) |
|--------|----------------------------------------------|
| Test files | 58 |
| Tests | 1200 |

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
  (Llama 3 8B); merges response into empty base via defensive merge (missing fields stay default).
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

Each schema bump is a cursor-based upgrade callback in `src/data/db.ts`, idempotent.

**Critical invariant:** ALL `createObjectStore` / `deleteObjectStore` calls must live in the synchronous "Phase 1" header of the `upgrade` callback, before any `await`. Data migrations (cursor-based) go in "Phase 2" after all stores are declared. See db.ts comments.

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

- **OQ — Localization of canonical race/class/background names.** Currently free-text;
  could be mapped to i18n keys but with significant complexity (custom values, reverse
  lookup across languages). Deferred indefinitely.

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
- **OQ — Lock functional (read-only mode).** Today only stub label; functionality
  (editing disabled, fields read-only) deferred to lock sub-phase.
- **OQ — Auth status interactive.** Click on badge could open a menu (logout, account
  info). Deferred per Q4.1 (visual-only decision).
- **OQ — Worker AI expansion (items + spells).** Worker template currently doesn't
  include these fields. Fields stay empty on AI creation for user to fill manually.
- **OQ — Worker AI `sleight_hand` normalization.** Worker returns `sleight_hand` but
  domain uses `sleight_of_hand`. Mapped in merge function as workaround; worker-side
  fix would be cleaner.
- **OQ — Multi-tab edition coordination.** Character can be edited in 2 browser tabs
  simultaneously; no locking. Best-effort via debounced saves.
- **OQ — Tombstone cleanup TTL.** Tombstones accumulate indefinitely. Decision:
  no TTL (permanent) — revisit if storage becomes an issue.
- **OQ — Versionamento futuro do app.** Atualmente sem versioning visível ao usuário.
  Considerar `/about` page com versão, links, créditos quando fizer sentido.
