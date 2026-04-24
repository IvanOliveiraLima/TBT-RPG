import { useCharacterStore } from '@/store/character'
import { HeroCard } from '../parts/HeroCard'
import { HpBlock } from '../parts/HpBlock'

export function StatusTab() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  return (
    <div className="space-y-4">
      <HeroCard character={character} />
      <HpBlock character={character} />
      {/* Atributos, Saves, Skills, Features — B.1b.2 */}
    </div>
  )
}
