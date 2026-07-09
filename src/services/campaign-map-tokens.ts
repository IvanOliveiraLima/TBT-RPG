import { supabase } from '@/lib/supabase'
import { BUCKET, MAX_BYTES, ALLOWED_TYPES } from '@/services/campaign-maps'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CampaignMapToken {
  id: string
  mapId: string
  x: number
  y: number
  label: string
  color: string
  size: number
  imagePath: string | null
  createdAt: number
}

export type TokenPatch = Partial<Pick<CampaignMapToken, 'x' | 'y' | 'label' | 'color' | 'size' | 'imagePath'>>

type Row = {
  id: string
  map_id: string
  x: number
  y: number
  label: string
  color: string
  size: number
  image_path: string | null
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
    imagePath: row.image_path ?? null,
    createdAt: new Date(row.created_at).getTime(),
  }
}

function extFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
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
  if (patch.imagePath !== undefined) update.image_path = patch.imagePath
  const { error } = await supabase
    .from('campaign_map_tokens')
    .update(update)
    .eq('id', id)
  if (error) throw error
}

export async function deleteMapToken(token: CampaignMapToken): Promise<void> {
  if (!supabase) return
  if (token.imagePath) {
    await supabase.storage.from(BUCKET).remove([token.imagePath]).catch(() => undefined)
  }
  const { error } = await supabase
    .from('campaign_map_tokens')
    .delete()
    .eq('id', token.id)
  if (error) throw error
}

export async function uploadTokenImage(
  campaignId: string,
  tokenId: string,
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
  const path = `${campaignId}/tokens/${tokenId}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })
  if (uploadError) throw uploadError
  await updateMapToken(tokenId, { imagePath: path })
  return path
}

export async function getTokenImageSignedUrl(imagePath: string): Promise<string> {
  if (!supabase) throw new Error('not_authenticated')
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, 3600)
  if (error || !data?.signedUrl) throw error ?? new Error('No signed URL returned')
  return data.signedUrl
}

export async function removeTokenImage(tokenId: string, imagePath: string): Promise<void> {
  if (!supabase) return
  await supabase.storage.from(BUCKET).remove([imagePath]).catch(() => undefined)
  await updateMapToken(tokenId, { imagePath: null })
}

export async function uploadTokenImageBlob(
  campaignId: string,
  tokenId: string,
  blob: Blob,
): Promise<string> {
  if (!supabase) throw new Error('not_authenticated')
  const ext = extFromMimeType(blob.type)
  const path = `${campaignId}/tokens/${tokenId}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true })
  if (error) throw error
  await updateMapToken(tokenId, { imagePath: path })
  return path
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(',')
  const head = commaIdx > -1 ? dataUrl.slice(0, commaIdx) : ''
  const b64  = commaIdx > -1 ? dataUrl.slice(commaIdx + 1) : dataUrl
  const mime = /data:(.*?);/.exec(head)?.[1] ?? 'image/png'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function setTokenImageFromCharacterPortrait(
  campaignId: string,
  tokenId: string,
  portraitDataUrl: string,
): Promise<string> {
  if (!supabase) throw new Error('not_authenticated')
  const blob = dataUrlToBlob(portraitDataUrl)
  const ext = extFromMimeType(blob.type)
  const path = `${campaignId}/tokens/${tokenId}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true })
  if (error) throw error
  await updateMapToken(tokenId, { imagePath: path })
  return path
}
