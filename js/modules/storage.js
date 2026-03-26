// Character sheet storage using IndexedDB via the idb wrapper.

import { openDB } from 'idb';

const DB_NAME = 'dnd-character-sheet';
const DB_VERSION = 1;
const STORE_NAME = 'characters';
const ACTIVE_ID = 'active';

let dbPromise = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        });
    }
    return dbPromise;
}

function migrateSchema(data) {
    if (!data) return null;

    // v1 → v2: adiciona campo 'id' se não existir
    if (!data.schemaVersion || data.schemaVersion < 2) {
        data.id = data.id || ACTIVE_ID;
        data.schemaVersion = 2;
    }

    return data;
}

/**
 * Persist the active character to IndexedDB.
 * @param {object} data
 */
export async function saveCharacter(data) {
    const db = await getDB();
    await db.put(STORE_NAME, { id: ACTIVE_ID, ...data });
}

/**
 * Load the active character from IndexedDB, or null if absent.
 * Applies schema migration before returning.
 * @returns {Promise<object|null>}
 */
export async function loadCharacter() {
    const db = await getDB();
    const record = await db.get(STORE_NAME, ACTIVE_ID);
    return migrateSchema(record || null);
}

/**
 * Remove the active character from IndexedDB.
 */
export async function clearCharacter() {
    const db = await getDB();
    await db.delete(STORE_NAME, ACTIVE_ID);
}
