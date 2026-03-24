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

var DND_SHEET_STORAGE_KEY = window.DND_SHEET_STORAGE_KEY || 'dnd_sheet_v1';
window.DND_SHEET_STORAGE_KEY = DND_SHEET_STORAGE_KEY;
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
window.sheetImages = window.sheetImages || {
    character: '',
    symbol: ''
};
var CLASS_ROWS_SELECTOR = '#character-basic-info #basic-info #class-rows';
var CLASS_ROW_NAME_SELECTOR = 'input[name="class-name"]';
var CLASS_ROW_LEVEL_SELECTOR = 'input[name="class-level"]';

function parseLegacyClassLevel(value) {
    var rawValue = String(value || '').trim();
    var parsed = {
        charClass: '',
        level: ''
    };

    if (!rawValue) {
        return parsed;
    }

    var commaMatch = rawValue.match(/^(.*?),\s*(\d+)$/);
    if (commaMatch) {
        parsed.charClass = commaMatch[1].trim();
        parsed.level = commaMatch[2].trim();
        return parsed;
    }

    var trailingLevelMatch = rawValue.match(/^(.*)\s+(\d+)$/);
    if (trailingLevelMatch) {
        parsed.charClass = trailingLevelMatch[1].trim();
        parsed.level = trailingLevelMatch[2].trim();
        return parsed;
    }

    parsed.charClass = rawValue;
    return parsed;
}

function sanitizeClassEntry(entry) {
    var safeEntry = isObject(entry) ? entry : {};
    var className = String(safeEntry.name || safeEntry.char_class || '').trim();
    var classLevel = String(safeEntry.level || '').trim();

    if (/^\d+$/.test(className) && !classLevel) {
        classLevel = className;
        className = '';
    }

    return {
        name: className,
        level: classLevel
    };
}

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

function calculateTotalClassLevel(classes) {
    var total = 0;

    for (var i = 0; i < classes.length; i++) {
        var level = String(classes[i].level || '').trim();
        if (/^\d+$/.test(level)) {
            total += parseInt(level, 10);
        }
    }

    return total;
}

