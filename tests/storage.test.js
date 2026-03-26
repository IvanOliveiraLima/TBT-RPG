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
    };
    return {
        openDB: vi.fn(() => Promise.resolve(mockDb)),
    };
});

import { saveCharacter, loadCharacter, clearCharacter } from '../js/modules/storage.js';

beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// saveCharacter
// ---------------------------------------------------------------------------

describe('saveCharacter', () => {
    it('persists the sheet so loadCharacter returns it', async () => {
        const sheet = { page1: { basic_info: { char_name: 'Legolas' } } };
        await saveCharacter(sheet);
        const loaded = await loadCharacter();
        expect(loaded).toMatchObject(sheet);
    });

    it('overwrites a previous save', async () => {
        await saveCharacter({ hp: 10 });
        await saveCharacter({ hp: 20 });
        const loaded = await loadCharacter();
        expect(loaded.hp).toBe(20);
    });

    it('always saves under the active id', async () => {
        await saveCharacter({ name: 'Frodo' });
        expect(mockStore.has('active')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// loadCharacter
// ---------------------------------------------------------------------------

describe('loadCharacter', () => {
    it('returns null when nothing is stored', async () => {
        expect(await loadCharacter()).toBeNull();
    });

    it('returns the saved object after saveCharacter', async () => {
        const sheet = { page1: { basic_info: { char_name: 'Gandalf' } } };
        await saveCharacter(sheet);
        const loaded = await loadCharacter();
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
});

// ---------------------------------------------------------------------------
// clearCharacter
// ---------------------------------------------------------------------------

describe('clearCharacter', () => {
    it('makes loadCharacter return null after clearing', async () => {
        await saveCharacter({ hp: 99 });
        await clearCharacter();
        expect(await loadCharacter()).toBeNull();
    });

    it('does not throw when nothing is stored', async () => {
        await expect(clearCharacter()).resolves.toBeUndefined();
    });
});
