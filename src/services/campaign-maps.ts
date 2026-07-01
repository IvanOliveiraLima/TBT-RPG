import { supabase } from '@/lib/supabase'

const BUCKET = 'campaign-maps'
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CampaignMap {
  id: string
  campaignId: string
  name: string
  imagePath: string
  width: number
  height: number
  createdAt: number
}

type Row = {
  id: string
  campaign_id: string
  name: string
  image_path: string
  width: number
  height: number
  created_at: string
}

function toMap(row: Row): CampaignMap {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    imagePath: row.image_path,
    width: row.width,
    height: row.height,
    createdAt: new Date(row.created_at).getTime(),
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

function measureImage(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img
      URL.revokeObjectURL(url)
      resolve({ width, height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image dimensions'))
    }
    img.src = url
  })
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function listCampaignMaps(campaignId: string): Promise<CampaignMap[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_maps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at')
  if (error) throw error
  return (data as Row[]).map(toMap)
}

export async function uploadCampaignMap(
  campaignId: string,
  file: File,
  name: string,
): Promise<CampaignMap> {
  if (!supabase) throw new Error('Supabase not configured')

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw Object.assign(new Error('Invalid file type'), { code: 'invalid_type' })
  }
  if (file.size > MAX_BYTES) {
    throw Object.assign(new Error('File too large'), { code: 'too_large' })
  }

  const { width, height } = await measureImage(file)
  const mapId = crypto.randomUUID()
  const ext = extFromMimeType(file.type)
  const path = `${campaignId}/${mapId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw uploadError

  const { data, error: insertError } = await supabase
    .from('campaign_maps')
    .insert({ id: mapId, campaign_id: campaignId, name, image_path: path, width, height })
    .select()
    .single()

  if (insertError) {
    // Rollback storage upload to avoid orphan
    await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined)
    throw insertError
  }

  return toMap(data as Row)
}

export async function deleteCampaignMap(map: CampaignMap): Promise<void> {
  if (!supabase) return
  // Remove storage object best-effort
  await supabase.storage.from(BUCKET).remove([map.imagePath]).catch(() => undefined)
  const { error } = await supabase.from('campaign_maps').delete().eq('id', map.id)
  if (error) throw error
}

export async function getCampaignMapSignedUrl(imagePath: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, 3600)
  if (error || !data?.signedUrl) throw error ?? new Error('No signed URL returned')
  return data.signedUrl
}
