import { supabase } from '@/lib/supabase'
import {
  emptyTracker,
} from '@/domain/initiative'
import type { Combatant, InitiativeTracker } from '@/domain/initiative'

export type { Combatant, InitiativeTracker }

export async function getInitiative(campaignId: string): Promise<InitiativeTracker> {
  if (!supabase) return emptyTracker()
  const { data, error } = await supabase
    .from('campaign_initiative')
    .select('combatants, active_combatant_id, round, active')
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (error || !data) return emptyTracker()
  return {
    combatants:        data.combatants as Combatant[],
    activeCombatantId: (data.active_combatant_id as string | null) ?? null,
    round:             data.round as number,
    active:            data.active as boolean,
  }
}

/** Upsert the full tracker state for a campaign. Best-effort: logs on error, does not throw. */
export async function saveInitiative(campaignId: string, t: InitiativeTracker): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('campaign_initiative').upsert({
    campaign_id:         campaignId,
    combatants:          t.combatants,
    active_combatant_id: t.activeCombatantId,
    round:               t.round,
    active:              t.active,
    updated_at:          new Date().toISOString(),
  })
  if (error) console.error('[campaign-initiative] save error', error)
}

/**
 * Best-effort: chama a RPC register_initiative para cada campanha vinculada.
 * A RPC valida membro + vínculo + toggle server-side; o client não decide nada.
 * Nunca lança (fire-and-forget).
 */
export async function registerInitiative(
  campaignIds: string[],
  characterId: string,
  value: number,
  name: string,
): Promise<void> {
  if (!supabase || campaignIds.length === 0) return
  await Promise.all(
    campaignIds.map(id =>
      supabase!
        .rpc('register_initiative', {
          p_campaign_id: id,
          p_character_id: characterId,
          p_value: value,
          p_name: name,
        })
        .then(({ error }) => {
          if (error) console.error('[campaign-initiative] register error', error)
        }),
    ),
  )
}
