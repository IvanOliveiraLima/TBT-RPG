import { BACKGROUND_FIXED_SKILLS_MAP, BACKGROUND_FLEXIBLE_SET, SKILL_NAME_TO_KEY } from './modules/utils.js';
import { getAbilityModifier, cacluateCurrencyMod } from './modules/calculations.js';
import { showSheetFeedback } from './save.js';

var LOCKED = false;
var BACKGROUND_AUTO_APPLIED_SKILL_KEYS = [];


export function lock() {
    LOCKED = !LOCKED;
    var lockEl = document.querySelector('#menu-options #lock');
    if (lockEl) {
        lockEl.textContent = LOCKED ? 'Locked' : 'Unlocked';
        lockEl.classList.toggle('locked');
        lockEl.classList.toggle('unlocked');
    }
}

function getSkillProfCheckbox(skillKey) {
    return document.querySelector('#page-1 #saves-skills #skills #' + skillKey + '-skill input[name="prof"]');
}

function refreshAllSkillDerivedValues() {
    updateStrSkills();
    updateStrMisc();
    updateDexSkills();
    updateDexMisc();
    updateIntSkills();
    updateWisSkills();
    updateWisMisc();
    updateChaSkills();
}

function applyBackgroundSkillProficiencies(backgroundValue) {
    if (LOCKED) {
        return;
    }

    // Remove only proficiencies that were auto-applied previously.
    BACKGROUND_AUTO_APPLIED_SKILL_KEYS.forEach(function(skillKey) {
        var checkbox = getSkillProfCheckbox(skillKey);
        if (checkbox && checkbox.dataset.bgAuto === 'true') {
            checkbox.checked = false;
            delete checkbox.dataset.bgAuto;
        }
    });
    BACKGROUND_AUTO_APPLIED_SKILL_KEYS = [];

    var normalizedBackground = String(backgroundValue || '').trim();
    if (!normalizedBackground) {
        refreshAllSkillDerivedValues();
        return;
    }

    if (BACKGROUND_FLEXIBLE_SET[normalizedBackground]) {
        showSheetFeedback('Background flexível: selecione as perícias manualmente');
        refreshAllSkillDerivedValues();
        return;
    }

    var fixedSkills = BACKGROUND_FIXED_SKILLS_MAP[normalizedBackground];
    if (!Array.isArray(fixedSkills)) {
        refreshAllSkillDerivedValues();
        return;
    }

    fixedSkills.forEach(function(skillName) {
        var skillKey = SKILL_NAME_TO_KEY[skillName];
        if (!skillKey) {
            return;
        }

        var checkbox = getSkillProfCheckbox(skillKey);
        if (!checkbox) {
            return;
        }

        if (!checkbox.checked) {
            checkbox.checked = true;
            checkbox.dataset.bgAuto = 'true';
            BACKGROUND_AUTO_APPLIED_SKILL_KEYS.push(skillKey);
            return;
        }

        // If already checked manually, keep it checked but do not mark as auto-managed.
        delete checkbox.dataset.bgAuto;
        BACKGROUND_AUTO_APPLIED_SKILL_KEYS.push(skillKey);
    });

    refreshAllSkillDerivedValues();
}



function updateMod(att, score) {
    document.querySelector('#attributes input[name="' + att + '-mod"]').value = getAbilityModifier(score);
}

function updateSaves() {

    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;

    var strProf = document.querySelector('#saves #str-save input[name="prof"]').checked ? prof : 0;
    var base = parseInt(document.querySelector('#attributes input[name="str-mod"]').value) || 0;
    var save = ((base + strProf) < 0 ? "" : "+") + (base + strProf);
    document.querySelector('#saves input[name="str-save"]').value = save;

    var dexProf = document.querySelector('#saves #dex-save input[name="prof"]').checked ? prof : 0;
    base = parseInt(document.querySelector('#attributes input[name="dex-mod"]').value) || 0;
    save = ((base + dexProf) < 0 ? "" : "+") + (base + dexProf);
    document.querySelector('#saves input[name="dex-save"]').value = save;

    var conProf = document.querySelector('#saves #con-save input[name="prof"]').checked ? prof : 0;
    base = parseInt(document.querySelector('#attributes input[name="con-mod"]').value) || 0;
    save = ((base + conProf) < 0 ? "" : "+") + (base + conProf);
    document.querySelector('#saves input[name="con-save"]').value = save;

    var intProf = document.querySelector('#saves #int-save input[name="prof"]').checked ? prof : 0;
    base = parseInt(document.querySelector('#attributes input[name="int-mod"]').value) || 0;
    save = ((base + intProf) < 0 ? "" : "+") + (base + intProf);
    document.querySelector('#saves input[name="int-save"]').value = save;

    var wisProf = document.querySelector('#saves #wis-save input[name="prof"]').checked ? prof : 0;
    base = parseInt(document.querySelector('#attributes input[name="wis-mod"]').value) || 0;
    save = ((base + wisProf) < 0 ? "" : "+") + (base + wisProf);
    document.querySelector('#saves input[name="wis-save"]').value = save;

    var chaProf = document.querySelector('#saves #cha-save input[name="prof"]').checked ? prof : 0;
    base = parseInt(document.querySelector('#attributes input[name="cha-mod"]').value) || 0;
    save = ((base + chaProf) < 0 ? "" : "+") + (base + chaProf);
    document.querySelector('#saves input[name="cha-save"]').value = save;
}

