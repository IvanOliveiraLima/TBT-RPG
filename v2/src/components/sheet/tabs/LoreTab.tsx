import { useCharacterStore } from '@/store/character'
import { LoreHero } from '../parts/LoreHero'
import { BackstoryBlock } from '../parts/BackstoryBlock'
import { PersonalityBlock } from '../parts/PersonalityBlock'
import { NotesBlock } from '../parts/NotesBlock'

export function LoreTab() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <LoreHero character={character} />
      <BackstoryBlock character={character} />
      <PersonalityBlock character={character} />
      <NotesBlock character={character} />
    </div>
  )
}
