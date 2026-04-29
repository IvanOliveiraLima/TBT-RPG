/**
 * Pure D&D 5e calculation functions.
 *
 * No DOM access, no IndexedDB, no side effects.
 * Ported and extended from v1 js/modules/calculations.js.
 */

/**
 * Returns the D&D 5e ability modifier for a raw ability score.
 * Formula: floor((score - 10) / 2)
 * Range: score 1 → -5, score 10/11 → 0, score 30 → +10
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Returns the proficiency bonus for a given total character level.
 * Levels 1–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, 17–20: +6
 */
export function proficiencyBonus(totalLevel: number): number {
  if (totalLevel <= 0) return 2
  return Math.floor((totalLevel - 1) / 4) + 2
}

/**
 * Returns the total bonus for a saving throw.
 * @param abilityScore Raw ability score (e.g. 14)
 * @param proficient Whether proficient in this saving throw
 * @param profBonus Proficiency bonus
 * @param miscBonus Any additional flat modifier (default 0)
 */
export function savingThrowBonus(
  abilityScore: number,
  proficient: boolean,
  profBonus: number,
  miscBonus = 0,
): number {
  return abilityModifier(abilityScore) + (proficient ? profBonus : 0) + miscBonus
}

/**
 * Returns the total bonus for a skill check, accounting for expertise.
 * @param abilityScore Raw ability score
 * @param proficient Proficiency in this skill
 * @param expertise Expertise (doubles proficiency bonus)
 * @param profBonus Proficiency bonus
 */
export function skillBonus(
  abilityScore: number,
  proficient: boolean,
  expertise: boolean,
  profBonus: number,
): number {
  const base = abilityModifier(abilityScore)
  if (expertise) return base + profBonus * 2
  if (proficient) return base + profBonus
  return base
}

/**
 * Returns passive perception score.
 * Formula: 10 + perception skill bonus
 */
export function passivePerception(
  wisScore: number,
  perceptionProficient: boolean,
  expertise: boolean,
  profBonus: number,
): number {
  return 10 + skillBonus(wisScore, perceptionProficient, expertise, profBonus)
}

/**
 * Returns spell save DC.
 * Formula: 8 + proficiency bonus + spellcasting ability modifier
 */
export function spellSaveDC(abilityScore: number, profBonus: number): number {
  return 8 + profBonus + abilityModifier(abilityScore)
}

/**
 * Returns spell attack bonus.
 * Formula: proficiency bonus + spellcasting ability modifier
 */
export function spellAttackBonus(abilityScore: number, profBonus: number): number {
  return profBonus + abilityModifier(abilityScore)
}

/**
 * Returns initiative bonus.
 * Formula: DEX modifier + any misc bonus
 */
export function initiativeBonus(dexScore: number, miscBonus = 0): number {
  return abilityModifier(dexScore) + miscBonus
}

/**
 * Returns the expected maximum HP from a single class.
 * - First class, first level: uses max hit die + CON mod
 * - Subsequent levels: uses average (floor(die/2) + 1) + CON mod per level
 *
 * @param classLevel Number of levels in this class
 * @param hitDie Die size (6, 8, 10, or 12)
 * @param conModifier Constitution modifier
 * @param isFirstClass Whether this is the primary class (gets max HP at level 1)
 */
export function maxHpForClass(
  classLevel: number,
  hitDie: number,
  conModifier: number,
  isFirstClass: boolean,
): number {
  if (classLevel <= 0) return 0
  const firstLevelHp = isFirstClass ? hitDie + conModifier : 0
  const subsequentLevels = classLevel - (isFirstClass ? 1 : 0)
  const subsequentHp = subsequentLevels * (Math.floor(hitDie / 2) + 1 + conModifier)
  return firstLevelHp + subsequentHp
}

/**
 * Formats a signed integer for display: +0, +3, -1, etc.
 */
export function formatSigned(n: number): string {
  if (n === 0) return '+0'
  return n > 0 ? `+${n}` : `${n}`
}

/**
 * Converts an amount of one D&D currency denomination into another.
 * Returns the conversion rate (multiply source amount by this to get base units).
 *
 * Ported from v1 js/modules/calculations.js (cacluateCurrencyMod — typo preserved in v1).
 *
 * @param coin Source currency ('copper' | 'silver' | 'gold' | 'electrum' | 'platinum')
 * @param base Target denomination ('c' | 's' | 'g' | 'e' | 'p')
 */
export function currencyConversionRate(
  coin: 'copper' | 'silver' | 'gold' | 'electrum' | 'platinum',
  base: 'c' | 's' | 'g' | 'e' | 'p',
): number {
  const rates: Record<string, Record<string, number>> = {
    copper:   { c: 1,    s: 1/10,  g: 1/100, e: 1/50,  p: 1/1000 },
    silver:   { c: 10,   s: 1,     g: 1/10,  e: 1/5,   p: 1/100  },
    gold:     { c: 100,  s: 10,    g: 1,     e: 2,     p: 1/10   },
    electrum: { c: 50,   s: 5,     g: 1/2,   e: 1,     p: 1/20   },
    platinum: { c: 1000, s: 100,   g: 10,    e: 20,    p: 1      },
  }
  return rates[coin]?.[base] ?? 0
}
