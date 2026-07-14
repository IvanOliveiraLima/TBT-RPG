import { supabase } from '@/lib/supabase'

export interface CampaignMapArea {
  id: string
  mapId: string
  shape: 'circle' | 'square' | 'line' | 'cone'
  x: number      // centre / start-point in viewBox space (x = lng)
  y: number      // centre / start-point in viewBox space (y = map.height - lat)
  radius: number // Euclidean distance (shape-invariant; for line/cone = length)
  x2: number | null  // end-point / tip (line & cone only; null for circle/square)
  y2: number | null
  color: string
}

type Row = {
  id: string
  map_id: string
  shape: string
  x: number
  y: number
  radius: number
  x2: number | null
  y2: number | null
  color: string
}

function toArea(row: Row): CampaignMapArea {
  return {
    id: row.id,
    mapId: row.map_id,
    shape: row.shape as CampaignMapArea['shape'],
    x: row.x,
    y: row.y,
    radius: row.radius,
    x2: row.x2 ?? null,
    y2: row.y2 ?? null,
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
  opts: {
    shape: CampaignMapArea['shape']
    x: number
    y: number
    radius: number
    color: string
    x2?: number | null
    y2?: number | null
  },
): Promise<CampaignMapArea> {
  if (!supabase) throw new Error('no supabase')
  const { data, error } = await supabase
    .from('campaign_map_areas')
    .insert({
      map_id: mapId,
      shape: opts.shape,
      x: opts.x,
      y: opts.y,
      radius: opts.radius,
      color: opts.color,
      x2: opts.x2 ?? null,
      y2: opts.y2 ?? null,
    })
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
