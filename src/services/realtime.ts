import { supabase } from '@/lib/supabase'

export type RealtimeStatus = 'active' | 'inactive'

/**
 * Subscribes to character UPDATE events via Postgres Changes.
 *
 * Notify-and-fetch pattern: the callback receives only the character id;
 * payload content is ignored (the JSONB carries the full character which
 * would make the payload very large). The caller refetches via its own
 * service function.
 *
 * No column filter: Postgres Changes accepts a single value per filter, but
 * linked characters are many. RLS ensures only readable rows reach this
 * subscriber — no information leak.
 *
 * Returns a cleanup function that removes the channel.
 */
export function subscribeCharacterChanges(
  onChange: (id: string) => void,
  onStatus: (status: RealtimeStatus) => void,
): () => void {
  if (!supabase) {
    onStatus('inactive')
    return () => {}
  }

  const channel = supabase
    .channel('character-changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'characters' },
      (payload) => {
        const id = (payload.new as Record<string, unknown>)['id'] as string | undefined
        if (id) onChange(id)
      },
    )
    .subscribe((status) => {
      onStatus(status === 'SUBSCRIBED' ? 'active' : 'inactive')
    })

  return () => {
    void supabase?.removeChannel(channel)
  }
}
