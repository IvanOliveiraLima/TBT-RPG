import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCharacterStore } from '@/store/character'
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
import { NotesTab } from '@/components/sheet/tabs/NotesTab'

function TabContent({ tabKey }: { tabKey: TabKey }) {
  switch (tabKey) {
    case 'status':  return <StatusTab />
    case 'combat':  return <CombatTab />
    case 'spells':  return <SpellsTab />
    case 'inv':     return <InventoryTab />
    case 'lore':    return <LoreTab />
    case 'notes':   return <NotesTab />
  }
}

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>()
  const { character, loading, error, loadCharacter, clearCharacter } = useCharacterStore()
  const [activeTab, setActiveTab] = useState<TabKey>('status')

  useEffect(() => {
    if (id) void loadCharacter(id)
    return () => clearCharacter()
  }, [id, loadCharacter, clearCharacter])

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
