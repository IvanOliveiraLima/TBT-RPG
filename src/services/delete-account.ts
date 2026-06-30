import { supabase } from '@/lib/supabase'
import { listMyCampaigns, deleteCampaign, leaveCampaign } from '@/services/campaign'
import { listCharacters, clearAllLocalData } from '@/data/db'
import { deleteCharacterImages } from '@/services/delete-character'

export class DeleteAccountError extends Error {
  readonly code: string
  constructor(code: string) {
    super(`Delete account failed: ${code}`)
    this.name = 'DeleteAccountError'
    this.code = code
  }
}

export async function deleteAccountService(): Promise<void> {
  if (!supabase) throw new DeleteAccountError('not_configured')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new DeleteAccountError('not_authenticated')

  const userId = session.user.id

  // 1. Campaigns: delete owned, leave joined (best-effort)
  try {
    const campaigns = await listMyCampaigns()
    for (const c of campaigns) {
      try {
        if (c.ownerId === userId) await deleteCampaign(c.id)
        else await leaveCampaign(c.id)
      } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }

  // 2. Characters: storage images (best-effort) + cloud rows (best-effort)
  try {
    const chars = await listCharacters()
    for (const ch of chars) {
      try { await deleteCharacterImages(userId, ch.id) } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
  try {
    await supabase.from('characters').delete().eq('user_id', userId)
  } catch { /* best-effort */ }

  // 3. Local IndexedDB (best-effort)
  try { await clearAllLocalData() } catch { /* best-effort */ }

  // 4. Remove the auth user via SECURITY DEFINER RPC (required — defines success)
  const { error } = await supabase.rpc('delete_own_account')
  if (error) {
    console.error('[delete-account] rpc error', error)
    throw new DeleteAccountError('account_delete_failed')
  }

  // 5. Sign out to clear local session
  await supabase.auth.signOut()
}
