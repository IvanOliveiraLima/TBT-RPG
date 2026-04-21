import { listCharacters, deleteCharacter, duplicateCharacter, exportAllCharacters, importCharacters, generateId, saveCharacter, markAsDeleted } from './storage.js';
import { isLoggedIn } from './auth.js';
import { createEmptySheet, blockUnloadSave } from '../save.js';
import { applyTranslations } from './i18n.js';
var container = null;
var selectInitialized = false;

function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function renderCard(char) {
    var card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.id = char.id;

    // Extract fields from nested schema (schemaVersion 1+)
    var basicInfo  = char.page1?.basic_info   || {};
    var charInfo   = char.page1?.character_info || {};
    var statusInfo = char.page1?.status        || {};

    var name      = basicInfo.char_name  || char.name  || 'Unnamed';
    var charClass = basicInfo.char_class || char.class  || '';
    var level     = basicInfo.total_level != null ? basicInfo.total_level : (char.level || '');
    var race      = charInfo.race_class   || char.race  || '';

    var currentHp = parseFloat(statusInfo.current_health ?? '') || 0;
    var maxHp     = parseFloat(statusInfo.max_health     ?? '') || 0;
    var hpPct     = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;
    var hpColor   = hpPct < 30 ? 'hp-low' : hpPct < 60 ? 'hp-mid' : '';

    var classPart = charClass && level ? charClass + ' ' + level : charClass;
    var metaParts = [race, classPart].filter(Boolean);
    var updated   = char.updatedAt ? 'Last edited ' + formatDate(char.updatedAt) : '';

    // Portrait: use character image if available, else first letter of name
    var initial   = escapeHtml((name || 'X')[0].toUpperCase());
    var portraitStyle = char.images?.character
        ? `background-image:url('${escapeHtml(char.images.character)}'); background-size:cover; background-position:center;`
        : '';

    var hpDisplay = maxHp > 0
        ? `<div class="char-hp-value">
               <div class="char-hp-label">HP</div>
               <div class="char-hp-number">${currentHp}<span class="hp-max">/${maxHp}</span></div>
           </div>`
        : '';

    card.innerHTML = `
        <div class="char-portrait" style="${portraitStyle}">
            ${char.images?.character ? '' : initial}
            ${level ? `<div class="char-portrait-level">${escapeHtml(String(level))}</div>` : ''}
        </div>
        <div class="char-card-body">
            <p class="char-name" title="${escapeHtml(name)}">${escapeHtml(name)}</p>
            <div class="char-meta">
                ${metaParts.map(escapeHtml).join(' · ')}${updated ? '<br>' + updated : ''}
            </div>
            ${maxHp > 0 ? `<div class="char-hp-bar"><div class="char-hp-bar-fill ${hpColor}" style="width:${hpPct}%"></div></div>` : ''}
            <div class="card-actions">
                <button class="w3-button w3-blue-gray w3-round btn-open" style="flex:1" data-i18n="card.open">Open</button>
                <button class="w3-button w3-round btn-duplicate" title="Duplicate">⧉</button>
                <button class="w3-button w3-red w3-round btn-delete" title="Delete">✕</button>
            </div>
        </div>
        ${hpDisplay}
    `;
    return card;
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

async function refresh() {
    if (!container) return;
    var grid = container.querySelector('.character-grid');
    grid.innerHTML = '';

    var chars = await listCharacters();

    if (chars.length === 0) {
        grid.insertAdjacentHTML('beforeend', `<p class="select-empty">No characters yet. Create one to get started!</p>`);
    } else {
        chars.forEach(function(char) {
            grid.appendChild(renderCard(char));
        });
    }

    // New character button at the end of the grid
    var btnNew = document.createElement('button');
    btnNew.className = 'btn-new-character';
    btnNew.textContent = '+ New Character';
    btnNew.addEventListener('click', createNewCharacter);
    grid.appendChild(btnNew);

    applyTranslations();
}

async function createNewCharacter() {
    var id = generateId();
    var emptySheet = createEmptySheet();
    await saveCharacter({ ...emptySheet, id: id, schemaVersion: 2, updatedAt: Date.now() });
    blockUnloadSave();
    sessionStorage.setItem('activeCharacterId', id);
    location.reload();
}

function openCharacter(id) {
    blockUnloadSave();
    sessionStorage.setItem('activeCharacterId', id);
    location.reload();
}

async function handleDuplicate(id) {
    var newId = await duplicateCharacter(id);
    if (newId) await refresh();
}

async function handleDelete(id, name) {
    if (!window.confirm('Delete "' + name + '"? This cannot be undone.')) return;
    if (isLoggedIn()) await markAsDeleted(id);
    await deleteCharacter(id);
    await refresh();
}

async function handleExportAll() {
    var json = await exportAllCharacters();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dnd-characters-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportClick() {
    var input = container.querySelector('#import-all-input');
    input.click();
}

async function handleImportFile(event) {
    var file = event.target.files[0];
    if (!file) return;

    var mode = window.confirm('Replace all existing characters?\n\nOK = Replace all\nCancel = Merge (keep existing)') ? 'replace' : 'merge';

    try {
        var text = await file.text();
        var count = await importCharacters(text, mode);
        await refresh();
        alert('Imported ' + count + ' character(s).');
    } catch (e) {
        alert('Import failed: ' + e.message);
    }
    event.target.value = '';
}

export function initCharacterSelect(screenElement) {
    container = screenElement;

    if (selectInitialized) {
        return refresh();
    }
    selectInitialized = true;

    // Reset buttons before adding listeners to prevent duplicates
    var btnExport = container.querySelector('.btn-export-all');
    var btnImport = container.querySelector('.btn-import-all');
    if (btnExport) { btnExport.replaceWith(btnExport.cloneNode(true)); }
    if (btnImport) { btnImport.replaceWith(btnImport.cloneNode(true)); }

    container.querySelector('.btn-export-all').addEventListener('click', handleExportAll);
    container.querySelector('.btn-import-all').addEventListener('click', handleImportClick);
    container.querySelector('#import-all-input').addEventListener('change', handleImportFile);

    // Close sidebar when clicking outside it on the character select screen
    screenElement.addEventListener('click', (e) => {
        if (e.target === screenElement || e.target.closest('.character-grid') || e.target.closest('.character-card')) {
            if (window.w3_close) window.w3_close();
        }
    });

    // Wire card actions via delegation
    document.addEventListener('syncCompleted', () => { refresh() })

    container.querySelector('.character-grid').addEventListener('click', function(e) {
        var card = e.target.closest('.character-card');
        if (!card) return;
        var id = card.dataset.id;
        var name = card.querySelector('.char-name').textContent;

        if (e.target.matches('.btn-open')) openCharacter(id);
        else if (e.target.matches('.btn-duplicate')) handleDuplicate(id);
        else if (e.target.matches('.btn-delete')) handleDelete(id, name);
    });

    return refresh();
}
