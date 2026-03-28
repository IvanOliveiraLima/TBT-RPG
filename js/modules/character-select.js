import { listCharacters, deleteCharacter, duplicateCharacter, exportAllCharacters, importCharacters, generateId, saveCharacter } from './storage.js';

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

    var meta = [char.race, char.class, char.level ? 'Level ' + char.level : ''].filter(Boolean).join(' · ');
    var updated = char.updatedAt ? 'Last edited ' + formatDate(char.updatedAt) : '';

    card.innerHTML = `
        <p class="char-name" title="${escapeHtml(char.name)}">${escapeHtml(char.name)}</p>
        <div class="char-meta">
            ${meta ? escapeHtml(meta) + '<br>' : ''}
            ${updated}
        </div>
        <div class="card-actions">
            <button class="w3-button w3-blue-gray w3-round btn-open" style="flex:1">Open</button>
            <button class="w3-button w3-round btn-duplicate" title="Duplicate">⧉</button>
            <button class="w3-button w3-red w3-round btn-delete" title="Delete">✕</button>
        </div>
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
        grid.insertAdjacentHTML('beforeend', '<p class="select-empty">No characters yet. Create one to get started!</p>');
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
}

async function createNewCharacter() {
    var id = generateId();
    await saveCharacter({ id: id, schemaVersion: 2 });
    sessionStorage.setItem('activeCharacterId', id);
    location.reload();
}

function openCharacter(id) {
    sessionStorage.setItem('activeCharacterId', id);
    location.reload();
}

async function handleDuplicate(id) {
    var newId = await duplicateCharacter(id);
    if (newId) await refresh();
}

async function handleDelete(id, name) {
    if (!window.confirm('Delete "' + name + '"? This cannot be undone.')) return;
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

    // Wire card actions via delegation
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
