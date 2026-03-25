var LOCKED = false;
var BACKGROUND_AUTO_APPLIED_SKILL_KEYS = [];
var BACKGROUND_FIXED_SKILLS_MAP = {
    "Acolyte (Background)": ["Insight", "Religion"],
    "Anthropologist": ["Insight", "Religion"],
    "Archaeologist": ["History", "Survival"],
    "Athlete": ["Acrobatics", "Athletics"],
    "Azorius Functionary": ["Insight", "Intimidation"],
    "Black Fist Double Agent": ["Deception", "Insight"],
    "Boros Legionnaire": ["Athletics", "Intimidation"],
    "Caravan Specialist": ["Animal Handling", "Survival"],
    "Celebrity Adventurer's Scion": ["Perception", "Performance"],
    "Charlatan": ["Deception", "Sleight of Hand"],
    "City Watch": ["Athletics", "Insight"],
    "Clan Crafter": ["History", "Insight"],
    "Cormanthor Refugee": ["Nature", "Survival"],
    "Courtier": ["Insight", "Persuasion"],
    "Criminal": ["Deception", "Stealth"],
    "Dimir Operative": ["Deception", "Stealth"],
    "Dragon Casualty": ["Intimidation", "Survival"],
    "Earthspur Miner": ["Athletics", "Survival"],
    "Entertainer": ["Acrobatics", "Performance"],
    "Faceless": ["Deception", "Intimidation"],
    "Failed Merchant": ["Investigation", "Persuasion"],
    "Far Traveler": ["Insight", "Perception"],
    "Feylost": ["Deception", "Survival"],
    "Fisher": ["History", "Survival"],
    "Folk Hero": ["Animal Handling", "Survival"],
    "Gambler": ["Deception", "Insight"],
    "Gate Urchin": ["Deception", "Sleight of Hand"],
    "Gate Warden": ["Persuasion", "Survival"],
    "Giant Foundling": ["Intimidation", "Survival"],
    "Golgari Agent": ["Nature", "Survival"],
    "Grinner": ["Deception", "Performance"],
    "Gruul Anarch": ["Animal Handling", "Athletics"],
    "Guild Artisan": ["Insight", "Persuasion"],
    "Harborfolk": ["Athletics", "Sleight of Hand"],
    "Hermit": ["Medicine", "Religion"],
    "Hillsfar Merchant": ["Insight", "Persuasion"],
    "Hillsfar Smuggler": ["Perception", "Stealth"],
    "House Agent": ["Investigation", "Persuasion"],
    "Initiate": ["Athletics", "Intimidation"],
    "Inquisitor": ["Investigation", "Religion"],
    "Iron Route Bandit": ["Animal Handling", "Stealth"],
    "Izzet Engineer": ["Arcana", "Investigation"],
    "Knight of Solamnia": ["Athletics", "Survival"],
    "Lorehold Student": ["History", "Religion"],
    "Mage of High Sorcery": ["Arcana", "History"],
    "Marine": ["Athletics", "Survival"],
    "Mercenary Veteran": ["Athletics", "Persuasion"],
    "Mulmaster Aristocrat": ["Deception", "Performance"],
    "Noble": ["History", "Persuasion"],
    "Orzhov Representative": ["Intimidation", "Religion"],
    "Outlander": ["Athletics", "Survival"],
    "Phlan Insurgent": ["Stealth", "Survival"],
    "Phlan Refugee": ["Athletics", "Insight"],
    "Plaintiff": ["Medicine", "Persuasion"],
    "Planar Philosopher": ["Arcana", "Persuasion"],
    "Prismari Student": ["Acrobatics", "Performance"],
    "Quandrix Student": ["Arcana", "Nature"],
    "Rakdos Cultist": ["Acrobatics", "Performance"],
    "Rival Intern": ["History", "Investigation"],
    "Rune Carver": ["History", "Perception"],
    "Sage": ["Arcana", "History"],
    "Sailor": ["Athletics", "Perception"],
    "Secret Identity": ["Deception", "Stealth"],
    "Selesnya Initiate": ["Nature", "Persuasion"],
    "Shade Fanatic": ["Deception", "Intimidation"],
    "Shipwright": ["History", "Perception"],
    "Silverquill Student": ["Intimidation", "Persuasion"],
    "Simic Scientist": ["Arcana", "Medicine"],
    "Smuggler": ["Athletics", "Deception"],
    "Soldier": ["Athletics", "Intimidation"],
    "Stojanow Prisoner": ["Deception", "Perception"],
    "Ticklebelly Nomad": ["Animal Handling", "Nature"],
    "Trade Sheriff": ["Investigation", "Persuasion"],
    "Urchin": ["Sleight of Hand", "Stealth"],
    "Uthgardt Tribe Member": ["Athletics", "Survival"],
    "Vizier": ["History", "Religion"],
    "Volstrucker Agent": ["Deception", "Stealth"],
    "Waterdhavian Noble": ["History", "Persuasion"],
    "Witchlight Hand": ["Performance", "Sleight of Hand"],
    "Witherbloom Student": ["Nature", "Survival"]
};
var BACKGROUND_FLEXIBLE_SET = {
    "Cloistered Scholar": true,
    "Faction Agent": true,
    "Haunted One": true,
    "Inheritor": true,
    "Investigator": true,
    "Knight of the Order": true,
    "Urban Bounty Hunter": true
};
var SKILL_NAME_TO_KEY = {
    "Acrobatics": "acrobatics",
    "Animal Handling": "animal-handling",
    "Arcana": "arcana",
    "Athletics": "athletics",
    "Deception": "deception",
    "History": "history",
    "Insight": "insight",
    "Intimidation": "intimidation",
    "Investigation": "investigation",
    "Medicine": "medicine",
    "Nature": "nature",
    "Perception": "perception",
    "Performance": "performance",
    "Persuasion": "persuasion",
    "Religion": "religion",
    "Sleight of Hand": "sleight-hand",
    "Stealth": "stealth",
    "Survival": "survival"
};

