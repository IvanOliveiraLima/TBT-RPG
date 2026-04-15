// Character sheet storage using IndexedDB via the idb wrapper.

import { openDB } from 'idb';

const DB_NAME = 'dnd-character-sheet';
const DB_VERSION = 2;
const STORE = 'characters';

function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id' });
            }
        }
    });
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
    await db.put(STORE, { ...data, updatedAt: Date.now() });
}

/**
 * Load a character by ID. Defaults to 'active' for backwards compatibility.
 * Returns null if not found.
 * @param {string} [id='active']
 * @returns {Promise<object|null>}
 */
export async function loadCharacter(id = 'active') {
    const db = await getDB();
    const data = await db.get(STORE, id);
    return data ? migrateSchema(data) : null;
}

/**
 * Returns a summary list of all characters (excluding the legacy 'active' record),
 * sorted by most recently updated.
 * @returns {Promise<Array>}
 */
export async function listCharacters() {
    const db = await getDB();
    const all = await db.getAll(STORE);
    return all
        .filter(c => c.id !== 'active')
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .map(c => ({
            id: c.id,
            name: c.page1?.basic_info?.char_name || 'Unnamed',
            class: c.page1?.basic_info?.char_class || '',
            level: c.page1?.basic_info?.total_level || '',
            race: c.page1?.character_info?.race_class || '',
            updatedAt: c.updatedAt
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
