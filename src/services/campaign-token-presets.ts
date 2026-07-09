import { supabase } from '@/lib/supabase'
import { BUCKET, MAX_BYTES, ALLOWED_TYPES } from '@/services/campaign-maps'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CampaignTokenPreset {
  id: string
  campaignId: string
  label: string
  color: string
  size: number
  imagePath: string | null
}

type Row = {
  id: string
  campaign_id: string
  label: string
  color: string
  size: number
  image_path: string | null
  created_at: string
}

function toPreset(row: Row): CampaignTokenPreset {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    label: row.label,
    color: row.color,
    size: row.size,
    imagePath: row.image_path ?? null,
  }
}

function extFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function listTokenPresets(campaignId: string): Promise<CampaignTokenPreset[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_token_presets')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at')
  if (error) throw error
  return (data as Row[]).map(toPreset)
}

export async function createTokenPreset(
  campaignId: string,
  opts?: { label?: string; color?: string; size?: number },
): Promise<CampaignTokenPreset> {
  if (!supabase) throw new Error('not_authenticated')
  const { data, error } = await supabase
    .from('campaign_token_presets')
    .insert({
      campaign_id: campaignId,
      label: opts?.label ?? '',
      color: opts?.color ?? '#C0392B',
      size: opts?.size ?? 1,
    })
    .select()
    .single()
  if (error) throw error
  return toPreset(data as Row)
}

export async function updateTokenPreset(
  id: string,
  patch: Partial<Pick<CampaignTokenPreset, 'label' | 'color' | 'size' | 'imagePath'>>,
): Promise<void> {
  if (!supabase) return
  const update: Record<string, unknown> = {}
  if (patch.label !== undefined) update.label = patch.label
  if (patch.color !== undefined) update.color = patch.color
  if (patch.size !== undefined) update.size = patch.size
  if (patch.imagePath !== undefined) update.image_path = patch.imagePath
  const { error } = await supabase
    .from('campaign_token_presets')
    .update(update)
    .eq('id', id)
  if (error) throw error
}

export async function deleteTokenPreset(preset: CampaignTokenPreset): Promise<void> {
  if (!supabase) return
  if (preset.imagePath) {
    await supabase.storage.from(BUCKET).remove([preset.imagePath]).catch(() => undefined)
  }
  const { error } = await supabase
    .from('campaign_token_presets')
    .delete()
    .eq('id', preset.id)
  if (error) throw error
}

export async function uploadTokenPresetImage(
  campaignId: string,
  presetId: string,
  file: File,
): Promise<string> {
  if (!supabase) throw new Error('not_authenticated')
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw Object.assign(new Error('Invalid file type'), { code: 'upload_error_type' })
  }
  if (file.size > MAX_BYTES) {
    throw Object.assign(new Error('File too large'), { code: 'upload_error_size' })
  }
  const ext = extFromMimeType(file.type)
  const path = `${campaignId}/presets/${presetId}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })
  if (uploadError) throw uploadError
  await updateTokenPreset(presetId, { imagePath: path })
  return path
}

export async function getTokenPresetImageSignedUrl(imagePath: string): Promise<string> {
  if (!supabase) throw new Error('not_authenticated')
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, 3600)
  if (error || !data?.signedUrl) throw error ?? new Error('No signed URL returned')
  return data.signedUrl
}

export async function removeTokenPresetImage(presetId: string, imagePath: string): Promise<void> {
  if (!supabase) return
  await supabase.storage.from(BUCKET).remove([imagePath]).catch(() => undefined)
  await updateTokenPreset(presetId, { imagePath: null })
}
