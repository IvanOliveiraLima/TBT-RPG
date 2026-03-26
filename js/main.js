// Entry point — import all modules and expose globals needed by inline onclick handlers.
// Static imports are hoisted by the JS engine; the module body (including the
// top-level await below) runs only after all imports have been initialised.
// DOMContentLoaded fires after the entire module tree finishes executing, so
// migrateFromLocalStorage() is guaranteed to complete before load.js reads IndexedDB.

import './extra.js';
import './add-attack.js';
import './app.js';
import './load.js';

import { openPage, w3_open, w3_close } from './app.js';
import { att_attack } from './add-attack.js';
import { exportSheet, openImportDialog, clearSavedSheet, importSheetFile, saveSheet } from './save.js';
import { lock } from './changes.js';
import { loadCharacter, saveCharacter } from './modules/storage.js';

// Migrate data from localStorage (legacy) to IndexedDB on first run.
async function migrateFromLocalStorage() {
    var legacy = localStorage.getItem('dnd_sheet_v1');
    if (!legacy) return;

    try {
        var data = JSON.parse(legacy);
        var existing = await loadCharacter();
        if (!existing) {
            await saveCharacter({ id: 'active', ...data });
        }
        localStorage.removeItem('dnd_sheet_v1');
        console.info('Migrated character data from localStorage to IndexedDB');
    } catch (e) {
        console.warn('Migration failed, keeping localStorage data', e);
    }
}

await migrateFromLocalStorage();

window.openPage = openPage;
window.w3_open = w3_open;
window.w3_close = w3_close;
window.att_attack = att_attack;
window.exportSheet = exportSheet;
window.openImportDialog = openImportDialog;
window.clearSavedSheet = clearSavedSheet;
window.importSheetFile = importSheetFile;
window.saveSheet = saveSheet;
window.lock = lock;
