/**
 * IndexedDB wrapper for v2 — v2-native persistence.
 *
 * Strategy (Phase C.1.0 pivot):
 *   v2 DB  (dnd-character-sheet-v2, version 6) — read + write, stores Character directly
 *   v1 DB  (dnd-character-sheet, version 3)    — read-only, accessed only during migration
 *
 * Characters are stored as domain Character objects (v2-native schema).
 * The v1 DB is read ONCE via migrateV1Characters() (migration.ts), then
 * never touched again from v2. The v1 app at /TBT-RPG/ remains frozen and
 * unaware of v2's existence.
 *
 * Schema history:
 *   v1 → v2: store cleared (V1Character shape incompatible with Character)
 *   v2 → v3: backfill className on hitDice entries (C.1.c.4)
 *   v3 → v4: migrate proficiencies strings→arrays; lift languages to top-level;
 *             backfill id/source on features missing them (C.1.c.5)
 *   v4 → v5: expand Attack shape — rename baseStat→ability, bonus(string)→attackBonus(number),
 *             add kind/range/properties/notes, drop rollType/proficient (C.1.d)
 *   v5 → v6: expand Spell shape — migrate spells?{ability,saveDC,attackBonus,slots,known}
 *             to flat spells:Spell[], spellSlots:Record, spellcastingAbility, spellcastingClass (C.1.e)
 *   v6 → v7: expand InventoryItem shape — add category/description/equipped;
 *             remove EP from Currency (convert 1 EP → 5 SP) (C.1.f)
 *   v7 → v8: HOTFIX — see v9 entry below (v8 was deployed with a bug)
 *   v8 → v9: defensive creation of deleted_characters store (tombstones for sync).
 *             v8 shipped with createObjectStore called AFTER async cursor awaits
 *             inside the upgrade callback, causing the versionchange transaction
 *             to auto-commit before the store was created. v9 moves ALL
 *             createObjectStore calls to the synchronous header of the callback,
 *             before any await, and the < 9 guard also heals existing broken v8
 *             installs that reached v8 without the deleted_characters store.
 */

import { openDB } from 'idb'
import type { Character } from '@/domain/character'
import { isValidCategory } from './canonical/item-categories'
/* ── Migration helpers (inlined from former adapter.ts) ──────────────────── */

function migrateProfString(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string') return []
  return raw.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 0)
}

function inferAttackKind(toHit: string | undefined | null, stat: string): 'melee' | 'ranged' | 'spell' {
  if (toHit && /^DC\s*\d+/i.test(toHit)) return 'spell'
  if (stat === 'int' || stat === 'wis' || stat === 'cha') return 'spell'
  if (stat === 'dex') return 'ranged'
  return 'melee'
}

function parseBonusString(toHit: string | undefined | null): number {
  const s = (toHit ?? '').trim()
  if (/^DC\s*\d+/i.test(s)) return 0
  const n = parseInt(s.replace(/^\+/, ''), 10)
  return isNaN(n) ? 0 : n
}

/* ── DB constants ─────────────────────────────────────────────────────── */

const V2_DB_NAME      = 'dnd-character-sheet-v2'
const V2_DB_VER       = 10
const V2_STORE        = 'characters'
const TOMBSTONE_STORE = 'deleted_characters'

// ── Tombstone shape ────────────────────────────────────────────────────────

export interface DeletedCharacterTombstone {
  id:        string   // character id
  deletedAt: number   // Date.now()
  userId:    string   // who deleted (validated in sync)
  synced:    boolean  // false = pending propagation, true = propagated
}

/* ── DB opener ────────────────────────────────────────────────────────── */


