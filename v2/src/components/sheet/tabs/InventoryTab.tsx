import { useCharacterStore } from '@/store/character'
import { InventoryList } from '../parts/InventoryList'
import { CurrencyBlock } from '../parts/CurrencyBlock'

export function InventoryTab() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <CurrencyBlock character={character} />
        <InventoryList character={character} />
      </div>

      {/* ── DESKTOP (2-col: inventory | currency) ── */}
      <div
        className="hidden lg:grid"
        style={{ gridTemplateColumns: '1.3fr 1fr', gap: 14 }}
      >
        <InventoryList character={character} />
        <CurrencyBlock character={character} />
      </div>
    </>
  )
}
