import { describe, it, expect } from 'vitest';
import {
    isObject,
    hasKeys,
    parseLegacyClassLevel,
    sanitizeClassEntry,
    calculateTotalClassLevel,
    getExportFilenameFromSheet,
    BACKGROUND_FIXED_SKILLS_MAP,
    BACKGROUND_FLEXIBLE_SET,
    SKILL_NAME_TO_KEY,
} from '../js/modules/utils.js';

// ---------------------------------------------------------------------------
// isObject
// ---------------------------------------------------------------------------

describe('isObject', () => {
    it('returns true for a plain object', () => {
        expect(isObject({ a: 1 })).toBe(true);
    });

    it('returns false for null', () => {
        expect(isObject(null)).toBeFalsy();
    });

    it('returns false for an array', () => {
        expect(isObject([1, 2, 3])).toBe(false);
    });

    it('returns false for a string', () => {
        expect(isObject('hello')).toBeFalsy();
    });

    it('returns false for a number', () => {
        expect(isObject(42)).toBeFalsy();
    });

    it('returns false for undefined', () => {
        expect(isObject(undefined)).toBeFalsy();
    });
});

// ---------------------------------------------------------------------------
// hasKeys
// ---------------------------------------------------------------------------

describe('hasKeys', () => {
    it('returns true when all required keys are present', () => {
        expect(hasKeys({ a: 1, b: 2 }, ['a', 'b'])).toBe(true);
    });

    it('returns true for empty keys array', () => {
        expect(hasKeys({ a: 1 }, [])).toBe(true);
    });

    it('returns false when a key is missing', () => {
        expect(hasKeys({ a: 1 }, ['a', 'b'])).toBe(false);
    });

    it('returns false when source is not an object', () => {
        expect(hasKeys(null, ['a'])).toBe(false);
    });

    it('returns false when source is an array', () => {
        expect(hasKeys(['a', 'b'], ['0'])).toBe(false);
    });

    it('accepts keys with value undefined', () => {
        expect(hasKeys({ a: undefined }, ['a'])).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// parseLegacyClassLevel
// ---------------------------------------------------------------------------

describe('parseLegacyClassLevel', () => {
    it('returns empty strings for an empty value', () => {
        expect(parseLegacyClassLevel('')).toEqual({ charClass: '', level: '' });
    });

    it('returns empty strings for null/undefined', () => {
        expect(parseLegacyClassLevel(null)).toEqual({ charClass: '', level: '' });
        expect(parseLegacyClassLevel(undefined)).toEqual({ charClass: '', level: '' });
    });

    it('parses comma-separated format "Fighter, 5"', () => {
        expect(parseLegacyClassLevel('Fighter, 5')).toEqual({ charClass: 'Fighter', level: '5' });
    });

    it('parses comma format without space "Rogue,3"', () => {
        expect(parseLegacyClassLevel('Rogue,3')).toEqual({ charClass: 'Rogue', level: '3' });
    });

    it('parses trailing-number format "Wizard 10"', () => {
        expect(parseLegacyClassLevel('Wizard 10')).toEqual({ charClass: 'Wizard', level: '10' });
    });

    it('parses multi-word class with trailing number "Eldritch Knight 7"', () => {
        expect(parseLegacyClassLevel('Eldritch Knight 7')).toEqual({ charClass: 'Eldritch Knight', level: '7' });
    });

    it('returns only charClass when no level found', () => {
        expect(parseLegacyClassLevel('Barbarian')).toEqual({ charClass: 'Barbarian', level: '' });
    });
});

// ---------------------------------------------------------------------------
// sanitizeClassEntry
// ---------------------------------------------------------------------------

describe('sanitizeClassEntry', () => {
    it('returns empty strings for non-object input', () => {
        expect(sanitizeClassEntry(null)).toEqual({ name: '', level: '' });
        expect(sanitizeClassEntry('string')).toEqual({ name: '', level: '' });
    });

    it('reads name and level from modern entry', () => {
        expect(sanitizeClassEntry({ name: 'Paladin', level: '4' })).toEqual({ name: 'Paladin', level: '4' });
    });

    it('falls back to char_class for legacy entries', () => {
        expect(sanitizeClassEntry({ char_class: 'Druid', level: '6' })).toEqual({ name: 'Druid', level: '6' });
    });

    it('treats a numeric-only name as a level', () => {
        expect(sanitizeClassEntry({ name: '8' })).toEqual({ name: '', level: '8' });
    });

    it('trims whitespace from name and level', () => {
        expect(sanitizeClassEntry({ name: ' Monk ', level: ' 3 ' })).toEqual({ name: 'Monk', level: '3' });
    });
});

// ---------------------------------------------------------------------------
// calculateTotalClassLevel
// ---------------------------------------------------------------------------

describe('calculateTotalClassLevel', () => {
    it('returns 0 for an empty array', () => {
        expect(calculateTotalClassLevel([])).toBe(0);
    });

    it('sums levels for a single class', () => {
        expect(calculateTotalClassLevel([{ level: '5' }])).toBe(5);
    });

    it('sums levels for multiple classes (multiclass)', () => {
        expect(calculateTotalClassLevel([{ level: '5' }, { level: '3' }, { level: '2' }])).toBe(10);
    });

    it('ignores entries with non-numeric levels', () => {
        expect(calculateTotalClassLevel([{ level: 'abc' }, { level: '4' }])).toBe(4);
    });

    it('ignores entries with empty level', () => {
        expect(calculateTotalClassLevel([{ level: '' }, { level: '2' }])).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// getExportFilenameFromSheet
// ---------------------------------------------------------------------------

describe('getExportFilenameFromSheet', () => {
    it('returns savedSheet.json for null input', () => {
        expect(getExportFilenameFromSheet(null)).toBe('savedSheet.json');
    });

    it('returns savedSheet.json when char_name is absent', () => {
        expect(getExportFilenameFromSheet({})).toBe('savedSheet.json');
    });

    it('returns savedSheet.json when char_name is empty', () => {
        const sheet = { page1: { basic_info: { char_name: '' } } };
        expect(getExportFilenameFromSheet(sheet)).toBe('savedSheet.json');
    });

    it('returns char_name + .json for a normal name', () => {
        const sheet = { page1: { basic_info: { char_name: 'Aragorn' } } };
        expect(getExportFilenameFromSheet(sheet)).toBe('Aragorn.json');
    });

    it('replaces forbidden filesystem characters with dashes', () => {
        const sheet = { page1: { basic_info: { char_name: 'Ar/a:gorn' } } };
        expect(getExportFilenameFromSheet(sheet)).toBe('Ar-a-gorn.json');
    });

    it('collapses multiple spaces into one', () => {
        const sheet = { page1: { basic_info: { char_name: 'Thorin  Oakenshield' } } };
        expect(getExportFilenameFromSheet(sheet)).toBe('Thorin Oakenshield.json');
    });
});

// ---------------------------------------------------------------------------
// BACKGROUND_FIXED_SKILLS_MAP
// ---------------------------------------------------------------------------

describe('BACKGROUND_FIXED_SKILLS_MAP', () => {
    it('is a non-empty object', () => {
        expect(isObject(BACKGROUND_FIXED_SKILLS_MAP)).toBe(true);
        expect(Object.keys(BACKGROUND_FIXED_SKILLS_MAP).length).toBeGreaterThan(0);
    });

    it('each entry has exactly 2 skills', () => {
        for (const skills of Object.values(BACKGROUND_FIXED_SKILLS_MAP)) {
            expect(skills).toHaveLength(2);
        }
    });

    it('Acolyte maps to Insight and Religion', () => {
        expect(BACKGROUND_FIXED_SKILLS_MAP['Acolyte (Background)']).toEqual(['Insight', 'Religion']);
    });

    it('Criminal maps to Deception and Stealth', () => {
        expect(BACKGROUND_FIXED_SKILLS_MAP['Criminal']).toEqual(['Deception', 'Stealth']);
    });
});

// ---------------------------------------------------------------------------
// BACKGROUND_FLEXIBLE_SET
// ---------------------------------------------------------------------------

describe('BACKGROUND_FLEXIBLE_SET', () => {
    it('is a non-empty object', () => {
        expect(isObject(BACKGROUND_FLEXIBLE_SET)).toBe(true);
    });

    it('Faction Agent is in the flexible set', () => {
        expect(BACKGROUND_FLEXIBLE_SET['Faction Agent']).toBe(true);
    });

    it('Haunted One is in the flexible set', () => {
        expect(BACKGROUND_FLEXIBLE_SET['Haunted One']).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// SKILL_NAME_TO_KEY
// ---------------------------------------------------------------------------

describe('SKILL_NAME_TO_KEY', () => {
    it('has entries for all 18 D&D 5e skills', () => {
        expect(Object.keys(SKILL_NAME_TO_KEY)).toHaveLength(18);
    });

    it('Acrobatics maps to acrobatics', () => {
        expect(SKILL_NAME_TO_KEY['Acrobatics']).toBe('acrobatics');
    });

    it('Animal Handling maps to animal-handling', () => {
        expect(SKILL_NAME_TO_KEY['Animal Handling']).toBe('animal-handling');
    });

    it('Sleight of Hand maps to sleight-hand', () => {
        expect(SKILL_NAME_TO_KEY['Sleight of Hand']).toBe('sleight-hand');
    });
});
