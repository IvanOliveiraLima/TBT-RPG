#!/usr/bin/env node
/**
 * Translates SRD spell text fields to PT-BR using Cloudflare Workers AI.
 *
 * Reads src/data/srd-spells.json, adds `pt` to each spell that lacks it,
 * and writes the file back. Resumable: spells that already have `pt` are skipped.
 *
 * Requirements (env vars):
 *   CF_ACCOUNT_ID  — Cloudflare account ID
 *   CF_API_TOKEN   — Cloudflare API token with Workers AI write permission
 *
 * Usage:
 *   CF_ACCOUNT_ID=xxx CF_API_TOKEN=yyy node scripts/translate-spells.mjs
 *
 * Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast
 *   Validated: non-reasoning, returns choices[0].message.content as string.
 *   If this family is deprecated (AiError 5028), replace MODEL below with
 *   another non-reasoning instruct model and validate in the AI Playground first.
 *
 * Data credit: Open5e (CC-BY-4.0 / OGL). Translations are derivative works
 * under the same license.
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const JSON_PATH = join(__dirname, '../src/data/srd-spells.json')

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const THROTTLE_MS = 600   // ms between API calls
const MAX_RETRIES = 3
const SAVE_EVERY = 10     // save JSON every N successful translations

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error(
    'Error: CF_ACCOUNT_ID and CF_API_TOKEN environment variables are required.\n' +
    'Usage: CF_ACCOUNT_ID=xxx CF_API_TOKEN=yyy node scripts/translate-spells.mjs',
  )
  process.exit(1)
}

const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${MODEL}`

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional translator for tabletop RPG content.
Translate D&D 5e spell text from English to Brazilian Portuguese following the PHB-PT (Manual do Jogador em Português).

Glossary — use these exact terms:
saving throw → salvaguarda | spell slot → espaço de magia | cantrip → truque
hit points → pontos de vida | hit point → ponto de vida | attack roll → jogada de ataque
DC → CD | bonus action → ação bônus | reaction → reação | action → ação
round → rodada | turn → turno | creature → criatura | target → alvo
advantage → vantagem | disadvantage → desvantagem
Constitution → Constituição | Strength → Força | Dexterity → Destreza
Intelligence → Inteligência | Wisdom → Sabedoria | Charisma → Carisma
fire damage → dano de fogo | cold damage → dano de frio | lightning damage → dano de relâmpago
thunder damage → dano de trovão | acid damage → dano de ácido | poison damage → dano de veneno
necrotic damage → dano necrótico | radiant damage → dano radiante | psychic damage → dano psíquico
force damage → dano de força | bludgeoning → concussão | piercing → perfuração | slashing → cortante
unconscious → inconsciente | incapacitated → incapacitado | restrained → contido
paralyzed → paralisado | poisoned → envenenado | blinded → cego | deafened → surdo
frightened → amedrontado | charmed → enfeitiçado | prone → caído
stunned → atordoado | petrified → petrificado | exhaustion → exaustão
spell attack → ataque de magia | spellcasting ability → habilidade de conjuração
proficiency bonus → bônus de proficiência | ability check → teste de habilidade
healing → cura | heal → curar | damage → dano

Rules:
- PRESERVE dice notation exactly (8d6, 1d8+5, 2d10, etc.)
- PRESERVE numbers exactly
- PRESERVE proper creature names when no established PT equivalent exists
- Translate spell names referenced in descriptions to well-known PT equivalents when they exist
  (Fireball → Bola de Fogo, Bless → Abençoar, etc.)
- Translate the spell's own name to its established PHB-PT equivalent; if none exists, translate naturally
- DO NOT add commentary, footnotes, or explanation
- Respond ONLY with a valid JSON object with exactly these keys:
  name, castingTime, range, duration, components, material, description, higherLevel`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  const start = Date.now()
  while (Date.now() - start < ms) { /* busy wait — keeps this script fully synchronous */ }
}

/**
 * Extracts the text response from a Cloudflare Workers AI result.
 * Llama 3.3 70B Fast returns choices[0].message.content (string) and
 * result.response (pre-parsed object). We prefer the string choices path.
 */
function pickText(result) {
  const choice = result?.choices?.[0]?.message?.content
  if (typeof choice === 'string' && choice.trim()) return choice
  const r = result?.response
  if (typeof r === 'string' && r.trim()) return r
  return null
}

/**
 * Removes markdown code fences and extracts the first valid JSON object.
 */
function extractJson(raw) {
  if (!raw) return null
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* fall through */ }
    }
    return null
  }
}

const REQUIRED_KEYS = ['name', 'castingTime', 'range', 'duration', 'components', 'material', 'description', 'higherLevel']

