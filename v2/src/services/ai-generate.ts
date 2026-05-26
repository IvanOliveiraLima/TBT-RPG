/**
 * AI character generation service.
 *
 * Thin wrapper around the Cloudflare Worker endpoint. Handles timeouts,
 * HTTP error codes, and maps them to structured AIGenerationError codes
 * for the modal to display translated messages.
 *
 * mergeAIResponseIntoCharacter() applies the worker's response onto a blank
 * character produced by createEmptyCharacter(). Fields not present in the AI
 * response are left as the factory default.
 */

import type { Character, AbilityKey } from '@/domain/character'
import { createEmptyCharacter, CANONICAL_SKILLS } from '@/domain/factories'
import {
  abilityModifier,
  proficiencyBonus,
  skillBonus,
  savingThrowBonus,
  passivePerception,
} from '@/domain/calculations'
import { getHitDie } from '@/domain/classes'

const WORKER_URL = 'https://dnd-ai-worker.ivanoliveira-estudos.workers.dev'
const TIMEOUT_MS = 45_000

// ── Error type ───────────────────────────────────────────────────────────────

export class AIGenerationError extends Error {
  readonly code: string
  constructor(code: string) {
    super(`AI generation error: ${code}`)
    this.name = 'AIGenerationError'
    this.code = code
  }
}

export function parseErrorCode(err: unknown): string {
  if (err instanceof AIGenerationError) return err.code
  return 'unknown'
}

// ── Worker response shape ─────────────────────────────────────────────────────

/** Shape returned by the Cloudflare Worker (numbers stored as strings). */
interface WorkerCharacter {
  char_name?:        string
  race?:             string
  background?:       string
  alignment?:        string
  classes?:          Array<{ name: string; level: string | number }>
  str?: string; dex?: string; con?: string
  int?: string; wis?: string; cha?: string
  max_health?:       string | number
  speed?:            string | number
  proficiencies?: {
    weapon_armor?: string
    tools?:        string
    languages?:    string
  }
  skills?: Partial<Record<string, boolean>>
  features?:          string
  personality_traits?: string
  ideals?:            string
  bonds?:             string
  flaws?:             string
  backstory?:         string
}

// ── Service ───────────────────────────────────────────────────────────────────

export interface AIGenerationRequest {
  description: string
  lang: 'pt' | 'en'
}

/**
 * Calls the Cloudflare Worker and returns the raw WorkerCharacter.
 * Throws AIGenerationError with a structured code on any failure.
 */
