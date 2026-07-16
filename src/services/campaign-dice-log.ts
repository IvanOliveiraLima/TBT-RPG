import { supabase, getSession } from '@/lib/supabase'
import type { RollResult } from '@/domain/dice'

export interface CampaignDiceRoll {
  id: string
  campaignId: string
  userId: string
  actorName: string
  result: RollResult
  createdAt: number
}

// ── Log ───────────────────────────────────────────────────────────────────────

/**
 * Inserts one row per campaignId. Fire-and-forget: never throws.
 * Skips silently when supabase is null (offline / unauthenticated).
 */
export async function logRoll(
  campaignIds: string[],
  actorName: string,
  result: RollResult,
): Promise<void> {
  if (!supabase || campaignIds.length === 0) return

  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return   // RLS requires auth.uid(); skip silently if not logged in

  const rows = campaignIds.map(campaign_id => ({
    campaign_id,
    user_id: userId,
    actor_name: actorName,
    result: result as unknown as Record<string, unknown>,
  }))

  const { error } = await supabase.from('campaign_dice_rolls').insert(rows)

  if (error) {
    console.error('[dice-log] logRoll error', error)
    // best-effort — does not throw
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listCampaignRolls(
  campaignId: string,
  limit = 50,
): Promise<CampaignDiceRoll[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campaign_dice_rolls')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[dice-log] listCampaignRolls error', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id:         row.id as string,
    campaignId: row.campaign_id as string,
    userId:     row.user_id as string,
    actorName:  row.actor_name as string,
    result:     row.result as RollResult,
    createdAt:  new Date(row.created_at as string).getTime(),
  }))
}

// ── Clear ─────────────────────────────────────────────────────────────────────

/**
 * Deletes all rolls for a campaign. Requires ownership (enforced by RLS).
 * Best-effort: does not throw.
 */
export async function clearCampaignRolls(campaignId: string): Promise<void> {
  if (!supabase) return

  const { error } = await supabase
    .from('campaign_dice_rolls')
    .delete()
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('[dice-log] clearCampaignRolls error', error)
    // best-effort — does not throw
  }
}
