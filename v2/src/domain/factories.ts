/**
 * Factory functions for creating new domain objects with sensible defaults.
 *
 * createEmptyCharacter() is the single source of truth for a new blank char.
 * Used by manual creation ("Create from scratch") and as the base for AI-assisted
 * creation (mergeAIResponseIntoCharacter applies the AI output on top).
 */

import type { Character, AbilityKey, SavingThrowState, SkillState } from './character'
import {
  abilityModifier,
  proficiencyBonus,
  skillBonus,
  savingThrowBonus,
  passivePerception,
} from './calculations'
import { getHitDie } from './classes'

const DEFAULT_CLASS_NAME = 'Nova classe'

// Canonical skill list — mirrors adapter.ts SKILL_ABILITY_MAP order
const CANONICAL_SKILLS: { key: string; name: string; ability: AbilityKey }[] = [
  { key: 'acrobatics',      name: 'Acrobatics',      ability: 'dex' },
  { key: 'animal_handling', name: 'Animal Handling',  ability: 'wis' },
  { key: 'arcana',          name: 'Arcana',           ability: 'int' },
  { key: 'athletics',       name: 'Athletics',        ability: 'str' },
  { key: 'deception',       name: 'Deception',        ability: 'cha' },
  { key: 'history',         name: 'History',          ability: 'int' },
  { key: 'insight',         name: 'Insight',          ability: 'wis' },
  { key: 'intimidation',    name: 'Intimidation',     ability: 'cha' },
  { key: 'investigation',   name: 'Investigation',    ability: 'int' },
  { key: 'medicine',        name: 'Medicine',         ability: 'wis' },
  { key: 'nature',          name: 'Nature',           ability: 'int' },
  { key: 'perception',      name: 'Perception',       ability: 'wis' },
  { key: 'performance',     name: 'Performance',      ability: 'cha' },
  { key: 'persuasion',      name: 'Persuasion',       ability: 'cha' },
  { key: 'religion',        name: 'Religion',         ability: 'int' },
  { key: 'sleight_of_hand', name: 'Sleight of Hand',  ability: 'dex' },
  { key: 'stealth',         name: 'Stealth',          ability: 'dex' },
  { key: 'survival',        name: 'Survival',         ability: 'wis' },
]

/**
 * Creates a blank character with sensible D&D 5e defaults.
 * All abilities set to 10, single class "Nova classe" at level 1.
 * Used by both "Create from scratch" and as the base for AI-generated chars.
 */
export function createEmptyCharacter(name = ''): Character {
  const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  const profBonus = proficiencyBonus(1)

  const savingThrows: SavingThrowState[] = (
    ['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]
  ).map(ability => ({
    ability,
    proficient: false,
    bonus: savingThrowBonus(abilities[ability], false, profBonus),
  }))

  const skills: SkillState[] = CANONICAL_SKILLS.map(({ name: skillName, ability }) => ({
    name: skillName,
    ability,
    proficient: false,
    expertise: false,
    bonus: skillBonus(abilities[ability], false, false, profBonus),
  }))

  const hitDie = getHitDie(DEFAULT_CLASS_NAME)

  return {
    id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,

    race: '',
    background: '',
    alignment: 'True Neutral',
    classes: [{ name: DEFAULT_CLASS_NAME, level: 1, hitDie }],
    experience: 0,

    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',

    abilities,
    proficiencyBonus: profBonus,

    hp: { current: 10, max: 10, temp: 0 },
    hitDice: [{ className: DEFAULT_CLASS_NAME, current: 1, max: 1, dieSize: hitDie }],
    deathSaves: { successes: 0, failures: 0 },

    ac: 10,
    initiative: abilityModifier(abilities.dex),
    speed: 30,
    passivePerception: passivePerception(abilities.wis, false, false, profBonus),
    spellSaveDC: 0,
    inspiration: false,

    savingThrows,
    skills,

    proficiencies: { weapons: [], armor: [], tools: [], other: [] },
    languages: [],

    attacks: [],

    spells: [],
    spellSlots: {
      '1': { current: 0, max: 0 },
      '2': { current: 0, max: 0 },
      '3': { current: 0, max: 0 },
      '4': { current: 0, max: 0 },
      '5': { current: 0, max: 0 },
      '6': { current: 0, max: 0 },
      '7': { current: 0, max: 0 },
      '8': { current: 0, max: 0 },
      '9': { current: 0, max: 0 },
    },
    spellcastingAbility: '',
    spellcastingClass: '',

    inventory: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },

    features: [],
    backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },

    notes1: '',
    notes2: '',
    mountPet: '',
    mountPet2: '',
    alliesOrganizations: '',

    images: {},

    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/** Exported for testing and for AI merge to re-use the canonical skill list. */
export { CANONICAL_SKILLS }
