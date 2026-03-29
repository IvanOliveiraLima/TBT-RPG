import { isObject, hasKeys, parseLegacyClassLevel, sanitizeClassEntry, calculateTotalClassLevel, getExportFilenameFromSheet } from './modules/utils.js';
import { saveCharacter, clearCharacter, generateId } from './modules/storage.js';

function getAttacks() {
    var attacks = [];
    document.querySelectorAll('#page-1 #attacks-spells #attacks tr').forEach(function(row) {
        if (row.querySelectorAll('th').length == 0) {
            var temp = {};
            temp.name = row.querySelector('input[name="name"]').value;
            temp.stat = row.querySelector('input[name="stat"]').value;
            temp.toHit = row.querySelector('input[name="toHit"]').value;
            temp.damage = row.querySelector('input[name="damage"]').value;
            temp.damage_type = row.querySelector('input[name="damage_type"]').value;
            attacks.push(temp);
        }
    });

    return attacks;
}

function getEquipment() {
    var equ = {
        col_1: [],
        col_2: []
    };
    document.querySelectorAll('#page-2 #equipment .col-1 tr:not(#total)').forEach(function(row) {
        if (row.querySelectorAll('th').length == 0) {
            var temp = {};
            temp.name = row.querySelector('input[name="name"]').value;
            temp.weight = row.querySelector('input[name="weight"]').value;
            equ.col_1.push(temp);
        }
    });

    document.querySelectorAll('#page-2 #equipment .col-2 tr:not(#total)').forEach(function(row) {
        if (row.querySelectorAll('th').length == 0) {
            var temp = {};
            temp.name = row.querySelector('input[name="name"]').value;
            temp.weight = row.querySelector('input[name="weight"]').value;
            equ.col_2.push(temp);
        }
    });

    return equ;
}

function getSpells(spellLevel) {
    var spells = [];
    document.querySelectorAll('#page-3 #spells #' + spellLevel + ' .spells .spell').forEach(function(el) {
        var temp = {};
        if (spellLevel != 'cantrips')
            temp.preped = el.querySelector('input[name="preped"]').checked;
        temp.spell_name = el.querySelector('input[name="spell-name"]').value;
        spells.push(temp);
    });

    return spells;
}

var CURRENT_SHEET_SCHEMA_VERSION = 1;
var SHEET_FEEDBACK_TIMEOUT;
var AUTO_SAVE_DEBOUNCE_MS = 800;
var AUTO_SAVE_TIMER = null;
var LAST_AUTOSAVE_FEEDBACK_TS = 0;
var AUTOSAVE_FEEDBACK_MIN_INTERVAL_MS = 4000;
var skipUnloadSave = false;
var MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;
var ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
var IMAGE_MAX_WIDTH_BY_KIND = {
    character: 600,
    symbol: 300
};
var IMAGE_ADJUST_STATE = null;
var IMAGE_ADJUST_HANDLERS_BOUND = false;
var sheetImages = {
    character: '',
    symbol: ''
};
var CLASS_ROWS_SELECTOR = '#character-basic-info #basic-info #class-rows';
var CLASS_ROW_NAME_SELECTOR = 'input[name="class-name"]';
var CLASS_ROW_LEVEL_SELECTOR = 'input[name="class-level"]';

function normalizeBasicInfoClasses(basicInfo) {
    var normalizedClasses = [];

    if (Array.isArray(basicInfo.classes)) {
        for (var i = 0; i < basicInfo.classes.length; i++) {
            var entry = sanitizeClassEntry(basicInfo.classes[i]);
            if (entry.name || entry.level) {
                normalizedClasses.push(entry);
            }
        }
    }

    if (!normalizedClasses.length) {
        var rawLevel = String(basicInfo.level || '').trim();
        var rawLevelTwo = String(basicInfo.level_two || '').trim();
        var currentClass = String(basicInfo.char_class || '').trim();
        var currentLevel = rawLevel;
        var parsedFromLevel = parseLegacyClassLevel(rawLevel);

        if (!currentClass && parsedFromLevel.charClass) {
            currentClass = parsedFromLevel.charClass;
        }
        if (parsedFromLevel.level && !/^\d+$/.test(currentLevel)) {
            currentLevel = parsedFromLevel.level;
        }

        if (!/^\d+$/.test(currentLevel) && rawLevelTwo) {
            var parsedFromLevelTwo = parseLegacyClassLevel(rawLevelTwo);
            if (parsedFromLevelTwo.charClass) {
                if (!currentClass) {
                    currentClass = parsedFromLevelTwo.charClass;
                } else if (currentClass !== parsedFromLevelTwo.charClass) {
                    currentClass = currentClass + ' / ' + parsedFromLevelTwo.charClass;
                }
            }
            if (parsedFromLevelTwo.level) {
                currentLevel = parsedFromLevelTwo.level;
            }
        }

        normalizedClasses.push({
            name: currentClass,
            level: currentLevel
        });
    }

    if (!normalizedClasses.length) {
        normalizedClasses.push({
            name: '',
            level: ''
        });
    }

    return normalizedClasses;
}

export function updateClassTotalLevel() {
    var classes = getClassesFromForm();
    var total = calculateTotalClassLevel(classes);
    document.querySelector('#character-basic-info #basic-info #total-level').value = total ? String(total) : '';
}

function refreshClassRowActions() {
    var rows = document.querySelectorAll(CLASS_ROWS_SELECTOR + ' > .class-row');
    var disableRemove = rows.length <= 1;

    rows.forEach(function(row) {
        var btn = row.querySelector('.remove-class-row');
        if (btn) {
            btn.disabled = disableRemove;
            btn.classList.toggle('disabled', disableRemove);
        }
    });
}

