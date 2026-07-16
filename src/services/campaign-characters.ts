import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/supabase'
import type { CampaignCharacter } from '@/domain/campaign'
import { buildCharacterSummary } from '@/domain/campaign'
import type { Character } from '@/domain/character'

export class CampaignCharacterServiceError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
    this.name = 'CampaignCharacterServiceError'
  }
}

// ── Link ─────────────────────────────────────────────────────────────────────

export async function linkCharacterToCampaign(input: {
  campaignId: string
  character: Character
}): Promise<CampaignCharacter> {
  if (!supabase) throw new CampaignCharacterServiceError('not_authenticated')

  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) throw new CampaignCharacterServiceError('not_authenticated')

  const summary = buildCharacterSummary(input.character) || null

  const { data, error } = await supabase
    .from('campaign_characters')
    .insert({
      campaign_id:       input.campaignId,
      character_id:      input.character.id,
      user_id:           userId,
      character_name:    input.character.name,
      character_summary: summary,
    })
    .select()
    .single()

  if (error) {
    console.error('[campaign-chars] linkCharacterToCampaign error', error)
    if (error.code === '23505') {
      throw new CampaignCharacterServiceError('already_linked')
    }
    throw new CampaignCharacterServiceError('link_failed')
  }

  return mapRow(data)
}

// ── Unlink ────────────────────────────────────────────────────────────────────

export async function unlinkCharacterFromCampaign(input: {
  campaignId: string
  characterId: string
}): Promise<void> {
  if (!supabase) throw new CampaignCharacterServiceError('not_authenticated')

  const { error } = await supabase
    .from('campaign_characters')
    .delete()
    .eq('campaign_id', input.campaignId)
    .eq('character_id', input.characterId)

  if (error) {
    console.error('[campaign-chars] unlinkCharacterFromCampaign error', error)
    throw new CampaignCharacterServiceError('unlink_failed')
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listCampaignCharacters(campaignId: string): Promise<CampaignCharacter[]> {
  if (!supabase) throw new CampaignCharacterServiceError('not_authenticated')

  const { data, error } = await supabase
    .from('campaign_characters')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('added_at', { ascending: true })

  if (error) {
    console.error('[campaign-chars] listCampaignCharacters error', error)
    throw new CampaignCharacterServiceError('list_failed')
  }

  return (data ?? []).map(mapRow)
}

// ── Campaign IDs for character ────────────────────────────────────────────────

/**
 * Returns all campaign IDs that the current user's character is linked to.
 * Used by useDiceStore to know which campaigns to log rolls into.
 */
export async function listCampaignIdsForCharacter(characterId: string): Promise<string[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campaign_characters')
    .select('campaign_id')
    .eq('character_id', characterId)

  if (error) {
    console.error('[campaign-chars] listCampaignIdsForCharacter error', error)
    return []
  }

  return (data ?? []).map((row: { campaign_id: string }) => row.campaign_id)
}

// ── Cascade delete ────────────────────────────────────────────────────────────

/**
 * Removes all campaign links for a character owned by the current user.
 * Best-effort: does not throw. Used by deleteCharacter cascade.
 */
export async function unlinkCharacterFromAllCampaigns(characterId: string): Promise<void> {
  if (!supabase) return

  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return

  const { error } = await supabase
    .from('campaign_characters')
    .delete()
    .eq('character_id', characterId)
    .eq('user_id', userId)

  if (error) {
    console.error('[campaign-chars] unlinkCharacterFromAllCampaigns error', error)
    // best-effort — does not throw
  }
}

// ── Mapper ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): CampaignCharacter {
  return {
    campaignId:       row.campaign_id as string,
    characterId:      row.character_id as string,
    userId:           row.user_id as string,
    characterName:    row.character_name as string,
    characterSummary: (row.character_summary ?? null) as string | null,
    addedAt:          new Date(row.added_at as string).getTime(),
  }
}
