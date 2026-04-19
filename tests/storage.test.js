import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// idb mock — shared in-memory store
// ---------------------------------------------------------------------------

const mockStore = vi.hoisted(() => new Map());

vi.mock('idb', () => {
    const mockDb = {
        put: vi.fn((storeName, record) => {
            mockStore.set(record.id, { ...record });
            return Promise.resolve(record.id);
        }),
        get: vi.fn((storeName, key) => Promise.resolve(mockStore.get(key))),
        delete: vi.fn((storeName, key) => {
            mockStore.delete(key);
            return Promise.resolve();
        }),
        getAll: vi.fn(() => Promise.resolve([...mockStore.values()])),
    };
    return {
        openDB: vi.fn(() => Promise.resolve(mockDb)),
    };
});

import {
    saveCharacter,
    loadCharacter,
    clearCharacter,
    generateId,
    listCharacters,
    deleteCharacter,
    duplicateCharacter,
    exportAllCharacters,
    importCharacters,
} from '../js/modules/storage.js';

beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------

describe('generateId', () => {
    it('returns a string starting with char_', () => {
        expect(generateId()).toMatch(/^char_/);
    });

    it('returns unique values on each call', () => {
        const ids = new Set(Array.from({ length: 20 }, generateId));
        expect(ids.size).toBe(20);
    });
});

// ---------------------------------------------------------------------------
// saveCharacter
// ---------------------------------------------------------------------------

