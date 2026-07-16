import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCharacterStore, useActiveCharacter } from '@/store/character'
import { SheetLayout } from '@/components/sheet/SheetLayout'
import type { TabKey } from '@/components/sheet/types'
import { LoadingScreen } from '@/components/sheet/states/LoadingScreen'
import { ErrorScreen } from '@/components/sheet/states/ErrorScreen'
import { NotFoundScreen } from '@/components/sheet/states/NotFoundScreen'
import { StatusTab } from '@/components/sheet/tabs/StatusTab'
import { CombatTab } from '@/components/sheet/tabs/CombatTab'
import { SpellsTab } from '@/components/sheet/tabs/SpellsTab'
import { InventoryTab } from '@/components/sheet/tabs/InventoryTab'
import { LoreTab } from '@/components/sheet/tabs/LoreTab'
import { useDiceStore } from '@/store/useDiceStore'
import { listCampaignIdsForCharacter } from '@/services/campaign-characters'

function TabContent({ tabKey }: { tabKey: TabKey }) {
  switch (tabKey) {
    case 'status':  return <StatusTab />
    case 'combat':  return <CombatTab />
    case 'spells':  return <SpellsTab />
    case 'inv':     return <InventoryTab />
    case 'lore':    return <LoreTab />
  }
}

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>()
  const character = useActiveCharacter()
  const { loading, error, loadCharacter, clearCharacter } = useCharacterStore()
  const [activeTab, setActiveTab] = useState<TabKey>('status')
  const setCampaignContext = useDiceStore(s => s.setCampaignContext)
  const clearCampaignContext = useDiceStore(s => s.clearCampaignContext)

  useEffect(() => {
    if (id) void loadCharacter(id)
    return () => clearCharacter()
  }, [id, loadCharacter, clearCharacter])

  // Resolve which campaigns this character is linked to for dice logging
  useEffect(() => {
    if (!character) {
      clearCampaignContext()
      return
    }
    let cancelled = false
    void listCampaignIdsForCharacter(character.id).then(ids => {
      if (cancelled) return
      if (ids.length > 0) {
        setCampaignContext({ campaignTargets: ids, actorName: character.name })
      } else {
        clearCampaignContext()
      }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id, character?.name, setCampaignContext, clearCampaignContext])

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen message={error} />
  if (!character) return <NotFoundScreen />

  return (
    <SheetLayout
      character={character}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <TabContent tabKey={activeTab} />
    </SheetLayout>
  )
}
