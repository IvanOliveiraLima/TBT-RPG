/**
 * IndexedDB wrapper for v2 — v2-native persistence.
 *
 * Strategy (Phase C.1.0 pivot):
 *   v2 DB  (dnd-character-sheet-v2, version 5) — read + write, stores Character directly
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
 */

import { openDB } from 'idb'
import type { Character } from '@/domain/character'
import { migrateProfString, inferAttackKind, parseBonusString } from './adapter'

/* ── DB constants ─────────────────────────────────────────────────────── */

const V2_DB_NAME = 'dnd-character-sheet-v2'
const V2_DB_VER  = 6
const V2_STORE   = 'characters'

/* ── DB opener ────────────────────────────────────────────────────────── */


function openV2() {
  return openDB(V2_DB_NAME, V2_DB_VER, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
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

/* ── Public API ───────────────────────────────────────────────────────── */

/**
 * Returns all characters from the v2 DB, sorted by most recently updated.
 * Post-migration this is the single source of truth; no v1 merging needed.
 */
export async function listCharacters(): Promise<Character[]> {
  const db = await openV2()
  try {
    const all = await db.getAll(V2_STORE) as Character[]
    return all.sort((a, b) => b.updatedAt - a.updatedAt).map(normalizeHitDice)
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
    return result != null ? normalizeHitDice(result) : null
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