describe('saveCharacter', () => {
    it('persists the sheet so loadCharacter returns it', async () => {
        const sheet = { id: 'char_1', page1: { basic_info: { char_name: 'Legolas' } } };
        await saveCharacter(sheet);
        const loaded = await loadCharacter('char_1');
        expect(loaded).toMatchObject({ page1: { basic_info: { char_name: 'Legolas' } } });
    });

    it('overwrites a previous save', async () => {
        await saveCharacter({ id: 'char_1', hp: 10 });
        await saveCharacter({ id: 'char_1', hp: 20 });
        const loaded = await loadCharacter('char_1');
        expect(loaded.hp).toBe(20);
    });

    it('adds updatedAt timestamp when not provided', async () => {
        const before = Date.now();
        await saveCharacter({ id: 'char_1' });
        const loaded = await loadCharacter('char_1');
        expect(loaded.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('preserves explicit updatedAt when provided', async () => {
        await saveCharacter({ id: 'char_1', updatedAt: 12345 });
        const loaded = await loadCharacter('char_1');
        expect(loaded.updatedAt).toBe(12345);
    });

    it('backwards compat: saves under active when no id overridden', async () => {
        await saveCharacter({ id: 'active', name: 'Frodo' });
        expect(mockStore.has('active')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// loadCharacter
// ---------------------------------------------------------------------------

describe('loadCharacter', () => {
    it('returns null when nothing is stored', async () => {
        expect(await loadCharacter('char_1')).toBeNull();
    });

    it('defaults to id=active for backwards compatibility', async () => {
        mockStore.set('active', { id: 'active', hp: 5 });
        const loaded = await loadCharacter();
        expect(loaded).not.toBeNull();
        expect(loaded.hp).toBe(5);
    });

    it('returns the saved object by id', async () => {
        const sheet = { id: 'char_99', page1: { basic_info: { char_name: 'Gandalf' } } };
        await saveCharacter(sheet);
        const loaded = await loadCharacter('char_99');
        expect(loaded).toMatchObject(sheet);
    });

    it('applies schema migration: adds id and bumps schemaVersion to 2', async () => {
        mockStore.set('active', { schemaVersion: 1, hp: 30 });
        const loaded = await loadCharacter();
        expect(loaded.id).toBe('active');
        expect(loaded.schemaVersion).toBe(2);
    });

    it('applies schema migration when schemaVersion is absent', async () => {
        mockStore.set('active', { hp: 30 });
        const loaded = await loadCharacter();
        expect(loaded.schemaVersion).toBe(2);
    });

    it('does not downgrade schemaVersion when already at 2', async () => {
        mockStore.set('active', { id: 'active', schemaVersion: 2, hp: 10 });
        const loaded = await loadCharacter();
        expect(loaded.schemaVersion).toBe(2);
    });

    it('preserves existing id when migrating', async () => {
        mockStore.set('active', { id: 'active', schemaVersion: 1, hp: 5 });
        const loaded = await loadCharacter();
        expect(loaded.id).toBe('active');
    });
});

// ---------------------------------------------------------------------------
// clearCharacter
// ---------------------------------------------------------------------------

describe('clearCharacter', () => {
    it('makes loadCharacter return null after clearing', async () => {
        await saveCharacter({ id: 'char_1', hp: 99 });
        await clearCharacter('char_1');
        expect(await loadCharacter('char_1')).toBeNull();
    });

    it('defaults to active id for backwards compatibility', async () => {
        mockStore.set('active', { id: 'active', hp: 1 });
        await clearCharacter();
        expect(await loadCharacter()).toBeNull();
    });

    it('does not throw when nothing is stored', async () => {
        await expect(clearCharacter('nonexistent')).resolves.toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// listCharacters
// ---------------------------------------------------------------------------

describe('listCharacters', () => {
    it('returns empty array when no characters exist', async () => {
        expect(await listCharacters()).toEqual([]);
    });

    it('excludes the legacy active record', async () => {
        mockStore.set('active', { id: 'active', updatedAt: 1000 });
        expect(await listCharacters()).toEqual([]);
    });

    it('returns summary objects sorted by updatedAt descending', async () => {
        mockStore.set('char_a', {
            id: 'char_a',
            updatedAt: 1000,
            page1: { basic_info: { char_name: 'Aragorn' }, character_info: { race_class: 'Human' } }
        });
        mockStore.set('char_b', {
            id: 'char_b',
            updatedAt: 2000,
            page1: { basic_info: { char_name: 'Legolas' }, character_info: {} }
        });

        const list = await listCharacters();
        expect(list).toHaveLength(2);
        expect(list[0].id).toBe('char_b');
        expect(list[1].id).toBe('char_a');
    });

    it('returns Unnamed for characters without a name', async () => {
        mockStore.set('char_x', { id: 'char_x', updatedAt: 1 });
        const list = await listCharacters();
        expect(list[0].name).toBe('Unnamed');
    });

    it('maps character fields correctly', async () => {
        mockStore.set('char_z', {
            id: 'char_z',
            updatedAt: 500,
            page1: {
                basic_info: { char_name: 'Gimli', total_level: '5' },
                character_info: { race_class: 'Dwarf' }
            }
        });
        const list = await listCharacters();
        expect(list[0]).toMatchObject({ id: 'char_z', name: 'Gimli', level: '5', race: 'Dwarf' });
    });
});

// ---------------------------------------------------------------------------
// deleteCharacter
// ---------------------------------------------------------------------------

describe('deleteCharacter', () => {
    it('removes the character from storage', async () => {
        await saveCharacter({ id: 'char_del' });
        await deleteCharacter('char_del');
        expect(await loadCharacter('char_del')).toBeNull();
    });

    it('does not throw when character does not exist', async () => {
        await expect(deleteCharacter('nonexistent')).resolves.toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// duplicateCharacter
// ---------------------------------------------------------------------------

describe('duplicateCharacter', () => {
    it('returns null when original does not exist', async () => {
        expect(await duplicateCharacter('missing')).toBeNull();
    });

    it('creates a new record with a different id', async () => {
        await saveCharacter({ id: 'char_orig', page1: { basic_info: { char_name: 'Bilbo' } } });
        const newId = await duplicateCharacter('char_orig');
        expect(newId).not.toBe('char_orig');
        expect(newId).toMatch(/^char_/);
    });

    it('appends (copy) to the name', async () => {
        await saveCharacter({ id: 'char_orig', page1: { basic_info: { char_name: 'Bilbo' } } });
        const newId = await duplicateCharacter('char_orig');
        const copy = await loadCharacter(newId);
        expect(copy.page1.basic_info.char_name).toBe('Bilbo (copy)');
    });

    it('preserves all other data from the original', async () => {
        await saveCharacter({ id: 'char_orig', hp: 30, page1: { basic_info: { char_name: 'Sam' } } });
        const newId = await duplicateCharacter('char_orig');
        const copy = await loadCharacter(newId);
        expect(copy.hp).toBe(30);
    });

    it('original remains unchanged after duplication', async () => {
        await saveCharacter({ id: 'char_orig', page1: { basic_info: { char_name: 'Merry' } } });
        await duplicateCharacter('char_orig');
        const original = await loadCharacter('char_orig');
        expect(original.page1.basic_info.char_name).toBe('Merry');
    });
});

// ---------------------------------------------------------------------------
// exportAllCharacters
// ---------------------------------------------------------------------------

describe('exportAllCharacters', () => {
    it('returns valid JSON string', async () => {
        await saveCharacter({ id: 'char_1', page1: { basic_info: { char_name: 'Boromir' } } });
        const json = await exportAllCharacters();
        expect(() => JSON.parse(json)).not.toThrow();
    });

    it('includes exportVersion and characters array', async () => {
        await saveCharacter({ id: 'char_1', page1: { basic_info: { char_name: 'Boromir' } } });
        const parsed = JSON.parse(await exportAllCharacters());
        expect(parsed.exportVersion).toBe(1);
        expect(Array.isArray(parsed.characters)).toBe(true);
    });

    it('excludes the legacy active record', async () => {
        mockStore.set('active', { id: 'active', name: 'legacy' });
        await saveCharacter({ id: 'char_1', page1: { basic_info: { char_name: 'Boromir' } } });
        const parsed = JSON.parse(await exportAllCharacters());
        expect(parsed.characters.every(c => c.id !== 'active')).toBe(true);
    });

    it('returns empty characters array when no real characters exist', async () => {
        const parsed = JSON.parse(await exportAllCharacters());
        expect(parsed.characters).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// importCharacters
// ---------------------------------------------------------------------------

describe('importCharacters', () => {
    it('imports characters in merge mode', async () => {
        const json = JSON.stringify({ exportVersion: 1, characters: [
            { id: 'char_imp1', page1: { basic_info: { char_name: 'Faramir' } } }
        ]});
        const count = await importCharacters(json);
        expect(count).toBe(1);
        expect(mockStore.has('char_imp1')).toBe(true);
    });

    it('returns number of imported characters', async () => {
        const json = JSON.stringify({ characters: [
            { id: 'char_a' }, { id: 'char_b' }
        ]});
        expect(await importCharacters(json)).toBe(2);
    });

    it('reassigns id active to a new id', async () => {
        const json = JSON.stringify({ characters: [{ id: 'active', hp: 5 }] });
        await importCharacters(json);
        expect(mockStore.has('active')).toBe(false);
    });

    it('merge mode keeps existing characters', async () => {
        mockStore.set('char_existing', { id: 'char_existing' });
        const json = JSON.stringify({ characters: [{ id: 'char_new' }] });
        await importCharacters(json, 'merge');
        expect(mockStore.has('char_existing')).toBe(true);
        expect(mockStore.has('char_new')).toBe(true);
    });

    it('replace mode removes existing characters before importing', async () => {
        mockStore.set('char_old', { id: 'char_old' });
        const json = JSON.stringify({ characters: [{ id: 'char_new' }] });
        await importCharacters(json, 'replace');
        expect(mockStore.has('char_old')).toBe(false);
        expect(mockStore.has('char_new')).toBe(true);
    });

    it('replace mode preserves the active legacy record', async () => {
        mockStore.set('active', { id: 'active' });
        const json = JSON.stringify({ characters: [{ id: 'char_x' }] });
        await importCharacters(json, 'replace');
        expect(mockStore.has('active')).toBe(true);
    });

    it('accepts a raw array as input', async () => {
        const json = JSON.stringify([{ id: 'char_arr' }]);
        await importCharacters(json);
        expect(mockStore.has('char_arr')).toBe(true);
    });

    it('throws on invalid JSON', async () => {
        await expect(importCharacters('not json')).rejects.toThrow();
    });
});