function updateClassTotalLevel() {
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

function renderClassRows(classes) {
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
    if (!isObject(window.sheetImages)) {
        window.sheetImages = {
            character: '',
            symbol: ''
        };
    }

    if (typeof window.sheetImages.character !== 'string') {
        window.sheetImages.character = '';
    }

    if (typeof window.sheetImages.symbol !== 'string') {
        window.sheetImages.symbol = '';
    }

    return window.sheetImages;
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

function applyImagesFromSheet(sheet) {
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

        $('#image-adjust-preview').attr('src', dataUrl);
        $('#image-adjust-viewport').css({
            width: viewportWidth + 'px',
            height: viewportHeight + 'px'
        });
        $('#image-adjust-zoom').val('1');
        renderImageAdjustPreview();
        $('#image-adjust-modal').css('display', 'flex');
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

function showSheetFeedback(message) {
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

function normalizeSheet(sheet) {
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

function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

function hasKeys(source, keys) {
    if (!isObject(source)) {
        return false;
    }

    for (var i = 0; i < keys.length; i++) {
        if (!(keys[i] in source)) {
            return false;
        }
    }

    return true;
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

function buildSheetData() {
    var sheetImages = ensureSheetImagesState();
    var classes = getClassesFromForm();
    var totalLevel = calculateTotalClassLevel(classes);
    var firstClass = classes.length ? classes[0].name : '';

    var sheet = {
        schemaVersion: CURRENT_SHEET_SCHEMA_VERSION,
        page1: {
            basic_info: {
                char_name: $('#character-basic-info #basic-info input[name="char-name"]').val(),
                classes: classes,
                total_level: totalLevel,
                char_class: firstClass,
                level: String(totalLevel || ''),
            },
            character_info: {
                race_class: $('#character-basic-info #character-info input[name="race-class"]').val(),
                background: $('#character-basic-info #character-info input[name="background"]').val(),
                player_name: $('#character-basic-info #character-info input[name="player-name"]').val(),
                exp: $('#character-basic-info #character-info input[name="exp"]').val(),
                alignment: $('#character-basic-info #character-info input[name="alignment"]').val()
            },
            top_bar: {
                proficiency: $('#page-1 #top-bar input[name="proficiency"]').val(),
                initiative: $('#page-1 #top-bar input[name="initiative"]').val(),
                passive_perception: $('#page-1 #top-bar input[name="passive-perception"]').val(),
                ac: $('#page-1 #top-bar input[name="ac"]').val(),
                speed: $('#page-1 #top-bar input[name="speed"]').val(),
                spell_dc: $('#page-1 #top-bar input[name="spell-dc"]').val(),
                insperation: $('#page-1 #top-bar input[name="insperation"]').val()
            },
            attributes: {
                str: $('#page-1 #attributes input[name="str"]').val(),
                str_mod: $('#page-1 #attributes input[name="str-mod"]').val(),
                dex: $('#page-1 #attributes input[name="dex"]').val(),
                dex_mod: $('#page-1 #attributes input[name="dex-mod"]').val(),
                con: $('#page-1 #attributes input[name="con"]').val(),
                con_mod: $('#page-1 #attributes input[name="con-mod"]').val(),
                int: $('#page-1 #attributes input[name="int"]').val(),
                int_mod: $('#page-1 #attributes input[name="int-mod"]').val(),
                wis: $('#page-1 #attributes input[name="wis"]').val(),
                wis_mod: $('#page-1 #attributes input[name="wis-mod"]').val(),
                cha: $('#page-1 #attributes input[name="cha"]').val(),
                cha_mod: $('#page-1 #attributes input[name="cha-mod"]').val()
            },
            saves_skills: {
                spell_casting: $('#page-1 #saves-skills select[name="spell-att"]').val(),
                saves: {
                    str_save: {
                        val: $('#page-1 #saves-skills #saves input[name="str-save"]').val(),
                        prof: $('#page-1 #saves-skills #saves #str-save input[name="prof"]').prop("checked")
                    },
                    dex_save: {
                        val: $('#page-1 #saves-skills #saves input[name="dex-save"]').val(),
                        prof: $('#page-1 #saves-skills #saves #dex-save input[name="prof"]').prop("checked")
                    },
                    con_save: {
                        val: $('#page-1 #saves-skills #saves input[name="con-save"]').val(),
                        prof: $('#page-1 #saves-skills #saves #con-save input[name="prof"]').prop("checked")
                    },
                    int_save: {
                        val: $('#page-1 #saves-skills #saves input[name="int-save"]').val(),
                        prof: $('#page-1 #saves-skills #saves #int-save input[name="prof"]').prop("checked")
                    },
                    wis_save: {
                        val: $('#page-1 #saves-skills #saves input[name="wis-save"]').val(),
                        prof: $('#page-1 #saves-skills #saves #wis-save input[name="prof"]').prop("checked")
                    },
                    cha_save: {
                        val: $('#page-1 #saves-skills #saves input[name="cha-save"]').val(),
                        prof: $('#page-1 #saves-skills #saves #cha-save input[name="prof"]').prop("checked")
                    },
                },
                skills: {
                    acrobatics: {
                        val: $('#page-1 #saves-skills #skills input[name="acrobatics-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #acrobatics-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #acrobatics-skill input[name="expr"]').prop("checked")
                    },
                    animal_handling: {
                        val: $('#page-1 #saves-skills #skills input[name="animal-handling-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #animal-handling-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #animal-handling-skill input[name="expr"]').prop("checked")
                    },
                    arcana: {
                        val: $('#page-1 #saves-skills #skills input[name="arcana-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #arcana-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #arcana-skill input[name="expr"]').prop("checked")
                    },
                    athletics: {
                        val: $('#page-1 #saves-skills #skills input[name="athletics-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #athletics-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #athletics-skill input[name="expr"]').prop("checked")
                    },
                    deception: {
                        val: $('#page-1 #saves-skills #skills input[name="deception-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #deception-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #deception-skill input[name="expr"]').prop("checked")
                    },
                    history: {
                        val: $('#page-1 #saves-skills #skills input[name="history-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #history-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #history-skill input[name="expr"]').prop("checked")
                    },
                    insight: {
                        val: $('#page-1 #saves-skills #skills input[name="insight-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #insight-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #insight-skill input[name="expr"]').prop("checked")
                    },
                    intimidation: {
                        val: $('#page-1 #saves-skills #skills input[name="intimidation-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #intimidation-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #intimidation-skill input[name="expr"]').prop("checked")
                    },
                    investigation: {
                        val: $('#page-1 #saves-skills #skills input[name="investigation-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #investigation-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #investigation-skill input[name="expr"]').prop("checked")
                    },
                    medicine: {
                        val: $('#page-1 #saves-skills #skills input[name="medicine-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #medicine-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #medicine-skill input[name="expr"]').prop("checked")
                    },
                    nature: {
                        val: $('#page-1 #saves-skills #skills input[name="nature-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #nature-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #nature-skill input[name="expr"]').prop("checked")
                    },
                    perception: {
                        val: $('#page-1 #saves-skills #skills input[name="perception-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #perception-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #perception-skill input[name="expr"]').prop("checked")
                    },
                    performance: {
                        val: $('#page-1 #saves-skills #skills input[name="performance-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #performance-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #performance-skill input[name="expr"]').prop("checked")
                    },
                    persuasion: {
                        val: $('#page-1 #saves-skills #skills input[name="persuasion-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #persuasion-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #persuasion-skill input[name="expr"]').prop("checked")
                    },
                    religion: {
                        val: $('#page-1 #saves-skills #skills input[name="religion-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #religion-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #religion-skill input[name="expr"]').prop("checked")
                    },
                    sleight_hand: {
                        val: $('#page-1 #saves-skills #skills input[name="sleight-hand-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #sleight-hand-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #sleight-hand-skill input[name="expr"]').prop("checked")
                    },
                    stealth: {
                        val: $('#page-1 #saves-skills #skills input[name="stealth-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #stealth-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #stealth-skill input[name="expr"]').prop("checked")
                    },
                    survival: {
                        val: $('#page-1 #saves-skills #skills input[name="survival-skill"]').val(),
                        prof: $('#page-1 #saves-skills #skills #survival-skill input[name="prof"]').prop("checked"),
                        expr: $('#page-1 #saves-skills #skills #survival-skill input[name="expr"]').prop("checked")
                    }
                }
            },
            status: {
                conditions: $('#page-1 #status #conditions textarea[name="conditions"]').val(),
                boons: $('#page-1 #status #boons textarea[name="boons"]').val(),
                death_saves: {
                    success: {
                        one: $('#page-1 #status #death-saves input[name="success-1"]').prop("checked"),
                        two: $('#page-1 #status #death-saves input[name="success-2"]').prop("checked"),
                        three: $('#page-1 #status #death-saves input[name="success-3"]').prop("checked")
                    },
                    failure: {
                        one: $('#page-1 #status #death-saves input[name="failure-1"]').prop("checked"),
                        two: $('#page-1 #status #death-saves input[name="failure-2"]').prop("checked"),
                        three: $('#page-1 #status #death-saves input[name="failure-3"]').prop("checked")
                    }
                },
                hit_dice: {
                    type: $('#page-1 #status #hit-dice input[name="hit-dice"]').val(),
                    current_hd: $('#page-1 #status #hit-dice input[name="current-hd"]').val()
                },
                temp_health: $('#page-1 #status #hit-points input[name="temp-health"]').val(),
                current_health: $('#page-1 #status #hit-points input[name="current-health"]').val(),
                max_health: $('#page-1 #status #hit-points input[name="max-health"]').val()
            },
            proficiencies: {
                weapon_armor: $('#page-1 #proficiencies #weapons-armor textarea[name="weapons-armor"]').val(),
                tools: $('#page-1 #proficiencies #tools textarea[name="tools"]').val(),
                languages: $('#page-1 #proficiencies #languages textarea[name="languages"]').val()
            },
            attacks_spells: getAttacks(),
            features: $('#page-1 #features textarea[name="features"]').val()
        },
        page2: {
            equipment: {
                val: getEquipment(),
                total_weight: $('#page-2 #equipment tr#total input[name="total-weight"').val(),
                currency: {
                    copper: $('#page-2 #currancy input[name="copper"]').val(),
                    silver: $('#page-2 #currancy input[name="silver"]').val(),
                    gold: $('#page-2 #currancy input[name="gold"]').val(),
                    electrum: $('#page-2 #currancy input[name="electrum"]').val(),
                    platinum: $('#page-2 #currancy input[name="platinum"]').val(),
                    total: $('#page-2 #currancy input[name="total"]').val(),
                    base: $('#page-2 #currancy select[name="base"]').val()
                },
                encumberance: {
                    base: $('#page-2 #encumberance input[name="base-encumberance"]').val(),
                    encumbered: $('#page-2 #encumberance input[name="encumbered-encumberance"]').val(),
                    h_encumbered: $('#page-2 #encumberance input[name="h-encumbered-encumberance"]').val(),
                    push: $('#encumberance input[name="push-encumberance"]').val()
                }
            },
            attacks_spells: getAttacks(),
            mount_pet: {
                name: $('#page-2 #mount-pet input[name="mount-name"]').val(),
                type: $('#page-2 #mount-pet input[name="mount-type"]').val(),
                health: $('#page-2 #mount-pet input[name="mount-health"]').val(),
                ac: $('#page-2 #mount-pet input[name="mount-ac"]').val(),
                speed: $('#page-2 #mount-pet input[name="mount-speed"]').val(),
                notes: $('#page-2 #mount-pet textarea[name="mount-notes"]').val()
            },
            mount_pet2: {
                name2: $('#page-2 #mount-pet input[name="mount-name-2"]').val(),
                type2: $('#page-2 #mount-pet input[name="mount-type-2"]').val(),
                health2: $('#page-2 #mount-pet input[name="mount-health-2"]').val(),
                ac2: $('#page-2 #mount-pet input[name="mount-ac-2"]').val(),
                speed2: $('#page-2 #mount-pet input[name="mount-speed-2"]').val(),
                notes2: $('#page-2 #mount-pet textarea[name="mount-notes-2"]').val()
            }

        },
        page4: {
            backstory: $('#page-4 #backstory textarea[name="backstory"]').val(),
            allies_organizations: {
                name: $('#page-4 #allies-organizations input[name="name"]').val(),
                val: $('#page-4 #allies-organizations textarea[name="allies-organizations"]').val()
            },
            personality: {
                personality_traits: $('#personality #personality-traits textarea[name="personality-traits"]').val(),
                ideals: $('#personality #ideals textarea[name="ideals"]').val(),
                bonds: $('#personality #bonds textarea[name="bonds"]').val(),
                flaws: $('#personality #flaws textarea[name="flaws"]').val()
            },
        },
        page3: {
            spell_info: {
                class: $('#page-3 #spell-info input[name="class"]').val(),
                att: $('#page-3 #spell-info input[name="att"]').val(),
                dc: $('#page-3 #spell-info input[name="dc"]').val(),
                bonus: $('#page-3 #spell-info input[name="bonus"]').val()
            },
            spells: {
                cantrips: {
                    spells: getSpells('cantrips')
                },
                level_1: {
                    total: $('#page-3 #spells input[name="total-1"]').val(),
                    spells: getSpells('level-1')
                },
                level_2: {
                    total: $('#page-3 #spells input[name="total-2"]').val(),
                    spells: getSpells('level-2')
                },
                level_3: {
                    total: $('#page-3 #spells input[name="total-3"]').val(),
                    spells: getSpells('level-3')
                },
                level_4: {
                    total: $('#page-3 #spells input[name="total-4"]').val(),
                    spells: getSpells('level-4')
                },
                level_5: {
                    total: $('#page-3 #spells input[name="total-5"]').val(),
                    spells: getSpells('level-5')
                },
                level_6: {
                    total: $('#page-3 #spells input[name="total-6"]').val(),
                    spells: getSpells('level-6')
                },
                level_7: {
                    total: $('#page-3 #spells input[name="total-7"]').val(),
                    spells: getSpells('level-7')
                },
                level_8: {
                    total: $('#page-3 #spells input[name="total-8"]').val(),
                    spells: getSpells('level-8')
                },
                level_9: {
                    total: $('#page-3 #spells input[name="total-9"]').val(),
                    spells: getSpells('level-9')
                }
            }
        },
        page5: {
            notes_1: $('#page-5 #notes-1 textarea[name="notes-1"]').val(),
            notes_2: $('#page-5 #notes-2 textarea[name="notes-2"]').val()
        },
        images: {
            character: sheetImages.character,
            symbol: sheetImages.symbol
        }
    };

    return sheet;
}

function createEmptySheet() {
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

function persistSheetToLocalStorage(sheet) {
    localStorage.setItem(DND_SHEET_STORAGE_KEY, JSON.stringify(sheet));
    window.loadJson = sheet;
}

function saveSheet(argument) {
    var sheet = normalizeSheet(buildSheetData());

    try {
        persistSheetToLocalStorage(sheet);
        showSheetFeedback('Salvo no navegador');
    } catch (error) {
        showSheetFeedback('Falha ao salvar');
    }
}

function runAutoSave() {
    var sheet = normalizeSheet(buildSheetData());

    try {
        persistSheetToLocalStorage(sheet);
        var now = Date.now();
        if ((now - LAST_AUTOSAVE_FEEDBACK_TS) >= AUTOSAVE_FEEDBACK_MIN_INTERVAL_MS) {
            showSheetFeedback('Salvo automaticamente');
            LAST_AUTOSAVE_FEEDBACK_TS = now;
        }
    } catch (error) {
        showSheetFeedback('Falha no auto-save');
    }
}

function scheduleAutoSave() {
    clearTimeout(AUTO_SAVE_TIMER);
    AUTO_SAVE_TIMER = setTimeout(runAutoSave, AUTO_SAVE_DEBOUNCE_MS);
}

function persistCurrentSheetSafely() {
    if (skipUnloadSave) {
        return;
    }

    try {
        var sheet = normalizeSheet(buildSheetData());
        persistSheetToLocalStorage(sheet);
    } catch (error) {}
}

function clearSavedSheet(argument) {
    var confirmed = window.confirm('This will clear all current sheet data and uploaded images from this browser. Continue?');
    if (!confirmed) {
        return;
    }

    skipUnloadSave = true;
    clearTimeout(AUTO_SAVE_TIMER);
    AUTO_SAVE_TIMER = null;
    localStorage.removeItem(DND_SHEET_STORAGE_KEY);
    persistSheetToLocalStorage(createEmptySheet());
    location.reload();
}

function getExportFilenameFromSheet(sheet) {
    var rawName = '';

    if (sheet && sheet.page1 && sheet.page1.basic_info && typeof sheet.page1.basic_info.char_name === 'string') {
        rawName = sheet.page1.basic_info.char_name;
    }

    var sanitizedName = rawName
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[\/\\:\*\?"<>\|]/g, '-')
        .trim();

    if (!sanitizedName) {
        return 'savedSheet.json';
    }

    return sanitizedName + '.json';
}

function exportSheet(argument) {
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

function openImportDialog(argument) {
    var input = document.getElementById('import-sheet-input');
    if (input) {
        input.click();
    }
}

function importSheetFile(event) {
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
            persistSheetToLocalStorage(sheet);
            showSheetFeedback('Importado com sucesso');
            clearTimeout(AUTO_SAVE_TIMER);
            AUTO_SAVE_TIMER = null;
            skipUnloadSave = true;
            location.reload();
        } catch (error) {
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

$(document).ready(function() {
    renderClassRows([]);

    updateSheetImagePreviews(ensureSheetImagesState());

    $('#add-class-row').on('click', function() {
        addClassRow('', '', true);
    });

    $(document).on('click', '.remove-class-row', function() {
        removeClassRow(this);
    });

    $(document).on('input change', CLASS_ROWS_SELECTOR + ' ' + CLASS_ROW_LEVEL_SELECTOR, function() {
        updateClassTotalLevel();
    });

    $('#character-image-input').on('change', function(event) {
        handleSheetImageUpload(event, 'character');
    });

    $('#symbol-image-input').on('change', function(event) {
        handleSheetImageUpload(event, 'symbol');
    });

    $('#character-image-reset').on('click', function() {
        resetSheetImage('character');
    });

    $('#symbol-image-reset').on('click', function() {
        resetSheetImage('symbol');
    });

    document.addEventListener('sheetChanged', scheduleAutoSave);

    // Defer listener binding until initial scripted load is done.
    setTimeout(function() {
        $(document).on('input change', 'input, select, textarea', function(event) {
            if ($(event.target).is('#import-sheet-input, [type="file"]')) {
                return;
            }

            // Ignore synthetic events fired by scripts during form bootstrapping.
            if (!event.originalEvent) {
                return;
            }

            scheduleAutoSave();
        });
    }, 0);
});

window.addEventListener('beforeunload', persistCurrentSheetSafely);
window.addEventListener('pagehide', persistCurrentSheetSafely);
