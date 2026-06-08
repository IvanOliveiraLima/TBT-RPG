/**
 * Tests for campaign-characters service:
 * linkCharacterToCampaign, unlinkCharacterFromCampaign,
 * listCampaignCharacters, unlinkCharacterFromAllCampaigns
 * and buildCharacterSummary from domain/campaign.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @/lib/supabase ───────────────────────────────────────────────────────

let mockSupabaseConfigured = false
let mockSessionUserId: string | null = 'user1'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  get supabase() { return mockSupabaseConfigured ? mockClient : null },
  getSession: () => Promise.resolve(
    mockSessionUserId ? { user: { id: mockSessionUserId } } : null
  ),
}))

const mockClient = {
  from: (...args: unknown[]) => mockFrom(...args),
}

function setupSupabase() { mockSupabaseConfigured = true }
function resetSupabase() { mockSupabaseConfigured = false }

import {
  linkCharacterToCampaign,
  unlinkCharacterFromCampaign,
  listCampaignCharacters,
  unlinkCharacterFromAllCampaigns,
  CampaignCharacterServiceError,
} from '@/services/campaign-characters'

import { buildCharacterSummary } from '@/domain/campaign'
import type { Character } from '@/domain/character'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_CHAR: Character = {
  id: 'char1',
  name: 'Aragorn',
  race: 'Human',
  classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
  background: '',
  alignment: '',
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencyBonus: 3,
  hp: { current: 40, max: 40, temp: 0 },
  hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 15, initiative: 2, speed: 30, passivePerception: 14, spellSaveDC: 0,
  inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] },
  languages: [], attacks: [], spells: [], spellSlots: {},
  spellcastingAbility: '', spellcastingClass: '',
  inventory: [], currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
  features: [], backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '', mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0, updatedAt: 0,
}

// ── Row fixture ───────────────────────────────────────────────────────────────

const ROW = {
  campaign_id: 'c1',
  character_id: 'char1',
  user_id: 'user1',
  character_name: 'Aragorn',
  character_summary: 'Human — Ranger 5',
  added_at: '2024-01-01T00:00:00Z',
}

// ── buildCharacterSummary ─────────────────────────────────────────────────────

describe('buildCharacterSummary', () => {
  it('returns "Race — Class Level" for standard char', () => {
    expect(buildCharacterSummary({ race: 'Aasimar', classes: [{ name: 'Cleric', level: 1 }] }))
      .toBe('Aasimar — Cleric 1')
  })

  it('handles multiclass', () => {
    expect(buildCharacterSummary({
      race: 'Half-Elf',
      classes: [{ name: 'Bard', level: 3 }, { name: 'Warlock', level: 2 }],
    })).toBe('Half-Elf — Bard 3 / Warlock 2')
  })

  it('returns empty string when no race and no classes', () => {
    expect(buildCharacterSummary({})).toBe('')
  })

  it('handles only race (no classes)', () => {
    expect(buildCharacterSummary({ race: 'Dwarf' })).toBe('Dwarf')
  })

  it('handles only classes (no race)', () => {
    expect(buildCharacterSummary({ classes: [{ name: 'Fighter', level: 2 }] })).toBe('Fighter 2')
  })

  it('handles empty classes array', () => {
    expect(buildCharacterSummary({ race: 'Elf', classes: [] })).toBe('Elf')
  })
})

// ── linkCharacterToCampaign ───────────────────────────────────────────────────

describe('linkCharacterToCampaign', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSessionUserId = 'user1' })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(
      linkCharacterToCampaign({ campaignId: 'c1', character: BASE_CHAR })
    ).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('throws not_authenticated when no session user', async () => {
    setupSupabase()
    mockSessionUserId = null
    await expect(
      linkCharacterToCampaign({ campaignId: 'c1', character: BASE_CHAR })
    ).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns mapped CampaignCharacter on success', async () => {
    setupSupabase()
    const insertChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: ROW, error: null }),
      }),
    }
    mockFrom.mockReturnValue({ insert: vi.fn().mockReturnValue(insertChain) })

    const result = await linkCharacterToCampaign({ campaignId: 'c1', character: BASE_CHAR })
    expect(result.campaignId).toBe('c1')
    expect(result.characterId).toBe('char1')
    expect(result.characterName).toBe('Aragorn')
    expect(result.characterSummary).toBe('Human — Ranger 5')
  })

  it('inserts character_name and character_summary', async () => {
    setupSupabase()
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: ROW, error: null }),
      }),
    })
    mockFrom.mockReturnValue({ insert: mockInsert })

    await linkCharacterToCampaign({ campaignId: 'c1', character: BASE_CHAR })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      character_name: 'Aragorn',
      character_summary: 'Human — Ranger 5',
    }))
  })

  it('stores null summary when char has no race or classes', async () => {
    setupSupabase()
    const noSummaryChar = { ...BASE_CHAR, race: '', classes: [] }
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { ...ROW, character_summary: null }, error: null }),
      }),
    })
    mockFrom.mockReturnValue({ insert: mockInsert })

    await linkCharacterToCampaign({ campaignId: 'c1', character: noSummaryChar })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      character_summary: null,
    }))
  })

  it('throws already_linked on Postgres unique violation (23505)', async () => {
    setupSupabase()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'unique' } }),
        }),
      }),
    })
    await expect(
      linkCharacterToCampaign({ campaignId: 'c1', character: BASE_CHAR })
    ).rejects.toMatchObject({ code: 'already_linked' })
  })

  it('throws link_failed on other errors', async () => {
    setupSupabase()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'XXXX', message: 'db error' } }),
        }),
      }),
    })
    await expect(
      linkCharacterToCampaign({ campaignId: 'c1', character: BASE_CHAR })
    ).rejects.toMatchObject({ code: 'link_failed' })
  })

  it('throws CampaignCharacterServiceError with correct name', async () => {
    resetSupabase()
    try {
      await linkCharacterToCampaign({ campaignId: 'c1', character: BASE_CHAR })
    } catch (err) {
      expect(err).toBeInstanceOf(CampaignCharacterServiceError)
    }
  })
})

// ── unlinkCharacterFromCampaign ───────────────────────────────────────────────

describe('unlinkCharacterFromCampaign', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(
      unlinkCharacterFromCampaign({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('deletes by campaign_id and character_id', async () => {
    setupSupabase()
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ delete: mockDelete })

    await unlinkCharacterFromCampaign({ campaignId: 'c1', characterId: 'char1' })
    expect(mockEq1).toHaveBeenCalledWith('campaign_id', 'c1')
    expect(mockEq2).toHaveBeenCalledWith('character_id', 'char1')
  })

  it('throws unlink_failed on error', async () => {
    setupSupabase()
    const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'db error' } })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: mockEq1 }) })

    await expect(
      unlinkCharacterFromCampaign({ campaignId: 'c1', characterId: 'char1' })
    ).rejects.toMatchObject({ code: 'unlink_failed' })
  })
})

// ── listCampaignCharacters ────────────────────────────────────────────────────

describe('listCampaignCharacters', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws not_authenticated when supabase is null', async () => {
    resetSupabase()
    await expect(listCampaignCharacters('c1')).rejects.toMatchObject({ code: 'not_authenticated' })
  })

  it('returns mapped rows sorted by added_at', async () => {
    setupSupabase()
    const rows = [
      { ...ROW, character_id: 'char1', added_at: '2024-01-01T00:00:00Z' },
      { ...ROW, character_id: 'char2', character_name: 'Legolas', character_summary: 'Elf — Ranger 5', added_at: '2024-01-02T00:00:00Z' },
    ]
    const orderFn = vi.fn().mockResolvedValue({ data: rows, error: null })
    const eqFn = vi.fn().mockReturnValue({ order: orderFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
    mockFrom.mockReturnValue({ select: selectFn })

    const result = await listCampaignCharacters('c1')
    expect(result).toHaveLength(2)
    expect(result[0]?.characterId).toBe('char1')
    expect(result[1]?.characterId).toBe('char2')
    expect(orderFn).toHaveBeenCalledWith('added_at', { ascending: true })
  })

  it('returns empty array when no chars', async () => {
    setupSupabase()
    const orderFn = vi.fn().mockResolvedValue({ data: [], error: null })
    const eqFn = vi.fn().mockReturnValue({ order: orderFn })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) })

    const result = await listCampaignCharacters('c1')
    expect(result).toEqual([])
  })

  it('throws list_failed on error', async () => {
    setupSupabase()
    const orderFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } })
    const eqFn = vi.fn().mockReturnValue({ order: orderFn })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) })

    await expect(listCampaignCharacters('c1')).rejects.toMatchObject({ code: 'list_failed' })
  })

  it('maps all fields correctly', async () => {
    setupSupabase()
    const orderFn = vi.fn().mockResolvedValue({ data: [ROW], error: null })
    const eqFn = vi.fn().mockReturnValue({ order: orderFn })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) })

    const result = await listCampaignCharacters('c1')
    const char = result[0]!
    expect(char.campaignId).toBe('c1')
    expect(char.characterId).toBe('char1')
    expect(char.userId).toBe('user1')
    expect(char.characterName).toBe('Aragorn')
    expect(char.characterSummary).toBe('Human — Ranger 5')
    expect(char.addedAt).toBe(new Date('2024-01-01T00:00:00Z').getTime())
  })
})

// ── unlinkCharacterFromAllCampaigns ───────────────────────────────────────────

describe('unlinkCharacterFromAllCampaigns', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSessionUserId = 'user1' })

  it('returns silently when supabase is null', async () => {
    resetSupabase()
    await expect(unlinkCharacterFromAllCampaigns('char1')).resolves.toBeUndefined()
  })

  it('returns silently when no session', async () => {
    setupSupabase()
    mockSessionUserId = null
    await expect(unlinkCharacterFromAllCampaigns('char1')).resolves.toBeUndefined()
  })

  it('deletes by character_id and user_id', async () => {
    setupSupabase()
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: mockEq1 }) })

    await unlinkCharacterFromAllCampaigns('char1')
    expect(mockEq1).toHaveBeenCalledWith('character_id', 'char1')
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'user1')
  })

  it('silently returns on error (best-effort)', async () => {
    setupSupabase()
    const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'db error' } })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: mockEq1 }) })

    await expect(unlinkCharacterFromAllCampaigns('char1')).resolves.toBeUndefined()
  })
})
