import type { ReactNode } from 'react'
import type { Character } from '@/domain/character'
import type { TabKey } from './types'
import { DesktopShell } from './DesktopShell'
import { MobileShell } from './MobileShell'
import { useIsMobile } from '@/hooks/useIsMobile'

interface SheetLayoutProps {
  character: Character
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

/**
 * Mounts a single shell based on the current viewport.
 * Tailwind `lg` breakpoint = 1024px — matches the previous CSS media-query cutoff.
 */
export function SheetLayout({ character, activeTab, onTabChange, children }: SheetLayoutProps) {
  // Tailwind `lg` = 1024px — preserves the same breakpoint as the previous layout.
  const isMobile = useIsMobile(1024)
  const Shell = isMobile ? MobileShell : DesktopShell
  return (
    <Shell character={character} activeTab={activeTab} onTabChange={onTabChange}>
      {children}
    </Shell>
  )
}
