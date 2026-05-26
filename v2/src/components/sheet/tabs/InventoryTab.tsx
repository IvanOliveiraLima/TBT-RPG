import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { InventoryList } from '../parts/InventoryList'
import { CurrencyBlock } from '../parts/CurrencyBlock'
import type { Character } from '@/domain/character'

export function InventoryTab() {
  const character = useActiveCharacter()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  if (!character) return null

  function onUpdate(partial: Partial<Character>) {
    void updateCharacter(character!.id, partial)
  }

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <CurrencyBlock character={character} onUpdate={onUpdate} />
        <InventoryList character={character} onUpdate={onUpdate} />
      </div>

      {/* ── DESKTOP (2-col: inventory | currency) ── */}
      <div
        className="hidden lg:grid"
        style={{ gridTemplateColumns: '1.3fr 1fr', gap: 14 }}
      >
        <InventoryList character={character} onUpdate={onUpdate} />
        <CurrencyBlock character={character} onUpdate={onUpdate} />
      </div>
    </>
  )
}
