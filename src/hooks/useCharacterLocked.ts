import { useContext } from 'react'
import { ForceReadOnlyContext } from '@/contexts/CampaignViewContext'
import { useCharactersStore } from '@/store/characters'

export function useCharacterLocked(characterId: string): boolean {
  const forceReadOnly = useContext(ForceReadOnlyContext)
  const lockedFromStore = useCharactersStore(state =>
    state.characters.find(c => c.id === characterId)?.locked ?? false
  )
  return forceReadOnly || lockedFromStore
}