function openV2() {
  return openDB(V2_DB_NAME, V2_DB_VER, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      // ── PHASE 1: schema declarations (MUST be synchronous, before any await) ──
      //
      // IndexedDB auto-commits the versionchange transaction when there are no
      // pending requests and control returns to the event loop. Any `await` on
      // an IDB request (e.g. cursor.openCursor()) gives up control, which can
      // close the transaction before createObjectStore is reached.
      //
      // Rule: ALL createObjectStore / deleteObjectStore calls go here, in the
      // synchronous top section, before any `await` in PHASE 2.

      if (oldVersion < 1) {
        db.createObjectStore(V2_STORE, { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        // v1-shape data (V1Character) is incompatible with v2-native Character.
        // Clear the store so migration can re-populate with adapted records.
        // This only affects dev environments that had C.1.a phase data.
        if (db.objectStoreNames.contains(V2_STORE)) {
          db.deleteObjectStore(V2_STORE)
        }
        db.createObjectStore(V2_STORE, { keyPath: 'id' })
      }
      if (oldVersion < 9) {
        // Tombstone store for the sync layer (upload sub-fase 2.1).
        // The guard < 9 (not < 8) also heals installs that reached v8 without
        // this store due to the async-before-createObjectStore bug in the
        // original v8 deployment.
        if (!db.objectStoreNames.contains(TOMBSTONE_STORE)) {
          db.createObjectStore(TOMBSTONE_STORE, { keyPath: 'id' })
        }
      }

      // ── PHASE 2: data migrations (cursor-based, may use await) ───────────────

      if (oldVersion < 10) {
        // v10: add `locked` field (default false) to all characters.
        const store = transaction.objectStore(V2_STORE)
        let cursor = await store.openCursor()
        while (cursor) {
          const char = cursor.value as Character
          if (typeof char.locked !== 'boolean') {
            await cursor.update({ ...char, locked: false })
          }
          cursor = await cursor.continue()
        }
      }

      if (oldVersion < 3) {
        // Add className to each hitDice entry, deriving it from classes[i].name.
        // Characters stored in v2 DB have hitDice without className (C.1.c.4 shape change).
        // For fresh installs (store just recreated above), cursor is null and this loop is a no-op.
        const store = transaction.objectStore(V2_STORE)
        let cursor = await store.openCursor()
        while (cursor) {
          const char = cursor.value as Record<string, unknown>
          if (Array.isArray(char.hitDice)) {
            const classes = (char.classes as Array<{ name: string }> | undefined) ?? []
            char.hitDice = (char.hitDice as Array<Record<string, unknown>>).map((hd, i) => ({
              className: classes[i]?.name ?? '',
              ...hd,
            }))
            await cursor.update(char)
          }
          cursor = await cursor.continue()
        }
      }
      if (oldVersion < 4) {
        // Migrate proficiencies from string fields to arrays; lift languages to top-level.
        // Also backfill id and source on Feature entries that are missing them.
        const store = transaction.objectStore(V2_STORE)
        let cursor = await store.openCursor()
        while (cursor) {
          const char = cursor.value as Record<string, unknown>
          let updated = false

          // Proficiencies migration: old shape has string fields
          const profs = char.proficiencies as Record<string, unknown> | undefined
          if (profs && typeof profs.weaponsAndArmor === 'string') {
            char.proficiencies = {
              weapons: migrateProfString(profs.weaponsAndArmor),
              armor:   [],
              tools:   migrateProfString(profs.tools),
              other:   migrateProfString(profs.other),
            }
            // Languages move from proficiencies to top-level
            char.languages = migrateProfString(profs.languages)
            updated = true
          }

          // Ensure languages exists as array (fresh installs after v4 already have it)
          if (!Array.isArray(char.languages)) {
            char.languages = []
            updated = true
          }

          // Feature backfill: add id and source if missing
          if (Array.isArray(char.features)) {
            const patched = (char.features as Array<Record<string, unknown>>).map((f, idx) => ({
              id:     f.id ?? `feat-${idx}`,
              source: f.source ?? '',
              ...f,
            }))
            const changed = patched.some((f, i) => {
              const orig = (char.features as Array<Record<string, unknown>>)[i]!
              return f.id !== orig.id || f.source !== orig.source
            })
            if (changed) {
              char.features = patched
              updated = true
            }
          }

          if (updated) await cursor.update(char)
          cursor = await cursor.continue()
        }
      }
      if (oldVersion < 5) {
        // Expand Attack shape: rename baseStat→ability, bonus(string)→attackBonus(number),
        // add kind/range/properties/notes, drop rollType/proficient.
        const store = transaction.objectStore(V2_STORE)
        let cursor = await store.openCursor()
        while (cursor) {
          const char = cursor.value as Record<string, unknown>
          if (Array.isArray(char.attacks) && char.attacks.length > 0) {
            char.attacks = (char.attacks as Array<Record<string, unknown>>).map((a) => {
              const bonusStr = String(a.bonus ?? '')
              const baseStat = String(a.baseStat ?? '')
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { baseStat: _bs, rollType: _rt, proficient: _p, bonus: _b, ...rest } = a
              return {
                ...rest,
                id:           a.id ?? crypto.randomUUID(),
                kind:         inferAttackKind(bonusStr, baseStat),
                ability:      baseStat,
                attackBonus:  parseBonusString(bonusStr),
                range:        a.range ?? '',
                properties:   a.properties ?? '',
                notes:        a.notes ?? '',
              }
            })
            await cursor.update(char)
          }
          cursor = await cursor.continue()
        }
      }
      if (oldVersion < 6) {
        // Expand Spell shape: migrate old spells? sub-object to flat arrays + new fields.
        // Old shape: char.spells?: { ability, attackBonus, saveDC, slots: [{level,current,max}], known: [{level,name,prepared?}] }
        // New shape: char.spells: Spell[], char.spellSlots: Record<string,{current,max}>,
        //            char.spellcastingAbility: AbilityKey|'', char.spellcastingClass: string
        const store = transaction.objectStore(V2_STORE)
        let cursor = await store.openCursor()
        while (cursor) {
          const char = cursor.value as Record<string, unknown>

          // Extract old spells sub-object (may be undefined for non-casters)
          const oldSpells = char.spells as Record<string, unknown> | undefined

          // spellcastingAbility
          if (typeof char.spellcastingAbility !== 'string') {
            char.spellcastingAbility = (oldSpells?.ability as string) ?? ''
          }

          // spellcastingClass
          if (typeof char.spellcastingClass !== 'string') {
            const classes = char.classes as Array<{ name: string }> | undefined
            char.spellcastingClass = classes?.[0]?.name ?? ''
          }

          // spellSlots: Record<'1'–'9', {current, max}>
          if (!char.spellSlots || typeof char.spellSlots !== 'object' || Array.isArray(char.spellSlots)) {
            const newSlots: Record<string, { current: number; max: number }> = {}
            const oldSlotArr = oldSpells?.slots as Array<{ level: number; current: number; max: number }> | undefined
            if (Array.isArray(oldSlotArr)) {
              for (const s of oldSlotArr) {
                const key = String(s.level)
                newSlots[key] = { current: s.current ?? 0, max: s.max ?? 0 }
              }
            }
            char.spellSlots = newSlots
          }

          // spells: Spell[]
          // If already an array (idempotent run), leave it.
          // If old shape is an object with .known, convert.
          if (!Array.isArray(char.spells)) {
            const known = oldSpells?.known as Array<{ level: number; name: string; prepared?: boolean }> | undefined
            char.spells = Array.isArray(known)
              ? known.map((s) => ({
                  id:          crypto.randomUUID(),
                  name:        s.name ?? '',
                  level:       typeof s.level === 'number' ? Math.max(0, Math.min(9, s.level)) : 0,
                  school:      'abjuration' as const,
                  castingTime: '',
                  range:       '',
                  description: '',
                  prepared:    typeof s.prepared === 'boolean' ? s.prepared : false,
                }))
              : []
          } else {
            // Already an array — backfill any missing fields (idempotent)
            char.spells = (char.spells as Array<Record<string, unknown>>).map((s) => ({
              id:          s.id ?? crypto.randomUUID(),
              name:        s.name ?? '',
              level:       typeof s.level === 'number' ? Math.max(0, Math.min(9, s.level)) : 0,
              school:      s.school ?? 'abjuration',
              castingTime: s.castingTime ?? '',
              range:       s.range ?? '',
              description: s.description ?? '',
              prepared:    typeof s.prepared === 'boolean' ? s.prepared : false,
            }))
          }

          await cursor.update(char)
          cursor = await cursor.continue()
        }
      }
      if (oldVersion < 7) {
        // Expand InventoryItem shape: add category/description/equipped; backfill id.
        // Remove EP from Currency: convert 1 EP → 5 SP (D&D 5e standard exchange rate).
        const store = transaction.objectStore(V2_STORE)
        let cursor = await store.openCursor()
        while (cursor) {
          const char = cursor.value as Record<string, unknown>
          let updated = false

          // Inventory items migration
          if (Array.isArray(char.inventory)) {
            char.inventory = (char.inventory as Array<Record<string, unknown>>).map((item, idx) => ({
              id:          typeof item.id === 'string' ? item.id : `inv_${idx}`,
              name:        typeof item.name === 'string' ? item.name : '',
              quantity:    typeof item.quantity === 'number' ? Math.max(0, item.quantity) : 1,
              weight:      typeof item.weight === 'number' ? Math.max(0, item.weight) : 0,
              category:    isValidCategory(item.category) ? item.category : 'misc',
              description: typeof item.description === 'string' ? item.description
                         : typeof item.notes === 'string' ? item.notes
                         : '',
              equipped:    typeof item.equipped === 'boolean' ? item.equipped : false,
            }))
            updated = true
          } else {
            char.inventory = []
            updated = true
          }

          // Currency migration: remove EP, convert to SP
          const cur = char.currency as Record<string, unknown> | undefined
          if (cur && typeof cur === 'object') {
            const epValue = typeof cur.ep === 'number' ? cur.ep : 0
            char.currency = {
              pp: typeof cur.pp === 'number' ? cur.pp : 0,
              gp: typeof cur.gp === 'number' ? cur.gp : 0,
              sp: (typeof cur.sp === 'number' ? cur.sp : 0) + (epValue * 5),
              cp: typeof cur.cp === 'number' ? cur.cp : 0,
            }
            updated = true
          } else {
            char.currency = { pp: 0, gp: 0, sp: 0, cp: 0 }
            updated = true
          }

          if (updated) await cursor.update(char)
          cursor = await cursor.continue()
        }
      }
      // (v8 tombstone store creation moved to PHASE 1 above — see schema v9 comment)
    },
  })
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Remove hitDice entries that are orphaned from the classes array.
 *
 * This handles characters that were persisted before the C.1.c.4 follow-up
 * fix: when addClass created entries with className '' and a subsequent rename
 * left the hitDice entry behind with an empty className. Cleaning on read is
 * O(n) over hitDice.length (≤ 3 entries in practice) and is a no-op for
 * characters that are already consistent.
 *
 * The next character save will persist the cleaned shape, self-healing the DB.
 */
function normalizeHitDice(char: Character): Character {
  if (!Array.isArray(char.classes) || !Array.isArray(char.hitDice)) return char
  const classNames = new Set(char.classes.map(c => c.name).filter(n => n !== ''))
  const cleaned = char.hitDice.filter(
    hd => hd.className !== '' && classNames.has(hd.className),
  )
  if (cleaned.length === char.hitDice.length) return char
  return { ...char, hitDice: cleaned }
}

/**
 * Runtime spell normalization — analogous to normalizeHitDice.
 *
 * Handles characters whose `spells` field is still in the legacy object shape
 * { ability, attackBonus, saveDC, slots, known } because the v5→v6 DB upgrade
 * block was skipped (the DB was already version 6 from an earlier incomplete
 * migration run before C.1.e was finalized).
 *
 * Also backfills spellSlots / spellcastingAbility / spellcastingClass when any
 * of them is missing (characters saved before those fields existed).
 *
 * Self-heals on every read; the next saveCharacter() will persist the
 * normalized shape, permanently fixing the stored record.
 */
function normalizeSpells(char: Character): Character {
  const raw = char as unknown as Record<string, unknown>

  // Fast path: all four spell fields are already in the correct shape.
  if (
    Array.isArray(raw.spells) &&
    typeof raw.spellcastingAbility === 'string' &&
    typeof raw.spellcastingClass   === 'string' &&
    raw.spellSlots != null &&
    typeof raw.spellSlots === 'object' &&
    !Array.isArray(raw.spellSlots)
  ) {
    return char
  }

  // Legacy object (or missing): extract old sub-object if spells is not an array.
  const oldSpells: Record<string, unknown> | undefined = Array.isArray(raw.spells)
    ? undefined
    : (raw.spells as Record<string, unknown> | undefined)

  // ── spells ───────────────────────────────────────────────────────────────
  let spells: Character['spells']
  if (Array.isArray(raw.spells)) {
    spells = raw.spells as Character['spells']
  } else {
    const known = oldSpells?.known as Array<{ level: number; name: string; prepared?: boolean }> | undefined
    spells = Array.isArray(known)
      ? known.map((s) => ({
          id:          crypto.randomUUID(),
          name:        s.name ?? '',
          level:       typeof s.level === 'number' ? Math.max(0, Math.min(9, s.level)) : 0,
          school:      'abjuration' as const,
          castingTime: '',
          range:       '',
          description: '',
          prepared:    typeof s.prepared === 'boolean' ? s.prepared : false,
        }))
      : []
  }

  // ── spellSlots ───────────────────────────────────────────────────────────
  let spellSlots: Character['spellSlots']
  if (
    raw.spellSlots != null &&
    typeof raw.spellSlots === 'object' &&
    !Array.isArray(raw.spellSlots)
  ) {
    spellSlots = raw.spellSlots as Character['spellSlots']
  } else {
    const newSlots: Record<string, { current: number; max: number }> = {}
    const oldSlotArr = oldSpells?.slots as Array<{ level: number; current: number; max: number }> | undefined
    if (Array.isArray(oldSlotArr)) {
      for (const s of oldSlotArr) {
        newSlots[String(s.level)] = { current: s.current ?? 0, max: s.max ?? 0 }
      }
    }
    spellSlots = newSlots
  }

  // ── spellcastingAbility ──────────────────────────────────────────────────
  const ABILITY_KEYS = new Set(['str', 'dex', 'con', 'int', 'wis', 'cha'])
  const rawAbilityStr = typeof raw.spellcastingAbility === 'string'
    ? raw.spellcastingAbility
    : (typeof oldSpells?.ability === 'string' ? oldSpells.ability : '')
  const spellcastingAbility = (
    ABILITY_KEYS.has(rawAbilityStr) ? rawAbilityStr : ''
  ) as Character['spellcastingAbility']

  // ── spellcastingClass ────────────────────────────────────────────────────
  const firstClassName = Array.isArray(char.classes) ? char.classes[0]?.name : undefined
  const spellcastingClass: string = typeof raw.spellcastingClass === 'string'
    ? raw.spellcastingClass
    : (firstClassName ?? '')

  return { ...char, spells, spellSlots, spellcastingAbility, spellcastingClass }
}

/**
 * Runtime inventory normalization — analogous to normalizeHitDice.
 *
 * Handles characters whose inventory items are missing fields introduced in
 * C.1.f (category, description, equipped) because the v6→v7 DB upgrade block
 * was skipped (DB already at v7 from an earlier incomplete dev run).
 * Also backfills Currency when ep is still present (converts → SP).
 *
 * Self-heals on every read; the next saveCharacter() persists the normalized shape.
 */
function normalizeInventory(char: Character): Character {
  const raw = char as unknown as Record<string, unknown>

  // Check inventory items
  const inv = raw.inventory
  let inventoryClean = true
  if (Array.isArray(inv)) {
    for (const item of inv as Array<Record<string, unknown>>) {
      if (
        typeof item.category !== 'string' ||
        typeof item.description !== 'string' ||
        typeof item.equipped !== 'boolean'
      ) {
        inventoryClean = false
        break
      }
    }
  } else {
    inventoryClean = false
  }

  // Check currency — fast path if ep absent
  const cur = raw.currency as Record<string, unknown> | undefined
  const currencyClean = cur != null && typeof cur === 'object' && !('ep' in cur)

  if (inventoryClean && currencyClean) return char

  let inventory: Character['inventory']
  if (!Array.isArray(inv)) {
    inventory = []
  } else {
    inventory = (inv as Array<Record<string, unknown>>).map((item, idx) => ({
      id:          typeof item.id === 'string' ? item.id : `inv_${idx}`,
      name:        typeof item.name === 'string' ? item.name : '',
      quantity:    typeof item.quantity === 'number' ? Math.max(0, item.quantity) : 1,
      weight:      typeof item.weight === 'number' ? Math.max(0, item.weight) : 0,
      category:    isValidCategory(item.category) ? item.category : 'misc',
      description: typeof item.description === 'string' ? item.description
                 : typeof item.notes === 'string' ? item.notes
                 : '',
      equipped:    typeof item.equipped === 'boolean' ? item.equipped : false,
    }))
  }

  let currency: Character['currency']
  if (cur != null && typeof cur === 'object') {
    const epValue = typeof cur.ep === 'number' ? cur.ep : 0
    currency = {
      pp: typeof cur.pp === 'number' ? cur.pp : 0,
      gp: typeof cur.gp === 'number' ? cur.gp : 0,
      sp: (typeof cur.sp === 'number' ? cur.sp : 0) + (epValue * 5),
      cp: typeof cur.cp === 'number' ? cur.cp : 0,
    }
  } else {
    currency = { pp: 0, gp: 0, sp: 0, cp: 0 }
  }

  return { ...char, inventory, currency }
}

/**
 * Runtime lock normalization — adds `locked: false` if the field is missing.
 *
 * Handles characters created before v10 that may not have the `locked` field.
 * Self-heals on every read; the next saveCharacter() persists the normalized shape.
 */
function normalizeLocked(char: Character): Character {
  if (typeof char.locked !== 'boolean') {
    return { ...char, locked: false }
  }
  return char
}

/* ── Public API ───────────────────────────────────────────────────────── */

/**
 * Returns all characters from the v2 DB, sorted by most recently updated.
 * Post-migration this is the single source of truth; no v1 merging needed.
 */
export async function listCharacters(): Promise<Character[]> {
  const db = await openV2()
  try {
    const all = await db.getAll(V2_STORE) as Character[]
    return all.sort((a, b) => b.updatedAt - a.updatedAt).map(normalizeHitDice).map(normalizeSpells).map(normalizeInventory).map(normalizeLocked)
  } finally {
    db.close()
  }
}

/**
 * Fetch a single character by id from the v2 DB.
 * Returns null if not found.
 */
export async function getCharacter(id: string): Promise<Character | null> {
  const db = await openV2()
  try {
    const result = await db.get(V2_STORE, id) as Character | undefined
    return result != null ? normalizeLocked(normalizeInventory(normalizeSpells(normalizeHitDice(result)))) : null
  } finally {
    db.close()
  }
}

/**
 * Persist a Character to the v2 DB.
 * Always stamps updatedAt to the current time.
 *
 * IMPORTANT: writes ONLY to the v2 DB (dnd-character-sheet-v2).
 * The v1 DB is treated as read-only from v2's perspective.
 */
export async function saveCharacter(character: Character): Promise<void> {
  const db = await openV2()
  try {
    await db.put(V2_STORE, { ...character, updatedAt: Date.now() })
  } finally {
    db.close()
  }
}

/**
 * Delete a character by id from the v2 DB.
 */
export async function deleteCharacter(id: string): Promise<void> {
  const db = await openV2()
  try {
    await db.delete(V2_STORE, id)
  } finally {
    db.close()
  }
}

/* ── Tombstone operations ─────────────────────────────────────────────── */

/**
 * Record a soft-delete tombstone so the sync layer can propagate the
 * deletion to Supabase. Only called when the user is logged in — offline
 * deletions do not generate tombstones (no user to attribute them to).
 */
export async function createTombstone(characterId: string, userId: string): Promise<void> {
  const db = await openV2()
  try {
    await db.put(TOMBSTONE_STORE, {
      id:        characterId,
      deletedAt: Date.now(),
      userId,
      synced:    false,
    } satisfies DeletedCharacterTombstone)
  } finally {
    db.close()
  }
}

/**
 * Returns all tombstones that have not yet been propagated to Supabase.
 */
export async function getPendingTombstones(): Promise<DeletedCharacterTombstone[]> {
  const db = await openV2()
  try {
    const all = await db.getAll(TOMBSTONE_STORE) as DeletedCharacterTombstone[]
    return all.filter(t => !t.synced)
  } finally {
    db.close()
  }
}

/**
 * Mark a tombstone as successfully propagated. Keeps the record for TTL
 * purposes; a future cleanup pass can remove old synced tombstones.
 */
export async function markTombstoneSynced(id: string): Promise<void> {
  const db = await openV2()
  try {
    const tombstone = await db.get(TOMBSTONE_STORE, id) as DeletedCharacterTombstone | undefined
    if (tombstone) {
      await db.put(TOMBSTONE_STORE, { ...tombstone, synced: true })
    }
  } finally {
    db.close()
  }
}

/**
 * Remove a tombstone entirely (used after confirmed cloud propagation).
 */
export async function removeTombstone(id: string): Promise<void> {
  const db = await openV2()
  try {
    await db.delete(TOMBSTONE_STORE, id)
  } finally {
    db.close()
  }
}

/**
 * Store a character exactly as-is, without updating updatedAt.
 * Used by the sync service when downloading from the cloud to preserve
 * the cloud timestamp for LWW conflict resolution.
 */
export async function importCharacter(character: Character): Promise<void> {
  const db = await openV2()
  try {
    await db.put(V2_STORE, character)
  } finally {
    db.close()
  }
}
