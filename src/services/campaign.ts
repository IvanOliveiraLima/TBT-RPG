import { supabase } from '@/lib/supabase'
import type { Campaign, CampaignMember } from '@/domain/campaign'

export class CampaignServiceError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
    this.name = 'CampaignServiceError'
  }
}

// ── Campaigns ─────────────────────────────────────────────────────────────

export async function createCampaign(input: {
  name: string
  description?: string
}): Promise<Campaign> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new CampaignServiceError('not_authenticated')

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      owner_id: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('[campaign] createCampaign error', error)
    throw new CampaignServiceError('create_failed')
  }

  return mapCampaignRow(data)
}

export async function listMyCampaigns(): Promise<Campaign[]> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[campaign] listMyCampaigns error', error)
    throw new CampaignServiceError('list_failed')
  }

  return (data ?? []).map(mapCampaignRow)
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[campaign] getCampaign error', error)
    throw new CampaignServiceError('get_failed')
  }

  return data ? mapCampaignRow(data) : null
}

export async function deleteCampaign(id: string): Promise<void> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[campaign] deleteCampaign error', error)
    throw new CampaignServiceError('delete_failed')
  }
}

// ── Members ───────────────────────────────────────────────────────────────

export async function listCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { data, error } = await supabase
    .from('campaign_members')
    .select('*')
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('[campaign] listCampaignMembers error', error)
    throw new CampaignServiceError('list_members_failed')
  }

  return (data ?? []).map(mapMemberRow)
}

// ── Mappers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCampaignRow(row: any): Campaign {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description ?? null) as string | null,
    ownerId: row.owner_id as string,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMemberRow(row: any): CampaignMember {
  return {
    campaignId: row.campaign_id as string,
    userId: row.user_id as string,
    role: row.role as 'master' | 'player',
    joinedAt: new Date(row.joined_at as string).getTime(),
  }
}