function createClassRow(name, level) {
    var row = document.createElement('div');
    row.className = 'class-row';

    var nameWrap = document.createElement('div');
    nameWrap.className = 'class-name-wrap';
    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = 'class-name';
    nameInput.setAttribute('list', 'dnd-class-suggestions');
    nameInput.placeholder = 'Class';
    nameInput.value = String(name || '').trim();
    nameWrap.appendChild(nameInput);

    var levelWrap = document.createElement('div');
    levelWrap.className = 'class-level-wrap';
    var levelInput = document.createElement('input');
    levelInput.type = 'number';
    levelInput.min = '0';
    levelInput.max = '20';
    levelInput.step = '1';
    levelInput.name = 'class-level';
    levelInput.placeholder = 'Lv';
    levelInput.value = String(level || '').trim();
    levelWrap.appendChild(levelInput);

    var removeWrap = document.createElement('div');
    removeWrap.className = 'class-remove-wrap';
    var removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-class-row w3-button w3-blue-gray w3-round';
    removeButton.setAttribute('aria-label', 'Remove class row');
    removeButton.textContent = '-';
    removeWrap.appendChild(removeButton);

    row.appendChild(nameWrap);
    row.appendChild(levelWrap);
    row.appendChild(removeWrap);
    return row;
}

function addClassRow(name, level, shouldDispatchEvent) {
    var row = createClassRow(name, level);
    document.querySelector(CLASS_ROWS_SELECTOR).appendChild(row);
    updateClassTotalLevel();
    refreshClassRowActions();

    if (shouldDispatchEvent) {
        document.dispatchEvent(new Event('sheetChanged'));
    }
}

function removeClassRow(button) {
    var rows = document.querySelectorAll(CLASS_ROWS_SELECTOR + ' > .class-row');
    if (rows.length <= 1) {
        return;
    }

    var confirmed = window.confirm('This will remove this class entry. Continue?');
    if (!confirmed) {
        return;
    } else {
        button.closest('.class-row').remove();
    }

    updateClassTotalLevel();
    refreshClassRowActions();
    document.dispatchEvent(new Event('sheetChanged'));
}

export function renderClassRows(classes) {
    var rowsContainer = document.querySelector(CLASS_ROWS_SELECTOR);
    if (!rowsContainer) {
        return;
    }

    rowsContainer.innerHTML = '';

    var normalized = Array.isArray(classes) ? classes : [];
    if (!normalized.length) {
        normalized = [{
            name: '',
            level: ''
        }];
    }

    for (var i = 0; i < normalized.length; i++) {
        var entry = sanitizeClassEntry(normalized[i]);
        addClassRow(entry.name, entry.level, false);
    }

    updateClassTotalLevel();
    refreshClassRowActions();
}

function getClassesFromForm() {
    var classes = [];

    document.querySelectorAll(CLASS_ROWS_SELECTOR + ' .class-row').forEach(function(row) {
        var nameEl = row.querySelector(CLASS_ROW_NAME_SELECTOR);
        var levelEl = row.querySelector(CLASS_ROW_LEVEL_SELECTOR);
        var entry = sanitizeClassEntry({
            name: nameEl ? nameEl.value : '',
            level: levelEl ? levelEl.value : ''
        });

        if (entry.name || entry.level) {
            classes.push(entry);
        }
    });

    if (!classes.length) {
        classes.push({
            name: '',
            level: ''
        });
    }

    return classes;
}

function ensureSheetImagesState() {
    if (typeof sheetImages.character !== 'string') {
        sheetImages.character = '';
    }

    if (typeof sheetImages.symbol !== 'string') {
        sheetImages.symbol = '';
    }

    return sheetImages;
}

function updateSheetImagePreviews(images) {
    var safeImages = images || ensureSheetImagesState();
    var characterSource = safeImages.character || '';
    var symbolSource = safeImages.symbol || '';
    var characterElement = document.querySelector('#page-4 #apperance #char-img');
    var symbolElement = document.querySelector('#page-4 #allies-organizations #alli-img');

    if (characterElement) {
        if (characterSource) {
            characterElement.classList.remove('image-empty');
            characterElement.textContent = '';
            characterElement.style.backgroundImage = 'url("' + characterSource + '")';
        } else {
            characterElement.classList.add('image-empty');
            characterElement.textContent = 'No character image';
            characterElement.style.backgroundImage = 'none';
        }
    }

    if (symbolElement) {
        if (symbolSource) {
            symbolElement.classList.remove('image-empty');
            symbolElement.textContent = '';
            symbolElement.style.backgroundImage = 'url("' + symbolSource + '")';
        } else {
            symbolElement.classList.add('image-empty');
            symbolElement.textContent = 'No symbol uploaded';
            symbolElement.style.backgroundImage = 'none';
        }
    }
}

export function applyImagesFromSheet(sheet) {
    var images = ensureSheetImagesState();
    images.character = '';
    images.symbol = '';

    if (sheet && isObject(sheet.images)) {
        if (typeof sheet.images.character === 'string') {
            images.character = sheet.images.character;
        }

        if (typeof sheet.images.symbol === 'string') {
            images.symbol = sheet.images.symbol;
        }
    }

    updateSheetImagePreviews(images);
}

function setSheetImage(kind, dataUrl) {
    var images = ensureSheetImagesState();
    images[kind] = dataUrl || '';
    updateSheetImagePreviews(images);
}

function isAcceptedImageFile(file) {
    if (!file) {
        return false;
    }

    var mimeType = String(file.type || '').toLowerCase();
    if (ACCEPTED_IMAGE_MIME_TYPES.indexOf(mimeType) !== -1) {
        return true;
    }

    var fileName = String(file.name || '').toLowerCase();
    return /\.(jpe?g|png|webp)$/.test(fileName);
}

function getImageOutputMimeType(file) {
    var mimeType = String(file.type || '').toLowerCase();
    if (ACCEPTED_IMAGE_MIME_TYPES.indexOf(mimeType) !== -1) {
        return mimeType;
    }

    var fileName = String(file.name || '').toLowerCase();
    if (/\.png$/.test(fileName)) {
        return 'image/png';
    }
    if (/\.webp$/.test(fileName)) {
        return 'image/webp';
    }

    return 'image/jpeg';
}

