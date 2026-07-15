import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCharacterWithAI, mergeAIResponseIntoCharacter, AIGenerationError, parseErrorCode } from '@/services/ai-generate'

// ── generateCharacterWithAI ──────────────────────────────────────────────────

describe('generateCharacterWithAI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the character from a successful response', async () => {
    const mockChar = { char_name: 'Aria', race: 'Elf', str: '10', dex: '14' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ character: mockChar }),
    }))
    const result = await generateCharacterWithAI({ description: 'An elf rogue', lang: 'en' })
    expect(result.char_name).toBe('Aria')
    expect(result.race).toBe('Elf')
  })

  it('sends description and lang in the request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ character: { char_name: 'X' } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await generateCharacterWithAI({ description: 'A dwarf cleric', lang: 'pt' })
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.description).toBe('A dwarf cleric')
    expect(body.lang).toBe('pt')
  })

  it('throws AIGenerationError with rate_limit for 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    await expect(generateCharacterWithAI({ description: 'A test character', lang: 'en' }))
      .rejects.toThrow(AIGenerationError)
    await expect(generateCharacterWithAI({ description: 'A test character', lang: 'en' }))
      .rejects.toMatchObject({ code: 'rate_limit' })
  })

  it('throws AIGenerationError with invalid_request for 400', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }))
    await expect(generateCharacterWithAI({ description: 'short desc here ok', lang: 'en' }))
      .rejects.toMatchObject({ code: 'invalid_request' })
  })

  it('throws AIGenerationError with server_error for 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(generateCharacterWithAI({ description: 'A test character ok', lang: 'en' }))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  it('throws AIGenerationError with invalid_response when character field missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ error: 'Something went wrong' }),
    }))
    await expect(generateCharacterWithAI({ description: 'A test character ok', lang: 'en' }))
      .rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('throws AIGenerationError with timeout when AbortController triggers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' })))
    await expect(generateCharacterWithAI({ description: 'A test character ok', lang: 'en' }))
      .rejects.toMatchObject({ code: 'timeout' })
  })

  it('throws AIGenerationError with network_error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))
    await expect(generateCharacterWithAI({ description: 'A test character ok', lang: 'en' }))
      .rejects.toMatchObject({ code: 'network_error' })
  })
})

// ── parseErrorCode ────────────────────────────────────────────────────────────

describe('parseErrorCode', () => {
  it('returns the code from AIGenerationError', () => {
    expect(parseErrorCode(new AIGenerationError('rate_limit'))).toBe('rate_limit')
  })

  it('returns unknown for non-AIGenerationError', () => {
    expect(parseErrorCode(new Error('generic'))).toBe('unknown')
    expect(parseErrorCode('string error')).toBe('unknown')
  })
})

// ── mergeAIResponseIntoCharacter ─────────────────────────────────────────────

