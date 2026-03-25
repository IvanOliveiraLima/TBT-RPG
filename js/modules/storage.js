// All localStorage read/write operations for the character sheet.

export var DND_SHEET_STORAGE_KEY = 'dnd_sheet_v1';

/**
 * Persist a sheet object to localStorage.
 * @param {object} sheet
 */
export function saveCharacter(sheet) {
    localStorage.setItem(DND_SHEET_STORAGE_KEY, JSON.stringify(sheet));
}

/**
 * Load the raw sheet object from localStorage, or null if absent/invalid.
 * @returns {object|null}
 */
export function loadCharacter() {
    try {
        var stored = localStorage.getItem(DND_SHEET_STORAGE_KEY);
        if (!stored) {
            return null;
        }
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
}

/**
 * Remove the saved sheet from localStorage.
 */
export function clearCharacter() {
    localStorage.removeItem(DND_SHEET_STORAGE_KEY);
}