function resizeImageDataUrl(dataUrl, maxWidth, mimeType, onSuccess, onError) {
    var image = new Image();

    image.onload = function() {
        var width = image.naturalWidth || image.width;
        var height = image.naturalHeight || image.height;

        if (!width || !height) {
            onError();
            return;
        }

        if (width <= maxWidth) {
            onSuccess(dataUrl);
            return;
        }

        var scale = maxWidth / width;
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        var context = canvas.getContext('2d');
        if (!context) {
            onError();
            return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        var resizedDataUrl;
        if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
            resizedDataUrl = canvas.toDataURL(mimeType, 0.9);
        } else {
            resizedDataUrl = canvas.toDataURL(mimeType);
        }

        onSuccess(resizedDataUrl);
    };

    image.onerror = function() {
        onError();
    };

    image.src = dataUrl;
}

function getImageAdjustTargetDimensions(kind) {
    var fallback = kind === 'symbol' ? {
        width: 240,
        height: 90
    } : {
        width: 360,
        height: 300
    };

    var selector = kind === 'symbol' ? '#page-4 #allies-organizations #alli-img' : '#page-4 #apperance #char-img';
    var element = document.querySelector(selector);
    var width = Math.round((element && element.offsetWidth) || fallback.width);
    var height = Math.round((element && element.offsetHeight) || fallback.height);

    if (width <= 0) {
        width = fallback.width;
    }
    if (height <= 0) {
        height = fallback.height;
    }

    return {
        width: width,
        height: height
    };
}

function clampImageAdjustOffsets(state) {
    var minOffsetX = state.viewportWidth - state.drawWidth;
    var minOffsetY = state.viewportHeight - state.drawHeight;

    if (state.drawWidth <= state.viewportWidth) {
        state.offsetX = (state.viewportWidth - state.drawWidth) / 2;
    } else {
        state.offsetX = Math.min(0, Math.max(minOffsetX, state.offsetX));
    }

    if (state.drawHeight <= state.viewportHeight) {
        state.offsetY = (state.viewportHeight - state.drawHeight) / 2;
    } else {
        state.offsetY = Math.min(0, Math.max(minOffsetY, state.offsetY));
    }
}

function renderImageAdjustPreview() {
    if (!IMAGE_ADJUST_STATE) {
        return;
    }

    IMAGE_ADJUST_STATE.drawWidth = IMAGE_ADJUST_STATE.sourceWidth * IMAGE_ADJUST_STATE.scale;
    IMAGE_ADJUST_STATE.drawHeight = IMAGE_ADJUST_STATE.sourceHeight * IMAGE_ADJUST_STATE.scale;

    clampImageAdjustOffsets(IMAGE_ADJUST_STATE);

    var preview = document.querySelector('#image-adjust-preview');
    if (preview) {
        preview.style.width = IMAGE_ADJUST_STATE.drawWidth + 'px';
        preview.style.height = IMAGE_ADJUST_STATE.drawHeight + 'px';
        preview.style.left = IMAGE_ADJUST_STATE.offsetX + 'px';
        preview.style.top = IMAGE_ADJUST_STATE.offsetY + 'px';
    }
}

function closeImageAdjustModal(cancelled) {
    var previousState = IMAGE_ADJUST_STATE;
    IMAGE_ADJUST_STATE = null;
    var modal = document.querySelector('#image-adjust-modal');
    if (modal) modal.style.display = 'none';
    var viewport = document.querySelector('#image-adjust-viewport');
    if (viewport) viewport.classList.remove('dragging');

    if (cancelled && previousState && typeof previousState.onCancel === 'function') {
        previousState.onCancel();
    }
}

function applyAdjustedImageFromModal() {
    if (!IMAGE_ADJUST_STATE) {
        return;
    }

    var canvas = document.createElement('canvas');
    canvas.width = IMAGE_ADJUST_STATE.outputWidth;
    canvas.height = IMAGE_ADJUST_STATE.outputHeight;

    var context = canvas.getContext('2d');
    if (!context) {
        showSheetFeedback('Falha ao processar imagem');
        closeImageAdjustModal(true);
        return;
    }

    var sx = -IMAGE_ADJUST_STATE.offsetX / IMAGE_ADJUST_STATE.scale;
    var sy = -IMAGE_ADJUST_STATE.offsetY / IMAGE_ADJUST_STATE.scale;
    var sw = IMAGE_ADJUST_STATE.viewportWidth / IMAGE_ADJUST_STATE.scale;
    var sh = IMAGE_ADJUST_STATE.viewportHeight / IMAGE_ADJUST_STATE.scale;

    context.drawImage(IMAGE_ADJUST_STATE.image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    var finalDataUrl;
    if (IMAGE_ADJUST_STATE.mimeType === 'image/jpeg' || IMAGE_ADJUST_STATE.mimeType === 'image/webp') {
        finalDataUrl = canvas.toDataURL(IMAGE_ADJUST_STATE.mimeType, 0.9);
    } else {
        finalDataUrl = canvas.toDataURL(IMAGE_ADJUST_STATE.mimeType);
    }

    if (typeof IMAGE_ADJUST_STATE.onApply === 'function') {
        IMAGE_ADJUST_STATE.onApply(finalDataUrl);
    }

    closeImageAdjustModal(false);
}

function bindImageAdjustHandlers() {
    if (IMAGE_ADJUST_HANDLERS_BOUND) {
        return;
    }
    IMAGE_ADJUST_HANDLERS_BOUND = true;

    document.querySelector('#image-adjust-cancel').addEventListener('click', function() {
        closeImageAdjustModal(true);
    });

    document.querySelector('#image-adjust-apply').addEventListener('click', function() {
        applyAdjustedImageFromModal();
    });

    document.querySelector('#image-adjust-zoom').addEventListener('input', function() {
        if (!IMAGE_ADJUST_STATE) {
            return;
        }
        var zoomFactor = parseFloat(this.value) || 1;
        IMAGE_ADJUST_STATE.scale = IMAGE_ADJUST_STATE.baseScale * zoomFactor;
        renderImageAdjustPreview();
    });

    var viewport = document.querySelector('#image-adjust-viewport');
    viewport.addEventListener('mousedown', function(event) {
        if (!IMAGE_ADJUST_STATE) {
            return;
        }
        event.preventDefault();
        IMAGE_ADJUST_STATE.dragging = true;
        IMAGE_ADJUST_STATE.dragStartX = event.clientX;
        IMAGE_ADJUST_STATE.dragStartY = event.clientY;
        IMAGE_ADJUST_STATE.dragStartOffsetX = IMAGE_ADJUST_STATE.offsetX;
        IMAGE_ADJUST_STATE.dragStartOffsetY = IMAGE_ADJUST_STATE.offsetY;
        viewport.classList.add('dragging');
    });

    document.addEventListener('mousemove', function(event) {
        if (!IMAGE_ADJUST_STATE || !IMAGE_ADJUST_STATE.dragging) {
            return;
        }
        var deltaX = event.clientX - IMAGE_ADJUST_STATE.dragStartX;
        var deltaY = event.clientY - IMAGE_ADJUST_STATE.dragStartY;
        IMAGE_ADJUST_STATE.offsetX = IMAGE_ADJUST_STATE.dragStartOffsetX + deltaX;
        IMAGE_ADJUST_STATE.offsetY = IMAGE_ADJUST_STATE.dragStartOffsetY + deltaY;
        renderImageAdjustPreview();
    });

    document.addEventListener('mouseup', function() {
        if (!IMAGE_ADJUST_STATE) {
            return;
        }
        IMAGE_ADJUST_STATE.dragging = false;
        viewport.classList.remove('dragging');
    });

    document.querySelector('#image-adjust-modal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeImageAdjustModal(true);
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && IMAGE_ADJUST_STATE) {
            closeImageAdjustModal(true);
        }
    });
}

