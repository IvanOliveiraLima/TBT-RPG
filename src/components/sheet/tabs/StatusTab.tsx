import type React from 'react'
import { useActiveCharacter } from '@/store/character'
import { useCharactersStore } from '@/store/characters'
import { useIsForceReadOnly } from '@/contexts/CampaignViewContext'
import { useTranslation } from '@/i18n'
import { HeroCard } from '../parts/HeroCard'
import { HpBlock } from '../parts/HpBlock'
import { CombatStrip } from '../parts/CombatStrip'
import { AttrGrid } from '../parts/AttrGrid'
import { SavingThrows } from '../parts/SavingThrows'
import { SkillsBlock } from '../parts/SkillsBlock'
import { FeaturesList } from '../parts/FeaturesList'
import { ProficienciesBlock } from '../parts/ProficienciesBlock'
import { LanguagesBlock } from '../parts/LanguagesBlock'
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
  const forceReadOnly = useIsForceReadOnly()
  if (!character) return null

  const handleUpdate = (partial: Partial<Character>) => void updateCharacter(character.id, partial)
  const upd = forceReadOnly ? {} : { onUpdate: handleUpdate }

  return (
    <>
      {/* ── MOBILE STACK (hidden on lg+) ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <HeroCard character={character} {...upd} compact />

        <HpBlock character={character} {...upd} />
        <CombatStrip character={character} cols={3} />

        {/* Atributos */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ color: '#D4A017', fontSize: 12 }}>⬢</span>
            <Label style={{ marginBottom: 0 }}>{t('attributes.section_title')}</Label>
          </div>
          <AttrGrid character={character} cols={3} compact {...upd} />
        </div>

        {/* Saving Throws */}
        <div style={CARD}>
          <Label>{t('saves.section_title')}</Label>
          <SavingThrows character={character} {...upd} />
        </div>

        {/* Skills */}
        <div style={CARD}>
          <Label>{t('skills.label')}</Label>
          <SkillsBlock character={character} {...upd} />
        </div>

        {/* Features & Traits */}
        <div style={CARD}>
          <Label>{t('features.label')}</Label>
          <FeaturesList character={character} {...upd} />
        </div>

        {/* Languages */}
        <LanguagesBlock character={character} {...upd} />

        {/* Proficiencies */}
        <ProficienciesBlock character={character} {...upd} />
      </div>

      {/* ── DESKTOP (hidden below lg) — B2 layout ── */}
      <div className="hidden lg:flex lg:flex-col" style={{ gap: 14 }}>

        {/* Row 0: HeroCard full-width */}
        <HeroCard character={character} {...upd} />

        {/* Row 1: HpBlock (1col) + CombatStrip (2cols) */}
        <div className="grid grid-cols-3" style={{ gap: 14 }}>
          <div>
            <HpBlock character={character} {...upd} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ ...CARD, height: '100%' }}>
              <Label>{t('nav.combat')}</Label>
              <CombatStrip character={character} cols={6} />
            </div>
          </div>
        </div>

        {/* Row 2: AttrGrid full-width */}
        <div style={CARD}>
          <Label>{t('attributes.section_title')}</Label>
          <AttrGrid character={character} cols={6} {...upd} />
        </div>

        {/* Row 3: Skills | Saves */}
        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <div style={{ ...CARD, maxHeight: 420, overflowY: 'auto' }}>
            <Label>{t('skills.label')}</Label>
            <SkillsBlock character={character} {...upd} />
          </div>
          <div style={CARD}>
            <Label>{t('saves.section_title')}</Label>
            <SavingThrows character={character} {...upd} />
          </div>
        </div>

        {/* Row 4: FeaturesList full-width */}
        <div style={CARD}>
          <Label>{t('features.title')}</Label>
          <FeaturesList character={character} {...upd} />
        </div>

        {/* Row 5: Languages | Proficiencies */}
        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <LanguagesBlock character={character} {...upd} />
          <ProficienciesBlock character={character} {...upd} />
        </div>

      </div>
    </>
  )
}