describe('mergeAIResponseIntoCharacter', () => {
  it('sets the character name from char_name', () => {
    const result = mergeAIResponseIntoCharacter({ char_name: 'Zara the Bold' })
    expect(result.name).toBe('Zara the Bold')
  })

  it('falls back to empty name when char_name is absent', () => {
    const result = mergeAIResponseIntoCharacter({})
    expect(result.name).toBe('')
  })

  it('sets race, background, alignment', () => {
    const result = mergeAIResponseIntoCharacter({
      race: 'Half-Elf',
      background: 'Sage',
      alignment: 'Chaotic Good',
    })
    expect(result.race).toBe('Half-Elf')
    expect(result.background).toBe('Sage')
    expect(result.alignment).toBe('Chaotic Good')
  })

  it('keeps factory defaults for fields not provided by AI', () => {
    const result = mergeAIResponseIntoCharacter({ char_name: 'Test' })
    expect(result.currency).toEqual({ pp: 0, gp: 0, sp: 0, cp: 0 })
    expect(result.inventory).toHaveLength(0)
    expect(result.attacks).toHaveLength(0)
    expect(result.spells).toHaveLength(0)
  })

  it('parses string ability scores from worker response', () => {
    const result = mergeAIResponseIntoCharacter({ str: '16', dex: '14', con: '12', int: '10', wis: '8', cha: '15' })
    expect(result.abilities.str).toBe(16)
    expect(result.abilities.dex).toBe(14)
    expect(result.abilities.cha).toBe(15)
  })

  it('ignores invalid ability scores (NaN, 0)', () => {
    const base = mergeAIResponseIntoCharacter({})
    const withBad = mergeAIResponseIntoCharacter({ str: 'invalid', dex: '0' })
    expect(withBad.abilities.str).toBe(base.abilities.str)
    expect(withBad.abilities.dex).toBe(base.abilities.dex)
  })

  it('sets class name and level from first class entry', () => {
    const result = mergeAIResponseIntoCharacter({
      classes: [{ name: 'Fighter', level: '5' }],
    })
    expect(result.classes[0]!.name).toBe('Fighter')
    expect(result.classes[0]!.level).toBe(5)
    expect(result.hitDice[0]!.className).toBe('Fighter')
    expect(result.hitDice[0]!.max).toBe(5)
  })

  it('converts max_health string to numeric hp', () => {
    const result = mergeAIResponseIntoCharacter({ max_health: '38' })
    expect(result.hp.max).toBe(38)
    expect(result.hp.current).toBe(38)
  })

  it('sets skill proficiencies from worker boolean map', () => {
    const result = mergeAIResponseIntoCharacter({
      skills: { acrobatics: true, stealth: true },
    })
    const acrobatics = result.skills.find(s => s.name === 'Acrobatics')
    const stealth    = result.skills.find(s => s.name === 'Stealth')
    const history    = result.skills.find(s => s.name === 'History')
    expect(acrobatics?.proficient).toBe(true)
    expect(stealth?.proficient).toBe(true)
    expect(history?.proficient).toBe(false)
  })

  it('normalises sleight_hand (worker alias) to Sleight of Hand skill', () => {
    const result = mergeAIResponseIntoCharacter({
      skills: { sleight_hand: true },
    })
    const sleight = result.skills.find(s => s.name === 'Sleight of Hand')
    expect(sleight?.proficient).toBe(true)
  })

  it('converts proficiencies comma-separated strings to arrays', () => {
    const result = mergeAIResponseIntoCharacter({
      proficiencies: {
        weapon_armor: 'Simple weapons, Handcrossbows',
        tools:        'Thieves\' tools',
        languages:    'Common, Elvish',
      },
    })
    expect(result.proficiencies.weapons).toContain('Simple weapons')
    expect(result.proficiencies.tools).toContain('Thieves\' tools')
    expect(result.languages).toContain('Common')
    expect(result.languages).toContain('Elvish')
  })

  it('converts features string into a single Feature entry', () => {
    const result = mergeAIResponseIntoCharacter({ features: 'Sneak Attack, Cunning Action' })
    expect(result.features).toHaveLength(1)
    expect(result.features[0]!.description).toContain('Sneak Attack')
  })

  it('skips features when features string is empty', () => {
    const result = mergeAIResponseIntoCharacter({ features: '   ' })
    expect(result.features).toHaveLength(0)
  })

  it('sets backstory and personality fields', () => {
    const result = mergeAIResponseIntoCharacter({
      backstory: 'Born in a distant land.',
      personality_traits: 'Curious',
      ideals: 'Freedom',
      bonds: 'My homeland',
      flaws: 'Overconfident',
    })
    expect(result.backstory).toBe('Born in a distant land.')
    expect(result.personality.traits).toBe('Curious')
    expect(result.personality.ideals).toBe('Freedom')
    expect(result.personality.bonds).toBe('My homeland')
    expect(result.personality.flaws).toBe('Overconfident')
  })

  it('produces a character with a unique UUID id', () => {
    const a = mergeAIResponseIntoCharacter({})
    const b = mergeAIResponseIntoCharacter({})
    expect(a.id).not.toBe(b.id)
  })

  it('re-derives initiative from merged DEX score', () => {
    const result = mergeAIResponseIntoCharacter({ dex: '16' }) // mod = +3
    expect(result.initiative).toBe(3)
  })

  // ── attacks mapping ──────────────────────────────────────────────────────────

  it('leaves attacks empty when AI response has no attacks field', () => {
    const result = mergeAIResponseIntoCharacter({})
    expect(result.attacks).toHaveLength(0)
  })

  it('leaves attacks empty when attacks field is not an array', () => {
    const result = mergeAIResponseIntoCharacter({ attacks: 'invalid' as never })
    expect(result.attacks).toHaveLength(0)
  })

  it('maps a melee attack with str ability and positive mod', () => {
    // Fighter str=16 → mod=+3, level=1 → prof=+2 → attackBonus=5, damage="1d8+3"
    const result = mergeAIResponseIntoCharacter({
      classes: [{ name: 'Fighter', level: '1' }],
      str: '16',
      attacks: [{ name: 'Longsword', kind: 'melee', ability: 'str', damage: '1d8', damage_type: 'Slashing', range: '5 ft', properties: 'Versatile' }],
    })
    expect(result.attacks).toHaveLength(1)
    const atk = result.attacks[0]!
    expect(atk.name).toBe('Longsword')
    expect(atk.kind).toBe('melee')
    expect(atk.ability).toBe('str')
    expect(atk.attackBonus).toBe(5)   // mod(3) + prof(2)
    expect(atk.damage).toBe('1d8+3')
    expect(atk.damageType).toBe('Slashing')
    expect(atk.range).toBe('5 ft')
    expect(atk.properties).toBe('Versatile')
    expect(atk.notes).toBe('')
    expect(atk.id).toBeTruthy()
  })

  it('maps a ranged attack with dex ability', () => {
    // Ranger dex=16 → mod=+3, level=1 → prof=+2 → attackBonus=5, damage="1d8+3"
    const result = mergeAIResponseIntoCharacter({
      classes: [{ name: 'Ranger', level: '1' }],
      dex: '16',
      attacks: [{ name: 'Longbow', kind: 'ranged', ability: 'dex', damage: '1d8', damage_type: 'Piercing', range: '150/600 ft', properties: 'Heavy, Two-Handed' }],
    })
    const atk = result.attacks[0]!
    expect(atk.kind).toBe('ranged')
    expect(atk.ability).toBe('dex')
    expect(atk.attackBonus).toBe(5)
    expect(atk.damage).toBe('1d8+3')
  })

  it('defaults unknown kind to melee', () => {
    const result = mergeAIResponseIntoCharacter({
      str: '10',
      attacks: [{ name: 'Bite', kind: 'natural' as never, ability: 'str', damage: '1d6' }],
    })
    expect(result.attacks[0]!.kind).toBe('melee')
  })

  it('defaults invalid ability to empty string and attackBonus to 0', () => {
    const result = mergeAIResponseIntoCharacter({
      attacks: [{ name: 'Cantrip', kind: 'spell', ability: 'magic' as never, damage: '1d10' }],
    })
    const atk = result.attacks[0]!
    expect(atk.ability).toBe('')
    expect(atk.attackBonus).toBe(0)
  })

  it('does not append modifier to damage when ability is empty', () => {
    const result = mergeAIResponseIntoCharacter({
      attacks: [{ name: 'Ray', ability: undefined, damage: '1d8' }],
    })
    expect(result.attacks[0]!.damage).toBe('1d8')
  })

  it('does not append modifier to damage when mod is 0', () => {
    // str=10 → mod=0
    const result = mergeAIResponseIntoCharacter({
      str: '10',
      attacks: [{ name: 'Club', kind: 'melee', ability: 'str', damage: '1d4' }],
    })
    expect(result.attacks[0]!.damage).toBe('1d4')
  })

  it('appends negative modifier to damage when mod is negative', () => {
    // str=8 → mod=-1
    const result = mergeAIResponseIntoCharacter({
      str: '8',
      attacks: [{ name: 'Dagger', kind: 'melee', ability: 'str', damage: '1d4' }],
    })
    expect(result.attacks[0]!.damage).toBe('1d4-1')
  })

  it('produces empty damage string when damage field is missing', () => {
    const result = mergeAIResponseIntoCharacter({
      str: '16',
      attacks: [{ name: 'Unarmed', kind: 'melee', ability: 'str' }],
    })
    expect(result.attacks[0]!.damage).toBe('')
  })

  it('caps attacks at 6 items', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ name: `Weapon${i}`, kind: 'melee', ability: 'str', damage: '1d6' }))
    const result = mergeAIResponseIntoCharacter({ attacks: many })
    expect(result.attacks).toHaveLength(6)
  })

  it('filters out attacks without a name', () => {
    const result = mergeAIResponseIntoCharacter({
      attacks: [
        { name: 'Sword', kind: 'melee', ability: 'str', damage: '1d8' },
        { name: '', kind: 'melee', ability: 'str', damage: '1d6' },
        { kind: 'melee', ability: 'str', damage: '1d4' },
      ],
    })
    expect(result.attacks).toHaveLength(1)
    expect(result.attacks[0]!.name).toBe('Sword')
  })

  it('each generated attack has a unique id', () => {
    const result = mergeAIResponseIntoCharacter({
      attacks: [
        { name: 'Sword', kind: 'melee', ability: 'str', damage: '1d8' },
        { name: 'Dagger', kind: 'melee', ability: 'dex', damage: '1d4' },
      ],
    })
    expect(result.attacks[0]!.id).not.toBe(result.attacks[1]!.id)
  })
})