function validatePt(pt) {
  if (!pt || typeof pt !== 'object') return false
  for (const k of REQUIRED_KEYS) {
    if (typeof pt[k] !== 'string') return false
  }
  // name and description must be non-empty
  return Boolean(pt.name.trim() && pt.description.trim())
}

function buildUserMessage(spell) {
  return (
    'Translate this D&D 5e spell to Brazilian Portuguese.\n' +
    'Return ONLY a JSON object with these exact keys: ' +
    'name, castingTime, range, duration, components, material, description, higherLevel\n\n' +
    JSON.stringify({
      name: spell.name,
      castingTime: spell.castingTime,
      range: spell.range,
      duration: spell.duration,
      components: spell.components,
      material: spell.material,
      description: spell.description,
      higherLevel: spell.higherLevel,
    }, null, 2)
  )
}

// ─── API call ─────────────────────────────────────────────────────────────────

function callApi(spell) {
  const body = JSON.stringify({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(spell) },
    ],
  })

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = execSync(
        `curl -sf --max-time 90 -X POST ` +
        `-H ${JSON.stringify(`Authorization: Bearer ${CF_API_TOKEN}`)} ` +
        `-H "Content-Type: application/json" ` +
        `--data-binary @- ` +
        `${JSON.stringify(ENDPOINT)}`,
        { input: body, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      )

      const envelope = JSON.parse(raw)

      if (!envelope.success) {
        const msg = envelope.errors?.[0]?.message ?? JSON.stringify(envelope.errors)
        throw new Error(`API error: ${msg}`)
      }

      const text = pickText(envelope.result)
      if (!text) {
        const keys = Object.keys(envelope.result ?? {}).join(', ')
        console.warn(`    [warn] unexpected result shape — keys: ${keys}`)
        throw new Error('Could not extract text from response')
      }

      const pt = extractJson(text)
      if (!validatePt(pt)) {
        const preview = text.slice(0, 200).replace(/\n/g, ' ')
        console.warn(`    [warn] invalid PT JSON — preview: ${preview}`)
        throw new Error('Invalid or incomplete PT JSON')
      }

      // Return only the 8 expected keys (drop any extras the model added)
      return {
        name: pt.name,
        castingTime: pt.castingTime,
        range: pt.range,
        duration: pt.duration,
        components: pt.components,
        material: pt.material,
        description: pt.description,
        higherLevel: pt.higherLevel,
      }
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * attempt
        const msg = String(err.message ?? err).split('\n')[0]
        console.warn(`    [retry ${attempt}/${MAX_RETRIES}] ${msg} — waiting ${delay}ms`)
        sleep(delay)
      } else {
        throw err
      }
    }
  }
}

// ─── Persist ─────────────────────────────────────────────────────────────────

function saveJson(data) {
  writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Translating SRD spells to PT-BR ===\n')
  console.log(`Model:    ${MODEL}`)
  console.log(`Endpoint: ${ENDPOINT}\n`)

  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'))
  const spells = data.spells

  const toTranslate = spells.filter(s => !s.pt)
  const alreadyDone = spells.length - toTranslate.length

  console.log(`Total:      ${spells.length} spells`)
  console.log(`Translated: ${alreadyDone} (skipping)`)
  console.log(`Pending:    ${toTranslate.length}\n`)

  if (toTranslate.length === 0) {
    console.log('All spells already have PT translations. Nothing to do.')
    return
  }

  let done = 0
  let failed = 0

  for (let i = 0; i < toTranslate.length; i++) {
    const spell = toTranslate[i]
    process.stdout.write(`[${i + 1}/${toTranslate.length}] ${spell.name}... `)

    try {
      const pt = callApi(spell)
      const idx = spells.findIndex(s => s.slug === spell.slug)
      if (idx !== -1) spells[idx].pt = pt
      done++
      console.log(`✓  ${pt.name}`)
    } catch (err) {
      failed++
      const msg = String(err.message ?? err).split('\n')[0]
      console.log(`✗  SKIPPED — ${msg}`)
    }

    // Save incrementally to avoid losing progress on interruption
    const isLast = i === toTranslate.length - 1
    if ((done % SAVE_EVERY === 0 && done > 0) || isLast) {
      saveJson(data)
      if (!isLast) console.log(`  [saved — ${done} translated, ${failed} skipped so far]\n`)
    }

    // Throttle between calls
    if (!isLast) sleep(THROTTLE_MS)
  }

  saveJson(data)

  console.log(`\n=== Done ===`)
  console.log(`Translated: ${done}`)
  console.log(`Skipped:    ${failed}`)
  if (failed > 0) {
    console.log(`Re-run to retry skipped spells (resumable).`)
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
