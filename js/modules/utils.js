// Pure utility functions — no DOM access, no localStorage, no side effects.

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

export function hasKeys(source, keys) {
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

// ---------------------------------------------------------------------------
// Class / level helpers
// ---------------------------------------------------------------------------

export function parseLegacyClassLevel(value) {
    var rawValue = String(value || '').trim();
    var parsed = { charClass: '', level: '' };

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

export function sanitizeClassEntry(entry) {
    var safeEntry = isObject(entry) ? entry : {};
    var className = String(safeEntry.name || safeEntry.char_class || '').trim();
    var classLevel = String(safeEntry.level || '').trim();

    if (/^\d+$/.test(className) && !classLevel) {
        classLevel = className;
        className = '';
    }

    return { name: className, level: classLevel };
}

export function calculateTotalClassLevel(classes) {
    var total = 0;
    for (var i = 0; i < classes.length; i++) {
        var level = String(classes[i].level || '').trim();
        if (/^\d+$/.test(level)) {
            total += parseInt(level, 10);
        }
    }
    return total;
}

// ---------------------------------------------------------------------------
// Export filename helper
// ---------------------------------------------------------------------------

export function getExportFilenameFromSheet(sheet) {
    var rawName = '';
    if (sheet && sheet.page1 && sheet.page1.basic_info && typeof sheet.page1.basic_info.char_name === 'string') {
        rawName = sheet.page1.basic_info.char_name;
    }
    var sanitizedName = rawName
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[/\\:*?"<>|]/g, '-')
        .trim();

    return sanitizedName ? sanitizedName + '.json' : 'savedSheet.json';
}

// ---------------------------------------------------------------------------
// Background skill data
// ---------------------------------------------------------------------------

export var BACKGROUND_FIXED_SKILLS_MAP = {
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

export var BACKGROUND_FLEXIBLE_SET = {
    "Cloistered Scholar": true,
    "Faction Agent": true,
    "Haunted One": true,
    "Inheritor": true,
    "Investigator": true,
    "Knight of the Order": true,
    "Urban Bounty Hunter": true
};

export var SKILL_NAME_TO_KEY = {
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
