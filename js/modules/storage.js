// Character sheet storage using IndexedDB via the idb wrapper.

import { openDB } from 'idb';

const DB_NAME = 'dnd-character-sheet';
const DB_VERSION = 3;
const STORE = 'characters';
const TOMBSTONE_STORE = 'deleted_characters';

// v2 DB — read-only from v1. v1 never writes here; v2 never writes to DB_NAME.
// See CLAUDE.md → v2 IndexedDB strategy.
const DB_NAME_V2 = 'dnd-character-sheet-v2';

/**
 * Try to open the v2 DB for reading. Returns null if:
 *  - The v2 DB has never been created (user hasn't opened v2 yet)
 *  - indexedDB.databases() is unavailable (old browser)
 *  - Any other error (network issue, private browsing restriction, etc.)
 *
 * IMPORTANT: no upgrade callback — v1 must never create or migrate the v2 DB.
 * Uses indexedDB.databases() to check existence before opening, avoiding the
 * side-effect of creating an empty DB when calling openDB on a non-existent store.
 *
 * Known limitation: if a character was deleted in v1 (tombstone in
 * deleted_characters) but still exists in the v2 DB, the merge in
 * listCharacters/loadCharacter will NOT show it because tombstone IDs are
 * filtered out. Characters deleted only in v2 (no v2 delete UI exists yet)
 * are not handled — future work when v2 gets a delete flow.
 */
async function openV2DbReadonly() {
    try {
        const dbs = await indexedDB.databases();
        if (!dbs.some(db => db.name === DB_NAME_V2)) return null;
        return await openDB(DB_NAME_V2);
    } catch {
        return null;
    }
}

function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(TOMBSTONE_STORE)) {
                db.createObjectStore(TOMBSTONE_STORE, { keyPath: 'id' });
            }
        }
    });
}

export async function markAsDeleted(id) {
    const db = await getDB();
    await db.put(TOMBSTONE_STORE, { id, deletedAt: Date.now() });
}

export async function getDeletedIds() {
    const db = await getDB();
    return db.getAll(TOMBSTONE_STORE);
}

export async function clearTombstone(id) {
    const db = await getDB();
    await db.delete(TOMBSTONE_STORE, id);
}

function migrateSchema(data) {
    if (!data) return null;

    // v1 → v2: ensure id field and schemaVersion
    if (!data.schemaVersion || data.schemaVersion < 2) {
        data.id = data.id || 'active';
        data.schemaVersion = 2;
    }

    return data;
}

/**
 * Generates a unique ID for a new character.
 * @returns {string}
 */
