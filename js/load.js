import { loadCharacter } from './modules/storage.js';
import { normalizeSheet, createEmptySheet, renderClassRows, updateClassTotalLevel, applyImagesFromSheet, showSheetFeedback } from './save.js';
import { updateSpellSlots } from './changes.js';

var loadJson = null;

async function resolveInitialSheet() {
    var stored = await loadCharacter();
    if (stored) {
        return normalizeSheet(stored);
    }

    return normalizeSheet(createEmptySheet());
}

function setFormFieldsEnabled(enabled) {
    document.querySelectorAll('input, select, textarea').forEach(function(el) { el.disabled = !enabled; });
}

function applyLoadedSheet() {

    //Change the title to the character name
    if (loadJson.page1.basic_info.char_name)
        document.title = loadJson.page1.basic_info.char_name;

    //Load Basic Info
    document.querySelector('#character-basic-info #basic-info input[name="char-name"]').value = loadJson.page1.basic_info.char_name;
    var loadedClasses = loadJson.page1.basic_info.classes;
    if (!Array.isArray(loadedClasses) || !loadedClasses.length) {
        loadedClasses = [{
            name: loadJson.page1.basic_info.char_class || '',
            level: loadJson.page1.basic_info.level || ''
        }];
    }
    renderClassRows(loadedClasses);
    updateClassTotalLevel();

    //Load Character Info
    document.querySelector('#character-basic-info #character-info input[name="race-class"]').value = loadJson.page1.character_info.race_class;
    document.querySelector('#character-basic-info #character-info input[name="background"]').value = loadJson.page1.character_info.background;
    document.querySelector('#character-basic-info #character-info input[name="player-name"]').value = loadJson.page1.character_info.player_name;
    document.querySelector('#character-basic-info #character-info input[name="exp"]').value = loadJson.page1.character_info.exp;
    document.querySelector('#character-basic-info #character-info input[name="alignment"]').value = loadJson.page1.character_info.alignment;

    //Load Info Bar
    document.querySelector('#page-1 #top-bar input[name="proficiency"]').value = loadJson.page1.top_bar.proficiency;
    document.querySelector('#page-1 #top-bar input[name="initiative"]').value = loadJson.page1.top_bar.initiative;
    document.querySelector('#page-1 #top-bar input[name="passive-perception"]').value = loadJson.page1.top_bar.passive_perception;
    document.querySelector('#page-1 #top-bar input[name="ac"]').value = loadJson.page1.top_bar.ac;
    document.querySelector('#page-1 #top-bar input[name="speed"]').value = loadJson.page1.top_bar.speed;
    document.querySelector('#page-1 #top-bar input[name="spell-dc"]').value = loadJson.page1.top_bar.spell_dc;
    document.querySelector('#page-1 #top-bar input[name="insperation"]').value = loadJson.page1.top_bar.insperation;

    //Load Attributes
    document.querySelector('#page-1 #attributes input[name="str"]').value = loadJson.page1.attributes.str;
    document.querySelector('#page-1 #attributes input[name="str-mod"]').value = loadJson.page1.attributes.str_mod;
    document.querySelector('#page-1 #attributes input[name="dex"]').value = loadJson.page1.attributes.dex;
    document.querySelector('#page-1 #attributes input[name="dex-mod"]').value = loadJson.page1.attributes.dex_mod;
    document.querySelector('#page-1 #attributes input[name="con"]').value = loadJson.page1.attributes.con;
    document.querySelector('#page-1 #attributes input[name="con-mod"]').value = loadJson.page1.attributes.con_mod;
    document.querySelector('#page-1 #attributes input[name="int"]').value = loadJson.page1.attributes.int;
    document.querySelector('#page-1 #attributes input[name="int-mod"]').value = loadJson.page1.attributes.int_mod;
    document.querySelector('#page-1 #attributes input[name="wis"]').value = loadJson.page1.attributes.wis;
    document.querySelector('#page-1 #attributes input[name="wis-mod"]').value = loadJson.page1.attributes.wis_mod;
    document.querySelector('#page-1 #attributes input[name="cha"]').value = loadJson.page1.attributes.cha;
    document.querySelector('#page-1 #attributes input[name="cha-mod"]').value = loadJson.page1.attributes.cha_mod;

    //Load Skills and Saves	
    var spellAttEl = document.querySelector('#page-1 #saves-skills select[name="spell-att"]');
    if (spellAttEl) {
        spellAttEl.value = loadJson.page1.saves_skills.spell_casting || 'none';
        spellAttEl.dispatchEvent(new Event('change'));
    }

    document.querySelector('#page-1 #saves-skills #saves input[name="str-save"]').value = loadJson.page1.saves_skills.saves.str_save.val;
    document.querySelector('#page-1 #saves-skills #saves #str-save input[name="prof"]').checked = loadJson.page1.saves_skills.saves.str_save.prof;
    document.querySelector('#page-1 #saves-skills #saves input[name="dex-save"]').value = loadJson.page1.saves_skills.saves.dex_save.val;
    document.querySelector('#page-1 #saves-skills #saves #dex-save input[name="prof"]').checked = loadJson.page1.saves_skills.saves.dex_save.prof;
    document.querySelector('#page-1 #saves-skills #saves input[name="con-save"]').value = loadJson.page1.saves_skills.saves.con_save.val;
    document.querySelector('#page-1 #saves-skills #saves #con-save input[name="prof"]').checked = loadJson.page1.saves_skills.saves.con_save.prof;
    document.querySelector('#page-1 #saves-skills #saves input[name="int-save"]').value = loadJson.page1.saves_skills.saves.int_save.val;
    document.querySelector('#page-1 #saves-skills #saves #int-save input[name="prof"]').checked = loadJson.page1.saves_skills.saves.int_save.prof;
    document.querySelector('#page-1 #saves-skills #saves input[name="wis-save"]').value = loadJson.page1.saves_skills.saves.wis_save.val;
    document.querySelector('#page-1 #saves-skills #saves #wis-save input[name="prof"]').checked = loadJson.page1.saves_skills.saves.wis_save.prof;
    document.querySelector('#page-1 #saves-skills #saves input[name="cha-save"]').value = loadJson.page1.saves_skills.saves.cha_save.val;
    document.querySelector('#page-1 #saves-skills #saves #cha-save input[name="prof"]').checked = loadJson.page1.saves_skills.saves.cha_save.prof;

    document.querySelector('#page-1 #saves-skills #skills input[name="acrobatics-skill"]').value = loadJson.page1.saves_skills.skills.acrobatics.val;
    document.querySelector('#page-1 #saves-skills #skills #acrobatics-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.acrobatics.prof;
    document.querySelector('#page-1 #saves-skills #skills #acrobatics-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.acrobatics.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="animal-handling-skill"]').value = loadJson.page1.saves_skills.skills.animal_handling.val;
    document.querySelector('#page-1 #saves-skills #skills #animal-handling-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.animal_handling.prof;
    document.querySelector('#page-1 #saves-skills #skills #animal-handling-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.animal_handling.expr

    document.querySelector('#page-1 #saves-skills #skills input[name="arcana-skill"]').value = loadJson.page1.saves_skills.skills.arcana.val;
    document.querySelector('#page-1 #saves-skills #skills #arcana-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.arcana.prof;
    document.querySelector('#page-1 #saves-skills #skills #arcana-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.arcana.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="athletics-skill"]').value = loadJson.page1.saves_skills.skills.athletics.val;
    document.querySelector('#page-1 #saves-skills #skills #athletics-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.athletics.prof;
    document.querySelector('#page-1 #saves-skills #skills #athletics-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.athletics.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="deception-skill"]').value = loadJson.page1.saves_skills.skills.deception.val;
    document.querySelector('#page-1 #saves-skills #skills #deception-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.deception.prof;
    document.querySelector('#page-1 #saves-skills #skills #deception-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.deception.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="history-skill"]').value = loadJson.page1.saves_skills.skills.history.val;
    document.querySelector('#page-1 #saves-skills #skills #history-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.history.prof;
    document.querySelector('#page-1 #saves-skills #skills #history-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.history.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="insight-skill"]').value = loadJson.page1.saves_skills.skills.insight.val;
    document.querySelector('#page-1 #saves-skills #skills #insight-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.insight.prof;
    document.querySelector('#page-1 #saves-skills #skills #insight-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.insight.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="intimidation-skill"]').value = loadJson.page1.saves_skills.skills.intimidation.val;
    document.querySelector('#page-1 #saves-skills #skills #intimidation-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.intimidation.prof;
    document.querySelector('#page-1 #saves-skills #skills #intimidation-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.intimidation.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="investigation-skill"]').value = loadJson.page1.saves_skills.skills.investigation.val;
    document.querySelector('#page-1 #saves-skills #skills #investigation-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.investigation.prof;
    document.querySelector('#page-1 #saves-skills #skills #investigation-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.investigation.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="medicine-skill"]').value = loadJson.page1.saves_skills.skills.medicine.val;
    document.querySelector('#page-1 #saves-skills #skills #medicine-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.medicine.prof;
    document.querySelector('#page-1 #saves-skills #skills #medicine-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.medicine.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="nature-skill"]').value = loadJson.page1.saves_skills.skills.nature.val;
    document.querySelector('#page-1 #saves-skills #skills #nature-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.nature.prof;
    document.querySelector('#page-1 #saves-skills #skills #nature-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.nature.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="perception-skill"]').value = loadJson.page1.saves_skills.skills.perception.val;
    document.querySelector('#page-1 #saves-skills #skills #perception-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.perception.prof;
    document.querySelector('#page-1 #saves-skills #skills #perception-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.perception.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="performance-skill"]').value = loadJson.page1.saves_skills.skills.performance.val;
    document.querySelector('#page-1 #saves-skills #skills #performance-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.performance.prof;
    document.querySelector('#page-1 #saves-skills #skills #performance-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.performance.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="persuasion-skill"]').value = loadJson.page1.saves_skills.skills.persuasion.val;
    document.querySelector('#page-1 #saves-skills #skills #persuasion-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.persuasion.prof;
    document.querySelector('#page-1 #saves-skills #skills #persuasion-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.persuasion.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="religion-skill"]').value = loadJson.page1.saves_skills.skills.religion.val;
    document.querySelector('#page-1 #saves-skills #skills #religion-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.religion.prof;
    document.querySelector('#page-1 #saves-skills #skills #religion-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.religion.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="sleight-hand-skill"]').value = loadJson.page1.saves_skills.skills.sleight_hand.val;
    document.querySelector('#page-1 #saves-skills #skills #sleight-hand-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.sleight_hand.prof;
    document.querySelector('#page-1 #saves-skills #skills #sleight-hand-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.sleight_hand.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="stealth-skill"]').value = loadJson.page1.saves_skills.skills.stealth.val;
    document.querySelector('#page-1 #saves-skills #skills #stealth-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.stealth.prof;
    document.querySelector('#page-1 #saves-skills #skills #stealth-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.stealth.expr;

    document.querySelector('#page-1 #saves-skills #skills input[name="survival-skill"]').value = loadJson.page1.saves_skills.skills.survival.val;
    document.querySelector('#page-1 #saves-skills #skills #survival-skill input[name="prof"]').checked = loadJson.page1.saves_skills.skills.survival.prof;
    document.querySelector('#page-1 #saves-skills #skills #survival-skill input[name="expr"]').checked = loadJson.page1.saves_skills.skills.survival.expr;

    //Load Status
    document.querySelector('#page-1 #status #conditions textarea[name="conditions"]').value = loadJson.page1.status.conditions;
    document.querySelector('#page-1 #status #boons textarea[name="boons"]').value = loadJson.page1.status.boons;
    document.querySelector('#page-1 #status #death-saves input[name="success-1"]').checked = loadJson.page1.status.death_saves.success.one;
    document.querySelector('#page-1 #status #death-saves input[name="success-2"]').checked = loadJson.page1.status.death_saves.success.two;
    document.querySelector('#page-1 #status #death-saves input[name="success-3"]').checked = loadJson.page1.status.death_saves.success.three;
    document.querySelector('#page-1 #status #death-saves input[name="failure-1"]').checked = loadJson.page1.status.death_saves.failure.one;
    document.querySelector('#page-1 #status #death-saves input[name="failure-2"]').checked = loadJson.page1.status.death_saves.failure.two;
    document.querySelector('#page-1 #status #death-saves input[name="failure-3"]').checked = loadJson.page1.status.death_saves.failure.three;
    document.querySelector('#page-1 #status #hit-dice input[name="hit-dice"]').value = loadJson.page1.status.hit_dice.type;
    document.querySelector('#page-1 #status #hit-dice input[name="current-hd"]').value = loadJson.page1.status.hit_dice.current_hd;
    document.querySelector('#page-1 #status #hit-points input[name="temp-health"]').value = loadJson.page1.status.temp_health;
    document.querySelector('#page-1 #status #hit-points input[name="current-health"]').value = loadJson.page1.status.current_health;
    document.querySelector('#page-1 #status #hit-points input[name="max-health"]').value = loadJson.page1.status.max_health;

    //Load Proficiencies
    document.querySelector('#page-1 #proficiencies #weapons-armor textarea[name="weapons-armor"]').value = loadJson.page1.proficiencies.weapon_armor;
    document.querySelector('#page-1 #proficiencies #tools textarea[name="tools"]').value = loadJson.page1.proficiencies.tools;
    document.querySelector('#page-1 #proficiencies #languages textarea[name="languages"]').value = loadJson.page1.proficiencies.languages;

    //Load Attacks
    loadJson.page1.attacks_spells.forEach(function(value) {
        document.querySelector('#page-1 #attacks-spells #attacks tbody').insertAdjacentHTML('beforeend', `
            <tr>                    <td><input type="text" name="name" value="` + value.name + `"/></td>
                <td><input type="text" name="stat" value="` + value.stat + `"/></td>
                <td><input type="text" name="toHit" value="` + value.toHit + `"/></td>
                <td><input type="text" name="damage" value="` + value.damage + `"/></td>
                <td><input type="text" name="damage_type" value="` + value.damage_type + `"/></td>
                <td><button>X</button></td>                </tr>
            `);
    });

    //Load Feats and Traits
    document.querySelector('#page-1 #features textarea[name="features"]').value = loadJson.page1.features;

    //Load Equipment
    loadJson.page2.equipment.val.col_1.forEach(function(value, index) {
        var child = index + 2;
        document.querySelector('#page-2 #equipment .col-1 tr:nth-child(' + child + ') input[name="name"]').value = value.name;
        document.querySelector('#page-2 #equipment .col-1 tr:nth-child(' + child + ') input[name="weight"]').value = value.weight;
    });

    loadJson.page2.equipment.val.col_2.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-2 #equipment .col-2 tr:nth-child(' + child + ') input[name="name"]').value = value.name;
        document.querySelector('#page-2 #equipment .col-2 tr:nth-child(' + child + ') input[name="weight"]').value = value.weight;
    });

    document.querySelector('#page-2 #equipment tr#total input[name="total-weight"').value = loadJson.page2.equipment.total_weight;

    document.querySelector('#page-2 #currancy input[name="copper"]').value = loadJson.page2.equipment.currency.copper;
    document.querySelector('#page-2 #currancy input[name="silver"]').value = loadJson.page2.equipment.currency.silver;
    document.querySelector('#page-2 #currancy input[name="gold"]').value = loadJson.page2.equipment.currency.gold;
    document.querySelector('#page-2 #currancy input[name="electrum"]').value = loadJson.page2.equipment.currency.electrum;
    document.querySelector('#page-2 #currancy input[name="platinum"]').value = loadJson.page2.equipment.currency.platinum;
    document.querySelector('#page-2 #currancy input[name="total"]').value = loadJson.page2.equipment.currency.total;
    document.querySelector('#page-2 #currancy select[name="base"]').value = loadJson.page2.equipment.currency.base;

    document.querySelector('#page-2 #encumberance input[name="base-encumberance"]').value = loadJson.page2.equipment.encumberance.base;
    document.querySelector('#page-2 #encumberance input[name="encumbered-encumberance"]').value = loadJson.page2.equipment.encumberance.encumbered;
    document.querySelector('#page-2 #encumberance input[name="h-encumbered-encumberance"]').value = loadJson.page2.equipment.encumberance.h_encumbered;
    document.querySelector('#page-2 #encumberance input[name="push-encumberance"]').value = loadJson.page2.equipment.encumberance.push;

    //Load Mount
    document.querySelector('#page-2 #mount-pet input[name="mount-name"]').value = loadJson.page2.mount_pet.name;
    document.querySelector('#page-2 #mount-pet input[name="mount-type"]').value = loadJson.page2.mount_pet.type;
    document.querySelector('#page-2 #mount-pet input[name="mount-health"]').value = loadJson.page2.mount_pet.health;
    document.querySelector('#page-2 #mount-pet input[name="mount-ac"]').value = loadJson.page2.mount_pet.ac;
    document.querySelector('#page-2 #mount-pet input[name="mount-speed"]').value = loadJson.page2.mount_pet.speed;
    document.querySelector('#page-2 #mount-pet textarea[name="mount-notes"]').value = loadJson.page2.mount_pet.notes;

    //Load Mount 2
    document.querySelector('#page-2 #mount-pet input[name="mount-name-2"]').value = loadJson.page2.mount_pet2.name2;
    document.querySelector('#page-2 #mount-pet input[name="mount-type-2"]').value = loadJson.page2.mount_pet2.type2;
    document.querySelector('#page-2 #mount-pet input[name="mount-health-2"]').value = loadJson.page2.mount_pet2.health2;
    document.querySelector('#page-2 #mount-pet input[name="mount-ac-2"]').value = loadJson.page2.mount_pet2.ac2;
    document.querySelector('#page-2 #mount-pet input[name="mount-speed-2"]').value = loadJson.page2.mount_pet2.speed2;
    document.querySelector('#page-2 #mount-pet textarea[name="mount-notes-2"]').value = loadJson.page2.mount_pet2.notes2;

    //Load Backstory
    document.querySelector('#page-4 #backstory textarea[name="backstory"]').value = loadJson.page4.backstory;
    applyImagesFromSheet(loadJson);

    //Load allies/organizations
    document.querySelector('#page-4 #allies-organizations input[name="name"]').value = loadJson.page4.allies_organizations.name;
    document.querySelector('#page-4 #allies-organizations textarea[name="allies-organizations"]').value = loadJson.page4.allies_organizations.val;

    //Load Personality
    document.querySelector('#personality #personality-traits textarea[name="personality-traits"]').value = loadJson.page4.personality.personality_traits;
    document.querySelector('#personality #ideals textarea[name="ideals"]').value = loadJson.page4.personality.ideals;
    document.querySelector('#personality #bonds textarea[name="bonds"]').value = loadJson.page4.personality.bonds;
    document.querySelector('#personality #flaws textarea[name="flaws"]').value = loadJson.page4.personality.flaws;

    //Load Notes
    document.querySelector('#page-5 #notes-1 textarea[name="notes-1"]').value = loadJson.page5.notes_1;
    document.querySelector('#page-5 #notes-2 textarea[name="notes-2"]').value = loadJson.page5.notes_2;

    //Load Spell Info
    document.querySelector('#page-3 #spell-info input[name="class"]').value = loadJson.page3.spell_info.class;
    document.querySelector('#page-3 #spell-info input[name="att"]').value = loadJson.page3.spell_info.att;
    document.querySelector('#page-3 #spell-info input[name="dc"]').value = loadJson.page3.spell_info.dc;
    document.querySelector('#page-3 #spell-info input[name="bonus"]').value = loadJson.page3.spell_info.bonus;

    //Load Spells
    loadJson.page3.spells.cantrips.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #cantrips .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });

    document.querySelector('#page-3 #spells #level-1 input[name="total-1"]').value = loadJson.page3.spells.level_1.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-1 input[name="total-1"]'));
    loadJson.page3.spells.level_1.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-1 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-1 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-2 input[name="total-2"]').value = loadJson.page3.spells.level_2.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-2 input[name="total-2"]'));
    loadJson.page3.spells.level_2.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-2 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-2 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-3 input[name="total-3"]').value = loadJson.page3.spells.level_3.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-3 input[name="total-3"]'));
    loadJson.page3.spells.level_3.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-3 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-3 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-4 input[name="total-4"]').value = loadJson.page3.spells.level_4.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-4 input[name="total-4"]'));
    loadJson.page3.spells.level_4.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-4 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-4 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-5 input[name="total-5"]').value = loadJson.page3.spells.level_5.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-5 input[name="total-5"]'));
    loadJson.page3.spells.level_5.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-5 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-5 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-6 input[name="total-6"]').value = loadJson.page3.spells.level_6.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-6 input[name="total-6"]'));
    loadJson.page3.spells.level_6.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-6 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-6 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-7 input[name="total-7"]').value = loadJson.page3.spells.level_7.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-7 input[name="total-7"]'));
    loadJson.page3.spells.level_7.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-7 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-7 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-8 input[name="total-8"]').value = loadJson.page3.spells.level_8.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-8 input[name="total-8"]'));
    loadJson.page3.spells.level_8.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-8 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-8 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });


    document.querySelector('#page-3 #spells #level-9 input[name="total-9"]').value = loadJson.page3.spells.level_9.total;
    //In changes.js
    updateSpellSlots(document.querySelector('#page-3 #spells #level-9 input[name="total-9"]'));
    loadJson.page3.spells.level_9.spells.forEach(function(value, index) {
        var child = index + 1;
        document.querySelector('#page-3 #spells #level-9 .spells .spell:nth-child(' + child + ') input[name="preped"]').checked = value.preped;
        document.querySelector('#page-3 #spells #level-9 .spells .spell:nth-child(' + child + ') input[name="spell-name"]').value = value.spell_name;
    });



}

document.addEventListener('DOMContentLoaded', function() {
    setFormFieldsEnabled(false);

    resolveInitialSheet()
        .then(function(sheet) {
            loadJson = sheet;
            applyLoadedSheet();
            setFormFieldsEnabled(true);
        })
        .catch(function(error) {
            setFormFieldsEnabled(true);
            showSheetFeedback('Falha ao carregar ficha padrao');
            console.error(error);
        });
});
