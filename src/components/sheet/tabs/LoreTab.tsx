import type { Character } from '@/domain/character'
import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { useIsForceReadOnly } from '@/contexts/CampaignViewContext'
import { LoreHero } from '../parts/LoreHero'
import { BackstoryBlock } from '../parts/BackstoryBlock'
import { PersonalityBlock } from '../parts/PersonalityBlock'
import { NotesBlock } from '../parts/NotesBlock'

export function LoreTab() {
  const character = useActiveCharacter()
  const updateCharacter = useCharactersStore((s) => s.updateCharacter)
  const forceReadOnly = useIsForceReadOnly()

  if (!character) return null

  const handleUpdate = (partial: Partial<Character>) => void updateCharacter(character.id, partial)
  const upd = forceReadOnly ? {} : { onUpdate: handleUpdate }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <LoreHero character={character} {...upd} />
      <BackstoryBlock character={character} {...upd} />
      <PersonalityBlock character={character} {...upd} />
      <NotesBlock character={character} {...upd} />
    </div>
  )
}