export function generateId() {
    return `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Persist a character to IndexedDB. The data object must have an `id` field.
 * @param {object} data
 */
export async function saveCharacter(data) {
    const db = await getDB();
    await db.put(STORE, { ...data, updatedAt: data.updatedAt ?? Date.now() });
}

/**
 * Load a character by ID. Defaults to 'active' for backwards compatibility.
 * Checks v2 DB first (v2 wins on collision), falls back to v1 DB.
 * Returns null if not found in either DB.
 * @param {string} [id='active']
 * @returns {Promise<object|null>}
 */
export async function loadCharacter(id = 'active') {
    // v2 wins on collision — check v2 DB first
    const v2db = await openV2DbReadonly();
    if (v2db) {
        try {
            const v2data = await v2db.get(STORE, id);
            if (v2data) return migrateSchema(v2data);
        } catch {
            // v2 DB open but read failed — fall through to v1
        }
    }
    const db = await getDB();
    const data = await db.get(STORE, id);
    return data ? migrateSchema(data) : null;
}

/**
 * Returns a summary list of all characters from both v1 and v2 DBs, merged
 * and deduplicated. v2 wins on ID collisions. Characters with tombstones
 * (deleted in v1 while logged in) are excluded even if they still exist in
 * the v2 DB. Sorted by most recently updated.
 * @returns {Promise<Array>}
 */
export async function listCharacters() {
    const db = await getDB();
    const [v1All, tombstones] = await Promise.all([
        db.getAll(STORE),
        db.getAll(TOMBSTONE_STORE),
    ]);
    const deletedIds = new Set(tombstones.map(t => t.id));

    // Start with v1 records
    const byId = new Map();
    for (const c of v1All) {
        if (c.id === 'active' || deletedIds.has(c.id)) continue;
        byId.set(c.id, c);
    }

    // Overlay v2 records (v2 wins on collision); skip tombstoned ids
    const v2db = await openV2DbReadonly();
    if (v2db) {
        try {
            const v2All = await v2db.getAll(STORE);
            for (const c of v2All) {
                if (c.id === 'active' || deletedIds.has(c.id)) continue;
                byId.set(c.id, c);
            }
        } catch {
            // v2 read failed — continue with v1-only results
        }
    }

    return [...byId.values()]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .map(c => ({
            id: c.id,
            name: c.page1?.basic_info?.char_name || 'Unnamed',
            class: c.page1?.basic_info?.char_class || c.page1?.basic_info?.classes?.[0]?.name || '',
            level: c.page1?.basic_info?.total_level || '',
            race: c.page1?.character_info?.race_class || '',
            updatedAt: c.updatedAt,
        }));
}

/**
 * Lista todos os personagens (sem filtrar por 'active'), para uso no sync.
 * @returns {Promise<Array>}
 */
export async function listAllCharacters() {
  const db = await getDB()
  return db.getAll(STORE)
}

/**
 * Delete a character by ID.
 * @param {string} id
 */
export async function deleteCharacter(id) {
    const db = await getDB();
    await db.delete(STORE, id);
}

/**
 * Duplicate a character, assigning it a new ID and appending " (copy)" to its name.
 * Returns the new ID, or null if the original was not found.
 * @param {string} id
 * @returns {Promise<string|null>}
 */
export async function duplicateCharacter(id) {
    const db = await getDB();
    const original = await db.get(STORE, id);
    if (!original) return null;

    const copy = {
        ...original,
        id: generateId(),
        updatedAt: Date.now(),
        page1: {
            ...original.page1,
            basic_info: {
                ...original.page1?.basic_info,
                char_name: `${original.page1?.basic_info?.char_name || 'Unnamed'} (copy)`
            }
        }
    };
    await db.put(STORE, copy);
    return copy.id;
}

/**
 * Export all characters (excluding legacy 'active') as a JSON string.
 * @returns {Promise<string>}
 */
export async function exportAllCharacters() {
    const db = await getDB();
    const all = await db.getAll(STORE);
    const characters = all.filter(c => c.id !== 'active');
    return JSON.stringify({ exportVersion: 1, exportedAt: Date.now(), characters }, null, 2);
}

/**
 * Import characters from a JSON string.
 * mode='merge' adds/updates; mode='replace' clears existing characters first.
 * @param {string} jsonString
 * @param {'merge'|'replace'} [mode='merge']
 * @returns {Promise<number>} number of characters imported
 */
export async function importCharacters(jsonString, mode = 'merge') {
    const data = JSON.parse(jsonString);
    const characters = data.characters || (Array.isArray(data) ? data : [data]);
    const db = await getDB();

    if (mode === 'replace') {
        const existing = await db.getAll(STORE);
        for (const c of existing.filter(c => c.id !== 'active')) {
            await db.delete(STORE, c.id);
        }
    }

    for (const char of characters) {
        const id = char.id && char.id !== 'active' ? char.id : generateId();
        await db.put(STORE, { ...char, id, updatedAt: Date.now() });
    }

    return characters.length;
}

/**
 * Remove a character from IndexedDB. Defaults to 'active' for backwards compatibility.
 * @param {string} [id='active']
 */
export async function clearCharacter(id = 'active') {
    const db = await getDB();
    await db.delete(STORE, id);
}
