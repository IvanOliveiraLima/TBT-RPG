#!/usr/bin/env node
/**
 * Fetches SRD spells from Open5e (v1 = 2014, v2 = 2024), normalizes them,
 * deduplicates by name (preferring 2024), and writes src/data/srd-spells.json.
 *
 * Usage: node scripts/generate-spells.mjs
 * Requires network access to api.open5e.com.
 *
 * Uses curl for HTTP (respects system proxy env vars automatically).
 *
 * Data license: CC-BY-4.0 / OGL (Wizards of the Coast SRD)
 */
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUTPUT_PATH = join(__dirname, '../src/data/srd-spells.json')

const V1_FIRST = `https://api.open5e.com/v1/spells/?document__slug=wotc-srd&limit=100`
const V2_FIRST = `https://api.open5e.com/v2/spells/?document__key=srd-2024&limit=100`
const MAX_RETRIES = 3

function fetchUrl(url) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = execSync(
        `curl -sf --max-time 30 ${JSON.stringify(url)}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      )
      return JSON.parse(result)
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        const delay = 1000 * (attempt + 1)
        console.warn(`  Retry ${attempt + 1}/${MAX_RETRIES - 1} for ${url} — waiting ${delay}ms`)
        const start = Date.now()
        while (Date.now() - start < delay) { /* busy wait */ }
      } else {
        throw new Error(`Failed after ${MAX_RETRIES} attempts: ${url}\n${String(err.stderr ?? err.message)}`)
      }
    }
  }
}

async function fetchAllPages(firstUrl) {
  const results = []
  let url = firstUrl
  while (url) {
    console.log(`  GET ${url}`)
    const data = fetchUrl(url)
    results.push(...data.results)
    url = data.next ?? null
  }
  return results
}

/** Converts slug-style time strings to readable text (idempotent for already-clean values). */
function cleanTime(raw) {
  return String(raw ?? '')
    .replace(/-/g, ' ')                   // bonus-action → bonus action
    .replace(/(\d)([a-zA-Z])/g, '$1 $2') // 1minute → 1 minute, 10minutes → 10 minutes
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fills empty string/array fields in `win` from `other` (backfill from losing edition).
 * Mutates and returns `win`.
 */
function backfill(win, other) {
  if (!other) return win
  for (const k of ['description', 'higherLevel', 'castingTime', 'range', 'components', 'material', 'duration']) {
    if ((!win[k] || !String(win[k]).trim()) && other[k]) win[k] = other[k]
  }
  if ((!win.classes || win.classes.length === 0) && other.classes?.length) win.classes = other.classes
  return win
}

function normalizeV1(r) {
  const classes = (r.dnd_class ?? '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean)
  return {
    slug: r.slug ?? '',
    name: r.name ?? '',
    level: r.level_int ?? r.spell_level ?? 0,
    school: (r.school ?? '').toLowerCase(),
    castingTime: cleanTime(r.casting_time),
    range: r.range ?? '',
    components: r.components ?? '',
    material: r.material ?? '',
    duration: cleanTime(r.duration),
    concentration: /^\s*(yes|true)\s*$/i.test(String(r.concentration ?? '')),
    ritual: /^\s*(yes|true)\s*$/i.test(String(r.ritual ?? '')),
    description: r.desc ?? '',
    higherLevel: r.higher_level ?? '',
    classes,
    edition: '2014',
  }
}

function normalizeV2(r) {
  const compParts = []
  if (r.verbal) compParts.push('V')
  if (r.somatic) compParts.push('S')
  if (r.material) compParts.push('M')

  const classes = (r.classes ?? []).map(c => c.name).filter(Boolean)

  return {
    slug: r.key ?? '',
    name: r.name ?? '',
    level: typeof r.level === 'number' ? r.level : parseInt(String(r.level ?? '0'), 10),
    school: r.school?.key ?? (r.school?.name ?? '').toLowerCase(),
    castingTime: cleanTime(r.casting_time),
    range: r.range_text ?? (r.range != null ? String(r.range) : ''),
    components: compParts.join(', '),
    material: r.material_specified ?? '',
    duration: cleanTime(r.duration),
    concentration: Boolean(r.concentration),
    ritual: Boolean(r.ritual),
    description: r.desc ?? '',
    higherLevel: r.higher_level ?? '',
    classes,
    edition: '2024',
  }
}

async function main() {
  console.log('=== Generating SRD spells ===\n')

  console.log('Fetching v1 (SRD 2014, wotc-srd)...')
  const v1Raw = await fetchAllPages(V1_FIRST)
  console.log(`  → ${v1Raw.length} raw spells\n`)

  console.log('Fetching v2 (SRD 2024, srd-2024)...')
  const v2Raw = await fetchAllPages(V2_FIRST)
  console.log(`  → ${v2Raw.length} raw spells\n`)

  if (v1Raw.length === 0 && v2Raw.length === 0) {
    throw new Error('Both APIs returned 0 results — refusing to overwrite existing JSON.')
  }

  const v1Spells = v1Raw.map(normalizeV1)
  const v2Spells = v2Raw.map(normalizeV2)

  // Dedupe by name (lowercase). 2024 wins, but backfills empty fields from 2014.
  const byName = new Map()
  for (const s of v1Spells) byName.set(s.name.trim().toLowerCase(), s)
  for (const s of v2Spells) {
    const key = s.name.trim().toLowerCase()
    const existing = byName.get(key) // may be undefined (2024-only) or a 2014 entry
    byName.set(key, backfill(s, existing))
  }

  const spells = Array.from(byName.values()).sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return a.name.localeCompare(b.name)
  })

  if (spells.length === 0) {
    throw new Error('Final spell list is empty after dedup — refusing to overwrite existing JSON.')
  }

  const emptyDesc = spells.filter(s => !s.description.trim())
  if (emptyDesc.length > 0) {
    console.warn(`  ⚠ ${emptyDesc.length} spell(s) with empty description: ${emptyDesc.map(s => s.name).join(', ')}`)
  }

  const by2024 = spells.filter(s => s.edition === '2024').length
  const by2014 = spells.filter(s => s.edition === '2014').length

  const output = {
    _meta: {
      attribution:
        'Spell data from Open5e (https://open5e.com), licensed under CC-BY-4.0 / OGL. ' +
        'Sources: System Reference Document 5.1 (2014) and 5.2 (2024) by Wizards of the Coast.',
      generated: new Date().toISOString(),
      v1Count: v1Spells.length,
      v2Count: v2Spells.length,
      totalCount: spells.length,
    },
    spells,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n')

  console.log(`Wrote ${spells.length} spells → src/data/srd-spells.json`)
  console.log(`  2024 edition: ${by2024} spells`)
  console.log(`  2014 only:    ${by2014} spells`)
}

main().catch(err => {
  console.error('\nError:', err.message)
  process.exit(1)
})
