import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { useIsForceReadOnly } from '@/contexts/CampaignViewContext'
import { InventoryList } from '../parts/InventoryList'
import { CurrencyBlock } from '../parts/CurrencyBlock'
import type { Character } from '@/domain/character'

export function InventoryTab() {
  const character = useActiveCharacter()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  const forceReadOnly = useIsForceReadOnly()
  if (!character) return null

  const handleUpdate = (partial: Partial<Character>) => void updateCharacter(character.id, partial)
  const upd = forceReadOnly ? {} : { onUpdate: handleUpdate }

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <CurrencyBlock character={character} {...upd} />
        <InventoryList character={character} {...upd} />
      </div>

      {/* ── DESKTOP (2-col: inventory | currency) ── */}
      <div
        className="hidden lg:grid"
        style={{ gridTemplateColumns: '1.3fr 1fr', gap: 14 }}
      >
        <InventoryList character={character} {...upd} />
        <CurrencyBlock character={character} {...upd} />
      </div>
    </>
  )
}
