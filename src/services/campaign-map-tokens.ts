import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CampaignMapToken {
  id: string
  mapId: string
  x: number
  y: number
  label: string
  color: string
  size: number
  createdAt: number
}

export type TokenPatch = Partial<Pick<CampaignMapToken, 'x' | 'y' | 'label' | 'color' | 'size'>>

type Row = {
  id: string
  map_id: string
  x: number
  y: number
  label: string
  color: string
  size: number
  created_at: string
}

function toToken(row: Row): CampaignMapToken {
  return {
    id: row.id,
    mapId: row.map_id,
    x: row.x,
    y: row.y,
    label: row.label,
    color: row.color,
    size: row.size,
    createdAt: new Date(row.created_at).getTime(),
  }
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function listMapTokens(mapId: string): Promise<CampaignMapToken[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_map_tokens')
    .select('*')
    .eq('map_id', mapId)
    .order('created_at')
  if (error) throw error
  return (data as Row[]).map(toToken)
}

export async function createMapToken(
  mapId: string,
  x: number,
  y: number,
  opts?: { label?: string; color?: string; size?: number },
): Promise<CampaignMapToken> {
  if (!supabase) throw new Error('not_authenticated')
  const { data, error } = await supabase
    .from('campaign_map_tokens')
    .insert({
      map_id: mapId,
      x,
      y,
      label: opts?.label ?? '',
      color: opts?.color ?? '#C0392B',
      size: opts?.size ?? 1,
    })
    .select()
    .single()
  if (error) throw error
  return toToken(data as Row)
}

export async function updateMapToken(id: string, patch: TokenPatch): Promise<void> {
  if (!supabase) return
  const update: Record<string, unknown> = {}
  if (patch.x !== undefined) update.x = patch.x
  if (patch.y !== undefined) update.y = patch.y
  if (patch.label !== undefined) update.label = patch.label
  if (patch.color !== undefined) update.color = patch.color
  if (patch.size !== undefined) update.size = patch.size
  const { error } = await supabase
    .from('campaign_map_tokens')
    .update(update)
    .eq('id', id)
  if (error) throw error
}

export async function deleteMapToken(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_tokens')
    .delete()
    .eq('id', id)
  if (error) throw error
}
