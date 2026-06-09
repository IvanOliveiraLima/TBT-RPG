import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { useCampaignViewStore } from '@/store/campaign-view'
import { listCampaignCharacters } from '@/services/campaign-characters'
import { ForceReadOnlyContext, RemoteCharacterContext } from '@/contexts/CampaignViewContext'
import type { CampaignCharacter } from '@/domain/campaign'
import type { TabKey } from '@/components/sheet/types'
import { StatusTab } from '@/components/sheet/tabs/StatusTab'
import { CombatTab } from '@/components/sheet/tabs/CombatTab'
import { SpellsTab } from '@/components/sheet/tabs/SpellsTab'
import { InventoryTab } from '@/components/sheet/tabs/InventoryTab'
import { LoreTab } from '@/components/sheet/tabs/LoreTab'
import { CampaignDesktopShell } from '@/components/sheet/CampaignDesktopShell'
import { CampaignMobileShell } from '@/components/sheet/CampaignMobileShell'

function TabContent({ tabKey }: { tabKey: TabKey }) {
  switch (tabKey) {
    case 'status':  return <StatusTab />
    case 'combat':  return <CombatTab />
    case 'spells':  return <SpellsTab />
    case 'inv':     return <InventoryTab />
    case 'lore':    return <LoreTab />
  }
}

export default function CampaignCharacterView() {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const character     = useCampaignViewStore(s => s.character)
  const loading       = useCampaignViewStore(s => s.loading)
  const error         = useCampaignViewStore(s => s.error)
  const loadCharacter = useCampaignViewStore(s => s.loadCharacter)
  const startPolling  = useCampaignViewStore(s => s.startPolling)
  const clear         = useCampaignViewStore(s => s.clear)

  const [activeTab, setActiveTab] = useState<TabKey>('status')
  const [linkedChars, setLinkedChars] = useState<CampaignCharacter[]>([])

  // Load linked chars for sidebar
  useEffect(() => {
    if (!campaignId) return
    listCampaignCharacters(campaignId).then(setLinkedChars).catch(console.error)
  }, [campaignId])

  // Load char + start polling; clear on unmount or when ids change
  useEffect(() => {
    if (!campaignId || !charId) return
    void loadCharacter(campaignId, charId)
    startPolling(campaignId, charId)
    return () => { clear() }
  }, [campaignId, charId, loadCharacter, startPolling, clear])

  // Auto-redirect after char_not_found
  useEffect(() => {
    if (error !== 'char_not_found') return
    const timer = setTimeout(() => navigate(`/campaigns/${campaignId}`), 2000)
    return () => clearTimeout(timer)
  }, [error, campaignId, navigate])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && !character) {
    return (
      <div
        data-testid="campaign-view-loading"
        style={{
          minHeight: '100dvh', background: '#0F0D14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7A7788', fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14,
        }}
      >
        …
      </div>
    )
  }

  // ── Char not found ────────────────────────────────────────────────────────
  if (error === 'char_not_found') {
    return (
      <div
        data-testid="campaign-view-not-found"
        style={{
          minHeight: '100dvh', background: '#0F0D14',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#7A7788', fontFamily: "'Inter', system-ui, sans-serif",
          gap: 12, textAlign: 'center', padding: 24,
        }}
      >
        <div style={{ fontSize: 14 }}>{t('campaign_view.char_not_found')}</div>
        <div style={{ fontSize: 12 }}>{t('campaign_view.redirecting')}</div>
      </div>
    )
  }

  // ── Other error ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        data-testid="campaign-view-error"
        style={{
          minHeight: '100dvh', background: '#0F0D14',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#7A7788', fontFamily: "'Inter', system-ui, sans-serif",
          gap: 16, textAlign: 'center', padding: 24,
        }}
      >
        <div style={{ fontSize: 14 }}>
          {t(`campaign_view.error_${error}` as TranslationKey)}
        </div>
        <button
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          data-testid="campaign-view-back-btn"
          style={{
            background: 'transparent', border: '1px solid #2A2537',
            borderRadius: 8, padding: '8px 16px',
            color: '#C8C4D6', fontSize: 13, cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {t('campaign_view.back_to_campaign')}
        </button>
      </div>
    )
  }

  if (!character) return null

  const sharedProps = {
    character,
    campaignId: campaignId!,
    activeCharId: charId!,
    linkedChars,
    activeTab,
    onTabChange: setActiveTab,
  }

  return (
    <ForceReadOnlyContext.Provider value={true}>
      <RemoteCharacterContext.Provider value={character}>
        {/* Mobile: < 1024px */}
        <div className="lg:hidden">
          <CampaignMobileShell {...sharedProps}>
            <TabContent tabKey={activeTab} />
          </CampaignMobileShell>
        </div>
        {/* Desktop: >= 1024px */}
        <div className="hidden lg:block">
          <CampaignDesktopShell {...sharedProps}>
            <TabContent tabKey={activeTab} />
          </CampaignDesktopShell>
        </div>
      </RemoteCharacterContext.Provider>
    </ForceReadOnlyContext.Provider>
  )
}
