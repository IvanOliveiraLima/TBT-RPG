import type React from 'react'
import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { useIsForceReadOnly } from '@/contexts/CampaignViewContext'
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
  const forceReadOnly = useIsForceReadOnly()
  if (!character) return null

  const handleUpdate = (partial: Partial<Character>) => void updateCharacter(character.id, partial)
  const upd = forceReadOnly ? {} : { onUpdate: handleUpdate }

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <CombatStrip character={character} cols={3} {...upd} />
        <div style={CARD}>
          <AttacksList character={character} {...upd} />
        </div>
      </div>

      {/* ── DESKTOP (hidden below lg) ── */}
      <div className="hidden lg:flex lg:flex-col" style={{ gap: 14 }}>
        <CombatStrip character={character} cols={6} {...upd} />
        <div style={CARD}>
          <AttacksList character={character} {...upd} />
        </div>
      </div>
    </>
  )
}
