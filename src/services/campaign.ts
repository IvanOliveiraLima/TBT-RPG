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

  // Best-effort: remove map images from storage BEFORE deleting the campaign row
  // (while is_campaign_owner RLS still passes). With ≤20 maps per campaign a single
  // list() call (default 100 limit) covers the folder — no pagination needed.
  try {
    const { data: files } = await supabase.storage.from('campaign-maps').list(id)
    if (files && files.length > 0) {
      await supabase.storage.from('campaign-maps').remove(files.map(f => `${id}/${f.name}`))
    }
  } catch (e) {
    console.error('[campaign] map storage cleanup failed (best-effort)', e)
  }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[campaign] deleteCampaign error', error)
    throw new CampaignServiceError('delete_failed')
  }
}

export async function leaveCampaign(campaignId: string): Promise<void> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new CampaignServiceError('not_authenticated')

  // 1. Remove own chars from campaign_characters
  const { error: charsError } = await supabase
    .from('campaign_characters')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)

  if (charsError) {
    console.error('[campaign] leaveCampaign chars error', charsError)
    throw new CampaignServiceError('leave_failed')
  }

  // 2. Remove own campaign_members row
  const { error: memberError } = await supabase
    .from('campaign_members')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)

  if (memberError) {
    console.error('[campaign] leaveCampaign member error', memberError)
    throw new CampaignServiceError('leave_failed')
  }
}

export async function removeMember(input: {
  campaignId: string
  userId: string
}): Promise<void> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id
  if (!currentUserId) throw new CampaignServiceError('not_authenticated')

  if (input.userId === currentUserId) {
    throw new CampaignServiceError('cannot_remove_self')
  }

  // 1. Remove chars linked to this user in this campaign (best-effort cascade)
  const { error: charsError } = await supabase
    .from('campaign_characters')
    .delete()
    .eq('campaign_id', input.campaignId)
    .eq('user_id', input.userId)

  if (charsError) {
    console.warn('[campaign] removeMember — failed to unlink chars', charsError)
    // non-blocking — proceed to membership removal
  }

  // 2. Remove the membership row
  const { error } = await supabase
    .from('campaign_members')
    .delete()
    .eq('campaign_id', input.campaignId)
    .eq('user_id', input.userId)

  if (error) {
    console.error('[campaign] removeMember error', error)
    throw new CampaignServiceError('remove_member_failed')
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

// ── Invite operations ─────────────────────────────────────────────────────

export async function lookupCampaignByCode(code: string): Promise<{
  id: string
  name: string
  description: string | null
} | null> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const cleaned = code.replace(/-/g, '').trim().toUpperCase()

  const { data, error } = await supabase
    .rpc('lookup_campaign_by_code', { p_code: cleaned })
    .maybeSingle()

  if (error) {
    console.error('[campaign] lookupCampaignByCode error', error)
    throw new CampaignServiceError('lookup_failed')
  }

  if (!data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description ?? null) as string | null,
  }
}

export async function acceptCampaignInvite(code: string): Promise<{
  campaignId: string
  status: 'joined' | 'already_member' | 'not_found'
}> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const cleaned = code.replace(/-/g, '').trim().toUpperCase()

  const { data, error } = await supabase
    .rpc('accept_campaign_invite', { p_code: cleaned })
    .single()

  if (error) {
    console.error('[campaign] acceptCampaignInvite error', error)
    if (error.message?.includes('not_authenticated')) {
      throw new CampaignServiceError('not_authenticated')
    }
    throw new CampaignServiceError('accept_failed')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  return {
    campaignId: row.r_campaign_id as string,
    status: row.r_status as 'joined' | 'already_member' | 'not_found',
  }
}

export async function regenerateInviteCode(campaignId: string): Promise<string> {
  if (!supabase) throw new CampaignServiceError('not_authenticated')

  const { data, error } = await supabase
    .rpc('regenerate_invite_code', { p_campaign_id: campaignId })

  if (error) {
    console.error('[campaign] regenerateInviteCode error', error)
    if (error.message?.includes('not_owner')) {
      throw new CampaignServiceError('not_owner')
    }
    if (error.message?.includes('campaign_not_found')) {
      throw new CampaignServiceError('campaign_not_found')
    }
    throw new CampaignServiceError('regenerate_failed')
  }

  return data as string
}

// ── Mappers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCampaignRow(row: any): Campaign {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description ?? null) as string | null,
    ownerId: row.owner_id as string,
    inviteCode: (row.invite_code ?? '') as string,
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