function openImageAdjustModal(kind, dataUrl, mimeType, onApply, onCancel) {
    bindImageAdjustHandlers();

    var image = new Image();
    image.onload = function() {
        var targetDimensions = getImageAdjustTargetDimensions(kind);
        var maxModalWidth = 560;
        var maxModalHeight = 340;
        var displayScale = Math.min(1, maxModalWidth / targetDimensions.width, maxModalHeight / targetDimensions.height);
        var viewportWidth = Math.max(120, Math.round(targetDimensions.width * displayScale));
        var viewportHeight = Math.max(90, Math.round(targetDimensions.height * displayScale));

        var baseScale = Math.max(viewportWidth / image.width, viewportHeight / image.height);
        var outputWidth = Math.min(IMAGE_MAX_WIDTH_BY_KIND[kind] || 600, image.width);
        var outputHeight = Math.max(1, Math.round(outputWidth * (targetDimensions.height / targetDimensions.width)));

        IMAGE_ADJUST_STATE = {
            kind: kind,
            image: image,
            mimeType: mimeType,
            sourceWidth: image.width,
            sourceHeight: image.height,
            viewportWidth: viewportWidth,
            viewportHeight: viewportHeight,
            outputWidth: outputWidth,
            outputHeight: outputHeight,
            baseScale: baseScale,
            scale: baseScale,
            drawWidth: image.width * baseScale,
            drawHeight: image.height * baseScale,
            offsetX: (viewportWidth - (image.width * baseScale)) / 2,
            offsetY: (viewportHeight - (image.height * baseScale)) / 2,
            dragging: false,
            onApply: onApply,
            onCancel: onCancel
        };

        document.querySelector('#image-adjust-preview').setAttribute('src', dataUrl);
        var vp = document.querySelector('#image-adjust-viewport');
        vp.style.width = viewportWidth + 'px';
        vp.style.height = viewportHeight + 'px';
        document.querySelector('#image-adjust-zoom').value = '1';
        renderImageAdjustPreview();
        document.querySelector('#image-adjust-modal').style.display = 'flex';
    };

    image.onerror = function() {
        if (typeof onCancel === 'function') {
            onCancel();
        }
        showSheetFeedback('Falha ao processar imagem');
    };

    image.src = dataUrl;
}

function handleSheetImageUpload(event, kind) {
    var input = event.target;
    var file = input.files && input.files[0];

    if (!file) {
        return;
    }

    if (!isAcceptedImageFile(file)) {
        showSheetFeedback('Formato de imagem inválido');
        input.value = '';
        return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        showSheetFeedback('Imagem muito grande (max 2MB)');
        input.value = '';
        return;
    }

    var reader = new FileReader();
    var maxWidth = IMAGE_MAX_WIDTH_BY_KIND[kind] || 600;
    var outputMimeType = getImageOutputMimeType(file);

    reader.onload = function(loadEvent) {
        resizeImageDataUrl(loadEvent.target.result, maxWidth, outputMimeType, function(resizedDataUrl) {
            openImageAdjustModal(kind, resizedDataUrl, outputMimeType, function(finalDataUrl) {
                setSheetImage(kind, finalDataUrl);
                showSheetFeedback('Imagem atualizada');
                document.dispatchEvent(new Event('sheetChanged'));
                input.value = '';
            }, function() {
                input.value = '';
            });
        }, function() {
            showSheetFeedback('Falha ao processar imagem');
            input.value = '';
        });
    };

    reader.onerror = function() {
        showSheetFeedback('Falha ao carregar imagem');
        input.value = '';
    };

    reader.readAsDataURL(file);
}

function resetSheetImage(kind) {
    setSheetImage(kind, '');
    showSheetFeedback('Imagem removida');
    document.dispatchEvent(new Event('sheetChanged'));
}

