import type { Character } from '@/domain/character'
import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { useIsForceReadOnly } from '@/contexts/CampaignViewContext'
import { HpBlock } from '../parts/HpBlock'
import { SpellHeader } from '../parts/SpellHeader'
import { SpellSlots } from '../parts/SpellSlots'
import { SpellList } from '../parts/SpellList'

export function SpellsTab() {
  const character = useActiveCharacter()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  const forceReadOnly = useIsForceReadOnly()
  if (!character) return null

  const handleUpdate = (partial: Partial<Character>) => void updateCharacter(character.id, partial)
  const upd = forceReadOnly ? {} : { onUpdate: handleUpdate }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <HpBlock character={character} {...upd} />
      <SpellHeader character={character} {...upd} />
      <SpellSlots character={character} {...upd} />
      <SpellList character={character} {...upd} />
    </div>
  )
}
