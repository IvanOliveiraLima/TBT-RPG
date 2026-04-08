const SYSTEM_PROMPT = `You are a D&D 5e character creation assistant.
Given a character description, generate a complete character sheet as a JSON object.
Respond ONLY with valid JSON, no markdown, no explanation, no code blocks.

The JSON must follow this exact structure:
{
  "char_name": "string",
  "race": "string",
  "background": "string",
  "alignment": "string (e.g. Chaotic Good)",
  "classes": [{ "name": "string", "level": "1" }],
  "str": "10", "dex": "10", "con": "10", "int": "10", "wis": "10", "cha": "10",
  "max_health": "10",
  "speed": "30",
  "proficiencies": {
    "weapon_armor": "string",
    "tools": "string",
    "languages": "string"
  },
  "skills": {
    "acrobatics": false, "animal_handling": false, "arcana": false,
    "athletics": false, "deception": false, "history": false,
    "insight": false, "intimidation": false, "investigation": false,
    "medicine": false, "nature": false, "perception": false,
    "performance": false, "persuasion": false, "religion": false,
    "sleight_hand": false, "stealth": false, "survival": false
  },
  "features": "string",
  "personality_traits": "string",
  "ideals": "string",
  "bonds": "string",
  "flaws": "string",
  "backstory": "string"
}

Rules:
- Generate ability scores appropriate for the class using standard array values (15,14,13,12,10,8)
- Set skills to true if proficient based on class and background
- Calculate max_health as hit_die + CON modifier at level 1
- Write backstory in 2-3 sentences
- All number values must be strings`

const ALLOWED_ORIGINS = [
  'https://ivanoliveiralima.github.io',
  'http://localhost:5173',
  'http://localhost:4173'
]

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) })
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: getCorsHeaders(request)
      })
    }

    let description
    try {
      const body = await request.json()
      description = body.description?.trim()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: getCorsHeaders(request)
      })
    }

    if (!description || description.length < 10) {
      return new Response(JSON.stringify({ error: 'Description too short' }), {
        status: 400,
        headers: getCorsHeaders(request)
      })
    }

    if (description.length > 1000) {
      return new Response(JSON.stringify({ error: 'Description too long (max 1000 chars)' }), {
        status: 400,
        headers: getCorsHeaders(request)
      })
    }

    try {
      const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })

      const text = response.response || ''

      // Strip markdown code blocks if model added them
      const clean = text.replace(/```json\n?|\n?```/g, '').trim()

      let character
      try {
        character = JSON.parse(clean)
      } catch {
        return new Response(JSON.stringify({ error: 'AI returned invalid JSON', raw: text }), {
          status: 500,
          headers: getCorsHeaders(request)
        })
      }

      return new Response(JSON.stringify({ character }), {
        status: 200,
        headers: getCorsHeaders(request)
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'AI generation failed', detail: err.message }), {
        status: 500,
        headers: getCorsHeaders(request)
      })
    }
  }
}
