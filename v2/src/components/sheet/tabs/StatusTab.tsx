import type React from 'react'
import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { useTranslation } from '@/i18n'
import { HeroCard } from '../parts/HeroCard'
import { IdentityBlock } from '../parts/IdentityBlock'
import { HpBlock } from '../parts/HpBlock'
import { CombatStrip } from '../parts/CombatStrip'
import { AttrGrid } from '../parts/AttrGrid'
import { SavingThrows } from '../parts/SavingThrows'
import { SkillsBlock } from '../parts/SkillsBlock'
import { FeaturesList } from '../parts/FeaturesList'
import { ProficienciesBlock } from '../parts/ProficienciesBlock'
import { Label } from '../ui/Label'
import type { Character } from '@/domain/character'

const CARD: React.CSSProperties = {
  background: '#15121C',
  border: '1px solid #2A2537',
  borderRadius: 14,
  padding: 14,
}

export function StatusTab() {
  const { t } = useTranslation()
  const character = useActiveCharacter()
  const updateCharacter = useCharactersStore(s => s.updateCharacter)
  if (!character) return null

  const onUpdate = (partial: Partial<Character>) =>
    void updateCharacter(character.id, partial)

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <HeroCard character={character} compact />

        {/* Identity editing */}
        <div style={CARD}>
          <Label>{t('identity.section_title')}</Label>
          <IdentityBlock character={character} onUpdate={onUpdate} />
        </div>

        <HpBlock character={character} />
        <CombatStrip character={character} cols={3} />

        {/* Atributos */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ color: '#D4A017', fontSize: 12 }}>⬢</span>
            <Label style={{ marginBottom: 0 }}>{t('attributes.section_title')}</Label>
          </div>
          <AttrGrid character={character} cols={3} compact onUpdate={onUpdate} />
        </div>

        {/* Saving Throws — before Skills (numeric → numeric → descriptive) */}
        <div style={CARD}>
          <Label>{t('saves.section_title')}</Label>
          <SavingThrows character={character} onUpdate={onUpdate} />
        </div>

        {/* Skills */}
        <div style={CARD}>
          <Label>{t('skills.label')}</Label>
          <SkillsBlock character={character} onUpdate={onUpdate} />
        </div>

        {/* Features & Traits */}
        <div style={CARD}>
          <Label>{t('features.label')}</Label>
          <FeaturesList character={character} />
        </div>

        {/* Proficiências */}
        <ProficienciesBlock character={character} />
      </div>

      {/* ── DESKTOP (hidden below lg) ── */}
      <div className="hidden lg:flex lg:flex-col" style={{ gap: 14 }}>

        {/* Row 0: HeroCard + Identity side by side */}
        <div className="grid grid-cols-3" style={{ gap: 14 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <HeroCard character={character} />
          </div>
          <div style={CARD}>
            <Label>{t('identity.section_title')}</Label>
            <IdentityBlock character={character} onUpdate={onUpdate} />
          </div>
        </div>

        {/* Rows 1–2: 3-col grid (HpBlock + Combate, AttrGrid) */}
        <div className="grid grid-cols-3" style={{ gap: 14 }}>
          {/* Row 1: HpBlock (1 col) + Combate card (2 cols) */}
          <div>
            <HpBlock character={character} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ ...CARD, height: '100%' }}>
              <Label>{t('nav.combat')}</Label>
              <CombatStrip character={character} cols={6} />
            </div>
          </div>

          {/* Row 2: AttrGrid full width */}
          <div style={{ gridColumn: 'span 3' }}>
            <div style={CARD}>
              <Label>{t('attributes.section_title')}</Label>
              <AttrGrid character={character} cols={6} onUpdate={onUpdate} />
            </div>
          </div>
        </div>

        {/* Row 3: 2-col — Skills left | Saves + Features right */}
        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <div style={{ ...CARD, maxHeight: 420, overflowY: 'auto' }}>
            <Label>{t('skills.label')}</Label>
            <SkillsBlock character={character} onUpdate={onUpdate} />
          </div>
          <div className="flex flex-col" style={{ gap: 14 }}>
            <div style={CARD}>
              <Label>{t('saves.section_title')}</Label>
              <SavingThrows character={character} onUpdate={onUpdate} />
            </div>
            <div style={CARD}>
              <Label>{t('features.title')}</Label>
              <FeaturesList character={character} />
            </div>
          </div>
        </div>

        {/* Row 4: Proficiências — full width */}
        <ProficienciesBlock character={character} />
      </div>
    </>
  )
}
