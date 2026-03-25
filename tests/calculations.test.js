import { describe, it, expect } from 'vitest';
import { getAbilityModifier, cacluateCurrencyMod } from '../js/modules/calculations.js';

// ---------------------------------------------------------------------------
// getAbilityModifier
// ---------------------------------------------------------------------------

describe('getAbilityModifier', () => {
    it('returns -5 for score 1 (minimum)', () => {
        expect(getAbilityModifier(1)).toBe('-5');
    });

    it('returns -4 for even score 2', () => {
        expect(getAbilityModifier(2)).toBe('-4');
    });

    it('returns -4 for odd score 3', () => {
        expect(getAbilityModifier(3)).toBe('-4');
    });

    it('returns -1 for score 8', () => {
        expect(getAbilityModifier(8)).toBe('-1');
    });

    it('returns -1 for odd score 9', () => {
        expect(getAbilityModifier(9)).toBe('-1');
    });

    it('returns +0 for score 10 (average even)', () => {
        expect(getAbilityModifier(10)).toBe('+0');
    });

    it('returns +0 for odd score 11 (average odd)', () => {
        expect(getAbilityModifier(11)).toBe('+0');
    });

    it('returns +4 for score 18 (typical max for player chars)', () => {
        expect(getAbilityModifier(18)).toBe('+4');
    });

    it('returns +4 for odd score 19', () => {
        expect(getAbilityModifier(19)).toBe('+4');
    });

    it('returns +5 for score 20', () => {
        expect(getAbilityModifier(20)).toBe('+5');
    });

    it('returns +10 for score 30 (maximum in D&D 5e)', () => {
        expect(getAbilityModifier(30)).toBe('+10');
    });

    it('returns empty string for out-of-range score 0', () => {
        expect(getAbilityModifier(0)).toBe('');
    });

    it('returns empty string for out-of-range score 31', () => {
        expect(getAbilityModifier(31)).toBe('');
    });

    it('accepts a numeric string', () => {
        expect(getAbilityModifier('14')).toBe('+2');
    });
});

// ---------------------------------------------------------------------------
// cacluateCurrencyMod
// ---------------------------------------------------------------------------

describe('cacluateCurrencyMod', () => {
    // Same coin → 1:1
    it('copper to copper is 1', () => {
        expect(cacluateCurrencyMod('copper', 'c')).toBe(1);
    });

    it('silver to silver is 1', () => {
        expect(cacluateCurrencyMod('silver', 's')).toBe(1);
    });

    it('gold to gold is 1', () => {
        expect(cacluateCurrencyMod('gold', 'g')).toBe(1);
    });

    it('platinum to platinum is 1', () => {
        expect(cacluateCurrencyMod('platinum', 'p')).toBe(1);
    });

    // Canonical D&D conversions
    it('gold to copper is 100', () => {
        expect(cacluateCurrencyMod('gold', 'c')).toBe(100);
    });

    it('gold to silver is 10', () => {
        expect(cacluateCurrencyMod('gold', 's')).toBe(10);
    });

    it('platinum to gold is 10', () => {
        expect(cacluateCurrencyMod('platinum', 'g')).toBe(10);
    });

    it('silver to copper is 10', () => {
        expect(cacluateCurrencyMod('silver', 'c')).toBe(10);
    });

    it('copper to gold is 1/100', () => {
        expect(cacluateCurrencyMod('copper', 'g')).toBeCloseTo(0.01);
    });

    it('electrum to gold is 0.5', () => {
        expect(cacluateCurrencyMod('electrum', 'g')).toBe(0.5);
    });

    // Edge cases
    it('returns 0 for unknown coin type', () => {
        expect(cacluateCurrencyMod('diamond', 'g')).toBe(0);
    });

    it('returns 0 for unknown base currency', () => {
        expect(cacluateCurrencyMod('gold', 'x')).toBe(0);
    });
});
