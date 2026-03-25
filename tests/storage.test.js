import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DND_SHEET_STORAGE_KEY, saveCharacter, loadCharacter, clearCharacter } from '../js/modules/storage.js';

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] ?? null),
        setItem: vi.fn((key, value) => { store[key] = String(value); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// DND_SHEET_STORAGE_KEY
// ---------------------------------------------------------------------------

describe('DND_SHEET_STORAGE_KEY', () => {
    it('is a non-empty string', () => {
        expect(typeof DND_SHEET_STORAGE_KEY).toBe('string');
        expect(DND_SHEET_STORAGE_KEY.length).toBeGreaterThan(0);
    });

    it('has the expected value', () => {
        expect(DND_SHEET_STORAGE_KEY).toBe('dnd_sheet_v1');
    });
});

// ---------------------------------------------------------------------------
// saveCharacter
// ---------------------------------------------------------------------------

describe('saveCharacter', () => {
    it('calls localStorage.setItem with the correct key', () => {
        const sheet = { page1: { basic_info: { char_name: 'Legolas' } } };
        saveCharacter(sheet);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(DND_SHEET_STORAGE_KEY, expect.any(String));
    });

    it('serialises the sheet as JSON', () => {
        const sheet = { hp: 42 };
        saveCharacter(sheet);
        const [, stored] = localStorageMock.setItem.mock.calls[0];
        expect(JSON.parse(stored)).toEqual(sheet);
    });

    it('overwrites a previous save', () => {
        saveCharacter({ hp: 10 });
        saveCharacter({ hp: 20 });
        expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// loadCharacter
// ---------------------------------------------------------------------------

describe('loadCharacter', () => {
    it('returns null when nothing is stored', () => {
        expect(loadCharacter()).toBeNull();
    });

    it('returns the parsed object after a save', () => {
        const sheet = { page1: { basic_info: { char_name: 'Gandalf' } } };
        saveCharacter(sheet);
        expect(loadCharacter()).toEqual(sheet);
    });

    it('returns null when the stored value is invalid JSON', () => {
        localStorageMock.setItem(DND_SHEET_STORAGE_KEY, 'not-json{{{');
        expect(loadCharacter()).toBeNull();
    });

    it('returns null when stored value is an empty string', () => {
        localStorageMock.setItem(DND_SHEET_STORAGE_KEY, '');
        // setItem stores String('') — getItem returns '' which is falsy → null
        expect(loadCharacter()).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// clearCharacter
// ---------------------------------------------------------------------------

describe('clearCharacter', () => {
    it('calls localStorage.removeItem with the correct key', () => {
        clearCharacter();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(DND_SHEET_STORAGE_KEY);
    });

    it('makes loadCharacter return null after clearing', () => {
        saveCharacter({ hp: 99 });
        clearCharacter();
        expect(loadCharacter()).toBeNull();
    });
});
