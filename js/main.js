// Entry point — import all modules and expose globals needed by inline onclick handlers.
// Static imports are hoisted by the JS engine; the module body (including the
// top-level await below) runs only after all imports have been initialised.
// DOMContentLoaded fires after the entire module tree finishes executing, so
// migrateFromLocalStorage() is guaranteed to complete before load.js reads IndexedDB.

import './extra.js';
import './add-attack.js';
import './app.js';
import { applyLoadedSheet } from './load.js';
import { openPage, w3_open, w3_close } from './app.js';
import { att_attack } from './add-attack.js';
import { exportSheet, openImportDialog, clearSavedSheet, importSheetFile, saveSheet, cancelAutoSave } from './save.js';
import { lock } from './changes.js';
import { loadCharacter, saveCharacter, generateId } from './modules/storage.js';
import { initCharacterSelect } from './modules/character-select.js';
import { openAiModal, closeAiModal, runAiGenerate } from './modules/ai-modal.js'
import { initAuth, onAuthChange } from './modules/auth.js'
import { applyTranslations, setLang, updateLangButtons } from './modules/i18n.js'
import { startAutoSync, stopAutoSync, cancelScheduledSync } from './modules/sync.js'
import { openAuthModal, closeAuthModal, showSignIn, showSignUp,
  handleEmailSignIn, handleEmailSignUp, handleGoogleSignIn,
  handleSignOut, handleForgotPassword } from './modules/auth-modal.js';

// ---------------------------------------------------------------------------
// Migration helpers
// ---------------------------------------------------------------------------

// Migrate data from localStorage (legacy v0) to IndexedDB on first run.
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

// Migrate the legacy 'active' record to a proper char_* ID.
async function migrateActiveCharacter() {
    var legacy = await loadCharacter('active');
    if (!legacy) return;

    var newId = generateId();
    await saveCharacter({ ...legacy, id: newId });
    // Remove the old 'active' record by importing clearCharacter inline to avoid circular dep
    var { clearCharacter } = await import('./modules/storage.js');
    await clearCharacter('active');
    console.info('Migrated active character to', newId);
    return newId;
}

// ---------------------------------------------------------------------------
// Screen visibility helpers
// ---------------------------------------------------------------------------

function showSheet() {
    var wrapper = document.getElementById('sheet-wrapper');
    var select = document.getElementById('character-select-screen');
    if (wrapper) wrapper.style.display = '';
    if (select) select.style.display = 'none';
    document.querySelectorAll('.sheet-only').forEach(el => el.style.display = '');
}

function showCharacterSelect() {
    var wrapper = document.getElementById('sheet-wrapper');
    var select = document.getElementById('character-select-screen');
    if (wrapper) wrapper.style.display = 'none';
    if (select) {
        select.style.display = '';
        initCharacterSelect(select);
    }
    document.querySelectorAll('.sheet-only').forEach(el => el.style.display = 'none');
}

// Called by the sidebar "← My Characters" link
window.goToCharacterSelect = function() {
    cancelAutoSave();
    sessionStorage.removeItem('activeCharacterId');
    w3_close();
    showCharacterSelect();
};

// ---------------------------------------------------------------------------
// Auth state handler — registrado ANTES de initAuth() para capturar a
// notificação inicial da sessão restaurada
// ---------------------------------------------------------------------------

onAuthChange(async (user) => {
    const authItem = document.getElementById('auth-sidebar-item');
    if (authItem) authItem.style.visibility = 'visible';

    const sidebarLink = document.getElementById('auth-sidebar-link');
    const userInfo = document.getElementById('auth-user-info');
    const emailSpan = document.getElementById('auth-user-email');

    if (user) {
        if (sidebarLink) sidebarLink.style.display = 'none';
        if (userInfo) userInfo.style.display = 'block';
        if (emailSpan) emailSpan.textContent = user.email;
        startAutoSync(30000);
    } else {
        if (sidebarLink) sidebarLink.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        stopAutoSync();
        cancelScheduledSync();
    }
});

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------

await migrateFromLocalStorage();
await migrateActiveCharacter();
await initAuth();

// Garante visibilidade mesmo quando Supabase não está configurado (modo offline)
var authItem = document.getElementById('auth-sidebar-item');
if (authItem) authItem.style.visibility = 'visible';

var activeId = sessionStorage.getItem('activeCharacterId') || null;

if (!activeId) {
    showCharacterSelect();
} else {
    var character = await loadCharacter(activeId);
    if (character) {
        sessionStorage.setItem('activeCharacterId', activeId);
        await applyLoadedSheet(character);
        showSheet();
    } else {
        sessionStorage.removeItem('activeCharacterId');
        showCharacterSelect();
    }
}

applyTranslations();
updateLangButtons();

// ---------------------------------------------------------------------------
// Global handlers for inline onclick attributes in HTML
// ---------------------------------------------------------------------------

window.setLang = setLang;
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
window.openAiModal = openAiModal;
window.closeAiModal = closeAiModal;
window.runAiGenerate = runAiGenerate;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.showSignIn = showSignIn;
window.showSignUp = showSignUp;
window.handleEmailSignIn = handleEmailSignIn;
window.handleEmailSignUp = handleEmailSignUp;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleSignOut = handleSignOut;
window.handleForgotPassword = handleForgotPassword;
