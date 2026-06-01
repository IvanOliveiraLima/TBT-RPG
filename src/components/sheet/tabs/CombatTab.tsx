import type React from 'react'
import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import type { Character } from '@/domain/character'
import { CombatStrip } from '../parts/CombatStrip'
import { AttacksList } from '../parts/AttacksList'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 14,
}

export function CombatTab() {
  const character = useActiveCharacter()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  if (!character) return null

  const onUpdate = (partial: Partial<Character>) =>
    void updateCharacter(character.id, partial)

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <CombatStrip character={character} cols={3} />
        <div style={CARD}>
          <AttacksList character={character} onUpdate={onUpdate} />
        </div>
      </div>

      {/* ── DESKTOP (hidden below lg) ── */}
      <div className="hidden lg:flex lg:flex-col" style={{ gap: 14 }}>
        <CombatStrip character={character} cols={6} />
        <div style={CARD}>
          <AttacksList character={character} onUpdate={onUpdate} />
        </div>
      </div>
    </>
  )
}
