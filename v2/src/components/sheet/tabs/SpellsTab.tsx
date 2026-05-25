import type { Character } from '@/domain/character'
import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { SpellHeader } from '../parts/SpellHeader'
import { SpellSlots } from '../parts/SpellSlots'
import { SpellList } from '../parts/SpellList'

export function SpellsTab() {
  const character = useActiveCharacter()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  if (!character) return null

  const onUpdate = (partial: Partial<Character>) =>
    void updateCharacter(character.id, partial)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SpellHeader character={character} onUpdate={onUpdate} />
      <SpellSlots character={character} onUpdate={onUpdate} />
      <SpellList character={character} onUpdate={onUpdate} />
    </div>
  )
}