export function showSheetFeedback(message) {
    var feedback = document.getElementById('sheet-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'sheet-feedback';
        document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.classList.add('show');

    clearTimeout(SHEET_FEEDBACK_TIMEOUT);
    SHEET_FEEDBACK_TIMEOUT = setTimeout(function() {
        feedback.classList.remove('show');
    }, 1700);
}

function parseSheetJsonText(text) {
    var trimmed = text.trim();
    var prefix = 'var loadJson = ';

    if (trimmed.indexOf(prefix) === 0) {
        trimmed = trimmed.substring(prefix.length).trim();
        if (trimmed.charAt(trimmed.length - 1) === ';') {
            trimmed = trimmed.substring(0, trimmed.length - 1);
        }
    }

    return JSON.parse(trimmed);
}

export function normalizeSheet(sheet) {
    if (!isObject(sheet)) {
        return sheet;
    }

    var version = sheet.schemaVersion;

    if (version == null) {
        sheet.schemaVersion = 1;
        version = 1;
    }

    if (version === 1) {
        if (isObject(sheet.page1) && isObject(sheet.page1.basic_info)) {
            var basicInfo = sheet.page1.basic_info;
            basicInfo.classes = normalizeBasicInfoClasses(basicInfo);
            basicInfo.total_level = calculateTotalClassLevel(basicInfo.classes);

            if (basicInfo.classes.length > 0) {
                basicInfo.char_class = basicInfo.classes[0].name || '';
            } else {
                basicInfo.char_class = '';
            }

            basicInfo.level = String(basicInfo.total_level || '');
        }

        if (!isObject(sheet.images)) {
            sheet.images = {};
        }

        if (typeof sheet.images.character !== 'string') {
            sheet.images.character = '';
        }

        if (typeof sheet.images.symbol !== 'string') {
            sheet.images.symbol = '';
        }

        return sheet;
    }

    // Future migration entry point, e.g. migrateV1ToV2(sheet)
    return sheet;
}

function isValidSheetSchema(sheet) {
    if (!hasKeys(sheet, ['page1', 'page2', 'page3', 'page4', 'page5'])) {
        return false;
    }

    if (!hasKeys(sheet.page1, ['basic_info', 'character_info', 'top_bar', 'attributes', 'saves_skills', 'status', 'proficiencies', 'attacks_spells'])) {
        return false;
    }

    if (!hasKeys(sheet.page1.basic_info, ['char_name'])) {
        return false;
    }

    var basicInfo = sheet.page1.basic_info;
    var hasClassesArray = Array.isArray(basicInfo.classes);
    var hasNewClassLevel = ('char_class' in basicInfo) && ('level' in basicInfo);
    var hasLegacyClassLevel = ('level' in basicInfo) && ('level_two' in basicInfo);

    if (!hasClassesArray && !hasNewClassLevel && !hasLegacyClassLevel) {
        return false;
    }

    if (!hasKeys(sheet.page1.saves_skills, ['saves', 'skills'])) {
        return false;
    }

    if (!hasKeys(sheet.page1.status, ['death_saves', 'hit_dice'])) {
        return false;
    }

    if (!hasKeys(sheet.page2, ['equipment', 'mount_pet', 'mount_pet2'])) {
        return false;
    }

    if (!hasKeys(sheet.page2.equipment, ['val', 'currency', 'encumberance'])) {
        return false;
    }

    if (!hasKeys(sheet.page3, ['spell_info', 'spells'])) {
        return false;
    }

    if (!hasKeys(sheet.page3.spells, ['cantrips', 'level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'level_6', 'level_7', 'level_8', 'level_9'])) {
        return false;
    }

    if (!hasKeys(sheet.page4, ['backstory', 'allies_organizations', 'personality'])) {
        return false;
    }

    if (!hasKeys(sheet.page5, ['notes_1', 'notes_2'])) {
        return false;
    }

    return true;
}

export function buildSheetData() {
    var sheetImages = ensureSheetImagesState();
    var classes = getClassesFromForm();
    var totalLevel = calculateTotalClassLevel(classes);
    var firstClass = classes.length ? classes[0].name : '';

    var sheet = {
        schemaVersion: CURRENT_SHEET_SCHEMA_VERSION,
        page1: {
            basic_info: {
                char_name: document.querySelector('#character-basic-info #basic-info input[name="char-name"]').value,
                classes: classes,
                total_level: totalLevel,
                char_class: firstClass,
                level: String(totalLevel || ''),
            },
            character_info: {
                race_class: document.querySelector('#character-basic-info #character-info input[name="race-class"]').value,
                background: document.querySelector('#character-basic-info #character-info input[name="background"]').value,
                player_name: document.querySelector('#character-basic-info #character-info input[name="player-name"]').value,
                exp: document.querySelector('#character-basic-info #character-info input[name="exp"]').value,
                alignment: document.querySelector('#character-basic-info #character-info input[name="alignment"]').value
            },
            top_bar: {
                proficiency: document.querySelector('#page-1 #top-bar input[name="proficiency"]').value,
                initiative: document.querySelector('#page-1 #top-bar input[name="initiative"]').value,
                passive_perception: document.querySelector('#page-1 #top-bar input[name="passive-perception"]').value,
                ac: document.querySelector('#page-1 #top-bar input[name="ac"]').value,
                speed: document.querySelector('#page-1 #top-bar input[name="speed"]').value,
                spell_dc: document.querySelector('#page-1 #top-bar input[name="spell-dc"]').value,
                insperation: document.querySelector('#page-1 #top-bar input[name="insperation"]').value
            },
            attributes: {
                str: document.querySelector('#page-1 #attributes input[name="str"]').value,
                str_mod: document.querySelector('#page-1 #attributes input[name="str-mod"]').value,
                dex: document.querySelector('#page-1 #attributes input[name="dex"]').value,
                dex_mod: document.querySelector('#page-1 #attributes input[name="dex-mod"]').value,
                con: document.querySelector('#page-1 #attributes input[name="con"]').value,
                con_mod: document.querySelector('#page-1 #attributes input[name="con-mod"]').value,
                int: document.querySelector('#page-1 #attributes input[name="int"]').value,
                int_mod: document.querySelector('#page-1 #attributes input[name="int-mod"]').value,
                wis: document.querySelector('#page-1 #attributes input[name="wis"]').value,
                wis_mod: document.querySelector('#page-1 #attributes input[name="wis-mod"]').value,
                cha: document.querySelector('#page-1 #attributes input[name="cha"]').value,
                cha_mod: document.querySelector('#page-1 #attributes input[name="cha-mod"]').value
            },
            saves_skills: {
                spell_casting: document.querySelector('#page-1 #saves-skills select[name="spell-att"]').value,
                saves: {
                    str_save: {
                        val: document.querySelector('#page-1 #saves-skills #saves input[name="str-save"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #saves #str-save input[name="prof"]').checked
                    },
                    dex_save: {
                        val: document.querySelector('#page-1 #saves-skills #saves input[name="dex-save"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #saves #dex-save input[name="prof"]').checked
                    },
                    con_save: {
                        val: document.querySelector('#page-1 #saves-skills #saves input[name="con-save"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #saves #con-save input[name="prof"]').checked
                    },
                    int_save: {
                        val: document.querySelector('#page-1 #saves-skills #saves input[name="int-save"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #saves #int-save input[name="prof"]').checked
                    },
                    wis_save: {
                        val: document.querySelector('#page-1 #saves-skills #saves input[name="wis-save"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #saves #wis-save input[name="prof"]').checked
                    },
                    cha_save: {
                        val: document.querySelector('#page-1 #saves-skills #saves input[name="cha-save"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #saves #cha-save input[name="prof"]').checked
                    },
                },
                skills: {
                    acrobatics: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="acrobatics-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #acrobatics-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #acrobatics-skill input[name="expr"]').checked
                    },
                    animal_handling: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="animal-handling-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #animal-handling-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #animal-handling-skill input[name="expr"]').checked
                    },
                    arcana: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="arcana-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #arcana-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #arcana-skill input[name="expr"]').checked
                    },
                    athletics: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="athletics-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #athletics-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #athletics-skill input[name="expr"]').checked
                    },
                    deception: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="deception-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #deception-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #deception-skill input[name="expr"]').checked
                    },
                    history: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="history-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #history-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #history-skill input[name="expr"]').checked
                    },
                    insight: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="insight-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #insight-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #insight-skill input[name="expr"]').checked
                    },
                    intimidation: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="intimidation-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #intimidation-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #intimidation-skill input[name="expr"]').checked
                    },
                    investigation: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="investigation-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #investigation-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #investigation-skill input[name="expr"]').checked
                    },
                    medicine: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="medicine-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #medicine-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #medicine-skill input[name="expr"]').checked
                    },
                    nature: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="nature-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #nature-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #nature-skill input[name="expr"]').checked
                    },
                    perception: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="perception-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #perception-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #perception-skill input[name="expr"]').checked
                    },
                    performance: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="performance-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #performance-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #performance-skill input[name="expr"]').checked
                    },
                    persuasion: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="persuasion-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #persuasion-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #persuasion-skill input[name="expr"]').checked
                    },
                    religion: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="religion-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #religion-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #religion-skill input[name="expr"]').checked
                    },
                    sleight_hand: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="sleight-hand-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #sleight-hand-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #sleight-hand-skill input[name="expr"]').checked
                    },
                    stealth: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="stealth-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #stealth-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #stealth-skill input[name="expr"]').checked
                    },
                    survival: {
                        val: document.querySelector('#page-1 #saves-skills #skills input[name="survival-skill"]').value,
                        prof: document.querySelector('#page-1 #saves-skills #skills #survival-skill input[name="prof"]').checked,
                        expr: document.querySelector('#page-1 #saves-skills #skills #survival-skill input[name="expr"]').checked
                    }
                }
            },
            status: {
                conditions: document.querySelector('#page-1 #status #conditions textarea[name="conditions"]').value,
                boons: document.querySelector('#page-1 #status #boons textarea[name="boons"]').value,
                death_saves: {
                    success: {
                        one: document.querySelector('#page-1 #status #death-saves input[name="success-1"]').checked,
                        two: document.querySelector('#page-1 #status #death-saves input[name="success-2"]').checked,
                        three: document.querySelector('#page-1 #status #death-saves input[name="success-3"]').checked
                    },
                    failure: {
                        one: document.querySelector('#page-1 #status #death-saves input[name="failure-1"]').checked,
                        two: document.querySelector('#page-1 #status #death-saves input[name="failure-2"]').checked,
                        three: document.querySelector('#page-1 #status #death-saves input[name="failure-3"]').checked
                    }
                },
                hit_dice: {
                    type: document.querySelector('#page-1 #status #hit-dice input[name="hit-dice"]').value,
                    current_hd: document.querySelector('#page-1 #status #hit-dice input[name="current-hd"]').value
                },
                temp_health: document.querySelector('#page-1 #status #hit-points input[name="temp-health"]').value,
                current_health: document.querySelector('#page-1 #status #hit-points input[name="current-health"]').value,
                max_health: document.querySelector('#page-1 #status #hit-points input[name="max-health"]').value
            },
            proficiencies: {
                weapon_armor: document.querySelector('#page-1 #proficiencies #weapons-armor textarea[name="weapons-armor"]').value,
                tools: document.querySelector('#page-1 #proficiencies #tools textarea[name="tools"]').value,
                languages: document.querySelector('#page-1 #proficiencies #languages textarea[name="languages"]').value
            },
            attacks_spells: getAttacks(),
            features: document.querySelector('#page-1 #features textarea[name="features"]').value
        },
        page2: {
            equipment: {
                val: getEquipment(),
                total_weight: document.querySelector('#page-2 #equipment tr#total input[name="total-weight"').value,
                currency: {
                    copper: document.querySelector('#page-2 #currancy input[name="copper"]').value,
                    silver: document.querySelector('#page-2 #currancy input[name="silver"]').value,
                    gold: document.querySelector('#page-2 #currancy input[name="gold"]').value,
                    electrum: document.querySelector('#page-2 #currancy input[name="electrum"]').value,
                    platinum: document.querySelector('#page-2 #currancy input[name="platinum"]').value,
                    total: document.querySelector('#page-2 #currancy input[name="total"]').value,
                    base: document.querySelector('#page-2 #currancy select[name="base"]').value
                },
                encumberance: {
                    base: document.querySelector('#page-2 #encumberance input[name="base-encumberance"]').value,
                    encumbered: document.querySelector('#page-2 #encumberance input[name="encumbered-encumberance"]').value,
                    h_encumbered: document.querySelector('#page-2 #encumberance input[name="h-encumbered-encumberance"]').value,
                    push: document.querySelector('#page-2 #encumberance input[name="push-encumberance"]').value
                }
            },
            attacks_spells: getAttacks(),
            mount_pet: {
                name: document.querySelector('#page-2 #mount-pet input[name="mount-name"]').value,
                type: document.querySelector('#page-2 #mount-pet input[name="mount-type"]').value,
                health: document.querySelector('#page-2 #mount-pet input[name="mount-health"]').value,
                ac: document.querySelector('#page-2 #mount-pet input[name="mount-ac"]').value,
                speed: document.querySelector('#page-2 #mount-pet input[name="mount-speed"]').value,
                notes: document.querySelector('#page-2 #mount-pet textarea[name="mount-notes"]').value
            },
            mount_pet2: {
                name2: document.querySelector('#page-2 #mount-pet input[name="mount-name-2"]').value,
                type2: document.querySelector('#page-2 #mount-pet input[name="mount-type-2"]').value,
                health2: document.querySelector('#page-2 #mount-pet input[name="mount-health-2"]').value,
                ac2: document.querySelector('#page-2 #mount-pet input[name="mount-ac-2"]').value,
                speed2: document.querySelector('#page-2 #mount-pet input[name="mount-speed-2"]').value,
                notes2: document.querySelector('#page-2 #mount-pet textarea[name="mount-notes-2"]').value
            }

        },
        page4: {
            backstory: document.querySelector('#page-4 #backstory textarea[name="backstory"]').value,
            allies_organizations: {
                name: document.querySelector('#page-4 #allies-organizations input[name="name"]').value,
                val: document.querySelector('#page-4 #allies-organizations textarea[name="allies-organizations"]').value
            },
            personality: {
                personality_traits: document.querySelector('#personality #personality-traits textarea[name="personality-traits"]').value,
                ideals: document.querySelector('#personality #ideals textarea[name="ideals"]').value,
                bonds: document.querySelector('#personality #bonds textarea[name="bonds"]').value,
                flaws: document.querySelector('#personality #flaws textarea[name="flaws"]').value
            },
        },
        page3: {
            spell_info: {
                class: document.querySelector('#page-3 #spell-info input[name="class"]').value,
                att: document.querySelector('#page-3 #spell-info input[name="att"]').value,
                dc: document.querySelector('#page-3 #spell-info input[name="dc"]').value,
                bonus: document.querySelector('#page-3 #spell-info input[name="bonus"]').value
            },
            spells: {
                cantrips: {
                    spells: getSpells('cantrips')
                },
                level_1: {
                    total: document.querySelector('#page-3 #spells input[name="total-1"]').value,
                    spells: getSpells('level-1')
                },
                level_2: {
                    total: document.querySelector('#page-3 #spells input[name="total-2"]').value,
                    spells: getSpells('level-2')
                },
                level_3: {
                    total: document.querySelector('#page-3 #spells input[name="total-3"]').value,
                    spells: getSpells('level-3')
                },
                level_4: {
                    total: document.querySelector('#page-3 #spells input[name="total-4"]').value,
                    spells: getSpells('level-4')
                },
                level_5: {
                    total: document.querySelector('#page-3 #spells input[name="total-5"]').value,
                    spells: getSpells('level-5')
                },
                level_6: {
                    total: document.querySelector('#page-3 #spells input[name="total-6"]').value,
                    spells: getSpells('level-6')
                },
                level_7: {
                    total: document.querySelector('#page-3 #spells input[name="total-7"]').value,
                    spells: getSpells('level-7')
                },
                level_8: {
                    total: document.querySelector('#page-3 #spells input[name="total-8"]').value,
                    spells: getSpells('level-8')
                },
                level_9: {
                    total: document.querySelector('#page-3 #spells input[name="total-9"]').value,
                    spells: getSpells('level-9')
                }
            }
        },
        page5: {
            notes_1: document.querySelector('#page-5 #notes-1 textarea[name="notes-1"]').value,
            notes_2: document.querySelector('#page-5 #notes-2 textarea[name="notes-2"]').value
        },
        images: {
            character: sheetImages.character,
            symbol: sheetImages.symbol
        }
    };

    return sheet;
}

