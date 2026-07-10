import { supabase } from '@/lib/supabase'

export interface CampaignMapArea {
  id: string
  mapId: string
  shape: 'circle' | 'square'
  x: number      // centre in viewBox space (x = lng)
  y: number      // centre in viewBox space (y = map.height - lat)
  radius: number // Euclidean distance (shape-invariant)
  color: string
}

type Row = {
  id: string
  map_id: string
  shape: string
  x: number
  y: number
  radius: number
  color: string
}

function toArea(row: Row): CampaignMapArea {
  return {
    id: row.id,
    mapId: row.map_id,
    shape: row.shape as 'circle' | 'square',
    x: row.x,
    y: row.y,
    radius: row.radius,
    color: row.color,
  }
}

export async function listMapAreas(mapId: string): Promise<CampaignMapArea[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_map_areas')
    .select('*')
    .eq('map_id', mapId)
    .order('created_at')
  if (error) throw error
  return (data as Row[]).map(toArea)
}

export async function createMapArea(
  mapId: string,
  opts: { shape: 'circle' | 'square'; x: number; y: number; radius: number; color: string },
): Promise<CampaignMapArea> {
  if (!supabase) throw new Error('no supabase')
  const { data, error } = await supabase
    .from('campaign_map_areas')
    .insert({ map_id: mapId, shape: opts.shape, x: opts.x, y: opts.y, radius: opts.radius, color: opts.color })
    .select()
    .single()
  if (error) throw error
  return toArea(data as Row)
}

export async function deleteMapArea(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('campaign_map_areas').delete().eq('id', id)
  if (error) throw error
}

export async function clearMapAreas(mapId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('campaign_map_areas').delete().eq('map_id', mapId)
  if (error) throw error
}
