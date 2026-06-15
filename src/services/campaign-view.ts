import { supabase, getSession } from '@/lib/supabase'
import type { Character } from '@/domain/character'
import { listProfilesByIds } from '@/services/user-profile'
import { listCampaignCharacters } from '@/services/campaign-characters'

export interface LinkedCharacterDetails {
  characterId: string
  ownerUserId: string
  ownerDisplayName: string | null
  character: Character | null
  portraitData: string | null
  symbolData: string | null
}

export class CampaignViewError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
    this.name = 'CampaignViewError'
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Fetch a character linked to a campaign. Campaign members can call this.
 * Returns null if the char no longer exists or the user has no access (RLS blocks).
 * Never persists to IndexedDB — memory only.
 */
export async function fetchCampaignCharacter(input: {
  campaignId: string
  characterId: string
}): Promise<{ char: Character; ownerId: string } | null> {
  if (!supabase) throw new CampaignViewError('not_authenticated')

  const session = await getSession()
  if (!session?.user) throw new CampaignViewError('not_authenticated')

  // Verify the link exists (RLS already enforces member-only access)
  const { data: link, error: linkError } = await supabase
    .from('campaign_characters')
    .select('character_id, user_id')
    .eq('campaign_id', input.campaignId)
    .eq('character_id', input.characterId)
    .maybeSingle()

  if (linkError) {
    console.error('[campaign-view] link check error', linkError)
    throw new CampaignViewError('fetch_failed')
  }
  if (!link) return null

  // Fetch full character row
  const { data: row, error: charError } = await supabase
    .from('characters')
    .select('id, user_id, data, updated_at')
    .eq('id', input.characterId)
    .maybeSingle()

  if (charError) {
    console.error('[campaign-view] fetch char error', charError)
    throw new CampaignViewError('fetch_failed')
  }
  if (!row) return null

  const char: Character = {
    ...(row.data as Character),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }

  const ownerId = (link.user_id ?? row.user_id) as string
  return { char, ownerId }
}

/**
 * Fetch portrait and symbol images for a remote character.
 * Returns base64 data URLs. Graceful: returns nulls on any failure.
 */
export async function fetchCampaignCharacterImages(input: {
  userId: string
  characterId: string
}): Promise<{ portraitData: string | null; symbolData: string | null }> {
  const result = { portraitData: null as string | null, symbolData: null as string | null }
  if (!supabase) return result

  const prefix = `${input.userId}/${input.characterId}`
  const { data: files, error } = await supabase.storage
    .from('character-images')
    .list(prefix)

  if (error || !files || files.length === 0) return result

  for (const file of files) {
    const dotIdx = file.name.lastIndexOf('.')
    const kind = dotIdx > -1 ? file.name.slice(0, dotIdx) : file.name
    if (kind !== 'character' && kind !== 'symbol') continue

    const { data: blob, error: dlErr } = await supabase.storage
      .from('character-images')
      .download(`${prefix}/${file.name}`)

    if (dlErr || !blob) continue

    try {
      const base64 = await blobToBase64(blob)
      if (kind === 'character') result.portraitData = base64
      else result.symbolData = base64
    } catch {
      // ignore conversion errors
    }
  }

  return result
}

/**
 * Fetch full details for all characters linked to a campaign.
 *
 * Performance: 2 DB queries regardless of number of chars (batch .in() instead of N .eq()).
 * Images are NOT fetched here — consumers handle lazy loading to render cards immediately.
 *
 * Best-effort: chars missing from batch result return character: null (e.g. deleted chars).
 * Never persists to IndexedDB — memory only.
 */
export async function fetchLinkedCharactersDetails(
  campaignId: string
): Promise<LinkedCharacterDetails[]> {
  if (!supabase) return []

  // 1. Fetch all links (1 query)
  const links = await listCampaignCharacters(campaignId).catch(() => [])
  if (links.length === 0) return []

  // 2. Batch-fetch all chars in a single .in() query (1 query, was N*2 before)
  const characterIds = links.map(l => l.characterId)
  const { data: rows, error: charsError } = await supabase
    .from('characters')
    .select('id, user_id, data, updated_at')
    .in('id', characterIds)

  if (charsError) {
    console.error('[campaign-view] fetchLinkedCharactersDetails — chars batch', charsError)
    // Continue with empty map — cards render as "unknown character"
  }

  // 3. Batch-fetch owner profiles (1 query, was already batch)
  const ownerIds = [...new Set(links.map(l => l.userId))]
  const profiles = await listProfilesByIds(ownerIds).catch(() => [])
  const profileById = new Map(profiles.map(p => [p.userId, p]))

  // 4. Build chars map from batch result
  const charsMap = new Map<string, Character>()
  if (rows) {
    for (const row of rows) {
      const char: Character = {
        ...(row.data as Character),
        updatedAt: new Date(row.updated_at as string).getTime(),
      }
      charsMap.set(row.id as string, char)
    }
  }

  // 5. Compose results — images are null (lazy loaded by consumer)
  return links.map((link) => ({
    characterId: link.characterId,
    ownerUserId: link.userId,
    ownerDisplayName: profileById.get(link.userId)?.displayName ?? null,
    character: charsMap.get(link.characterId) ?? null,
    portraitData: null,
    symbolData: null,
  }))
}
