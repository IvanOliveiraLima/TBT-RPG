import { supabase, isSupabaseEnabled } from './supabase.js'
import { getCurrentUser, isLoggedIn } from './auth.js'
import { listAllCharacters, saveCharacter, loadCharacter, getDeletedIds, clearTombstone } from './storage.js'

// Upload de imagem para o Supabase Storage
async function uploadImage(userId, characterId, kind, dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null

  const mimeMatch = dataUrl.match(/data:([^;]+);base64,/)
  const mime = mimeMatch?.[1] || 'image/jpeg'
  const ext = mime.split('/')[1] || 'jpg'
  const path = `${userId}/${characterId}/${kind}.${ext}`

  const base64 = dataUrl.split(',')[1]
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

  const { error } = await supabase.storage
    .from('character-images')
    .upload(path, bytes, { contentType: mime, upsert: true })

  if (error) {
    console.warn('Image upload failed:', error.message)
    return null
  }

  const { data } = supabase.storage.from('character-images').getPublicUrl(path)
  return data.publicUrl
}

// Download de imagem do Supabase Storage para base64
async function downloadImage(url) {
  if (!url || url.startsWith('data:')) return url
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Push: envia personagem local → Supabase
export async function pushCharacter(character) {
  if (!isSupabaseEnabled() || !isLoggedIn()) return
  const user = getCurrentUser()

  // Extrair imagens antes de salvar no banco
  const charCopy = { ...character }
  const images = charCopy.images || {}

  if (images.character?.startsWith('data:')) {
    const url = await uploadImage(user.id, character.id, 'character', images.character)
    if (url) charCopy.images = { ...images, character: url }
  }
  if (images.symbol?.startsWith('data:')) {
    const url = await uploadImage(user.id, character.id, 'symbol', images.symbol)
    if (url) charCopy.images = { ...charCopy.images, symbol: url }
  }

  const { error } = await supabase
    .from('characters')
    .upsert({
      id: character.id,
      user_id: user.id,
      data: charCopy,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (error) console.warn('Push failed:', error.message)
}

// Pull: busca personagens do Supabase → local
export async function pullCharacters() {
  if (!isSupabaseEnabled() || !isLoggedIn()) return []
  const user = getCurrentUser()

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.warn('Pull failed:', error.message)
    return []
  }

  return data || []
}

// Sync completo: merge local + remoto com last-write-wins
export async function syncAll() {
  if (!isSupabaseEnabled() || !isLoggedIn()) return

  setSyncStatus('syncing')
  try {
    const [localChars, remoteRows, deletedRecords] = await Promise.all([
      listAllCharacters(),
      pullCharacters(),
      getDeletedIds()
    ])

    const remoteMap = new Map(remoteRows.map(r => [r.id, r]))
    const localMap = new Map(localChars.map(c => [c.id, c]))
    const deletedIds = new Set(deletedRecords.map(d => d.id))

    // Deletar do Supabase os personagens marcados como excluídos
    for (const { id } of deletedRecords) {
      if (remoteMap.has(id)) {
        const { error } = await supabase.from('characters').delete().eq('id', id)
        if (!error) await clearTombstone(id)
      } else {
        await clearTombstone(id) // já não existe no remoto
      }
    }

    // Personagens remotos mais recentes → salvar local (ignorar excluídos)
    for (const remote of remoteRows) {
      if (deletedIds.has(remote.id)) continue
      const local = localMap.get(remote.id)
      const remoteTs = new Date(remote.updated_at).getTime()
      const localTs = local?.updatedAt || 0

      if (remoteTs > localTs) {
        const remoteData = remote.data
        if (remoteData.images?.character?.startsWith('http')) {
          remoteData.images.character = await downloadImage(remoteData.images.character) || remoteData.images.character
        }
        if (remoteData.images?.symbol?.startsWith('http')) {
          remoteData.images.symbol = await downloadImage(remoteData.images.symbol) || remoteData.images.symbol
        }
        await saveCharacter({ ...remoteData, updatedAt: remoteTs })
      }
    }

    // Personagens locais → push (ignorar excluídos)
    for (const local of localChars) {
      if (deletedIds.has(local.id)) continue
      const remote = remoteMap.get(local.id)
      const localTs = local.updatedAt || 0
      const remoteTs = remote ? new Date(remote.updated_at).getTime() : 0

      if (localTs >= remoteTs) {
        await pushCharacter(local)
      }
    }

    setSyncStatus('synced')
    document.dispatchEvent(new CustomEvent('syncCompleted'))
    console.info('Sync completed')
  } catch (err) {
    setSyncStatus('error')
    console.warn('Sync error:', err.message)
  }
}

// Sync automático em background
let syncTimer = null

export function startAutoSync(intervalMs = 30000) {
  stopAutoSync()
  syncAll() // sync imediato ao iniciar
  syncTimer = setInterval(syncAll, intervalMs)
}

export function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}

// Push imediato de um personagem (usado internamente pelo sync completo)
export async function syncCharacterNow(characterId) {
  if (!isSupabaseEnabled() || !isLoggedIn()) return
  const character = await loadCharacter(characterId)
  if (character) await pushCharacter(character)
}

// Push com debounce — evita requisições excessivas durante edição contínua
let syncDebounceTimer = null
const SYNC_DEBOUNCE_MS = 15000 // 15 segundos

export function scheduleSyncCharacter(characterId) {
  clearTimeout(syncDebounceTimer)
  syncDebounceTimer = setTimeout(async () => {
    if (!isSupabaseEnabled() || !isLoggedIn()) return
    const character = await loadCharacter(characterId)
    if (character) await pushCharacter(character)
  }, SYNC_DEBOUNCE_MS)
}

export function cancelScheduledSync() {
  clearTimeout(syncDebounceTimer)
  syncDebounceTimer = null
}

export function setSyncStatus(status) {
  const el = document.getElementById('sync-status-text')
  const container = document.getElementById('sync-status')
  if (!el || !container) return
  container.style.display = 'block'
  const messages = {
    syncing: 'Syncing...',
    synced: 'Synced',
    error: 'Sync failed — retrying',
    offline: 'Offline'
  }
  el.textContent = messages[status] || status
}