export function createEmptySheet() {
    var template = buildSheetData();

    function cloneAsEmpty(value) {
        if (Array.isArray(value)) {
            return [];
        }

        if (isObject(value)) {
            var emptyObject = {};
            Object.keys(value).forEach(function(key) {
                emptyObject[key] = cloneAsEmpty(value[key]);
            });
            return emptyObject;
        }

        if (typeof value === 'boolean') {
            return false;
        }

        return '';
    }

    var emptySheet = cloneAsEmpty(template);
    emptySheet.schemaVersion = CURRENT_SHEET_SCHEMA_VERSION;

    if (!isObject(emptySheet.images)) {
        emptySheet.images = {};
    }
    emptySheet.images.character = '';
    emptySheet.images.symbol = '';

    return normalizeSheet(emptySheet);
}

async function persistSheetToStorage(sheet) {
    var activeId = sessionStorage.getItem('activeCharacterId');
    await saveCharacter({ ...sheet, id: activeId || sheet.id || 'active' });
}

export async function saveSheet() {
    var sheet = normalizeSheet(buildSheetData());

    try {
        await persistSheetToStorage(sheet);
        showSheetFeedback('Salvo no navegador');
    } catch (_error) {
        showSheetFeedback('Falha ao salvar');
    }
}

async function runAutoSave() {
    var sheet = normalizeSheet(buildSheetData());

    try {
        await persistSheetToStorage(sheet);
        var now = Date.now();
        if ((now - LAST_AUTOSAVE_FEEDBACK_TS) >= AUTOSAVE_FEEDBACK_MIN_INTERVAL_MS) {
            showSheetFeedback('Salvo automaticamente');
            LAST_AUTOSAVE_FEEDBACK_TS = now;
        }
    } catch (_error) {
        showSheetFeedback('Falha no auto-save');
    }
}