function lock() {
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
        if (typeof showSheetFeedback === 'function') {
            showSheetFeedback('Background flexível: selecione as perícias manualmente');
        }
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
    var value = '';
    switch (parseInt(score)) {
        case 1:
            value = '-5';
            break;
        case 2:
        case 3:
            value = '-4';
            break;
        case 4:
        case 5:
            value = '-3';
            break;
        case 6:
        case 7:
            value = '-2';
            break;
        case 8:
        case 9:
            value = '-1';
            break;
        case 10:
        case 11:
            value = '+0';
            break;
        case 12:
        case 13:
            value = '+1';
            break;
        case 14:
        case 15:
            value = '+2';
            break;
        case 16:
        case 17:
            value = '+3';
            break;
        case 18:
        case 19:
            value = '+4';
            break;
        case 20:
        case 21:
            value = '+5';
            break;
        case 22:
        case 23:
            value = '+6';
            break;
        case 24:
        case 25:
            value = '+7';
            break;
        case 26:
        case 27:
            value = '+8';
            break;
        case 28:
        case 29:
            value = '+9';
            break;
        case 30:
            value = '+10';
            break;
    }

    document.querySelector('#attributes input[name="' + att + '-mod"]').value = value;
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
        document.querySelector('#top-bar input[name="spell-dc"]').value = 'Na';
        document.querySelector('#spell-info input[name="dc"]').value = 'Na';
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
        switch (el.getAttribute('name')) {
            case 'copper':
                var copper = parseInt(el.value) || 0;
                var modifier = cacluateCurrencyMod('copper', base);
                total += copper * modifier;
                break;
            case 'silver':
                var silver = parseInt(el.value) || 0;
                var modifier = cacluateCurrencyMod('silver', base);
                total += silver * modifier;
                break;
            case 'gold':
                var gold = parseInt(el.value) || 0;
                var modifier = cacluateCurrencyMod('gold', base);
                total += gold * modifier;
                break;
            case 'electrum':
                var electrum = parseInt(el.value) || 0;
                var modifier = cacluateCurrencyMod('electrum', base);
                total += electrum * modifier;
                break;
            case 'platinum':
                var platinum = parseInt(el.value) || 0;
                var modifier = cacluateCurrencyMod('platinum', base);
                total += platinum * modifier;
                break;
        }
    });

    total = total.toFixed(2);

    document.querySelector('#equipment #currancy input[name="total"]').value = total.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

function cacluateCurrencyMod(coin, base) {
    switch (coin) {
        case 'copper':
            switch (base) {
                case 'c':
                    return 1;
                case 's':
                    return 1 / 10;
                case 'g':
                    return 1 / 100;
                case 'e':
                    return 1 / 50;
                case 'p':
                    return 1 / 1000;
            }
            break;
        case 'silver':
            switch (base) {
                case 'c':
                    return 10;
                case 's':
                    return 1;
                case 'g':
                    return 1 / 10;
                case 'e':
                    return 1 / 5;
                case 'p':
                    return 1 / 100;
            }
            break;
        case 'gold':
            switch (base) {
                case 'c':
                    return 100;
                case 's':
                    return 10;
                case 'g':
                    return 1;
                case 'e':
                    return 2;
                case 'p':
                    return 1 / 10;
            }
            break;
        case 'electrum':
            switch (base) {
                case 'c':
                    return 50;
                case 's':
                    return 5;
                case 'g':
                    return 1 / 2;
                case 'e':
                    return 1;
                case 'p':
                    return 1 / 20;
            }
            break;
        case 'platinum':
            switch (base) {
                case 'c':
                    return 1000;
                case 's':
                    return 100;
                case 'g':
                    return 10;
                case 'e':
                    return 20;
                case 'p':
                    return 1;
            }
            break;
    }
}

function updateSpellSlots(total) {
    var totalSlots = parseInt(total.value) || 0;
    var number = total.getAttribute('name').substring(-1);
    var slotsContainer = total.parentElement.parentElement.querySelector('div#slots');
    if (!slotsContainer) return;
    slotsContainer.innerHTML = '';

    for (var i = totalSlots - 1; i >= 0; i--) {
        slotsContainer.insertAdjacentHTML('beforeend', '<input type="checkbox" name="slot-' + number + '">');
    }
}

document.addEventListener('DOMContentLoaded', function() {
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
