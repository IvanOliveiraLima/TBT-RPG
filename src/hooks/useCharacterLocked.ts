import { useCharactersStore } from '@/store/characters'

export function useCharacterLocked(characterId: string): boolean {
  return useCharactersStore(state =>
    state.characters.find(c => c.id === characterId)?.locked ?? false
  )
}