function updateSpells() {
    var att = document.querySelector('#saves-skills select[name="spell-att"]').value;

    if (att == 'none') {
        document.querySelector('#top-bar input[name="spell-dc"]').value = '';
        document.querySelector('#spell-info input[name="dc"]').value = '';
        return;
    }

    var base = parseInt(document.querySelector('#attributes input[name="' + att + '-mod"]').value) || 0;
    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;

    //Update DC
    var dc = 8 + base + prof;
    document.querySelector('#top-bar input[name="spell-dc"]').value = dc;
    document.querySelector('#spell-info input[name="dc"]').value = dc;

    //Update Spell Bonus
    var bonus = base + prof;
    document.querySelector('#spell-info input[name="bonus"]').value = "+" + bonus;

    //Update Spell Attribute
    document.querySelector('#spell-info input[name="att"]').value = att;
}

function updateStrSkills() {
    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;
    var base = parseInt(document.querySelector('#attributes input[name="str-mod"]').value) || 0;

    var skillProf = 0;
    if (document.querySelector('#skills #athletics-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #athletics-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    var skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #athletics-skill input[type="text"]').value = skill;
}

function updateDexSkills() {
    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;
    var base = parseInt(document.querySelector('#attributes input[name="dex-mod"]').value) || 0;

    var skillProf = 0;
    if (document.querySelector('#skills #acrobatics-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #acrobatics-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    var skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #acrobatics-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #sleight-hand-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #sleight-hand-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #sleight-hand-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #stealth-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #stealth-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #stealth-skill input[type="text"]').value = skill;
}

function updateIntSkills() {
    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;
    var base = parseInt(document.querySelector('#attributes input[name="int-mod"]').value) || 0;

    var skillProf = 0;
    if (document.querySelector('#skills #arcana-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #arcana-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    var skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #arcana-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #history-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #history-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #history-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #investigation-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #investigation-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #investigation-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #religion-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #religion-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #religion-skill input[type="text"]').value = skill;

}

function updateWisSkills() {
    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;
    var base = parseInt(document.querySelector('#attributes input[name="wis-mod"]').value) || 0;

    var skillProf = 0;
    if (document.querySelector('#skills #animal-handling-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #animal-handling-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    var skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #animal-handling-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #insight-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #insight-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #insight-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #medicine-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #medicine-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #medicine-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #nature-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #nature-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #nature-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #perception-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #perception-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #perception-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #survival-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #survival-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #survival-skill input[type="text"]').value = skill;

}

function updateChaSkills() {
    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;
    var base = parseInt(document.querySelector('#attributes input[name="cha-mod"]').value) || 0;

    var skillProf = 0;
    if (document.querySelector('#skills #deception-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #deception-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    var skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #deception-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #intimidation-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #intimidation-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #intimidation-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #performance-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #performance-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #performance-skill input[type="text"]').value = skill;

    skillProf = 0;
    if (document.querySelector('#skills #persuasion-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #persuasion-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);
    document.querySelector('#skills #persuasion-skill input[type="text"]').value = skill;

}


function updateStrMisc() {
    var score = parseInt(document.querySelector('#attributes input[name="str"]').value) || 0;

    document.querySelector('#encumberance input[name="base-encumberance"]').value = score * 5;
    document.querySelector('#encumberance input[name="encumbered-encumberance"]').value = score * 10;
    document.querySelector('#encumberance input[name="h-encumbered-encumberance"]').value = score * 15;
    document.querySelector('#encumberance input[name="push-encumberance"]').value = score * 30;

}

function updateDexMisc() {
    // intentionally empty
}

function updateWisMisc() {
    var prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;
    var base = parseInt(document.querySelector('#attributes input[name="wis-mod"]').value) || 0;

    var skillProf = 0;
    if (document.querySelector('#skills #perception-skill input[name="prof"]').checked == true) {
        skillProf = prof;
    }
    if (document.querySelector('#skills #perception-skill input[name="expr"]').checked == true) {
        skillProf = prof * 2;
    }

    var skill = ((base + skillProf) < 0 ? "" : "+") + (base + skillProf);

    document.querySelector('#top-bar input[name="passive-perception"]').value = 10 + parseInt(skill);
}

function calculateTotalWeight() {
    var total = 0;
    document.querySelectorAll('#equipment input[name="weight"]').forEach(function(el) {
        total += parseFloat(el.value) || 0;
    });

    document.querySelector('#equipment input[name="total-weight"]').value = total.toFixed(2);
}

function calculateTotalCurrency() {
    var total = 0;
    var base = document.querySelector('#equipment #currancy select[name="base"]').value;

    document.querySelectorAll('#equipment #currancy input:not([name="total"])').forEach(function(el) {
        var modifier;
        switch (el.getAttribute('name')) {
            case 'copper':
                var copper = parseInt(el.value) || 0;
                modifier = cacluateCurrencyMod('copper', base);
                total += copper * modifier;
                break;
            case 'silver':
                var silver = parseInt(el.value) || 0;
                modifier = cacluateCurrencyMod('silver', base);
                total += silver * modifier;
                break;
            case 'gold':
                var gold = parseInt(el.value) || 0;
                modifier = cacluateCurrencyMod('gold', base);
                total += gold * modifier;
                break;
            case 'electrum':
                var electrum = parseInt(el.value) || 0;
                modifier = cacluateCurrencyMod('electrum', base);
                total += electrum * modifier;
                break;
            case 'platinum':
                var platinum = parseInt(el.value) || 0;
                modifier = cacluateCurrencyMod('platinum', base);
                total += platinum * modifier;
                break;
        }
    });

    total = total.toFixed(2);

    document.querySelector('#equipment #currancy input[name="total"]').value = total.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

export function updateSpellSlots(total) {
    var totalSlots = parseInt(total.value) || 0;
    var number = total.getAttribute('name').substring(-1);
    var slotsContainer = total.parentElement.parentElement.querySelector('div#slots');
    if (!slotsContainer) return;
    slotsContainer.innerHTML = '';

    for (var i = totalSlots - 1; i >= 0; i--) {
        slotsContainer.insertAdjacentHTML('beforeend', '<input type="checkbox" name="slot-' + number + '">');
    }
}

var NUMERIC_FIELD_SELECTORS = [
    '#hit-points input[name="temp-health"]',
    '#hit-points input[name="current-health"]',
    '#hit-points input[name="max-health"]',
    '#top-bar input[name="proficiency"]',
    '#top-bar input[name="initiative"]',
    '#top-bar input[name="ac"]',
    '#top-bar input[name="speed"]',
    '#attributes input[name="str"]',
    '#attributes input[name="dex"]',
    '#attributes input[name="con"]',
    '#attributes input[name="int"]',
    '#attributes input[name="wis"]',
    '#attributes input[name="cha"]',
    '#saves input[name="str-save"]',
    '#saves input[name="dex-save"]',
    '#saves input[name="con-save"]',
    '#saves input[name="int-save"]',
    '#saves input[name="wis-save"]',
    '#saves input[name="cha-save"]',
    '#skills #athletics-skill input[type="text"]',
    '#skills #acrobatics-skill input[type="text"]',
    '#skills #sleight-hand-skill input[type="text"]',
    '#skills #stealth-skill input[type="text"]',
    '#skills #arcana-skill input[type="text"]',
    '#skills #history-skill input[type="text"]',
    '#skills #investigation-skill input[type="text"]',
    '#skills #religion-skill input[type="text"]',
    '#skills #animal-handling-skill input[type="text"]',
    '#skills #insight-skill input[type="text"]',
    '#skills #medicine-skill input[type="text"]',
    '#skills #nature-skill input[type="text"]',
    '#skills #perception-skill input[type="text"]',
    '#skills #survival-skill input[type="text"]',
    '#skills #deception-skill input[type="text"]',
    '#skills #intimidation-skill input[type="text"]',
    '#skills #performance-skill input[type="text"]',
    '#skills #persuasion-skill input[type="text"]'
];

function isValidNumericInput(value) {
    return /^[+-]?\d*$/.test(value);
}

function bindNumericValidation(el) {
    el.dataset.lastValidNumericValue = el.value;
    el.addEventListener('input', function() {
        if (isValidNumericInput(this.value)) {
            this.dataset.lastValidNumericValue = this.value;
        } else {
            this.value = this.dataset.lastValidNumericValue;
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    //Bind numeric validation to stat/skill/save fields
    NUMERIC_FIELD_SELECTORS.forEach(function(selector) {
        var el = document.querySelector(selector);
        if (el) {
            bindNumericValidation(el);
        }
    });

    //Run when strength changes
    document.querySelector('#attributes input[name="str"]').addEventListener('input', function() {
        if (LOCKED) return;
        updateMod('str', document.querySelector('#attributes input[name="str"]').value);
        updateStrSkills();
        updateStrMisc();
    });

    //Run when dexterity changes
    document.querySelector('#attributes input[name="dex"]').addEventListener('input', function() {
        if (LOCKED) return;
        updateMod('dex', document.querySelector('#attributes input[name="dex"]').value);
        updateDexSkills();
        updateDexMisc();
    });

    //Run when constitution changes
    document.querySelector('#attributes input[name="con"]').addEventListener('input', function() {
        if (LOCKED) return;
        updateMod('con', document.querySelector('#attributes input[name="con"]').value);
    });

    //Run when intelligence changes
    document.querySelector('#attributes input[name="int"]').addEventListener('input', function() {
        if (LOCKED) return;
        updateMod('int', document.querySelector('#attributes input[name="int"]').value);
        updateIntSkills();
    });

    //Run when wisdom changes
    document.querySelector('#attributes input[name="wis"]').addEventListener('input', function() {
        if (LOCKED) return;
        updateMod('wis', document.querySelector('#attributes input[name="wis"]').value);
        updateWisSkills();
        updateWisMisc();
    });

    //Run when charisma changes
    document.querySelector('#attributes input[name="cha"]').addEventListener('input', function() {
        if (LOCKED) return;
        updateMod('cha', document.querySelector('#attributes input[name="cha"]').value);
        updateChaSkills();
    });

    //Run misc att changes
    document.querySelectorAll('#attributes input').forEach(function(el) {
        el.addEventListener('input', function() {
            if (LOCKED) return;
            updateSaves();
            updateSpells();
        });
    });

    //Run when proficience changes
    document.querySelector('#top-bar input[name="proficiency"]').addEventListener('input', function() {
        if (LOCKED) return;
        updateStrSkills();
        updateStrMisc();
        updateDexSkills();
        updateDexMisc();
        updateIntSkills();
        updateWisSkills();
        updateWisMisc();
        updateChaSkills();
        updateSaves();
        updateSpells();
    });

    //Run save prof changes
    document.querySelectorAll('#saves input[name="prof"]').forEach(function(el) {
        el.addEventListener('change', function() {
            if (LOCKED) return;
            updateSaves();
        });
    });

    //Run skill prof/exp changes
    document.querySelectorAll('#skills input[name="prof"]').forEach(function(el) {
        el.addEventListener('change', function() {
            if (LOCKED) return;
            delete this.dataset.bgAuto;
            updateStrSkills();
            updateStrMisc();
            updateDexSkills();
            updateDexMisc();
            updateIntSkills();
            updateWisSkills();
            updateWisMisc();
            updateChaSkills();
        });
    });

    document.querySelectorAll('#skills input[name="expr"]').forEach(function(el) {
        el.addEventListener('change', function() {
            if (LOCKED) return;
            updateStrSkills();
            updateStrMisc();
            updateDexSkills();
            updateDexMisc();
            updateIntSkills();
            updateWisSkills();
            updateWisMisc();
            updateChaSkills();
        });
    });

    //Run background auto proficiency changes (user-driven only)
    document.querySelector('#character-info input[name="background"]').addEventListener('change', function(event) {
        if (!event.isTrusted) {
            return;
        }
        applyBackgroundSkillProficiencies(this.value);
    });

    //Run misc changes
    document.querySelector('#saves-skills select[name="spell-att"]').addEventListener('change', function() {
        if (LOCKED) return;
        updateSpells();
    });

    //Run weight changes
    document.querySelectorAll('#equipment input[name="weight"]').forEach(function(el) {
        el.addEventListener('keyup', function() {
            if (LOCKED) return;
            calculateTotalWeight();
        });
    });

    //Run currency changes
    document.querySelectorAll('#equipment #currancy input:not([name="total"])').forEach(function(el) {
        el.addEventListener('keyup', function() {
            if (LOCKED) return;
            calculateTotalCurrency();
        });
    });

    document.querySelector('#equipment #currancy select[name="base"]').addEventListener('change', function() {
        if (LOCKED) return;
        calculateTotalCurrency();
    });

    //Update Spell Slots
    document.querySelectorAll('#spells #total-slots input').forEach(function(el) {
        el.addEventListener('keyup', function() {
            if (LOCKED) return;
            updateSpellSlots(this);
        });
    });
});