export async function generateCharacterWithAI(req: AIGenerationRequest): Promise<WorkerCharacter> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: req.description, lang: req.lang }),
      signal: controller.signal,
    })

    if (response.status === 429) throw new AIGenerationError('rate_limit')
    if (response.status === 400) throw new AIGenerationError('invalid_request')
    if (!response.ok)            throw new AIGenerationError('server_error')

    const data = await response.json() as { character?: WorkerCharacter; error?: string }

    if (!data.character || typeof data.character !== 'object') {
      throw new AIGenerationError('invalid_response')
    }

    return data.character
  } catch (err) {
    if (err instanceof AIGenerationError) throw err
    if ((err as { name?: string }).name === 'AbortError') throw new AIGenerationError('timeout')
    throw new AIGenerationError('network_error')
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── Merge ─────────────────────────────────────────────────────────────────────

/**
 * The worker uses 'sleight_hand' while the domain uses 'sleight_of_hand'.
 * This map normalises worker keys to domain keys before skill lookup.
 */
const WORKER_SKILL_KEY_MAP: Record<string, string> = {
  sleight_hand: 'sleight_of_hand',
}

function normaliseSkillKey(key: string): string {
  return WORKER_SKILL_KEY_MAP[key] ?? key
}

/**
 * Merges an AI WorkerCharacter response onto a blank character.
 * Fields absent from the AI response are left at factory defaults.
 * Does NOT auto-derive HP, spell slots, or other computed values —
 * the user completes those manually in the sheet.
 */
export function mergeAIResponseIntoCharacter(ai: WorkerCharacter): Character {
  const base = createEmptyCharacter(ai.char_name ?? '')

  // Identity
  if (ai.race)       base.race       = ai.race
  if (ai.background) base.background = ai.background
  if (ai.alignment)  base.alignment  = ai.alignment

  // Class + hit dice — worker returns single class in array with string level
  const firstClass = ai.classes?.[0]
  if (firstClass?.name) {
    const className = firstClass.name
    const level     = Math.max(1, parseInt(String(firstClass.level), 10) || 1)
    const hitDie    = getHitDie(className)

    base.classes  = [{ name: className, level, hitDie }]
    base.hitDice  = [{ className, current: level, max: level, dieSize: hitDie }]

    const profBonus = proficiencyBonus(level)
    base.proficiencyBonus = profBonus
  }

  // Abilities — worker stores all 6 as strings
  const mergedAbilities = { ...base.abilities }
  const rawAbilityEntries: [AbilityKey, string | undefined][] = [
    ['str', ai.str], ['dex', ai.dex], ['con', ai.con],
    ['int', ai.int], ['wis', ai.wis], ['cha', ai.cha],
  ]
  for (const [key, val] of rawAbilityEntries) {
    const n = parseInt(String(val ?? ''), 10)
    if (!isNaN(n) && n > 0) mergedAbilities[key] = n
  }
  base.abilities = mergedAbilities

  // Re-derive stats that depend on abilities
  const profBonus = base.proficiencyBonus
  base.initiative       = abilityModifier(mergedAbilities.dex)
  base.passivePerception = passivePerception(mergedAbilities.wis, false, false, profBonus)
  base.ac               = 10 + abilityModifier(mergedAbilities.dex)

  // Re-derive saving throws
  base.savingThrows = base.savingThrows.map(st => ({
    ...st,
    bonus: savingThrowBonus(mergedAbilities[st.ability], st.proficient, profBonus),
  }))

  // Speed
  if (ai.speed !== undefined) {
    const n = parseInt(String(ai.speed), 10)
    if (!isNaN(n) && n > 0) base.speed = n
  }

  // HP max (worker returns max_health at level 1)
  if (ai.max_health !== undefined) {
    const n = parseInt(String(ai.max_health), 10)
    if (!isNaN(n) && n > 0) base.hp = { current: n, max: n, temp: 0 }
  }

  // Skills — worker returns { acrobatics: boolean, sleight_hand: boolean, ... }
  if (ai.skills && typeof ai.skills === 'object') {
    const workerSkills = ai.skills
    base.skills = base.skills.map(skillState => {
      const canonicalKey = CANONICAL_SKILLS.find(s => s.name === skillState.name)?.key
      if (!canonicalKey) return skillState

      // Try both the canonical key and any worker alias
      const workerKey = Object.keys(WORKER_SKILL_KEY_MAP).find(
        wk => normaliseSkillKey(wk) === canonicalKey
      ) ?? canonicalKey

      const proficient = workerSkills[workerKey] === true ||
                         workerSkills[canonicalKey] === true

      return {
        ...skillState,
        proficient,
        bonus: skillBonus(mergedAbilities[skillState.ability], proficient, false, profBonus),
      }
    })
  }

  // Proficiencies — worker stores them as comma-separated strings
  if (ai.proficiencies) {
    const splitList = (s: string | undefined) =>
      s ? s.split(',').map(x => x.trim()).filter(Boolean) : []
    const weaponArmor = splitList(ai.proficiencies.weapon_armor)
    base.proficiencies = {
      weapons: weaponArmor,
      armor:   [],
      tools:   splitList(ai.proficiencies.tools),
      other:   [],
    }
    base.languages = splitList(ai.proficiencies.languages)
  }

  // Features — worker returns a single freetext string; convert to one Feature entry
  if (ai.features?.trim()) {
    base.features = [{
      id:          crypto.randomUUID(),
      name:        'Features',
      description: ai.features.trim(),
      type:        'passive' as const,
    }]
  }

  // Lore
  if (ai.backstory)          base.backstory                  = ai.backstory
  if (ai.personality_traits) base.personality.traits         = ai.personality_traits
  if (ai.ideals)             base.personality.ideals         = ai.ideals
  if (ai.bonds)              base.personality.bonds          = ai.bonds
  if (ai.flaws)              base.personality.flaws          = ai.flaws

  base.updatedAt = Date.now()
  return base
}