function scheduleAutoSave() {
    if (!sessionStorage.getItem('activeCharacterId')) return;
    clearTimeout(AUTO_SAVE_TIMER);
    AUTO_SAVE_TIMER = setTimeout(runAutoSave, AUTO_SAVE_DEBOUNCE_MS);
}

export function cancelAutoSave() {
    clearTimeout(AUTO_SAVE_TIMER);
    AUTO_SAVE_TIMER = null;
    skipUnloadSave = true;
}

export function blockUnloadSave() {
    skipUnloadSave = true;
    clearTimeout(AUTO_SAVE_TIMER);
    AUTO_SAVE_TIMER = null;
}

function persistCurrentSheetSafely() {
    if (skipUnloadSave) return;
    if (!sessionStorage.getItem('activeCharacterId')) return;

    try {
        var sheet = normalizeSheet(buildSheetData());
        persistSheetToStorage(sheet).catch(function() { /* best-effort */ });
    } catch (_error) { /* intentional: best-effort save on unload */ }
}

export async function clearSavedSheet() {
    var confirmed = window.confirm('This will clear all current sheet data and uploaded images from this browser. Continue?');
    if (!confirmed) {
        return;
    }

    skipUnloadSave = true;
    clearTimeout(AUTO_SAVE_TIMER);
    AUTO_SAVE_TIMER = null;

    var activeId = sessionStorage.getItem('activeCharacterId');
    if (activeId) await clearCharacter(activeId);

    var newId = generateId();
    sessionStorage.setItem('activeCharacterId', newId);
    var emptySheet = createEmptySheet();
    await saveCharacter({ ...emptySheet, id: newId });
    location.reload();
}

