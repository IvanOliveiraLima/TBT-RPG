import type { Character } from '@/domain/character'
import { useCharacterStore } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { LoreHero } from '../parts/LoreHero'
import { BackstoryBlock } from '../parts/BackstoryBlock'
import { PersonalityBlock } from '../parts/PersonalityBlock'
import { NotesBlock } from '../parts/NotesBlock'

export function LoreTab() {
  const character = useCharacterStore((s) => s.character)
  const patchCharacter = useCharacterStore((s) => s.patchCharacter)
  const updateInList = useCharactersStore((s) => s.updateCharacter)

  if (!character) return null

  const onUpdate = (partial: Partial<Character>) => {
    patchCharacter(partial)               // immediate reactive display
    void updateInList(character.id, partial) // debounced DB write
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <LoreHero character={character} onUpdate={onUpdate} />
      <BackstoryBlock character={character} onUpdate={onUpdate} />
      <PersonalityBlock character={character} onUpdate={onUpdate} />
      <NotesBlock character={character} onUpdate={onUpdate} />
    </div>
  )
}
