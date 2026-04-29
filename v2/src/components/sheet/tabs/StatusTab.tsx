import type React from 'react'
import { useCharacterStore } from '@/store/character'
import { HeroCard } from '../parts/HeroCard'
import { HpBlock } from '../parts/HpBlock'
import { CombatStrip } from '../parts/CombatStrip'
import { AttrGrid } from '../parts/AttrGrid'
import { SavingThrows } from '../parts/SavingThrows'
import { SkillsBlock } from '../parts/SkillsBlock'
import { FeaturesList } from '../parts/FeaturesList'
import { ProficienciesBlock } from '../parts/ProficienciesBlock'
import { Label } from '../ui/Label'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 14,
}

export function StatusTab() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <HeroCard character={character} compact />
        <HpBlock character={character} />
        <CombatStrip character={character} cols={3} />

        {/* Atributos */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ color: '#D4A017', fontSize: 12 }}>⬢</span>
            <Label style={{ marginBottom: 0 }}>Atributos</Label>
          </div>
          <AttrGrid character={character} cols={3} compact />
        </div>

        {/* Features & Traits */}
        <div style={CARD}>
          <Label>Features & Traits</Label>
          <FeaturesList character={character} />
        </div>

        {/* Skills */}
        <div style={CARD}>
          <Label>Skills</Label>
          <SkillsBlock character={character} />
        </div>

        {/* Saving Throws */}
        <div style={CARD}>
          <Label>Saving Throws</Label>
          <SavingThrows character={character} />
        </div>

        {/* Proficiências */}
        <ProficienciesBlock character={character} />
      </div>

      {/* ── DESKTOP GRID (hidden below lg) ── */}
      <div
        className="hidden lg:grid lg:grid-cols-3"
        style={{ gap: 14 }}
      >
        {/* Row 1: HpBlock (1 col) + Combate card (2 cols) */}
        <div>
          <HpBlock character={character} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ ...CARD, height: '100%' }}>
            <Label>Combate</Label>
            <CombatStrip character={character} cols={6} />
          </div>
        </div>

        {/* Row 2: AttrGrid (3 cols) */}
        <div style={{ gridColumn: 'span 3' }}>
          <div style={CARD}>
            <Label>Atributos</Label>
            <AttrGrid character={character} cols={6} />
          </div>
        </div>

        {/* Row 3: Saves | Skills | Features */}
        <div>
          <div style={CARD}>
            <Label>Saving Throws</Label>
            <SavingThrows character={character} />
          </div>
        </div>
        <div>
          <div style={{ ...CARD, maxHeight: 380, overflowY: 'auto' }}>
            <Label>Skills</Label>
            <SkillsBlock character={character} />
          </div>
        </div>
        <div>
          <div style={CARD}>
            <Label>Features</Label>
            <FeaturesList character={character} />
          </div>
        </div>

        {/* Row 4: Proficiências — full width */}
        <div style={{ gridColumn: 'span 3' }}>
          <ProficienciesBlock character={character} />
        </div>
      </div>
    </>
  )
}
