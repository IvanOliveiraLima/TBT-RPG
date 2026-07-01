import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CampaignMapMarker {
  id: string
  mapId: string
  x: number
  y: number
  label: string
  createdAt: number
}

type Row = {
  id: string
  map_id: string
  x: number
  y: number
  label: string
  created_at: string
}

function toMarker(row: Row): CampaignMapMarker {
  return {
    id: row.id,
    mapId: row.map_id,
    x: row.x,
    y: row.y,
    label: row.label,
    createdAt: new Date(row.created_at).getTime(),
  }
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function listMapMarkers(mapId: string): Promise<CampaignMapMarker[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_map_markers')
    .select('*')
    .eq('map_id', mapId)
    .order('created_at')
  if (error) throw error
  return (data as Row[]).map(toMarker)
}

export async function createMapMarker(
  mapId: string,
  x: number,
  y: number,
  label: string,
): Promise<CampaignMapMarker> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('campaign_map_markers')
    .insert({ map_id: mapId, x, y, label })
    .select()
    .single()
  if (error) throw error
  return toMarker(data as Row)
}

export async function updateMapMarkerLabel(id: string, label: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_markers')
    .update({ label })
    .eq('id', id)
  if (error) throw error
}

export async function deleteMapMarker(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_markers')
    .delete()
    .eq('id', id)
  if (error) throw error
}
