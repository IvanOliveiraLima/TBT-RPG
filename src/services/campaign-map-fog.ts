import { supabase } from '@/lib/supabase'

export interface CampaignMapFog {
  mapId: string
  enabled: boolean
  revealed: string[]
  updatedAt: number
}

type Row = {
  map_id: string
  enabled: boolean
  revealed: string[]
  updated_at: string
}

function toFog(row: Row): CampaignMapFog {
  return {
    mapId: row.map_id,
    enabled: row.enabled,
    revealed: row.revealed,
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

function defaultFog(mapId: string): CampaignMapFog {
  return { mapId, enabled: false, revealed: [], updatedAt: 0 }
}

export async function getMapFog(mapId: string): Promise<CampaignMapFog> {
  if (!supabase) return defaultFog(mapId)
  const { data, error } = await supabase
    .from('campaign_map_fog')
    .select('*')
    .eq('map_id', mapId)
    .maybeSingle()
  if (error) throw error
  if (!data) return defaultFog(mapId)
  return toFog(data as Row)
}

export async function saveMapFog(
  mapId: string,
  patch: { enabled: boolean; revealed: string[] },
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_fog')
    .upsert(
      { map_id: mapId, enabled: patch.enabled, revealed: patch.revealed, updated_at: new Date().toISOString() },
      { onConflict: 'map_id' },
    )
  if (error) throw error
}
