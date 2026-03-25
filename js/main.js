// Entry point — import all modules and expose globals needed by inline onclick handlers.

import './extra.js';
import './add-attack.js';
import './app.js';
import './load.js';

import { openPage, w3_open, w3_close } from './app.js';
import { att_attack } from './add-attack.js';
import { exportSheet, openImportDialog, clearSavedSheet, importSheetFile, saveSheet } from './save.js';
import { lock } from './changes.js';

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