export function exportSheet() {
    var sheet = normalizeSheet(buildSheetData());
    var saveString = JSON.stringify(sheet, null, 2);
    var file = new Blob([saveString], { type: 'application/json' });
    var a = document.createElement("a"),
        url = URL.createObjectURL(file);
    a.href = url;
    a.download = getExportFilenameFromSheet(sheet);
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
    showSheetFeedback('JSON exportado');
}

export function openImportDialog() {
    var input = document.getElementById('import-sheet-input');
    if (input) {
        input.click();
    }
}

export function importSheetFile(event) {
    var input = event.target;
    var file = input.files && input.files[0];

    if (!file) {
        return;
    }

    var reader = new FileReader();

    reader.onload = function(loadEvent) {
        try {
            var sheet = normalizeSheet(parseSheetJsonText(loadEvent.target.result));
            if (!isValidSheetSchema(sheet)) {
                showSheetFeedback('JSON não é uma ficha válida');
                return;
            }
            persistSheetToStorage(sheet).then(function() {
                clearTimeout(AUTO_SAVE_TIMER);
                AUTO_SAVE_TIMER = null;
                skipUnloadSave = true;
                location.reload();
            });
            showSheetFeedback('Importado com sucesso');
        } catch (_error) {
            showSheetFeedback('JSON invalido');
        } finally {
            input.value = '';
        }
    };

    reader.onerror = function() {
        showSheetFeedback('Falha na leitura do arquivo');
        input.value = '';
    };

    reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', function() {
    renderClassRows([]);

    updateSheetImagePreviews(ensureSheetImagesState());

    document.querySelector('#add-class-row').addEventListener('click', function() {
        addClassRow('', '', true);
    });

    document.addEventListener('click', function(event) {
        if (event.target.matches('.remove-class-row')) {
            removeClassRow(event.target);
        }
    });

    var classLevelSelector = CLASS_ROWS_SELECTOR + ' ' + CLASS_ROW_LEVEL_SELECTOR;
    document.addEventListener('input', function(event) {
        if (event.target.matches(classLevelSelector)) {
            updateClassTotalLevel();
        }
    });
    document.addEventListener('change', function(event) {
        if (event.target.matches(classLevelSelector)) {
            updateClassTotalLevel();
        }
    });

    document.querySelector('#character-image-input').addEventListener('change', function(event) {
        handleSheetImageUpload(event, 'character');
    });

    document.querySelector('#symbol-image-input').addEventListener('change', function(event) {
        handleSheetImageUpload(event, 'symbol');
    });

    document.querySelector('#character-image-reset').addEventListener('click', function() {
        resetSheetImage('character');
    });

    document.querySelector('#symbol-image-reset').addEventListener('click', function() {
        resetSheetImage('symbol');
    });

    document.addEventListener('sheetChanged', scheduleAutoSave);

    // Defer listener binding until initial scripted load is done.
    setTimeout(function() {
        document.addEventListener('input', function(event) {
            if (!event.target.matches('input, select, textarea')) return;
            if (event.target.matches('#import-sheet-input, [type="file"]')) return;
            // Ignore synthetic events fired by scripts during form bootstrapping.
            if (!event.isTrusted) return;
            scheduleAutoSave();
        });
        document.addEventListener('change', function(event) {
            if (!event.target.matches('input, select, textarea')) return;
            if (event.target.matches('#import-sheet-input, [type="file"]')) return;
            if (!event.isTrusted) return;
            scheduleAutoSave();
        });
    }, 0);
});

window.addEventListener('beforeunload', persistCurrentSheetSafely);
window.addEventListener('pagehide', persistCurrentSheetSafely);
